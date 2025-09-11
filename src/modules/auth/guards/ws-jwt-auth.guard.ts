import { Socket } from 'socket.io'
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { WebSocketJwtStrategy } from '../strategies/ws-jwt.strategy'

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
    constructor(
        private readonly webSocketJwtStrategy: WebSocketJwtStrategy,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>()

        const user = await this.webSocketJwtStrategy.authenticate(client)

        client.data.user = user

        return true
    }
} 