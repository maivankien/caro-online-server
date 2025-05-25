import { IAuthUser } from '../interfaces/auth.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): IAuthUser => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    }
)
