import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { logOperation } from '../utils/logger';
import { success, created } from '../utils/response';

export class AuthController {
  private userService = new UserService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, username } = req.body;
    const start = Date.now();

    try {
      const result = await this.userService.registerLocal(email, password, username);
      logOperation('REGISTER_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
      return created(res, 'User registered successfully.', result);
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
      logOperation('LOGIN_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
      return success(res, 'User logged in successfully.', result);
    } catch (err) {
      logOperation('LOGIN_USER', undefined, undefined, 'FAILED', Date.now() - start, err);
      return next(err);
    }
  };
}
