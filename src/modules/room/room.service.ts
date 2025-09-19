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
import { RoomStatusEnum, GameResultEnum } from '@common/enums/room.enum';
import { EVENT_EMITTER_CONSTANTS } from '@/common/constants/event.constants';
import { IRoomResponse, IRoomFormat, IRoomListResponse } from './interfaces/room.interface';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DEFAULT_BOARD_SIZE, DEFAULT_WIN_CONDITION, REDIS_CLIENT } from '@/common/constants/common.constants';
import { RoomRedisService } from './services/room-redis.service';


@Injectable()
export class RoomService {
    private readonly ROOMS_STATUS_WAITING_KEY = 'rooms:status:waiting'
    private readonly ROOM_FIELDS = [
        'id',
        'name',
        'host',
        'status',
        'boardSize',
        'winCondition',
        'createdAt',
        'password',
        'playerIds',
    ]

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,

        private readonly userService: UserService,
        private readonly eventEmitter: EventEmitter2,
        private readonly roomRedisService: RoomRedisService,

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
            boardSize: createRoomDto.boardSize || DEFAULT_BOARD_SIZE,
            winCondition: createRoomDto.winCondition || DEFAULT_WIN_CONDITION,
        }

        await this.roomRedisService.executeRoomMulti(roomId, (multi) => {
            multi.hmset(this.roomRedisService.getRoomKey(roomId), roomData)
            multi.sadd(this.roomRedisService.getRoomPlayersKey(roomId), hostId)
            multi.zadd(this.ROOMS_STATUS_WAITING_KEY, now.getTime(), roomId)
        })

        return this.formatRoomResponse(roomData)
    }

    async isRoomCreatedByUser(roomId: string, userId: string): Promise<boolean> {
        const hostData = await this.roomRedisService.getRoomField(roomId, 'host')

        if (!hostData) {
            return false
        }

        const host = JSON.parse(hostData)
        return host.id === userId
    }

    formatRoomData(
        [
            id,
            name,
            host,
            status,
            boardSize,
            winCondition,
            createdAt,
            password,
            playerIds
        ]
    ): IRoomFormat {
        return {
            id,
            name,
            host,
            status,
            password,
            playerIds,
            boardSize: +boardSize,
            createdAt: +createdAt,
            winCondition: +winCondition,
        }
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
                this.roomRedisService.getRoomKey(id),
                ...this.ROOM_FIELDS
            )
        )

        const replies = await pipeline.exec()
        const rooms = replies.map(([_, data]) =>
            this.formatRoomResponse(this.formatRoomData(data as any))
        )

        return {
            rooms,
            total,
            page,
            limit,
        }
    }

    async getRoomDetail(roomId: string, userId: string): Promise<IRoomResponse> {
        const rawData = await this.roomRedisService.getRoomData(roomId, this.ROOM_FIELDS)

        const roomData = this.formatRoomData(rawData)

        if (!roomData?.id) {
            throw new BadRequestException('Room not found')
        }

        const playerIds = JSON.parse(roomData.playerIds)

        if (!playerIds.includes(userId)) {
            throw new BadRequestException('You are not a player of this room')
        }

        return this.formatRoomResponse(roomData)
    }

    async joinRoom(userId: string, joinRoomDto: JoinRoomDto): Promise<void> {
        const { roomId, password: joinPassword } = joinRoomDto

        const [id, password, status, playerIdsRaw] = await this.roomRedisService.getRoomData(roomId, [
            'id',
            'password',
            'status',
            'playerIds'
        ])

        if (!id) {
            throw new BadRequestException('Room not found')
        }

        if (status !== RoomStatusEnum.WAITING) {
            throw new BadRequestException('Room is not waiting')
        }

        if (password && password !== joinPassword) {
            throw new BadRequestException('Invalid password')
        }

        const playerIds = JSON.parse(playerIdsRaw)

        if (playerIds.includes(userId)) {
            return
        }

        if (playerIds.length >= 2) {
            throw new BadRequestException('Room is full')
        }

        playerIds.push(userId)

        await this.roomRedisService.executeRoomMulti(roomId, (multi) => {
            multi.hset(this.roomRedisService.getRoomKey(roomId), 'status', RoomStatusEnum.READY)
            multi.hset(this.roomRedisService.getRoomKey(roomId), 'playerIds', JSON.stringify(playerIds))
            multi.sadd(this.roomRedisService.getRoomPlayersKey(roomId), userId)
            multi.zrem(this.ROOMS_STATUS_WAITING_KEY, roomId)
        })

        await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.ROOM_JOINED, {
            roomId,
            userId,
        })
    }
}
