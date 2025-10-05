import { IsNotEmpty, IsString, MaxLength, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserGuestDto {
    @ApiProperty({
        description: 'Guest user name',
        example: 'Guest User',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    name: string;
}

export class CreateUserDto {
    @ApiProperty({
        description: 'User name',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    name: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'password123',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class LoginUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'password123',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}
