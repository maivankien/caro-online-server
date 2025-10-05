import { v4 as uuidv4 } from 'uuid';
import { FindOptionsSelect, In, ObjectLiteral, Repository } from 'typeorm';
import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserGuestDto, CreateUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTypeEnum } from './enums/user.enum';
import { DEFAULT_ELO } from '@/common/constants/common.constants';
import * as bcrypt from 'bcrypt';

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

    async createUser(user: CreateUserDto): Promise<Partial<User>> {
        const existingUser = await this.userRepository.findOne({
            where: { email: user.email }
        })

        if (existingUser) {
            throw new ConflictException('Email already exists')
        }

        const hashedPassword = await bcrypt.hash(user.password, 10)

        const userData = {
            id: uuidv4(),
            name: user.name,
            email: user.email,
            password: hashedPassword,
            elo: DEFAULT_ELO,
            totalGames: 0,
            wins: 0,
            losses: 0,
            isGuest: UserTypeEnum.REGISTERED,
        }

        await this.userRepository.insert(userData)

        return {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            isGuest: userData.isGuest,
            elo: userData.elo,
            totalGames: userData.totalGames,
            wins: userData.wins,
            losses: userData.losses,
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { email }
        })
    }

    async validateUser(email: string, password: string): Promise<Partial<User> | null> {
        const user = await this.findByEmail(email)
        
        if (!user?.password) {
            return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        
        if (!isPasswordValid) {
            return null
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            isGuest: user.isGuest,
            elo: user.elo,
            totalGames: user.totalGames,
            wins: user.wins,
            losses: user.losses,
        }
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
