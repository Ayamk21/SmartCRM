import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import {
  SetSecurityQuestionsDto,
  VerifySecurityAnswersDto,
} from './dto/security-question.dto';

const REFRESH_COOKIE = 'refreshToken';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    if (result.isPlatformAdmin) {
      return { accessToken: result.accessToken, isPlatformAdmin: true };
    }
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user, isPlatformAdmin: false };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException('Aucune session active.');
    }
    const { accessToken, refreshToken, user } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE);
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.sub, dto);
    return { ok: true };
  }

  @Delete('account')
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.deleteAccount(user.sub, dto);
    res.clearCookie(REFRESH_COOKIE);
    return { ok: true };
  }

  @Post('security-questions')
  setSecurityQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetSecurityQuestionsDto,
  ) {
    return this.authService.setSecurityQuestions(user.sub, dto);
  }

  @Public()
  @Get('security-questions/:email')
  getSecurityQuestions(@Param('email') email: string) {
    return this.authService.getSecurityQuestions(email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('recover/verify-security-answers')
  verifySecurityAnswers(@Body() dto: VerifySecurityAnswersDto) {
    return this.authService.verifySecurityAnswers(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { ok: true };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const days = Number(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '30',
    );
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/auth',
    });
  }
}
