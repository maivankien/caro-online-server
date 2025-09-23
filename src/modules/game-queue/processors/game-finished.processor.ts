import { Job } from 'bullmq'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { IGameFinishedPayload } from '@modules/game/interfaces/game.interface'
import { GAME_FINISHED_QUEUE } from '@/common/constants/common.constants'

@Injectable()
@Processor(GAME_FINISHED_QUEUE)
export class GameFinishedProcessor extends WorkerHost {

    async process(job: Job<IGameFinishedPayload>) {
        const { roomId, winner, winningLine, gameState } = job.data

        await this.processGameFinished({
            roomId,
            winner,
            winningLine,
            gameState
        })
    }

    private async processGameFinished(payload: IGameFinishedPayload) {
        // Implement các logic xử lý khi game kết thúc:
        // 1. Cập nhật điểm ELO của người chơi
        // 2. Lưu lịch sử game vào database
        // 3. Cleanup room data

        console.log('Processing game finished:', {
            roomId: payload.roomId,
            winner: payload.winner,
            moveCount: payload.gameState.moveCount,
        })
    }
}
