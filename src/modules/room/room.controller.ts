import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { RoomService } from './room.service';
import {
    CreateRoomDto,
    JoinRoomDto,
} from './dto/room.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { IAuthUser } from '@modules/auth/interfaces/auth.interface';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { IRoomResponse, IRoomListResponse, IJoinRoomResponse } from './interfaces/room.interface';

@Controller()
@UseGuards(JwtAuthGuard)
export class RoomController {
    constructor(private readonly roomService: RoomService) { }

    @Post()
    async createRoom(
        @CurrentUser() user: IAuthUser,
        @Body() createRoomDto: CreateRoomDto,
    ): Promise<IRoomResponse> {
        return this.roomService.createRoom(user.userId, createRoomDto)
    }

    @Post('join')
    async joinRoom(
        @CurrentUser() user: IAuthUser,
        @Body() joinRoomDto: JoinRoomDto,
    ): Promise<IJoinRoomResponse> {
        return this.roomService.joinRoom(user.userId, joinRoomDto)
    }

    @Get()
    async getRooms(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ): Promise<IRoomListResponse> {
        const pageNum = parseInt(page, 10) || 1
        const limitNum = parseInt(limit, 10) || 10
        return this.roomService.getRooms(pageNum, limitNum)
    }
}
