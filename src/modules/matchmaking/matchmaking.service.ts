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

            await this.redis.zadd(queueKey, elo, userId)

            let range = rangeStep
            while (range <= maxRange) {
                const rangeStart = elo - range
                const rangeEnd = elo + range
                const candidates = await this.redis.zrangebyscore(queueKey, rangeStart, rangeEnd, 'LIMIT', 0, 2)

                const opponent = candidates.find(candidate => candidate !== userId)

                if (opponent) {
                    const success = await this.removePairIfExists(queueKey, userId, opponent)

                    if (success) {
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
}