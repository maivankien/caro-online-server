import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class ITokenResponseDto {
    user: {
        id: string;
        name: string;
        isGuest: number;
    };
    token: string;
}

export class IJwtPayloadDto {
    sub: string;
    name: string;
    isGuest: number;
    iat?: number;
    exp?: number;
}

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
