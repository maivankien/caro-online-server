import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface IErrorResponse {
    data: null;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        const errorResponse: IErrorResponse = {
            data: null,
            message: this.getErrorMessage(exception),
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(status).json(errorResponse);
    }

    private getErrorMessage(exception: HttpException): string {
        const response = exception.getResponse();

        if (typeof response === 'string') {
            return response;
        }

        if (typeof response === 'object' && response !== null) {
            if ('message' in response) {
                const message = (response as any).message;
                if (Array.isArray(message)) {
                    return message.join(', ')
                }
                return message;
            }
        }

        return 'An error occurred'
    }
}
