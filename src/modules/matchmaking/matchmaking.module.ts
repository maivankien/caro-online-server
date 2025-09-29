import { Module } from "@nestjs/common";
import { MatchmakingService } from "./matchmaking.service";
import { UserModule } from "@/modules/user/user.module";
import { RoomModule } from "@modules/room/room.module";
import { MatchmakingGateway } from "./matchmaking.gateway";
import { AuthModule } from "@modules/auth/auth.module";
import { EventEmitterModule } from "@nestjs/event-emitter";

@Module({
    imports: [
        AuthModule,
        UserModule,
        RoomModule,
        EventEmitterModule.forRoot(),
    ],
    providers: [MatchmakingService, MatchmakingGateway],
    exports: [MatchmakingService],
})
export class MatchmakingModule { }