import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateRoomDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsOptional()
    @IsString()
    password?: string

    @IsOptional()
    @IsNumber()
    @Min(5)
    @Max(20)
    boardSize?: number

    @IsOptional()
    @IsNumber()
    @Min(3)
    @Max(7)
    winCondition?: number
}

export class JoinRoomDto {
    @IsString()
    @IsNotEmpty()
    roomId: string

    @IsOptional()
    @IsString()
    password?: string
}