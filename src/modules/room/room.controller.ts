import { RoomService } from './room.service';
import {
    CreateRoomDto,
    JoinRoomDto,
    IRoomResponseDto,
    IRoomListResponseDto,
    IJoinRoomResponseDto,
} from './dto/room.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IAuthUser } from '@modules/auth/interfaces/auth.interface';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { IRoomResponse, IRoomListResponse } from './interfaces/room.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Query, HttpStatus, Param } from '@nestjs/common';

@ApiTags('Rooms')
@Controller()
@UseGuards(JwtAuthGuard)
export class RoomController {
    constructor(private readonly roomService: RoomService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new room' })
    @ApiBody({ type: CreateRoomDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Room created successfully',
        type: IRoomResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Bad request - Invalid input data',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - Invalid or missing token',
    })
    async createRoom(
        @CurrentUser() user: IAuthUser,
        @Body() createRoomDto: CreateRoomDto,
    ): Promise<IRoomResponse> {
        return this.roomService.createRoom(user.userId, createRoomDto)
    }

    @Post('join')
    @ApiOperation({ summary: 'Join an existing room' })
    @ApiBody({ type: JoinRoomDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Joined room successfully',
        type: IJoinRoomResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Bad request - Invalid room ID or password',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Room not found',
    })
    async joinRoom(
        @CurrentUser() user: IAuthUser,
        @Body() joinRoomDto: JoinRoomDto,
    ): Promise<{ message: string }> {
        await this.roomService.joinRoom(user.userId, joinRoomDto)

        return {
            message: 'Joined room successfully',
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get list of available rooms' })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Page number',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Number of rooms per page',
        example: 10,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Rooms retrieved successfully',
        type: IRoomListResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - Invalid or missing token',
    })
    async getRooms(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ): Promise<IRoomListResponse> {
        const pageNum = parseInt(page, 10) || 1
        const limitNum = parseInt(limit, 10) || 10
        return this.roomService.getRooms(pageNum, limitNum)
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get room detail by ID' })
    @ApiParam({
        name: 'id',
        description: 'Room ID',
        example: 'uuid-room-id',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Room detail retrieved successfully',
        type: IRoomResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Room not found',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - Invalid or missing token',
    })
    async getRoomDetail(@Param('id') roomId: string, @CurrentUser() user: IAuthUser): Promise<IRoomResponse> {
        const { userId } = user
        return this.roomService.getRoomDetail(roomId, userId)
    }
}
