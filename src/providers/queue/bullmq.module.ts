import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { AppConfigModule } from "@/config/app/config.module";
import { AppConfigService } from "@/config/app/config.service";


@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [AppConfigModule],
            inject: [AppConfigService],
            useFactory: async (config: AppConfigService) => ({
                connection: {
                    db: config.redis.db,
                    host: config.redis.host,
                    port: config.redis.port,
                    password: config.redis.password,
                    username: config.redis.username
                }
            })
        })
    ]
})
export class BullMQProviderModule { }