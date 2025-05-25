import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@modules/user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppConfigModule } from '@config/app/config.module';
import { AppConfigService } from '@config/app/config.service';

@Module({
    imports: [
        UserModule,
        PassportModule,
        AppConfigModule,
        JwtModule.registerAsync({
            imports: [AppConfigModule],
            useFactory: (appConfigService: AppConfigService) => ({
                secret: appConfigService.jwt.secret,
                signOptions: {
                    expiresIn: appConfigService.jwt.expirationTime,
                },
            }),
            inject: [AppConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtAuthGuard],
    exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule { }
