import {
    Catch,
    ArgumentsHost,
    ExceptionFilter,
    BadRequestException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { EVENT_SOCKET_CONSTANTS } from '../constants/event.constants';


@Catch(WsException, BadRequestException)
export class WsExceptionsFilter implements ExceptionFilter {
    catch(exception: WsException, host: ArgumentsHost) {
        const ctx = host.switchToWs()
        const client: Socket = ctx.getClient<Socket>()

        console.log(exception)

        client.emit(EVENT_SOCKET_CONSTANTS.ERROR, {
            event: EVENT_SOCKET_CONSTANTS.ERROR,
            message: exception instanceof WsException ? exception.message : 'An error occurred',
        })
    }
}
