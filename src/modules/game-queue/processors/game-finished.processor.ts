import { Job } from 'bullmq'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { UserService } from '@/modules/user/user.service'
import { IGameFinishedPayload } from '@modules/game/interfaces/game.interface'
import { GAME_FINISHED_QUEUE } from '@/common/constants/common.constants'
import { EloService } from '@/common/services/elo.service'
import { PlayerWinnerEnum } from '@/common/enums/common.enum'
import { RoomService } from '@modules/room/room.service'
import { GameHistoryService } from '@modules/game/services/game-history.service'

@Injectable()
@Processor(GAME_FINISHED_QUEUE)
export class GameFinishedProcessor extends WorkerHost {

    constructor(
        private readonly userService: UserService,
        private readonly eloService: EloService,
        private readonly roomService: RoomService,
        private readonly gameHistoryService: GameHistoryService
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
        try {
            await this.updateEloAndStats(payload)
            await this.createGameHistory(payload)
        } catch (error) {
            console.error('Failed to process game finished:', error)
            throw error
        }
    }

    private async createGameHistory(payload: IGameFinishedPayload) {
        const { roomId, winner, winningLine, gameState } = payload

        const roomDetail = await this.roomService.getRoomInfo(roomId)

        await this.roomService.createRoomHistory({
            id: roomId,
            type: roomDetail.type,
            name: roomDetail?.name,
            hostId: roomDetail?.host?.id,
            playerIds: roomDetail.playerIds,
            boardSize: roomDetail.boardSize,
            winCondition: roomDetail.winCondition,
        })

        const { id, board, playerXId, playerOId, startTime, finishedAt } = gameState

        const winnerId = winner === PlayerWinnerEnum.X ? playerXId : playerOId

        await this.gameHistoryService.createGameHistory({
            id,
            board,
            roomId,
            playerXId,
            playerOId,
            winnerId,
            winningLine,
            playerWinner: winner,
            startedAt: new Date(startTime),
            finishedAt: new Date(finishedAt),
        })
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
