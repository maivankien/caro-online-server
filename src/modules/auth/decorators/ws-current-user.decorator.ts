import { Socket } from 'socket.io'
import { IAuthUser } from '../interfaces/auth.interface'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'


export const WsCurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext): IAuthUser => {
        const client: Socket = context.switchToWs().getClient<Socket>()
        return client.data.user
    }
)