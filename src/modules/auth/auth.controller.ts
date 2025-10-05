import { AuthService } from './auth.service';
import { CreateUserGuestDto, CreateUserDto, LoginUserDto } from '@modules/user/dto/user.dto';
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

    @Post('register')
    @ApiOperation({ summary: 'Register new user with email and password' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User registered and authenticated successfully',
        type: ITokenResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email already exists',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Bad request - Invalid input data',
    })
    @ResponseMessage('User registered and authenticated successfully')
    async register(
        @Body() createUserDto: CreateUserDto,
    ): Promise<ITokenResponse> {
        return await this.authService.createUserWithToken(createUserDto)
    }

    @Post('login')
    @ApiOperation({ summary: 'Login user with email and password' })
    @ApiBody({ type: LoginUserDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User logged in successfully',
        type: ITokenResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid email or password',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Bad request - Invalid input data',
    })
    @ResponseMessage('User logged in successfully')
    async login(
        @Body() loginUserDto: LoginUserDto,
    ): Promise<ITokenResponse> {
        return await this.authService.loginUser(loginUserDto)
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
