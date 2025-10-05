import { v4 as uuidv4 } from 'uuid'
import { Injectable } from '@nestjs/common'
import { EVENT_EMITTER_CONSTANTS } from '@/common/constants/event.constants'
import { PlayerEnum, PlayerWinnerEnum, RoomStatusEnum, RoomTypeEnum } from '@/common/enums/common.enum'
import {
    IGameState,
    IGameMove,
    IPlayerAssignment,
    IMakeMoveDto,
    IPosition,
    IPlayerReadyStatus,
    IGameStateSyncPayload,
    ISocketData,
} from './interfaces/game.interface'
import { WsException } from '@nestjs/websockets'
import { RoomRedisService } from '@modules/room/services/room-redis.service'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LockService } from '@common/services/lock.service'
import { AiService } from '@modules/ai/ai.service'

@Injectable()
export class GameService {
    private readonly COUNTDOWN_INTERVAL = 800 // 0.8 second
    private readonly DEFAULT_COUNTDOWN = 3
    private readonly DELAY_START_GAME = 200
    private readonly DEFAULT_START_PLAYER = PlayerEnum.X
    private readonly AI_PLAYER_ID = 'AI_PLAYER'
    private readonly AI_MOVE_DELAY = 800 // 0.8 second delay for AI move

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly roomRedisService: RoomRedisService,
        private readonly lockService: LockService,
        private readonly aiService: AiService,
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
            const [
                status,
                playerIdsRaw,
                playerXId,
                playerOId,
                roomType,
            ] = await this.roomRedisService.getRoomData(roomId, [
                'status',
                'playerIds',
                'playerXId',
                'playerOId',
                'type',
            ])

            if (status !== RoomStatusEnum.WAITING_READY) {
                throw new WsException('Room is not in waiting ready status')
            }

            const playerIds = JSON.parse(playerIdsRaw)

            if (!playerXId || !playerOId) {
                await this.assignPlayers(roomId, roomType, playerIds)
            }

            await this.roomRedisService.setPlayerReady(roomId, userId, true)

