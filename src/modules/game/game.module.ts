import { Module } from '@nestjs/common'
import { GameService } from './game.service'
import { GameGateway } from './services/game.gateway'
import { AuthModule } from '@modules/auth/auth.module'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { RoomModule } from '@modules/room/room.module'
import { LockService } from '@common/services/lock.service'

@Module({
    imports: [
        AuthModule,
        RoomModule,
        EventEmitterModule.forRoot(),
    ],
    providers: [GameService, GameGateway, LockService],
    exports: [GameService, GameGateway],
})
export class GameModule {}
