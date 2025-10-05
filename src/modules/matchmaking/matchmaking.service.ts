import { Redis } from "ioredis";
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from "@/common/constants/common.constants";
import { UserService } from "@/modules/user/user.service";
import { IMatchmakingSocketCustom } from "./interfaces/matchmaking.interface";
import { MatchmakingDto } from "./dto/matchmaking.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EVENT_EMITTER_CONSTANTS } from "@/common/constants/event.constants";
import { RoomService } from "@modules/room/room.service";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class MatchmakingService {
    private readonly MATCH_MAKING_TIMEOUT: number = 60000 // 60 seconds

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
        private readonly userService: UserService,

        private readonly eventEmitter: EventEmitter2,
        private readonly roomService: RoomService,
    ) { }

    private getQueueKey(boardSize: number, winCondition: number): string {
        return `matchmaking:queue:${boardSize}:${winCondition}`
    }

    private getUserMatchmakingKey(userId: string): string {
        return `matchmaking:user:${userId}`
    }

    private getUserMatchmakingTimeoutKey(userId: string): string {
        return `matchmaking:timeout:${userId}`
    }

    private async removePairIfExists(queueKey: string, userId: string, opponent: string): Promise<boolean> {
        const luaScript = `
            local exists1 = redis.call("ZSCORE", KEYS[1], ARGV[1])
            local exists2 = redis.call("ZSCORE", KEYS[1], ARGV[2])
        
            if (exists1 and exists2) then
                redis.call("ZREM", KEYS[1], ARGV[1], ARGV[2])
                return 1
            else
                return 0
            end`

        return await this.redis.eval(luaScript, 1, queueKey, userId, opponent) === 1
    }

    private async handleMatchFound(userId: string, opponent: string, boardSize: number, winCondition: number) {
        const userMatchmakingKey = this.getUserMatchmakingKey(userId)
        const opponentMatchmakingKey = this.getUserMatchmakingKey(opponent)
        const userTimeoutKey = this.getUserMatchmakingTimeoutKey(userId)
        const opponentTimeoutKey = this.getUserMatchmakingTimeoutKey(opponent)

        await this.redis.pipeline()
            .del(userMatchmakingKey)
            .del(opponentMatchmakingKey)
            .del(userTimeoutKey)
            .del(opponentTimeoutKey)
            .exec()

        const room = await this.roomService.createMatchmakingRoom({
            playerA: userId,
            playerB: opponent,
            boardSize,
            winCondition,
        })

        const data = {
            playerA: userId,
            playerB: opponent,
            roomId: room.id,
        }

        return await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.MATCHMAKING_FOUND, data)
    }


    async matchmaking(client: IMatchmakingSocketCustom, payload: MatchmakingDto): Promise<any> {
        try {
            const { userId } = client.data.user
            const { boardSize, winCondition } = payload

            const user = await this.userService.findById(userId, {
                id: true,
                elo: true,
            })

            const { elo } = user
            const rangeStep = 50
            const maxRange = 500
            const delay = 1000
            const queueKey = this.getQueueKey(boardSize, winCondition)
            const userMatchmakingKey = this.getUserMatchmakingKey(userId)
            const userTimeoutKey = this.getUserMatchmakingTimeoutKey(userId)

            const sessionId = Date.now().toString()

            await this.redis.pipeline()
                .zadd(queueKey, elo, userId)
                .hset(userMatchmakingKey, {
                    boardSize: boardSize.toString(),
                    winCondition: winCondition.toString(),
                })
                .set(userTimeoutKey, sessionId)
                .exec()

            this.handleMatchmakingTimeout({
                userId,
                userTimeoutKey,
                sessionId,
                queueKey,
                userMatchmakingKey,
            })

            let range = rangeStep
            while (range <= maxRange) {
                const rangeStart = elo - range
                const rangeEnd = elo + range
                const candidates = await this.redis.zrangebyscore(queueKey, rangeStart, rangeEnd, 'LIMIT', 0, 2)

                const opponent = candidates.find(candidate => candidate !== userId)

                if (opponent) {
                    const success = await this.removePairIfExists(queueKey, userId, opponent)

                    if (success) {
                        return await this.handleMatchFound(userId, opponent, boardSize, winCondition)
                    }
                }

                range += rangeStep

                await new Promise(resolve => setTimeout(resolve, delay))
            }
        } catch (error) {
            if (error instanceof WsException) {
                throw error
            }

            console.log('Error in matchmaking: ', error)
            throw new WsException('Internal server error')
        }
    }

    private async handleMatchmakingTimeout({
        userId,
        userTimeoutKey,
        sessionId,
        queueKey,
        userMatchmakingKey,
    }: {
        userId: string,
        userTimeoutKey: string,
        sessionId: string,
        queueKey: string,
        userMatchmakingKey: string,
    }) {
        setTimeout(async () => {
            const currentSessionId = await this.redis.get(userTimeoutKey)

            if (currentSessionId !== sessionId) {
                return
            }

            const stillInQueue = await this.redis.zscore(queueKey, userId)

            if (!stillInQueue) {
                return
            }

            await this.redis.pipeline()
                .zrem(queueKey, userId)
                .del(userMatchmakingKey)
                .del(userTimeoutKey)
                .exec()

            await this.eventEmitter.emitAsync(EVENT_EMITTER_CONSTANTS.MATCHMAKING_TIMEOUT, { userId })

        }, this.MATCH_MAKING_TIMEOUT)
    }

    async matchmakingCancel(client: IMatchmakingSocketCustom) {
        try {
            const { userId } = client.data.user

            const userMatchmakingKey = this.getUserMatchmakingKey(userId)
            const userTimeoutKey = this.getUserMatchmakingTimeoutKey(userId)
            const matchmakingInfo = await this.redis.hgetall(userMatchmakingKey)

            const { boardSize, winCondition } = matchmakingInfo

            if (!boardSize || !winCondition) {
                throw new WsException('User is not in matchmaking queue')
            }

            const queueKey = this.getQueueKey(+boardSize, +winCondition)

            await this.redis.pipeline()
                .zrem(queueKey, userId)
                .del(userMatchmakingKey)
                .del(userTimeoutKey)
                .exec()
        } catch (error) {
            if (error instanceof WsException) {
                throw error
            }

            console.log('Error in matchmaking cancel: ', error)
            throw new WsException('Internal server error')
        }
    }

    async handleDisconnect(client: IMatchmakingSocketCustom) {
        try {
            await this.matchmakingCancel(client)
        } catch (error) {
            if (error instanceof WsException) {
                return
            }

            throw error
        }
    }
}