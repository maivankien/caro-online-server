import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomCleanupService } from './services/room-cleanup.service';
import { Room } from './entities/room.entity';
import { User } from '@modules/user/entities/user.entity';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '../user/user.module';
import { LockService } from '@/common/services/lock.service';

@Module({
    imports: [
        UserModule,
        AuthModule,
        TypeOrmModule.forFeature([
            Room,
            User,
        ]),
    ],
    controllers: [RoomController],
    providers: [RoomService, RoomCleanupService, LockService],
    exports: [RoomService, RoomCleanupService],
})
export class RoomModule { }
