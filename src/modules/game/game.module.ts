import { Module } from '@nestjs/common'
import { GameService } from './game.service'
import { GameGateway } from './services/game.gateway'
import { AuthModule } from '@modules/auth/auth.module'
import { EventEmitterModule } from '@nestjs/event-emitter'

@Module({
    imports: [
        AuthModule,
        EventEmitterModule.forRoot(),
    ],
    providers: [GameService, GameGateway],
    exports: [GameService, GameGateway],
})
export class GameModule {}
