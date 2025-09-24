import { Job } from 'bullmq'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { UserService } from '@/modules/user/user.service'
import { IGameFinishedPayload } from '@modules/game/interfaces/game.interface'
import { GAME_FINISHED_QUEUE } from '@/common/constants/common.constants'
import { EloService } from '@/common/services/elo.service'
import { PlayerWinnerEnum } from '@/common/enums/common.enum'

@Injectable()
@Processor(GAME_FINISHED_QUEUE)
export class GameFinishedProcessor extends WorkerHost {

    constructor(
        private readonly userService: UserService,
        private readonly eloService: EloService
    ) {
        super()
    }

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
        // 1. Cập nhật điểm ELO và thống kê trận đấu của người chơi
        // 2. Lưu lịch sử game vào database
        // 3. Cleanup room data

        await this.updateEloAndStats(payload)
    }

    private async updateEloAndStats(payload: IGameFinishedPayload) {
        const { winner, gameState } = payload
        const { playerXId, playerOId } = gameState

        const userEloMap = await this.userService.getMapUserElo([playerXId, playerOId])
        const eloX = userEloMap[playerXId]
        const eloO = userEloMap[playerOId]

        const { eloX: newEloX, eloO: newEloO } = this.eloService.calculateElo(eloX, eloO, winner)

        const isPlayerXWinner = winner === PlayerWinnerEnum.X
        const isPlayerXDraw = winner === PlayerWinnerEnum.DRAW

        const isPlayerOWinner = winner === PlayerWinnerEnum.O
        const isPlayerODraw = winner === PlayerWinnerEnum.DRAW

        await Promise.all([
            this.userService.updateEloAndStats(playerXId, newEloX, isPlayerXWinner, isPlayerXDraw),
            this.userService.updateEloAndStats(playerOId, newEloO, isPlayerOWinner, isPlayerODraw)
        ])
    }
}
