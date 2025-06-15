import { Redis } from "ioredis";
import { Inject, Injectable } from "@nestjs/common";
import { REDIS_CLIENT } from "@common/constants/common.constants";
import { RedisSetOptionsEnum } from "@common/enums/redis.enum";

@Injectable()
export class LockService {
    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis
    ) { }


    /**
     * Try to acquire lock within a specified time period
     * @param key - Lock key name
     * @param lockExpire - Lock expiration time (milliseconds)
     * @returns Promise<boolean> - true if lock acquired, false if timeout
     */
    async lock(key: string, lockExpire: number): Promise<boolean> {
        const lockKey = `lock:${key}`
        const lockValue = Date.now()

        return await this.redis.set(
            lockKey,
            lockValue,
            RedisSetOptionsEnum.EXPIRE_IN_MILLISECONDS,
            lockExpire, RedisSetOptionsEnum.ONLY_IF_NOT_EXISTS
        ) === "OK"
    }

    /**
     * Try to acquire lock within a specified time period
     * @param key - Lock key name
     * @param lockExpire - Lock expiration time (milliseconds)
     * @param timeout - Maximum time to try acquiring the lock (milliseconds)
     * @param retryInterval - Wait interval between attempts (milliseconds, default 100ms)
     * @returns Promise<boolean> - true if lock acquired, false if timeout
     */
    async acquireLock(key: string, lockExpire: number, timeout: number, retryInterval: number = 100): Promise<boolean> {

        const startTime = Date.now()

        while (Date.now() - startTime < timeout) {
            const acquired = await this.lock(key, lockExpire)

            if (acquired) {
                return true
            }

            await new Promise(resolve => setTimeout(resolve, retryInterval))
        }

        return false
    }

    async unlock(key: string): Promise<void> {
        const lockKey = `lock:${key}`
        await this.redis.del(lockKey)
    }
}