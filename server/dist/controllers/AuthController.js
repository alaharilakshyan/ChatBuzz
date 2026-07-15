"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const UserService_1 = require("../services/UserService");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class AuthController {
    userService = new UserService_1.UserService();
    register = async (req, res, next) => {
        const { email, password, username } = req.body;
        const start = Date.now();
        try {
            const result = await this.userService.registerLocal(email, password, username);
            (0, logger_1.logOperation)('REGISTER_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.created)(res, 'User registered successfully.', result);
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
            (0, logger_1.logOperation)('LOGIN_USER', result.user.id, undefined, 'SUCCESS', Date.now() - start);
            return (0, response_1.success)(res, 'User logged in successfully.', result);
        }
        catch (err) {
            (0, logger_1.logOperation)('LOGIN_USER', undefined, undefined, 'FAILED', Date.now() - start, err);
            return next(err);
        }
    };
}
exports.AuthController = AuthController;
