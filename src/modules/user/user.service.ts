import { v4 as uuidv4 } from 'uuid';
import { FindOptionsSelect, In, ObjectLiteral, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateUserGuestDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTypeEnum } from './enums/user.enum';
import { DEFAULT_ELO } from '@/common/constants/common.constants';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async createUserGuest(user: CreateUserGuestDto): Promise<Partial<User>> {
        const userData = {
            id: uuidv4(),
            name: user.name,
            elo: DEFAULT_ELO,
            totalGames: 0,
            wins: 0,
            losses: 0,
            isGuest: UserTypeEnum.GUEST,
        }

        await this.userRepository.insert(userData)

        return userData
    }

    async findById(
        id: string,
        select?: FindOptionsSelect<User>,
    ): Promise<Partial<User>> {
        return await this.userRepository.findOne({ where: { id }, select })
    }

    async getMapUserElo(ids: string[]): Promise<Record<string, number>> {
        const users = await this.userRepository.find({
            where: {
                id: In(ids)
            }, select: {
                id: true,
                elo: true
            }
        })

        return users.reduce((acc, user) => {
            acc[user.id] = user.elo
            return acc
        }, {})
    }

    async getUserProfile(id: string): Promise<Partial<User>> {
        return await this.userRepository.findOne({
            where: { id }, select: {
                id: true,
                name: true,
                isGuest: true,
                elo: true,
                totalGames: true,
                wins: true,
                losses: true,
            }
        })
    }

    async updateEloAndStats(id: string, elo: number, isWinner: boolean, isDraw: boolean = false) {
        const updateData: ObjectLiteral = {
            elo,
            totalGames: () => 'total_games + 1'
        }

        if (!isDraw) {
            if (isWinner) {
                updateData.wins = () => 'wins + 1'
            } else {
                updateData.losses = () => 'losses + 1'
            }
        }

        await this.userRepository
            .createQueryBuilder()
            .update(User)
            .set(updateData)
            .where('id = :id', { id })
            .execute()
    }
}
