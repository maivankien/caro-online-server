import Redis from 'ioredis';
import { Module, Global } from '@nestjs/common';
import { AppConfigModule } from '@/config/app/config.module';
import { AppConfigService } from '@/config/app/config.service';
import { REDIS_CLIENT } from '@/common/constants/common.constants';

@Global()
@Module({
    imports: [AppConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (config: AppConfigService) => {
                return new Redis({
                    db: config.redis.db,
                    host: config.redis.host,
                    port: config.redis.port,
                    password: config.redis.password,
                    username: config.redis.username
                })
            },
            inject: [AppConfigService]
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisProviderModule { }
