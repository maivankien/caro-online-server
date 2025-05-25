import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserGuestDto {
    @ApiProperty({
        description: 'Guest user name',
        example: 'Guest User',
    })
    @IsString()
    @IsNotEmpty()
    name: string;
}
