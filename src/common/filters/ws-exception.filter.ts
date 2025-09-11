import {
    Catch,
    ArgumentsHost,
    ExceptionFilter,
    BadRequestException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';


@Catch(WsException, BadRequestException)
export class WsExceptionsFilter implements ExceptionFilter {
    catch(exception: WsException, host: ArgumentsHost) {
        const ctx = host.switchToWs()
        const client: Socket = ctx.getClient<Socket>()

        console.log(exception)

        client.emit('error', {
            status: 'error',
            message: exception.message || 'WebSocket Error'
        })
    }
}
