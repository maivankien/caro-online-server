import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { RoomModule } from '@modules/room/room.module';
import { RouterModule } from '@nestjs/core';
import { AppConfigModule } from '@config/app/config.module';
import { MysqlDatabaseProviderModule } from '@providers/database/mysql/provider.module';

@Module({
    imports: [
        UserModule,
        AuthModule,
        RoomModule,
        AppConfigModule,
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
