import { Server, Socket } from 'socket.io';
import { RoomService } from '../room.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WebSocketJwtStrategy } from '@modules/auth/strategies/ws-jwt.strategy';
import { WsExceptionsFilter } from '@common/filters/ws-exception.filter';
import {
    OnGatewayConnection, OnGatewayInit,
    WebSocketGateway, WebSocketServer, WsException
} from "@nestjs/websockets";
import { EVENT_EMITTER_CONSTANTS, EVENT_SOCKET_CONSTANTS } from '@/common/constants/event.constants';


@WebSocketGateway({
    namespace: "room",
    cors: {
        origin: "*",
        credentials: true
    }
})
@UseFilters(new WsExceptionsFilter())
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RoomGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer()
    private server: Server

    constructor(
        private readonly roomService: RoomService,
        private readonly eventEmitter: EventEmitter2,
        private readonly webSocketJwtStrategy: WebSocketJwtStrategy,
    ) { }

    afterInit(server: Server): void {
        this.server = server
    }

    private getWaitingRoomId(roomId: string) {
        return `waiting_room_${roomId}`
    }

    async handleConnection(client: Socket) {
        try {
            const user = await this.webSocketJwtStrategy.authenticate(client)

            const { room_id } = client.handshake.query
            const roomId = Array.isArray(room_id) ? room_id[0] : room_id

            if (!roomId) {
                return client.disconnect()
            }

            const isRoomCreatedByUser = await
                this.roomService.isRoomCreatedByUser(roomId, user.userId)

            if (!isRoomCreatedByUser) {
                return client.disconnect()
            }

            client.data.user = user

            await client.join(this.getWaitingRoomId(roomId))
        } catch (error) {
            if (error instanceof WsException) {
                return client.disconnect()
            }

            console.log(error)
            client.disconnect()
        }
    }

    @OnEvent(EVENT_EMITTER_CONSTANTS.ROOM_JOINED)
    async handleRoomJoined(payload: { roomId: string, userId: string }) {
        const { roomId, userId } = payload

        this.server
            .to(this.getWaitingRoomId(roomId))
            .emit(EVENT_SOCKET_CONSTANTS.ROOM_JOINED, {
                roomId,
                userId,
            })
    }
}
