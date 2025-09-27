import { Server, Socket } from 'socket.io'
import { GameService } from '../game.service'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common'
import { WebSocketJwtStrategy } from '@modules/auth/strategies/ws-jwt.strategy'
import { WsExceptionsFilter } from '@common/filters/ws-exception.filter'
import {
    OnGatewayConnection, OnGatewayInit,
    WebSocketGateway, WebSocketServer, WsException,
    SubscribeMessage, MessageBody, ConnectedSocket
} from "@nestjs/websockets"
import {
    EVENT_EMITTER_CONSTANTS,
    EVENT_SOCKET_CONSTANTS
} from '@/common/constants/event.constants'
import {
    IGameCountdownPayload,
    IGameStartedPayload,
    IGameMovePayload,
    IGameFinishedPayload,
    IMakeMoveDto,
} from '../interfaces/game.interface'


@WebSocketGateway({
    namespace: "game",
    cors: {
        origin: "*",
        credentials: true
    }
})
@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class GameGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer()
    private server: Server

    constructor(
        private readonly gameService: GameService,
        private readonly eventEmitter: EventEmitter2,
        private readonly webSocketJwtStrategy: WebSocketJwtStrategy,
    ) { }

    afterInit(server: Server): void {
        this.server = server

        server.use(async (socket, next) => {
            try {
                const user = await this.webSocketJwtStrategy.authenticate(socket)

                const { room_id } = socket.handshake.query
                const roomId = Array.isArray(room_id) ? room_id[0] : room_id


                if (!roomId) {
                    throw new WsException('Room ID is required')
                }

                const isPlayer = await this.gameService.isPlayerInGame(roomId, user.userId)

                if (!isPlayer) {
                    throw new WsException('User is not a player in this game')
                }

                socket.data.user = user
                socket.data.roomId = roomId

                next()
            } catch (error) {
                if (error instanceof WsException) {
                    return next(error)
                }

                console.log('Error in middleware: ', error)
                next(new Error('Authentication failed'))
            }
        })
    }

    private getGameRoomId(roomId: string) {
        return `game_${roomId}`
    }

    async handleConnection(client: Socket) {
        const { roomId } = client.data

        await client.join(this.getGameRoomId(roomId))
    }

    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.PLAYER_READY)
    async handlePlayerReady(
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const { roomId } = client.data
            const { userId } = client.data.user

            await this.gameService.setPlayerReady(roomId, userId)

        } catch (error) {
            client.emit(EVENT_SOCKET_CONSTANTS.ERROR, {
                event: EVENT_SOCKET_CONSTANTS.PLAYER_READY,
                message: error instanceof WsException ? error.message : 'An error occurred',
            })
        }
    }


    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.MAKE_MOVE)
    async handleMakeMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: IMakeMoveDto
    ) {
        try {
            const { roomId } = client.data
            const { userId } = client.data.user

            if (!userId) {
                throw new WsException('Invalid user')
            }

            await this.gameService.makeMove(userId, roomId, data)

        } catch (error) {
            client.emit(EVENT_SOCKET_CONSTANTS.ERROR, {
                event: EVENT_SOCKET_CONSTANTS.MAKE_MOVE,
                message: error instanceof WsException ? error.message : 'An error occurred',
            })
        }
    }

    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.GET_GAME_STATE)
    async handleGetGameState(
        @ConnectedSocket() client: Socket,
    ) {
        try {
            const { roomId } = client.data

            const gameStateData = await this.gameService.getGameStateForPlayer(roomId)

            client.emit(EVENT_SOCKET_CONSTANTS.GAME_STATE_SYNC, gameStateData)

        } catch (error) {
            client.emit(EVENT_SOCKET_CONSTANTS.ERROR, {
                event: EVENT_SOCKET_CONSTANTS.GET_GAME_STATE,
                message: error instanceof WsException ? error.message : 'An error occurred',
            })
        }
    }


    @OnEvent(EVENT_EMITTER_CONSTANTS.GAME_START_COUNTDOWN)
    async handleGameStartCountdown(payload: IGameCountdownPayload) {
        const { roomId, countdown } = payload

        this.server
            .to(this.getGameRoomId(roomId))
            .emit(EVENT_SOCKET_CONSTANTS.GAME_START_COUNTDOWN, {
                countdown,
                message: countdown > 0 ? `Game starts in ${countdown}...` : 'GO!'
            })
    }

    @OnEvent(EVENT_EMITTER_CONSTANTS.GAME_STARTED)
    async handleGameStarted(payload: IGameStartedPayload) {
        const { roomId, gameState, players } = payload

        this.server
            .to(this.getGameRoomId(roomId))
            .emit(EVENT_SOCKET_CONSTANTS.GAME_STARTED, {
                gameState,
                players,
                message: 'Game has started! Player X goes first.'
            })
    }

    @OnEvent(EVENT_EMITTER_CONSTANTS.GAME_MOVE_MADE)
    async handleGameMoveMade(payload: IGameMovePayload) {
        const { roomId, move, gameState } = payload

        this.server
            .to(this.getGameRoomId(roomId))
            .emit(EVENT_SOCKET_CONSTANTS.GAME_MOVE_MADE, {
                move,
                gameState,
                nextPlayer: gameState.currentPlayer
            })
    }


    @OnEvent(EVENT_EMITTER_CONSTANTS.GAME_FINISHED)
    async handleGameFinished(payload: IGameFinishedPayload) {
        const { roomId, winner, winningLine, gameState } = payload

        this.server
            .to(this.getGameRoomId(roomId))
            .emit(EVENT_SOCKET_CONSTANTS.GAME_FINISHED, {
                winner,
                winningLine,
                gameState,
            })
    }

    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.REQUEST_REMATCH)
    async handleRequestRematch(
        @ConnectedSocket() client: Socket,
    ) {
        const { roomId } = client.data
        const { userId } = client.data.user

        await this.gameService.requestRematch(roomId, userId)
    }

    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.ACCEPT_REMATCH)
    async handleAcceptRematch(
        @ConnectedSocket() client: Socket,
    ) {
        const { roomId } = client.data
        const { userId } = client.data.user

        await this.gameService.acceptRematch(roomId, userId)
    }

    @OnEvent(EVENT_EMITTER_CONSTANTS.REQUEST_REMATCH)
    async handleRematchRequested(payload: { roomId: string, userId: string }) {
        const { roomId, userId } = payload

        this.server
            .to(this.getGameRoomId(roomId))
            .emit(EVENT_SOCKET_CONSTANTS.REQUEST_REMATCH, {
                roomId,
                userId,
            })
    }
}
