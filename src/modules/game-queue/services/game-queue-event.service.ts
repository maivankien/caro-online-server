import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { IGameFinishedPayload } from '@modules/game/interfaces/game.interface'
import { EVENT_EMITTER_CONSTANTS } from '@/common/constants/event.constants'
import { GameQueueService } from './game-queue.service'
import { RoomTypeEnum } from '@/common/enums/common.enum'

@Injectable()
export class GameQueueEventService {

    constructor(
        private readonly gameQueueService: GameQueueService
    ) {}

    @OnEvent(EVENT_EMITTER_CONSTANTS.GAME_FINISHED)
    async handleGameFinished(payload: IGameFinishedPayload) {
        if (payload.gameState.roomType === RoomTypeEnum.AI) {
            return
        }

        await this.gameQueueService.addGameFinishedJob(payload)
    }
}
