import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserGuestDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
