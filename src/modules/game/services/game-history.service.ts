import { Repository } from "typeorm";
import { GameHistory } from "../entities/game-history.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";


@Injectable()
export class GameHistoryService {
    constructor(
        @InjectRepository(GameHistory)
        private readonly gameHistoryRepository: Repository<GameHistory>,
    ) { }

    async createGameHistory(payload: Partial<GameHistory>) {
        await this.gameHistoryRepository.insert(payload)
    }
}   