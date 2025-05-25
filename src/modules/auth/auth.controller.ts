import { AuthService } from './auth.service';
import { CreateUserGuestDto } from '@modules/user/dto/user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { IAuthUser, ITokenResponse } from './interfaces/auth.interface';
import { Controller, Post, Body, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { ResponseMessage } from '@common/decorators/message.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ITokenResponseDto, IAuthUserDto } from './dto/auth.dto';

@Controller()
@ApiTags('Authentication')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile retrieved successfully',
        type: IAuthUserDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Unauthorized - Invalid or missing token',
    })
    @UseGuards(JwtAuthGuard)
    @ResponseMessage('User profile retrieved successfully')
    getProfile(@CurrentUser() user: IAuthUser): IAuthUser {
        return user
    }
}
