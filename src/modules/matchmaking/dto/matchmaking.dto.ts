import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsNumber } from "class-validator"

export class MatchmakingDto {
    @ApiProperty({
        description: 'Board size',
        example: 15,
    })
    @IsNumber()
    @IsNotEmpty()
    boardSize: number


    @ApiProperty({
        description: 'Win condition',
        example: 5,
    })
    @IsNumber()
    @IsNotEmpty()
    winCondition: number
}