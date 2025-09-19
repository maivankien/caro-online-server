import { Injectable, Inject } from '@nestjs/common'
import { Redis } from 'ioredis'
import { REDIS_CLIENT } from '@/common/constants/common.constants'

@Injectable()
export class RoomRedisService {
    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) { }

    getRoomKey(roomId: string): string {
        return `room:${roomId}`
    }

    getRoomPlayersKey(roomId: string): string {
        return `room:${roomId}:players`
    }

    getRoomReadyKey(roomId: string): string {
        return `room:${roomId}:ready`
    }

    async getRoomData(roomId: string, fields?: string[]): Promise<any> {
        const key = this.getRoomKey(roomId)
        if (fields) {
            return await this.redis.hmget(key, ...fields)
        }
        return await this.redis.hgetall(key)
    }

    async setRoomData(roomId: string, data: Record<string, any>): Promise<void> {
        const key = this.getRoomKey(roomId)
        await this.redis.hmset(key, data)
    }

    async setRoomField(roomId: string, field: string, value: any): Promise<void> {
        const key = this.getRoomKey(roomId)
        await this.redis.hset(key, field, value)
    }

    async getRoomField(roomId: string, field: string): Promise<string | null> {
        const key = this.getRoomKey(roomId)
        return await this.redis.hget(key, field)
    }

    async addRoomPlayer(roomId: string, userId: string): Promise<void> {
        const key = this.getRoomPlayersKey(roomId)
        await this.redis.sadd(key, userId)
    }

    async removeRoomPlayer(roomId: string, userId: string): Promise<void> {
        const key = this.getRoomPlayersKey(roomId)
        await this.redis.srem(key, userId)
    }

    async isRoomPlayer(roomId: string, userId: string): Promise<boolean> {
        const key = this.getRoomPlayersKey(roomId)
        return !!(await this.redis.sismember(key, userId))
    }

    async getRoomPlayers(roomId: string): Promise<string[]> {
        const key = this.getRoomPlayersKey(roomId)
        return await this.redis.smembers(key)
    }

    async setPlayerReady(roomId: string, userId: string, ready: boolean = true): Promise<void> {
        const key = this.getRoomReadyKey(roomId)
        await this.redis.hset(key, userId, ready.toString())
    }

    async getPlayerReady(roomId: string, userId: string): Promise<boolean> {
        const key = this.getRoomReadyKey(roomId)
        const result = await this.redis.hget(key, userId)
        return result === 'true'
    }

    async getPlayersReadyStatus(roomId: string, playerXId: string, playerOId: string): Promise<{ playerXReady: boolean, playerOReady: boolean, bothReady: boolean }> {
        const key = this.getRoomReadyKey(roomId)
        const [playerXReady, playerOReady] = await this.redis.hmget(key, playerXId, playerOId)
        
        return {
            playerXReady: playerXReady === 'true',
            playerOReady: playerOReady === 'true',
            bothReady: playerXReady === 'true' && playerOReady === 'true'
        }
    }

    async executeRoomMulti(roomId: string, operations: (multi: any) => void): Promise<any> {
        const multi = this.redis.multi()
        operations(multi)
        return await multi.exec()
    }

    async deleteRoom(roomId: string): Promise<void> {
        const pipeline = this.redis.pipeline()
        pipeline.del(this.getRoomKey(roomId))
        pipeline.del(this.getRoomPlayersKey(roomId))
        pipeline.del(this.getRoomReadyKey(roomId))
        await pipeline.exec()
    }
}
