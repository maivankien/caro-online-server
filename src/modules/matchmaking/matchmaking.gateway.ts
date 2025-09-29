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
import { OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets"



@WebSocketGateway({
    namespace: "matchmaking",
    cors: {
        origin: "*",
        credentials: true
    }
})
@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MatchmakingGateway implements OnGatewayInit, OnGatewayConnection {
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


    @SubscribeMessage(EVENT_SOCKET_CONSTANTS.MATCHMAKING)
    async matchmaking(client: IMatchmakingSocketCustom, payload: MatchmakingDto) {
        await this.matchmakingService.matchmaking(client, payload)
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
}