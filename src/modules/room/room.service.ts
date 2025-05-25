import {
    CreateRoomDto,
    JoinRoomDto,
} from './dto/room.dto';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import { UserService } from '@modules/user/user.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomStatusEnum, GameResultEnum } from '@common/enums/room.enum';
import { IRoomResponse, IRoomListResponse, IJoinRoomResponse } from './interfaces/room.interface';

@Injectable()
export class RoomService {
    static readonly DEFAULT_BOARD_SIZE = 15
    static readonly DEFAULT_WIN_CONDITION = 5

    constructor(
        private readonly userService: UserService,

        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) { }

    private formatRoomResponse(room: Room, host: Partial<User>): IRoomResponse {
        return {
            id: room.id,
            name: room.name,
            host: {
                id: host.id,
                name: host.name
            },
            status: room.status,
            hasPassword: !!room.password,
            boardSize: room.boardSize,
            winCondition: room.winCondition,
            createdAt: room.createdAt,
        }
    }

    async createRoom(hostId: string, createRoomDto: CreateRoomDto): Promise<IRoomResponse> {
        const host = await this.userService.findById(hostId, {
            id: true,
            name: true,
        })

        if (!host) {
            throw new NotFoundException('User not found')
        }

        const roomData = {
            id: uuidv4(),
            hostId,
            playerIds: [hostId],
            name: createRoomDto.name,
            status: RoomStatusEnum.WAITING,
            gameResult: GameResultEnum.NONE,
            password: createRoomDto.password || null,
            boardSize: createRoomDto.boardSize || RoomService.DEFAULT_BOARD_SIZE,
            winCondition: createRoomDto.winCondition || RoomService.DEFAULT_WIN_CONDITION,
        }

        const room = await this.roomRepository.save(roomData)
        return this.formatRoomResponse(room, host)
    }

    async joinRoom(userId: string, joinRoomDto: JoinRoomDto): Promise<IJoinRoomResponse> {
        return
    }


    async updateRoomStatusEnum(roomId: string, status: RoomStatusEnum): Promise<void> {
        await this.roomRepository.update(roomId, { status })
    }

    async updateGameResultEnum(roomId: string, gameResult: GameResultEnum, winnerId?: string): Promise<void> {
        const updateData: Partial<Room> = {
            gameResult,
            winnerId: winnerId || null,
            status: gameResult === GameResultEnum.NONE ? RoomStatusEnum.PLAYING : RoomStatusEnum.FINISHED,
        }
        await this.roomRepository.update(roomId, updateData)
    }

    async getRooms(page: number = 1, limit: number = 10): Promise<IRoomListResponse> {
        const queryBuilder = this.roomRepository.createQueryBuilder('room')
            .leftJoinAndSelect('room.host', 'host')
            .select([
                'room.id',
                'room.name',
                'room.status',
                'room.password',
                'room.boardSize',
                'room.winCondition',
                'room.createdAt',
                'host.id',
                'host.name'
            ])
            .where('room.status = :status', { status: RoomStatusEnum.WAITING })
            .orderBy('room.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)

        const [rooms, total] = await queryBuilder.getManyAndCount()

        return {
            rooms: rooms.map(room => this.formatRoomResponse(room, room.host)),
            total,
            page,
            limit
        }
    }
}
