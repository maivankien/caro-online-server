import { DatabaseType } from 'typeorm';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '@config/app/config.module';
import { AppConfigService } from '@config/app/config.service';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [AppConfigModule],
            inject: [AppConfigService],
            useFactory: async (config: AppConfigService) => ({
                type: 'mysql' as DatabaseType,
                host: config.mysql.host,
                port: config.mysql.port,
                username: config.mysql.username,
                password: config.mysql.password,
                database: config.mysql.database,
                autoLoadEntities: true,
            }),
        } as TypeOrmModuleAsyncOptions),
    ],
})
export class MysqlDatabaseProviderModule { }
