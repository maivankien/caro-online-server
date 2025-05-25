import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@modules/user/user.service';
import { CreateUserGuestDto } from '@modules/user/dto/user.dto';
import { IJwtPayload, ITokenResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) { }

    async createGuestUserWithToken(
        createUserDto: CreateUserGuestDto,
    ): Promise<ITokenResponse> {
        const user = await this.userService.createUserGuest(createUserDto)

        const payload: IJwtPayload = {
            sub: user.id,
            name: user.name,
            isGuest: user.isGuest,
        };

        const token = this.jwtService.sign(payload);

        return {
            user: {
                id: user.id,
                name: user.name,
                isGuest: user.isGuest,
            },
            token,
        }
    }

    async verifyToken(token: string): Promise<IJwtPayload> {
        return this.jwtService.verify(token)
    }
}
