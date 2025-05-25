import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'Username for login',
        example: 'john_doe',
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: 'Password for login',
        example: 'password123',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class ITokenResponseDto {
    @ApiProperty({
        description: 'User information',
        example: {
            id: 'uuid-string',
            name: 'John Doe',
            isGuest: 0,
        },
    })
    user: {
        id: string;
        name: string;
        isGuest: number;
    };

    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    token: string;
}

export class IJwtPayloadDto {
    @ApiProperty({
        description: 'User ID (subject)',
        example: 'uuid-string',
    })
    sub: string;

    @ApiProperty({
        description: 'User name',
        example: 'John Doe',
    })
    name: string;

    @ApiProperty({
        description: 'Is guest user (0 = false, 1 = true)',
        example: 0,
    })
    isGuest: number;

    @ApiProperty({
        description: 'Token issued at timestamp',
        example: 1640995200,
        required: false,
    })
    iat?: number;

    @ApiProperty({
        description: 'Token expiration timestamp',
        example: 1640998800,
        required: false,
    })
    exp?: number;
}

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token for getting new access token',
        example: 'refresh_token_string',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class IAuthUserDto {
    @ApiProperty({
        description: 'User ID',
        example: 'uuid-string',
    })
    userId: string;

    @ApiProperty({
        description: 'User name',
        example: 'John Doe',
    })
    name: string;

    @ApiProperty({
        description: 'Is guest user (0 = false, 1 = true)',
        example: 0,
    })
    isGuest: number;
}
