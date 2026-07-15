"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const provider_1 = require("../auth/provider");
const logger_1 = require("../utils/logger");
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger_1.logger.warn('Authentication failed: Missing or malformed Auth header');
        return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }
    const token = authHeader.split(' ')[1];
    const provider = (0, provider_1.getAuthProvider)();
    try {
        const user = await provider.verifyToken(token);
        req.user = user;
        return next();
    }
    catch (err) {
        logger_1.logger.warn(`Authentication failed: ${err.message}`);
        return res.status(401).json({ error: err.message || 'Authentication failed' });
    }
}
