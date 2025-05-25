import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { Room } from './entities/room.entity';
import { User } from '@modules/user/entities/user.entity';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '../user/user.module';

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
    providers: [RoomService],
    exports: [RoomService],
})
export class RoomModule { }
