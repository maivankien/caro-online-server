import {
    CreateRoomDto,
    JoinRoomDto,
} from './dto/room.dto';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '@modules/user/user.service';
import { LockService } from '@/common/services/lock.service';
import { REDIS_CLIENT } from '@/common/constants/common.constants';
import { RoomStatusEnum, GameResultEnum } from '@common/enums/room.enum';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IRoomResponse, IJoinRoomResponse, IRoomFormat, IRoomListResponse } from './interfaces/room.interface';


@Injectable()
export class RoomService {
    static readonly DEFAULT_BOARD_SIZE = 15
    static readonly DEFAULT_WIN_CONDITION = 5
    private readonly LOCK_TIME = 1000 * 60 * 10 // 10 minutes
    private readonly ROOMS_STATUS_WAITING_KEY = 'rooms:status:waiting'

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,

        private readonly lockService: LockService,
        private readonly userService: UserService,

        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) { }

    private formatRoomResponse(room: Partial<IRoomFormat>): IRoomResponse {
        return {
            id: room.id,
            name: room.name,
            host: JSON.parse(room.host),
            status: room.status,
            playerIds: JSON.parse(room.playerIds),
            hasPassword: !!room.password,
            boardSize: room.boardSize,
            winCondition: room.winCondition,
            createdAt: new Date(room.createdAt),
        }
    }

    async createRoom(hostId: string, createRoomDto: CreateRoomDto): Promise<IRoomResponse> {
        const host = await this.userService.findById(hostId, {
            id: true,
            name: true,
        })

        if (!host) {
            throw new UnauthorizedException('User not found')
        }

        const lockKey = `room-create:${hostId}`
        const isExisted = await this.lockService.lock(lockKey, this.LOCK_TIME)

        if (!isExisted) {
            throw new BadRequestException('Failed to create room')
        }

        const roomId = uuidv4()
        const now = new Date()

        const roomData = {
            id: roomId,
            host: JSON.stringify({
                id: hostId,
                name: host.name,
            }),
            createdAt: now.getTime(),
            name: createRoomDto.name,
            status: RoomStatusEnum.WAITING,
            gameResult: GameResultEnum.NONE,
            playerIds: JSON.stringify([hostId]),
            password: createRoomDto.password || '',
            boardSize: createRoomDto.boardSize || RoomService.DEFAULT_BOARD_SIZE,
            winCondition: createRoomDto.winCondition || RoomService.DEFAULT_WIN_CONDITION,
        }

        await this.redis
            .multi()
            .hmset(`room:${roomId}`, roomData)
            .sadd(`room:${roomId}:players`, hostId)
            .sadd(`room:user:${hostId}`, roomId)
            .zadd(this.ROOMS_STATUS_WAITING_KEY, now.getTime(), roomId)
            .exec()

        return this.formatRoomResponse(roomData)
    }

    async getRooms(page: number = 1, limit: number = 10): Promise<IRoomListResponse> {
        const start = (page - 1) * limit
        const stop = start + limit - 1

        const [roomIds, total] = await Promise.all([
            this.redis.zrevrange(
                this.ROOMS_STATUS_WAITING_KEY,
                start,
                stop
            ),
            this.redis.zcard(this.ROOMS_STATUS_WAITING_KEY)
        ])

        const pipeline = this.redis.pipeline()

        roomIds.forEach(id =>
            pipeline.hmget(
                `room:${id}`,
                'id',
                'name',
                'host',
                'status',
                'boardSize',
                'winCondition',
                'createdAt',
                'password',
                'playerIds'
            )
        )

        const replies = await pipeline.exec()

        const rooms = replies.map(([err, data]) => this.formatRoomResponse({
            id: data[0],
            name: data[1],
            host: data[2],
            status: data[3],
            boardSize: +data[4],
            winCondition: +data[5],
            createdAt: +data[6],
            password: data[7],
            playerIds: data[8],
        }))

        return {
            rooms,
            total,
            page,
            limit,
        }
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
}
