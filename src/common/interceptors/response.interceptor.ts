import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_RESPONSE_TRANSFORM_KEY } from '@common/decorators/skip-response-transform.decorator';
import { RESPONSE_MESSAGE_KEY } from '@common/decorators/message.decorator';

export interface IResponse<T> {
    data: T;
    message: string;
    statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, IResponse<T>> {
    private readonly successMessages = new Map<string, string>([
        ['GET', 'Data retrieved successfully'],
        ['POST', 'Resource created successfully'],
        ['PUT', 'Resource updated successfully'],
        ['PATCH', 'Resource updated successfully'],
        ['DELETE', 'Resource deleted successfully']
    ])

    constructor(private readonly reflector: Reflector) { }

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<IResponse<T>> {
        const skipTransform = this.reflector.getAllAndOverride<boolean>(
            SKIP_RESPONSE_TRANSFORM_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (skipTransform) {
            return next.handle();
        }

        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        // Get custom message from decorator
        const customMessage = this.reflector.getAllAndOverride<string>(
            RESPONSE_MESSAGE_KEY,
            [context.getHandler(), context.getClass()],
        );

        return next.handle().pipe(
            map((data) => ({
                data,
                message:
                    customMessage || this.getSuccessMessage(request.method),
                statusCode: response.statusCode,
            })),
        );
    }

    private getSuccessMessage(method: string): string {
        return this.successMessages.get(method) || 'Operation completed successfully';
    }
}
