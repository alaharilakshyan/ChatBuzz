import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { IUser } from '../models/User';
import { env } from '../config/env';
import { AuthenticationError, ConflictError } from '../middleware/error';
import { logger } from '../utils/logger';

export class UserService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();

  private hashPassword(password: string): string {
    return crypto.pbkdf2Sync(password, 'salt_chatbuzz', 1000, 64, 'sha512').toString('hex');
  }

  async registerLocal(email: string, password: string, username: string): Promise<{ user: IUser; token: string }> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('User with this email already exists.');
    }

    const existingProfile = await this.profileRepository.findByUsername(username);
    if (existingProfile) {
      throw new ConflictError('Username is already taken.');
    }

    const passwordHash = this.hashPassword(password);
    const user = await this.userRepository.create({
      email,
      passwordHash,
      emailVerified: false
    });

    // Generate random 4-digit tag
    const userTag = Math.floor(1000 + Math.random() * 9000).toString();
    await this.profileRepository.create({
      userId: user._id,
      username,
      userTag
    });

    const token = this.generateToken(user);
    logger.info(`User registered successfully: ${email}`);

    return { user, token };
  }

  async loginLocal(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const passwordHash = this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const token = this.generateToken(user);
    logger.info(`User logged in successfully: ${email}`);

    return { user, token };
  }

  private generateToken(user: IUser): string {
    return jwt.sign(
      { id: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );
  }
}
