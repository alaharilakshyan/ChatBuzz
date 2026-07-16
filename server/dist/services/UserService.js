"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserRepository_1 = require("../repositories/UserRepository");
const ProfileRepository_1 = require("../repositories/ProfileRepository");
const env_1 = require("../config/env");
const error_1 = require("../middleware/error");
const logger_1 = require("../utils/logger");
class UserService {
    userRepository = new UserRepository_1.UserRepository();
    profileRepository = new ProfileRepository_1.ProfileRepository();
    hashPassword(password) {
        return crypto_1.default.pbkdf2Sync(password, 'salt_chatbuzz', 1000, 64, 'sha512').toString('hex');
    }
    async registerLocal(email, password, username) {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new error_1.ConflictError('User with this email already exists.');
        }
        const existingProfile = await this.profileRepository.findByUsername(username);
        if (existingProfile) {
            throw new error_1.ConflictError('Username is already taken.');
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
        const refreshToken = this.generateRefreshToken(user);
        logger_1.logger.info(`User registered successfully: ${email}`);
        return { user, token, refreshToken };
    }
    async loginLocal(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user || !user.passwordHash) {
            throw new error_1.AuthenticationError('Invalid email or password.');
        }
        const passwordHash = this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            throw new error_1.AuthenticationError('Invalid email or password.');
        }
        const token = this.generateToken(user);
        const refreshToken = this.generateRefreshToken(user);
        logger_1.logger.info(`User logged in successfully: ${email}`);
        return { user, token, refreshToken };
    }
    generateToken(user) {
        return jsonwebtoken_1.default.sign({ id: user._id.toString(), email: user.email }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
    }
    generateRefreshToken(user) {
        return jsonwebtoken_1.default.sign({ id: user._id.toString(), email: user.email }, env_1.env.REFRESH_TOKEN_SECRET, { expiresIn: env_1.env.REFRESH_TOKEN_EXPIRES_IN });
    }
}
exports.UserService = UserService;
