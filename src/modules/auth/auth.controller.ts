import { AuthService } from './auth.service';
import { CreateUserGuestDto } from '@modules/user/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { IAuthUser, ITokenResponse } from './interfaces/auth.interface';
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ResponseMessage } from '@common/decorators/message.decorator';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('guest')
    @ResponseMessage('Guest user created and authenticated successfully')
    async createGuestUser(
        @Body() createUserDto: CreateUserGuestDto,
    ): Promise<ITokenResponse> {
        return await this.authService.createGuestUserWithToken(createUserDto)
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ResponseMessage('User profile retrieved successfully')
    getProfile(@CurrentUser() user: IAuthUser): IAuthUser {
        return user
    }
}
