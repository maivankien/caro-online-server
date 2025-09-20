import { Injectable } from '@nestjs/common'
import { Socket } from 'socket.io'
import { RoomService } from '../room.service'
import { WsException } from '@nestjs/websockets'
import { WebSocketJwtStrategy } from '@modules/auth/strategies/ws-jwt.strategy'

@Injectable()
export class RoomAuthMiddleware {
    constructor(
        private readonly roomService: RoomService,
        private readonly webSocketJwtStrategy: WebSocketJwtStrategy,
    ) { }

    async use(client: Socket, next: (err?: Error) => void) {
        try {
            const user = await this.webSocketJwtStrategy.authenticate(client)

            const { room_id } = client.handshake.query
            const roomId = Array.isArray(room_id) ? room_id[0] : room_id

            if (!roomId) {
                throw new WsException('Room ID is required')
            }


            const isRoomCreatedByUser = await this.roomService.isRoomCreatedByUser(roomId, user.userId)

            if (!isRoomCreatedByUser) {
                throw new WsException('Access denied: Room not created by user')
            }

            client.data.user = user
            client.data.roomId = roomId

            next()
        } catch (error) {
            if (error instanceof WsException) {
                return next(error)
            }

            console.log('Room auth middleware error:', error)
            next(new WsException('Internal server error'))
        }
    }
}
