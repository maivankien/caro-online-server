import { Module } from '@nestjs/common'
import { GameService } from './game.service'
import { GameGateway } from './services/game.gateway'
import { AuthModule } from '@modules/auth/auth.module'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { RoomModule } from '@modules/room/room.module'
import { LockService } from '@common/services/lock.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GameHistory } from './entities/game-history.entity'
import { GameHistoryService } from './services/game-history.service'
import { UserModule } from '../user/user.module'
import { AiModule } from '@modules/ai/ai.module'

@Module({
    imports: [
        AuthModule,
        RoomModule,
        UserModule,
        AiModule,
        EventEmitterModule.forRoot(),
        TypeOrmModule.forFeature([GameHistory]),
    ],
    providers: [GameService, GameGateway, LockService, GameHistoryService],
    exports: [GameService, GameGateway, GameHistoryService],
})
export class GameModule {}
