import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsExceptionsFilter } from '@common/filters/ws-exception.filter';
import {
    OnGatewayConnection, OnGatewayInit,
    WebSocketGateway, WebSocketServer
} from "@nestjs/websockets";
import { EVENT_EMITTER_CONSTANTS, EVENT_SOCKET_CONSTANTS } from '@/common/constants/event.constants';
import { RoomAuthMiddleware } from '../middleware/room-auth.middleware';


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
        private readonly roomAuthMiddleware: RoomAuthMiddleware,
    ) { }

    afterInit(server: Server): void {
        this.server = server
        
        server.use(async (client: Socket, next) => {
            await this.roomAuthMiddleware.use(client, next)
        })
    }

    private getWaitingRoomId(roomId: string) {
        return `waiting_room_${roomId}`
    }

    async handleConnection(client: Socket) {
        const { roomId } = client.data
        await client.join(this.getWaitingRoomId(roomId))
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
