import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@config/app/config.service';
import { IJwtPayload, IAuthUser } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly appConfigService: AppConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: appConfigService.jwt.secret,
        });
    }

    async validate(payload: IJwtPayload): Promise<IAuthUser> {
        return {
            userId: payload.sub,
            name: payload.name,
            isGuest: payload.isGuest,
        };
    }
}
