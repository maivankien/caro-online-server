import { Redis } from 'ioredis';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { REDIS_CLIENT } from '@/common/constants/common.constants';

@Injectable()
export class RoomCleanupService {
    private readonly logger = new Logger(RoomCleanupService.name)
    private readonly LOCK_TIME = 1000 * 60 * 10 // 10 minutes
    private readonly ROOMS_STATUS_WAITING_KEY = 'rooms:status:waiting'

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async cleanupExpiredRooms(): Promise<void> {
        try {
            this.logger.log('Starting cleanup of expired rooms...')

            const now = Date.now()
            const expiredTime = now - this.LOCK_TIME

            const expiredRoomIds = await this.redis.zrangebyscore(
                this.ROOMS_STATUS_WAITING_KEY,
                0,
                expiredTime
            )

            if (expiredRoomIds.length === 0) {
                this.logger.log('No expired rooms found')
                return
            }

            this.logger.log(`Found ${expiredRoomIds.length} expired rooms to cleanup`)

            for (const roomId of expiredRoomIds) {
                await this.cleanupRoom(roomId)
            }

            this.logger.log(`Successfully cleaned up ${expiredRoomIds.length} expired rooms`)
        } catch (error) {
            this.logger.error('Error during room cleanup:', error)
        }
    }

    private async cleanupRoom(roomId: string): Promise<void> {
        try {
            const roomData = await this.redis.hmget(
                `room:${roomId}`,
                'playerIds'
            )

            if (roomData[0]) {
                const playerIds: string[] = JSON.parse(roomData[0])

                const pipeline = this.redis.pipeline()

                pipeline.del(`room:${roomId}`)
                pipeline.del(`room:${roomId}:players`)

                pipeline.zrem(this.ROOMS_STATUS_WAITING_KEY, roomId)

                playerIds.forEach(playerId => {
                    pipeline.srem(`room:user:${playerId}`, roomId)
                })

                await pipeline.exec()

                this.logger.debug(`Cleaned up room ${roomId} with players: ${playerIds.join(', ')}`)
            } else {
                await this.redis.zrem(this.ROOMS_STATUS_WAITING_KEY, roomId)
                this.logger.debug(`Removed orphaned room ${roomId} from waiting list`)
            }
        } catch (error) {
            this.logger.error(`Error cleaning up room ${roomId}:`, error)
        }
    }

    /**
     * Manually trigger cleanup for testing purposes
     */
    async manualCleanup(): Promise<{ cleaned: number }> {
        const now = Date.now()
        const expiredTime = now - this.LOCK_TIME

        const expiredRoomIds = await this.redis.zrangebyscore(
            this.ROOMS_STATUS_WAITING_KEY,
            0,
            expiredTime
        )

        for (const roomId of expiredRoomIds) {
            await this.cleanupRoom(roomId)
        }

        return { cleaned: expiredRoomIds.length }
    }

    /**
     * Get expired rooms count without cleaning up
     */
    async getExpiredRoomsCount(): Promise<number> {
        const now = Date.now()
        const expiredTime = now - this.LOCK_TIME

        return await this.redis.zcount(
            this.ROOMS_STATUS_WAITING_KEY,
            0,
            expiredTime
        )
    }
} 