            // For AI rooms, immediately start game when human player is ready
            if (roomType === RoomTypeEnum.AI) {
                const gameState = await this.getGameState(roomId)
                if (!gameState) {
                    setTimeout(async () => {
                        await this.startGameCountdown(roomId)
                    }, this.DELAY_START_GAME)
                }
            } else {
                // For regular rooms, wait for both players to be ready
                const readyStatus = await this.getPlayersReadyStatus(roomId)

                if (readyStatus.bothReady) {
                    const gameState = await this.getGameState(roomId)

                    if (!gameState) {
                        setTimeout(async () => {
                            await this.startGameCountdown(roomId)
                        }, this.DELAY_START_GAME)
                    }
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

    private async assignPlayers(roomId: string, roomType: RoomTypeEnum, playerIds: string[]): Promise<void> {
        // For AI room, random assignment: human can be X or O
        if (roomType === RoomTypeEnum.AI) {
            const humanPlayerId = playerIds[0]
            const randomIndex = Math.floor(Math.random() * 2)

            const roomKey = this.roomRedisService.getRoomKey(roomId)

            const playerXId = randomIndex === 0 ? humanPlayerId : this.AI_PLAYER_ID
            const playerOId = randomIndex === 0 ? this.AI_PLAYER_ID : humanPlayerId

            await this.roomRedisService.executeRoomMulti((multi) => {
                multi.hset(roomKey, 'playerXId', playerXId)
                multi.hset(roomKey, 'playerOId', playerOId)
            })
            return
        }

        // For regular room, random assignment: human can be X or O
        const randomIndex = Math.floor(Math.random() * 2)
        const playerXId = playerIds[randomIndex]
        const playerOId = playerIds[1 - randomIndex]

        await this.roomRedisService.executeRoomMulti((multi) => {
            multi.hset(this.roomRedisService.getRoomKey(roomId), 'playerXId', playerXId)
            multi.hset(this.roomRedisService.getRoomKey(roomId), 'playerOId', playerOId)
        })
    }

    private async startGame(roomId: string): Promise<void> {
        await this.roomRedisService.setRoomField(roomId, 'status', RoomStatusEnum.PLAYING)

        const [
            roomType,
            boardSizeStr,
            winConditionStr,
            playerXId,
            playerOId,
        ] =
            await this.roomRedisService.getRoomData(roomId, [
                'type',
                'boardSize',
                'winCondition',
                'playerXId',
                'playerOId',
            ])

        const size = +boardSizeStr
        const winCondition = +winConditionStr

        const gameState: IGameState = {
            id: uuidv4(),
            roomType: roomType,
            playerXId: playerXId,
            playerOId: playerOId,
            board: Array(size).fill(null).map(() => Array(size).fill(null)),
            isGameActive: true,
            moveCount: 0,
            winCondition,
            currentPlayer: this.DEFAULT_START_PLAYER,
            startTime: new Date().toISOString(),
        }

        await this.roomRedisService.setRoomField(roomId, 'gameState', JSON.stringify(gameState))

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_STARTED, {
            roomId,
            gameState,
            players: {
                playerXId: playerXId,
                playerOId: playerOId,
            },
        })

        // For AI rooms, if AI goes first, make the first move
        if (roomType === RoomTypeEnum.AI) {
            await this.handleAiMove(roomId, gameState)
        }
    }

    private getPlayerSymbol(userId: string, gameState: IGameState): PlayerEnum {
        if (userId === gameState.playerXId) {
            return PlayerEnum.X
        } else if (userId === gameState.playerOId) {
            return PlayerEnum.O
        }
    }

    private async makeAiMove(roomId: string, gameState: IGameState): Promise<void> {
        const aiSymbol = gameState.currentPlayer
        const aiPosition = this.aiService.bestMove(gameState.board, aiSymbol)

        const aiMove: IMakeMoveDto = {
            row: aiPosition.row,
            col: aiPosition.col
        }

        await this.makeMove(this.AI_PLAYER_ID, roomId, aiMove)
    }

    private isAiTurn(gameState: IGameState): boolean {
        return (gameState.currentPlayer === PlayerEnum.X && gameState.playerXId === this.AI_PLAYER_ID) ||
            (gameState.currentPlayer === PlayerEnum.O && gameState.playerOId === this.AI_PLAYER_ID)
    }

    private async handleAiMove(roomId: string, gameState: IGameState): Promise<void> {
        if (!this.isAiTurn(gameState)) {
            return
        }

        setTimeout(async () => {
            const currentGameState = await this.getGameState(roomId)

            if (currentGameState?.isGameActive && this.isAiTurn(currentGameState)) {
                await this.makeAiMove(roomId, currentGameState)
            }
        }, this.AI_MOVE_DELAY)
    }

    async makeMove(userId: string, roomId: string, makeMoveDto: IMakeMoveDto): Promise<void> {
        const { row, col } = makeMoveDto

        const gameState = await this.getGameState(roomId)
        this.validateMoveRequest(gameState, userId, row, col)

        const playerSymbol = this.getPlayerSymbol(userId, gameState)
        const move = this.updateGameState(gameState, row, col, playerSymbol)

        await this.handleGameEndConditions(roomId, gameState, playerSymbol, move)
        await this.saveGameStateAndEmitEvents(roomId, gameState, move)

        if (gameState.roomType === RoomTypeEnum.AI && gameState.isGameActive) {
            await this.handleAiMove(roomId, gameState)
        }
    }

    private validateMoveRequest(gameState: IGameState | null, userId: string, row: number, col: number): void {
        if (!gameState) {
            throw new WsException('Game not found')
        }

        if (!gameState.isGameActive) {
            throw new WsException('Game is not active')
        }

        const playerSymbol = this.getPlayerSymbol(userId, gameState)
        if (gameState.currentPlayer !== playerSymbol) {
            throw new WsException('Not your turn')
        }

        if (row < 0 || row >= gameState.board.length || col < 0 || col >= gameState.board[0].length) {
            throw new WsException('Invalid move position')
        }

        if (gameState.board[row][col] !== null) {
            throw new WsException('Position already occupied')
        }
    }

    private updateGameState(gameState: IGameState, row: number, col: number, playerSymbol: PlayerEnum): IGameMove {
        gameState.moveCount++
        gameState.board[row][col] = playerSymbol
        gameState.lastMoveTime = new Date().toISOString()
        gameState.currentPlayer = playerSymbol === PlayerEnum.X ? PlayerEnum.O : PlayerEnum.X
        gameState.lastMovePosition = { row, col }

        return {
            row,
            col,
            player: playerSymbol,
            timestamp: gameState.lastMoveTime,
        }
    }

    private async handleGameEndConditions(
        roomId: string,
        gameState: IGameState,
        playerSymbol: PlayerEnum,
        move: IGameMove
    ): Promise<void> {
        const winResult = this.checkWinCondition(gameState, move.row, move.col, playerSymbol)

        if (winResult.hasWon) {
            await this.endGameWithWinner(roomId, gameState, playerSymbol, winResult.winningLine)
        } else if (this.isBoardFull(gameState)) {
            await this.endGameWithDraw(roomId, gameState)
        }
    }

    private async endGameWithWinner(
        roomId: string,
        gameState: IGameState,
        winner: PlayerEnum,
        winningLine?: IPosition[]
    ): Promise<void> {
        gameState.isGameActive = false
        gameState.finishedAt = new Date().toISOString()

        await this.roomRedisService.setRoomField(roomId, 'status', RoomStatusEnum.FINISHED)

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_FINISHED, {
            roomId,
            winner,
            winningLine,
            gameState,
        })
    }

