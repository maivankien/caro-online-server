import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { AppConfigService } from './config/app/config.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    app.setGlobalPrefix('api')

    const config = new DocumentBuilder()
        .setTitle('Caro Online API')
        .setDescription('API documentation for Caro Online game server')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth',
        )
        .addSecurityRequirements('JWT-auth')
        .build()

    const document = SwaggerModule.createDocument(app, config)

    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        }
    })

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
