import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { GameQueueService } from './services/game-queue.service'
import { GameQueueEventService } from './services/game-queue-event.service'
import { GameFinishedProcessor } from './processors/game-finished.processor'
import { GAME_FINISHED_QUEUE } from '@/common/constants/common.constants'

@Module({
    imports: [
        BullModule.registerQueue({
            name: GAME_FINISHED_QUEUE,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            }
        })
    ],
    providers: [
        GameQueueService,
        GameQueueEventService,
        GameFinishedProcessor
    ],
    exports: [GameQueueService]
})
export class GameQueueModule { }
