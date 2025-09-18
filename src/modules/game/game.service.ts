import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { Redis } from 'ioredis'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { REDIS_CLIENT } from '@/common/constants/common.constants'
import { EVENT_EMITTER_CONSTANTS } from '@/common/constants/event.constants'
import { RoomStatusEnum } from '@/common/enums/room.enum'
import {
    IGameState,
    IGameMove,
    IPlayerAssignment,
    IMakeMoveDto,
    IPosition,
    IPlayerReadyStatus
} from './interfaces/game.interface'
import { WsException } from '@nestjs/websockets'

@Injectable()
export class GameService {
    private readonly COUNTDOWN_INTERVAL = 1000 // 1 second
    private readonly DEFAULT_BOARD_SIZE = 15
    private readonly DEFAULT_WIN_CONDITION = 5
    private readonly DEFAULT_COUNTDOWN = 3
    private readonly DELAY_START_GAME = 500

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async setPlayerReady(roomId: string, userId: string): Promise<void> {
        const [status, playerIdsRaw, playerXId, playerOId] = await this.redis.hmget(
            `room:${roomId}`,
            'status',
            'playerIds',
            'playerXId',
            'playerOId',
        )

        if (status !== RoomStatusEnum.READY) {
            throw new WsException('Room is not in ready status')
        }

        const playerIds = JSON.parse(playerIdsRaw || '[]')
        if (!playerIds.includes(userId)) {
            throw new WsException('User is not a player in this room')
        }


        if (!playerXId || !playerOId) {
            await this.assignPlayers(roomId, playerIds)
        }

        const readyKey = `room:${roomId}:ready`
        await this.redis.hset(readyKey, userId, true.toString())

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
    }

    async getPlayersReadyStatus(roomId: string): Promise<IPlayerReadyStatus> {
        const readyKey = `room:${roomId}:ready`
        const [playerXId, playerOId] = await this.redis.hmget(`room:${roomId}`, 'playerXId', 'playerOId')

        const [playerXReady, playerOReady] = await this.redis.hmget(readyKey, playerXId || '', playerOId || '')

        return {
            playerXId: playerXId || '',
            playerOId: playerOId || '',
            playerXReady: playerXReady === 'true',
            playerOReady: playerOReady === 'true',
            bothReady: playerXReady === 'true' && playerOReady === 'true'
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

        await this.redis
            .multi()
            .hset(`room:${roomId}`, 'playerXId', playerXId)
            .hset(`room:${roomId}`, 'playerOId', playerOId)
            .exec()
    }

    private async startGame(roomId: string): Promise<void> {
        await this.redis.hset(`room:${roomId}`, 'status', RoomStatusEnum.PLAYING)

        const boardSizeStr = await this.redis.hget(`room:${roomId}`, 'boardSize')
        const size = boardSizeStr ? parseInt(boardSizeStr) : this.DEFAULT_BOARD_SIZE

        const gameState: IGameState = {
            board: Array(size).fill(null).map(() => Array(size).fill(null)),
            currentPlayer: 'X',
            isGameActive: true,
            moveCount: 0,
            startTime: new Date().toISOString(),
        }

        await this.redis.hset(`room:${roomId}`, 'gameState', JSON.stringify(gameState))

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

        let playerSymbol: 'X' | 'O'
        if (userId === players.playerXId) {
            playerSymbol = 'X'
        } else if (userId === players.playerOId) {
            playerSymbol = 'O'
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
        gameState.currentPlayer = playerSymbol === 'X' ? 'O' : 'X'

        const move: IGameMove = {
            row,
            col,
            player: playerSymbol,
            timestamp: gameState.lastMoveTime,
        }

        const winResult = await this.checkWinCondition(gameState, row, col, playerSymbol, roomId)

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

        await this.redis.hset(`room:${roomId}`, 'gameState', JSON.stringify(gameState))

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_MOVE_MADE, {
            roomId,
            move,
            gameState,
        })
    }

    private async checkWinCondition(
        gameState: IGameState,
        row: number,
        col: number,
        player: 'X' | 'O',
        roomId: string
    ): Promise<{ hasWon: boolean, winningLine?: IPosition[] }> {
        const winConditionStr = await this.redis.hget(`room:${roomId}`, 'winCondition')
        const winCondition = winConditionStr ? parseInt(winConditionStr) : this.DEFAULT_WIN_CONDITION

        const { board } = gameState
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
        const gameStateStr = await this.redis.hget(`room:${roomId}`, 'gameState')
        return gameStateStr ? JSON.parse(gameStateStr) : null
    }

    async getRoomPlayers(roomId: string): Promise<IPlayerAssignment> {
        const [playerXId, playerOId] = await this.redis.hmget(`room:${roomId}`, 'playerXId', 'playerOId')
        return {
            playerXId: playerXId || '',
            playerOId: playerOId || '',
        }
    }

    async isPlayerInGame(roomId: string, userId: string): Promise<boolean> {
        return !!(await this.redis.sismember(`room:${roomId}:players`, userId))
    }
}
