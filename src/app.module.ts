import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { RoomModule } from '@modules/room/room.module';
import { GameModule } from '@modules/game/game.module';
import { RouterModule } from '@nestjs/core';
import { AppConfigModule } from '@config/app/config.module';
import { RedisProviderModule } from './providers/cache/redis/provider.module';
import { MysqlDatabaseProviderModule } from '@providers/database/mysql/provider.module';
import { BullMQProviderModule } from './providers/queue/bullmq.module';
import { GameQueueModule } from '@modules/game-queue/game-queue.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        UserModule,
        AuthModule,
        RoomModule,
        GameModule,
        AppConfigModule,
        RedisProviderModule,
        BullMQProviderModule,
        GameQueueModule,
        MysqlDatabaseProviderModule,
        RouterModule.register([
            {
                path: 'users',
                module: UserModule,
            },
            {
                path: 'auth',
                module: AuthModule,
            },
            {
                path: 'rooms',
                module: RoomModule,
            },
        ]),
    ],
})
export class AppModule { }
