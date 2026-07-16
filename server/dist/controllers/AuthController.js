"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserService_1 = require("../services/UserService");
const UserRepository_1 = require("../repositories/UserRepository");
const env_1 = require("../config/env");
const error_1 = require("../middleware/error");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader)
        return list;
    cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}
const isProduction = env_1.env.NODE_ENV === 'production';
const ACCESS_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
};
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
class AuthController {
    userService = new UserService_1.UserService();
    userRepository = new UserRepository_1.UserRepository();
    register = async (req, res, next) => {
        const { email, password, username } = req.body;
        const start = Date.now();
        try {
            const result = await this.userService.registerLocal(email, password, username);
            res.cookie('chatbuzz_token', result.token, ACCESS_COOKIE_OPTIONS);
            res.cookie('chatbuzz_refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
            (0, logger_1.logOperation)('REGISTER_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'User registered successfully.', { user: result.user, token: result.token });
        }
        catch (err) {
            (0, logger_1.logOperation)('REGISTER_USER', undefined, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    login = async (req, res, next) => {
        const { email, password } = req.body;
        const start = Date.now();
        try {
            const result = await this.userService.loginLocal(email, password);
            res.cookie('chatbuzz_token', result.token, ACCESS_COOKIE_OPTIONS);
            res.cookie('chatbuzz_refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
            (0, logger_1.logOperation)('LOGIN_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'User logged in successfully.', { user: result.user, token: result.token });
        }
        catch (err) {
            (0, logger_1.logOperation)('LOGIN_USER', undefined, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    refresh = async (req, res, next) => {
        const start = Date.now();
        try {
            const cookies = parseCookies(req.headers.cookie);
            const refreshToken = cookies.chatbuzz_refresh_token;
            if (!refreshToken) {
                throw new error_1.AuthenticationError('Refresh token required.');
            }
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.REFRESH_TOKEN_SECRET);
            }
            catch (err) {
                throw new error_1.AuthenticationError('Invalid or expired refresh token.');
            }
            const user = await this.userRepository.findById(decoded.id);
            if (!user) {
                throw new error_1.AuthenticationError('User not found.');
            }
            // Generate new tokens (rotation)
            const token = jsonwebtoken_1.default.sign({ id: user._id.toString(), email: user.email }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
            const newRefreshToken = this.userService.generateRefreshToken(user);
            res.cookie('chatbuzz_token', token, ACCESS_COOKIE_OPTIONS);
            res.cookie('chatbuzz_refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);
            (0, logger_1.logOperation)('REFRESH_USER_TOKEN', user.id, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'Token refreshed successfully.', { token, user });
        }
        catch (err) {
            (0, logger_1.logOperation)('REFRESH_USER_TOKEN', undefined, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
    logout = async (req, res, next) => {
        res.clearCookie('chatbuzz_token', { httpOnly: true, secure: isProduction, sameSite: 'lax' });
        res.clearCookie('chatbuzz_refresh_token', { httpOnly: true, secure: isProduction, sameSite: 'lax' });
        return (0, response_1.success)(res, 'User logged out successfully.', null);
    };
}
exports.AuthController = AuthController;
