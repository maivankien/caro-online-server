import { AuthService } from './auth.service';
import { CreateUserGuestDto } from '@modules/user/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AccessToken, CurrentUser } from './decorators/current-user.decorator';
import { IAuthUser, ITokenResponse } from './interfaces/auth.interface';
import { Controller, Post, Body, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { ResponseMessage } from '@common/decorators/message.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ITokenResponseDto, IAuthUserDto } from './dto/auth.dto';
import { UserService } from '@modules/user/user.service';
import { User } from '../user/entities/user.entity';

@Controller()
@ApiTags('Authentication')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) { }

    @Post('guest')
    @ApiOperation({ summary: 'Create guest user and authenticate' })
    @ApiBody({ type: CreateUserGuestDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Guest user created and authenticated successfully',
        type: ITokenResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Bad request - Invalid input data',
    })
    @ResponseMessage('Guest user created and authenticated successfully')
    async createGuestUser(
        @Body() createUserDto: CreateUserGuestDto,
    ): Promise<ITokenResponse> {
        return await this.authService.createGuestUserWithToken(createUserDto)
    }

    @Get('verify')
    @ApiOperation({ summary: 'Verify user token' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User token verified successfully',
        type: IAuthUserDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - Invalid token',
    })
    @UseGuards(JwtAuthGuard)
    @ResponseMessage('User token verified successfully')
    verifyToken(@CurrentUser() user: IAuthUser, @AccessToken() accessToken: string): ITokenResponse {
        return {
            user: {
                id: user.userId,
                name: user.name,
                isGuest: user.isGuest,
            },
            token: accessToken,
        }
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile retrieved successfully',
        type: IAuthUserDto,
    })
    @UseGuards(JwtAuthGuard)
    @ResponseMessage('User profile retrieved successfully')
    async getProfile(@CurrentUser() user: IAuthUser): Promise<Partial<User>> {
        return await this.userService.getUserProfile(user.userId)
    }
}
