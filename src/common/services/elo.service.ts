import { Injectable } from "@nestjs/common";
import { PlayerWinnerEnum } from "../enums/common.enum";


@Injectable()
export class EloService {
    private readonly K_FACTOR = 32;

    calculateElo(eloX: number, eloO: number, winner: PlayerWinnerEnum) {
        let scoreX: number, scoreO: number

        if (winner === PlayerWinnerEnum.X) {
            scoreX = 1
            scoreO = 0
        } else if (winner === PlayerWinnerEnum.O) {
            scoreX = 0
            scoreO = 1
        } else {
            scoreX = 0.5
            scoreO = 0.5
        }

        const expectedX = 1 / (1 + Math.pow(10, (eloO - eloX) / 400))
        const expectedO = 1 / (1 + Math.pow(10, (eloX - eloO) / 400))

        const newEloX = eloX + this.K_FACTOR * (scoreX - expectedX)
        const newEloO = eloO + this.K_FACTOR * (scoreO - expectedO)

        return {
            eloX: Math.round(newEloX),
            eloO: Math.round(newEloO),
        }
    }
}
