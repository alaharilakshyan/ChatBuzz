import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';
import { env } from '../config/env';
import { AuthenticationError } from '../middleware/error';
import { logOperation } from '../utils/logger';
import { success, created } from '../utils/response';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    list[parts.shift()!.trim()] = decodeURI(parts.join('='));
  });
  return list;
}

const isProduction = env.NODE_ENV === 'production';
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000 // 15 mins
};
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  private userService = new UserService();
  private userRepository = new UserRepository();

  register = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, username } = req.body;
    const start = Date.now();

    try {
      const result = await this.userService.registerLocal(email, password, username);
      
      res.cookie('chatbuzz_token', result.token, ACCESS_COOKIE_OPTIONS);
      res.cookie('chatbuzz_refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      logOperation('REGISTER_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'User registered successfully.', { user: result.user, token: result.token });
    } catch (err) {
      logOperation('REGISTER_USER', undefined, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const start = Date.now();

    try {
      const result = await this.userService.loginLocal(email, password);
      
      res.cookie('chatbuzz_token', result.token, ACCESS_COOKIE_OPTIONS);
      res.cookie('chatbuzz_refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      logOperation('LOGIN_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'User logged in successfully.', { user: result.user, token: result.token });
    } catch (err) {
      logOperation('LOGIN_USER', undefined, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    try {
      const cookies = parseCookies(req.headers.cookie);
      const refreshToken = cookies.chatbuzz_refresh_token;
      
      if (!refreshToken) {
        throw new AuthenticationError('Refresh token required.');
      }

      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
      } catch (err) {
        throw new AuthenticationError('Invalid or expired refresh token.');
      }

      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new AuthenticationError('User not found.');
      }

      // Generate new tokens (rotation)
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );
      const newRefreshToken = this.userService.generateRefreshToken(user);

      res.cookie('chatbuzz_token', token, ACCESS_COOKIE_OPTIONS);
      res.cookie('chatbuzz_refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);

      logOperation('REFRESH_USER_TOKEN', user.id, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'Token refreshed successfully.', { token, user });
    } catch (err) {
      logOperation('REFRESH_USER_TOKEN', undefined, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie('chatbuzz_token', { httpOnly: true, secure: isProduction, sameSite: 'lax' });
    res.clearCookie('chatbuzz_refresh_token', { httpOnly: true, secure: isProduction, sameSite: 'lax' });
    return success(res, 'User logged out successfully.', null);
  };
}
