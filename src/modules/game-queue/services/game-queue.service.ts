import { Queue } from 'bullmq'
import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { IGameFinishedPayload } from '@modules/game/interfaces/game.interface'
import { GAME_FINISHED_QUEUE, GAME_FINISHED_JOB } from '@/common/constants/common.constants'

@Injectable()
export class GameQueueService {
    constructor(
        @InjectQueue(GAME_FINISHED_QUEUE)
        private readonly gameFinishedQueue: Queue<IGameFinishedPayload>
    ) { }

    async addGameFinishedJob(payload: IGameFinishedPayload) {
        return await this.gameFinishedQueue.add(GAME_FINISHED_JOB, payload)
    }
}
