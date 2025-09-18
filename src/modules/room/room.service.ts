import {
    CreateRoomDto,
    JoinRoomDto,
} from './dto/room.dto';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from '@modules/user/user.service';
import { LockService } from '@/common/services/lock.service';
import { REDIS_CLIENT } from '@/common/constants/common.constants';
import { RoomStatusEnum, GameResultEnum } from '@common/enums/room.enum';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IRoomResponse, IRoomFormat, IRoomListResponse } from './interfaces/room.interface';
import { EVENT_EMITTER_CONSTANTS } from '@/common/constants/event.constants';


@Injectable()
export class RoomService {
    static readonly DEFAULT_BOARD_SIZE = 15
    static readonly DEFAULT_WIN_CONDITION = 5
    private readonly LOCK_TIME = 1000 * 60 * 10 // 10 minutes
    private readonly ROOMS_STATUS_WAITING_KEY = 'rooms:status:waiting'

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,

        private readonly eventEmitter: EventEmitter2,

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
            .zadd(this.ROOMS_STATUS_WAITING_KEY, now.getTime(), roomId)
            .exec()

        return this.formatRoomResponse(roomData)
    }

    async isRoomCreatedByUser(roomId: string, userId: string): Promise<boolean> {
        const hostData = await this.redis.hget(`room:${roomId}`, 'host')

        if (!hostData) {
            return false
        }

        const host = JSON.parse(hostData)
        return host.id === userId
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

    async getRoomDetail(roomId: string, userId: string): Promise<IRoomResponse> {
        const roomData = await this.redis.hmget(
            `room:${roomId}`,
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

        if (!roomData[0]) {
            throw new BadRequestException('Room not found')
        }

        const playerIds = JSON.parse(roomData[8])

        if (!playerIds.includes(userId)) {
            throw new BadRequestException('You are not a player of this room')
        }

        return this.formatRoomResponse({
            id: roomData[0],
            name: roomData[1],
            host: roomData[2],
            boardSize: +roomData[4],
            winCondition: +roomData[5],
            createdAt: +roomData[6],
            password: roomData[7],
            playerIds: roomData[8],
            status: roomData[3] as RoomStatusEnum,
        })
    }

    async joinRoom(userId: string, joinRoomDto: JoinRoomDto): Promise<void> {
        const { roomId, password } = joinRoomDto

        const room = await this.redis.hmget(`room:${roomId}`,
            'id',
            'password',
            'status',
            'playerIds'
        )

        if (!room[0]) {
            throw new BadRequestException('Room not found')
        }

        if (room[2] !== RoomStatusEnum.WAITING) {
            throw new BadRequestException('Room is not waiting')
        }

        if (room[1] && room[1] !== password) {
            throw new BadRequestException('Invalid password')
        }

        const playerIds = JSON.parse(room[3])

        if (playerIds.includes(userId)) {
            return
        }

        if (playerIds.length >= 2) {
            throw new BadRequestException('Room is full')
        }

        playerIds.push(userId)

        await this.redis
            .multi()
            .hset(`room:${roomId}`, 'status', RoomStatusEnum.READY)
            .hset(`room:${roomId}`, 'playerIds', JSON.stringify(playerIds))
            .sadd(`room:${roomId}:players`, userId)
            .zrem(this.ROOMS_STATUS_WAITING_KEY, roomId)
            .exec()

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.ROOM_JOINED, {
            roomId,
            userId,
        })
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
