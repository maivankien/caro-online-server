import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { AppConfigService } from './config/app/config.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.setGlobalPrefix('api')

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    )

    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)))

    app.useGlobalFilters(new HttpExceptionFilter())

    app.use(json({ limit: '5mb' }))

    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
        credentials: true,
    })

    const configService = app.get(AppConfigService)

    await app.listen(configService.port)
}

bootstrap()
