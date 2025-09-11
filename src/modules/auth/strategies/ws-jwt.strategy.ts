import { Socket } from 'socket.io'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { WsException } from '@nestjs/websockets'
import { AppConfigService } from '@config/app/config.service'
import { IJwtPayload, IAuthUser } from '../interfaces/auth.interface'

@Injectable()
export class WebSocketJwtStrategy {
    constructor(
        private readonly jwtService: JwtService,
        private readonly appConfigService: AppConfigService,
    ) { }

    async authenticate(client: Socket): Promise<IAuthUser> {
        try {
            const token = this.extractTokenFromHandshake(client)

            if (!token) {
                throw new WsException('Unauthorized: No token provided')
            }

            const payload: IJwtPayload = await this.jwtService.verifyAsync(token, {
                secret: this.appConfigService.jwt.secret,
                ignoreExpiration: false,
            })

            return await this.validate(payload)

        } catch (error) {
            if (error instanceof WsException) {
                throw error
            }

            throw new WsException('Unauthorized: Invalid token')
        }
    }

    async validate(payload: IJwtPayload): Promise<IAuthUser> {
        return {
            userId: payload.sub,
            name: payload.name,
            isGuest: payload.isGuest,
        }
    }

    private extractTokenFromHandshake(client: Socket): string | null {
        const tokenFromAuth = client.handshake.auth?.token as string

        if (tokenFromAuth) {
            return tokenFromAuth
        }
        

        const authHeader = client.handshake.headers?.authorization
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1]
        }

        return null
    }
} 