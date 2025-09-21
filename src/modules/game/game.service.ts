import { Injectable, BadRequestException } from '@nestjs/common'
import { EVENT_EMITTER_CONSTANTS } from '@/common/constants/event.constants'
import { PlayerEnum, PlayerWinnerEnum, RoomStatusEnum } from '@/common/enums/common.enum'
import {
    IGameState,
    IGameMove,
    IPlayerAssignment,
    IMakeMoveDto,
    IPosition,
    IPlayerReadyStatus,
    IGameStateSyncPayload,
} from './interfaces/game.interface'
import { WsException } from '@nestjs/websockets'
import { RoomRedisService } from '@modules/room/services/room-redis.service'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LockService } from '@common/services/lock.service'

@Injectable()
export class GameService {
    private readonly COUNTDOWN_INTERVAL = 1000 // 1 second
    private readonly DEFAULT_COUNTDOWN = 3
    private readonly DELAY_START_GAME = 500
    private readonly DEFAULT_START_PLAYER = PlayerEnum.X

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly roomRedisService: RoomRedisService,
        private readonly lockService: LockService,
    ) { }

    async setPlayerReady(roomId: string, userId: string): Promise<void> {
        const lockKey = `room:${roomId}:ready`
        const lockExpire = 5000 // 5 seconds
        const lockTimeout = 3000 // 3 seconds timeout to acquire lock

        const lockAcquired = await this.lockService.acquireLock(lockKey, lockExpire, lockTimeout)
        if (!lockAcquired) {
            throw new WsException('Another player is setting ready, please try again')
        }

        try {
            const [status, playerIdsRaw, playerXId, playerOId] = await this.roomRedisService.getRoomData(roomId, [
                'status',
                'playerIds',
                'playerXId',
                'playerOId',
            ])

            if (status !== RoomStatusEnum.WAITING_READY) {
                throw new WsException('Room is not in waiting ready status')
            }

            const playerIds = JSON.parse(playerIdsRaw || '[]')
            if (!playerIds.includes(userId)) {
                throw new WsException('User is not a player in this room')
            }

            if (!playerXId || !playerOId) {
                await this.assignPlayers(roomId, playerIds)
            }

            await this.roomRedisService.setPlayerReady(roomId, userId, true)

            const readyStatus = await this.getPlayersReadyStatus(roomId)

            if (readyStatus.bothReady) {
                const gameState = await this.getGameState(roomId)

                if (!gameState) {
                    setTimeout(async () => {
                        try {
                            const currentGameState = await this.getGameState(roomId)
                            if (!currentGameState) {
                                await this.startGameCountdown(roomId)
                            }
                        } catch (error) {
                            console.error('Auto-start game failed:', error)
                        }
                    }, this.DELAY_START_GAME)
                }
            }
        } finally {
            await this.lockService.unlock(lockKey)
        }
    }

    async getPlayersReadyStatus(roomId: string): Promise<IPlayerReadyStatus> {
        const [playerXId, playerOId] = await this.roomRedisService.getRoomData(roomId, ['playerXId', 'playerOId'])

        const readyStatus = await this.roomRedisService.getPlayersReadyStatus(roomId, playerXId || '', playerOId || '')

        return {
            playerXId: playerXId || '',
            playerOId: playerOId || '',
            playerXReady: readyStatus.playerXReady,
            playerOReady: readyStatus.playerOReady,
            bothReady: readyStatus.bothReady
        }
    }

    private async startGameCountdown(roomId: string): Promise<void> {
        let countdown = this.DEFAULT_COUNTDOWN

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_START_COUNTDOWN, {
            roomId,
            countdown,
        })

        const countdownInterval = setInterval(async () => {
            countdown--

            if (countdown > 0) {
                await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_START_COUNTDOWN, {
                    roomId,
                    countdown,
                })
            } else {
                clearInterval(countdownInterval)
                await this.startGame(roomId)
            }
        }, this.COUNTDOWN_INTERVAL)
    }

    private async assignPlayers(roomId: string, playerIds: string[]): Promise<void> {
        const randomIndex = Math.floor(Math.random() * 2)
        const playerXId = playerIds[randomIndex]
        const playerOId = playerIds[1 - randomIndex]

        await this.roomRedisService.executeRoomMulti(roomId, (multi) => {
            multi.hset(this.roomRedisService.getRoomKey(roomId), 'playerXId', playerXId)
            multi.hset(this.roomRedisService.getRoomKey(roomId), 'playerOId', playerOId)
        })
    }

    private async startGame(roomId: string): Promise<void> {
        await this.roomRedisService.setRoomField(roomId, 'status', RoomStatusEnum.PLAYING)

        const [boardSizeStr, winConditionStr] = await this.roomRedisService.getRoomData(roomId, ['boardSize', 'winCondition'])
        const size = +boardSizeStr
        const winCondition = +winConditionStr

        const gameState: IGameState = {
            board: Array(size).fill(null).map(() => Array(size).fill(null)),
            isGameActive: true,
            moveCount: 0,
            winCondition,
            currentPlayer: this.DEFAULT_START_PLAYER,
            startTime: new Date().toISOString(),
        }

        await this.roomRedisService.setRoomField(roomId, 'gameState', JSON.stringify(gameState))

        const players = await this.getRoomPlayers(roomId)

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_STARTED, {
            roomId,
            gameState,
            players,
        })
    }

    async makeMove(userId: string, roomId: string, makeMoveDto: IMakeMoveDto): Promise<void> {
        const { row, col } = makeMoveDto

        const gameState = await this.getGameState(roomId)
        if (!gameState) {
            throw new BadRequestException('Game not found')
        }

        if (!gameState.isGameActive) {
            throw new BadRequestException('Game is not active')
        }

        const players = await this.getRoomPlayers(roomId)

        let playerSymbol: PlayerEnum
        if (userId === players.playerXId) {
            playerSymbol = PlayerEnum.X
        } else if (userId === players.playerOId) {
            playerSymbol = PlayerEnum.O
        } else {
            throw new BadRequestException('User is not a player in this game')
        }

        if (gameState.currentPlayer !== playerSymbol) {
            throw new BadRequestException('Not your turn')
        }

        if (row < 0 || row >= gameState.board.length || col < 0 || col >= gameState.board[0].length) {
            throw new BadRequestException('Invalid move position')
        }

        if (gameState.board[row][col] !== null) {
            throw new BadRequestException('Position already occupied')
        }

        gameState.moveCount++
        gameState.board[row][col] = playerSymbol
        gameState.lastMoveTime = new Date().toISOString()
        gameState.currentPlayer = playerSymbol === PlayerEnum.X ? PlayerEnum.O : PlayerEnum.X

        const move: IGameMove = {
            row,
            col,
            player: playerSymbol,
            timestamp: gameState.lastMoveTime,
        }

        const winResult = this.checkWinCondition(gameState, row, col, playerSymbol)

        if (winResult.hasWon) {
            gameState.isGameActive = false

            await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_FINISHED, {
                roomId,
                winner: playerSymbol,
                winningLine: winResult.winningLine,
                gameState,
            })
        } else if (gameState.moveCount === gameState.board.length * gameState.board[0].length) {
            gameState.isGameActive = false

            await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_FINISHED, {
                roomId,
                winner: 'DRAW',
                gameState,
            })
        }

        await this.roomRedisService.setRoomField(roomId, 'gameState', JSON.stringify(gameState))

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_MOVE_MADE, {
            roomId,
            move,
            gameState,
        })
    }

    async getGameStateForPlayer(roomId: string): Promise<IGameStateSyncPayload> {
        const gameState = await this.getGameState(roomId)

        if (!gameState) {
            throw new WsException('Game not found or not started')
        }

        const players = await this.getRoomPlayers(roomId)
        const gameResult = this.determineGameResult(gameState)

        return {
            gameState,
            players,
            winner: gameResult.winner,
            winningLine: gameResult.winningLine
        }
    }

    private getPlayerWinner(player: PlayerEnum): PlayerWinnerEnum {
        if (player === PlayerEnum.X) {
            return PlayerWinnerEnum.X
        } else if (player === PlayerEnum.O) {
            return PlayerWinnerEnum.O
        }
    }

    private determineGameResult(gameState: IGameState): { winner?: PlayerWinnerEnum | null, winningLine?: IPosition[] } {
        if (gameState.isGameActive) {
            return { winner: null }
        }

        const { board } = gameState
        const boardSize = board.length

        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const player = board[row][col]
                if (player) {
                    const winResult = this.checkWinCondition(gameState, row, col, player)

                    if (winResult.hasWon) {
                        return {
                            winner: this.getPlayerWinner(player),
                            winningLine: winResult.winningLine
                        }
                    }
                }
            }
        }

        if (gameState.moveCount === boardSize * boardSize) {
            return { winner: PlayerWinnerEnum.DRAW }
        }

        return { winner: null }
    }

    private checkWinCondition(
        gameState: IGameState,
        row: number,
        col: number,
        player: PlayerEnum,
    ): { hasWon: boolean, winningLine?: IPosition[] } {
        const { board, winCondition } = gameState
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal \
            [1, -1],  // diagonal / 
        ]

        for (const [dx, dy] of directions) {
            const line: IPosition[] = [{ row, col }]

            // Check in positive direction
            let newRow = row + dx
            let newCol = col + dy
            while (
                newRow >= 0 && newRow < board.length &&
                newCol >= 0 && newCol < board[0].length &&
                board[newRow][newCol] === player
            ) {
                line.push({ row: newRow, col: newCol })
                newRow += dx
                newCol += dy
            }

            // Check in negative direction
            newRow = row - dx
            newCol = col - dy
            while (
                newRow >= 0 && newRow < board.length &&
                newCol >= 0 && newCol < board[0].length &&
                board[newRow][newCol] === player
            ) {
                line.unshift({ row: newRow, col: newCol })
                newRow -= dx
                newCol -= dy
            }

            if (line.length >= winCondition) {
                return { hasWon: true, winningLine: line }
            }
        }

        return { hasWon: false }
    }

    async getGameState(roomId: string): Promise<IGameState | null> {
        const gameStateStr = await this.roomRedisService.getRoomField(roomId, 'gameState')
        return gameStateStr ? JSON.parse(gameStateStr) : null
    }

    async getRoomPlayers(roomId: string): Promise<IPlayerAssignment> {
        const [playerXId, playerOId] = await this.roomRedisService.getRoomData(roomId, ['playerXId', 'playerOId'])
        return {
            playerXId: playerXId || '',
            playerOId: playerOId || '',
        }
    }

    async isPlayerInGame(roomId: string, userId: string): Promise<boolean> {
        return await this.roomRedisService.isRoomPlayer(roomId, userId)
    }
}
