import { IAuthUser } from '../interfaces/auth.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): IAuthUser => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    }
)


export const AccessToken = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.headers.authorization.split(' ')[1];
    }
)