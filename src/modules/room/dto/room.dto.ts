import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty({
        description: 'Room name',
        example: 'My Caro Room',
    })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiPropertyOptional({
        description: 'Room password (optional)',
        example: 'room123',
    })
    @IsOptional()
    @IsString()
    password?: string

    @ApiPropertyOptional({
        description: 'Board size (5-20)',
        example: 15,
        minimum: 5,
        maximum: 20,
    })
    @IsOptional()
    @IsNumber()
    @Min(5)
    @Max(20)
    boardSize?: number

    @ApiPropertyOptional({
        description: 'Win condition (3-7 consecutive pieces)',
        example: 5,
        minimum: 3,
        maximum: 7,
    })
    @IsOptional()
    @IsNumber()
    @Min(3)
    @Max(7)
    winCondition?: number
}

export class JoinRoomDto {
    @ApiProperty({
        description: 'Room ID to join',
        example: 'uuid-room-id',
    })
    @IsString()
    @IsNotEmpty()
    roomId: string

    @ApiPropertyOptional({
        description: 'Room password (if required)',
        example: 'room123',
    })
    @IsOptional()
    @IsString()
    password?: string
}

export class IRoomHostDto {
    @ApiProperty({
        description: 'Host user ID',
        example: 'uuid-host-id',
    })
    id: string

    @ApiProperty({
        description: 'Host user name',
        example: 'John Doe',
    })
    name: string
}

export class IRoomResponseDto {
    @ApiProperty({
        description: 'Room ID',
        example: 'uuid-room-id',
    })
    id: string

    @ApiProperty({
        description: 'Room name',
        example: 'My Caro Room',
    })
    name: string

    @ApiProperty({
        description: 'Room host information',
        type: IRoomHostDto,
    })
    host: IRoomHostDto

    @ApiProperty({
        description: 'Room status',
        example: 'WAITING',
        enum: ['WAITING', 'PLAYING', 'FINISHED'],
    })
    status: string

    @ApiProperty({
        description: 'Whether room has password',
        example: false,
    })
    hasPassword: boolean

    @ApiProperty({
        description: 'Board size',
        example: 15,
    })
    boardSize: number

    @ApiProperty({
        description: 'Win condition',
        example: 5,
    })
    winCondition: number

    @ApiProperty({
        description: 'Room creation timestamp',
        example: '2024-01-01T00:00:00.000Z',
    })
    createdAt: Date
}

export class IRoomListResponseDto {
    @ApiProperty({
        description: 'List of rooms',
        type: [IRoomResponseDto],
    })
    rooms: IRoomResponseDto[]

    @ApiProperty({
        description: 'Total number of rooms',
        example: 25,
    })
    total: number

    @ApiProperty({
        description: 'Current page number',
        example: 1,
    })
    page: number

    @ApiProperty({
        description: 'Number of rooms per page',
        example: 10,
    })
    limit: number
}

export class IJoinRoomResponseDto {
    @ApiProperty({
        description: 'Room information',
        type: IRoomResponseDto,
    })
    room: IRoomResponseDto

    @ApiProperty({
        description: 'Join room message',
        example: 'Successfully joined the room',
    })
    message: string
}