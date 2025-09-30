import { Server } from "socket.io"
import { OnEvent } from "@nestjs/event-emitter"
import { UserService } from "@modules/user/user.service"
import { MatchmakingDto } from "./dto/matchmaking.dto"
import { MatchmakingService } from "./matchmaking.service"
import { UseFilters, UsePipes, ValidationPipe } from "@nestjs/common"
import { WsExceptionsFilter } from "@/common/filters/ws-exception.filter"
import { WebSocketJwtStrategy } from "@modules/auth/strategies/ws-jwt.strategy"
import { IMatchmakingSocketCustom } from "./interfaces/matchmaking.interface"
import { EVENT_EMITTER_CONSTANTS, EVENT_SOCKET_CONSTANTS } from "@/common/constants/event.constants"
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets"



@WebSocketGateway({
    namespace: "matchmaking",
    cors: {
        origin: "*",
        credentials: true
    }
})
@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MatchmakingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server

    constructor(
        private readonly userService: UserService,
        private readonly matchmakingService: MatchmakingService,
        private readonly webSocketJwtStrategy: WebSocketJwtStrategy,
    ) { }

    afterInit(server: Server): void {
        this.server = server

        server.use(async (client: IMatchmakingSocketCustom, next: (err?: Error) => void) => {
            try {
                const user = await this.webSocketJwtStrategy.authenticate(client)

                const { userId } = user

                const { id } = await this.userService.findById(userId, {
                    id: true,
                })

                if (!id) {
                    throw new WsException('User not found')
                }

                client.data.user = user

                next()
            } catch (error) {
                if (error instanceof WsException) {
                    return next(error)
                }

                console.log('Error in middleware: ', error)
                next(new Error('Internal server error'))
            }
        })
    }

    private getMatchmakingRoomId(userId: string) {
        return `matchmaking_${userId}`
    }

    async handleConnection(client: IMatchmakingSocketCustom) {
        const { userId } = client.data.user

        await client.join(this.getMatchmakingRoomId(userId))
    }

    async handleDisconnect(client: IMatchmakingSocketCustom) {
        const { userId } = client.data.user

        await client.leave(this.getMatchmakingRoomId(userId))

        await this.matchmakingService.handleDisconnect(client)
    }


    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.MATCHMAKING)
    async matchmaking(client: IMatchmakingSocketCustom, payload: MatchmakingDto) {
        await this.matchmakingService.matchmaking(client, payload)
    }

    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.MATCHMAKING_CANCEL)
    async matchmakingCancel(client: IMatchmakingSocketCustom) {
        await this.matchmakingService.matchmakingCancel(client)
    }

    @OnEvent(EVENT_EMITTER_CONSTANTS.MATCHMAKING_FOUND)
    async matchmakingFound(payload: { playerA: string, playerB: string, roomId: string }) {
        const { playerA, playerB, roomId } = payload

        this.server
            .to(this.getMatchmakingRoomId(playerA))
            .to(this.getMatchmakingRoomId(playerB))
            .emit(EVENT_SOCKET_CONSTANTS.MATCHMAKING_FOUND, {
                playerA,
                playerB,
                roomId,
            })
    }

    @OnEvent(EVENT_EMITTER_CONSTANTS.MATCHMAKING_TIMEOUT)
    async matchmakingTimeout(payload: { userId: string }) {
        const { userId } = payload

        this.server
            .to(this.getMatchmakingRoomId(userId))
            .emit(EVENT_SOCKET_CONSTANTS.MATCHMAKING_TIMEOUT, {
                message: 'Matchmaking timeout: No opponent found',
            })
    }
}