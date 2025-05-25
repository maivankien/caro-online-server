import { v4 as uuidv4 } from 'uuid';
import { FindOptionsSelect, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateUserGuestDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTypeEnum } from './enums/user.enum';

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
}
