import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
    constructor(private readonly configService: ConfigService) { }

    get name(): string {
        return this.configService.get<string>('app.name')
    }

    get env(): string {
        return this.configService.get<string>('app.env')
    }

    get url(): string {
        return this.configService.get<string>('app.url')
    }

    get port(): number {
        return Number(this.configService.get<number>('app.port'))
    }

    get mysql(): {
        host: string
        port: number
        username: string
        password: string
        database: string
    } {
        return this.configService.get<{
            host: string
            port: number
            username: string
            password: string
            database: string
        }>('app.mysql')
    }

    get jwt(): {
        secret: string
        expirationTime: string
    } {
        return this.configService.get<{
            secret: string
            expirationTime: string
        }>('app.jwt')
    }

    get redis(): {
        db: number
        host: string
        port: number
        password: string
        username: string
    } {
        return this.configService.get<{
            db: number
            host: string
            port: number
            password: string
            username: string
        }>('app.redis')
    }
}