    private async endGameWithDraw(roomId: string, gameState: IGameState): Promise<void> {
        gameState.isGameActive = false
        gameState.finishedAt = new Date().toISOString()

        await this.roomRedisService.setRoomField(roomId, 'status', RoomStatusEnum.FINISHED)

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.GAME_FINISHED, {
            roomId,
            gameState,
            winner: PlayerWinnerEnum.DRAW,
        })
    }

    private isBoardFull(gameState: IGameState): boolean {
        return gameState.moveCount === gameState.board.length * gameState.board[0].length
    }

    private async saveGameStateAndEmitEvents(roomId: string, gameState: IGameState, move: IGameMove): Promise<void> {
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

        const players: IPlayerAssignment = {
            playerXId: gameState.playerXId,
            playerOId: gameState.playerOId
        }
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

    async isPlayerInGame(roomId: string, userId: string): Promise<boolean> {
        return await this.roomRedisService.isRoomPlayer(roomId, userId)
    }

    async acceptRematchRequest(roomId: string, roomType: RoomTypeEnum, playerIds: string[]) {
        await this.assignPlayers(roomId, roomType, playerIds)

        await this.startGame(roomId)
    }

    async requestRematch(data: ISocketData): Promise<void> {
        const { roomId, user } = data
        const { userId } = user

        const lockKey = `room:${roomId}:ready`
        const lockExpire = 5000 // 5 seconds
        const lockTimeout = 3000 // 3 seconds timeout to acquire lock

        const lockAcquired = await this.lockService.acquireLock(lockKey, lockExpire, lockTimeout)
        if (!lockAcquired) {
            throw new WsException('Another player is requesting rematch, please try again')
        }

        try {
            const [
                status,
                playerIdsRaw,
                rematchRequester,
                roomType,
            ] = await this.roomRedisService.getRoomData(roomId, ['status', 'playerIds', 'rematchRequester', 'type'])

            if (status !== RoomStatusEnum.FINISHED && status !== RoomStatusEnum.WAITING_REMATCH) {
                throw new WsException('Room is not finished')
            }

            // For AI rooms, immediately start rematch
            if (roomType === RoomTypeEnum.AI) {
                return await this.acceptRematchRequest(roomId, roomType, JSON.parse(playerIdsRaw))
            }

            if (
                status === RoomStatusEnum.WAITING_REMATCH
                && rematchRequester && rematchRequester !== userId
            ) {
                return await this.acceptRematchRequest(roomId, roomType, JSON.parse(playerIdsRaw))
            }

            await this.roomRedisService.executeRoomMulti((multi) => {
                multi.hset(this.roomRedisService.getRoomKey(roomId), 'rematchRequester', userId)
                multi.hset(this.roomRedisService.getRoomKey(roomId), 'status', RoomStatusEnum.WAITING_REMATCH)
            })

            await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.REQUEST_REMATCH, {
                roomId,
                user,
            })
        } finally {
            await this.lockService.unlock(lockKey)
        }
    }

    async acceptRematch(data: ISocketData): Promise<void> {
        const { roomId, user } = data
        const { userId } = user

        const [status, playerIdsRaw, rematchRequester, roomType] = await this.roomRedisService.getRoomData(roomId, [
            'status',
            'playerIds',
            'rematchRequester',
            'type'
        ])

        if (status !== RoomStatusEnum.WAITING_REMATCH) {
            throw new WsException('Room is not waiting for rematch')
        }

        if (roomType === RoomTypeEnum.AI) {
            throw new WsException('AI rooms do not require manual rematch acceptance')
        }

        if (rematchRequester === userId) {
            throw new WsException('You cannot accept your own rematch request')
        }

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.ACCEPT_REMATCH, {
            roomId,
            user,
        })

        await this.acceptRematchRequest(roomId, roomType, JSON.parse(playerIdsRaw))
    }

    async declineRematch(data: ISocketData): Promise<void> {
        const { roomId, user } = data

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.DECLINE_REMATCH, {
            roomId,
            user,
        })
    }
}
