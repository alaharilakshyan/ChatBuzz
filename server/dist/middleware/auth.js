"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const provider_1 = require("../auth/provider");
const logger_1 = require("../utils/logger");
async function authenticate(req, res, next) {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    else if (req.headers.cookie) {
        const cookies = req.headers.cookie;
        const match = cookies.split(';').find(c => c.trim().startsWith('chatbuzz_token='));
        if (match) {
            token = match.split('=')[1];
        }
    }
    if (!token) {
        logger_1.logger.warn('Authentication failed: Missing token in Auth header and cookies');
        return res.status(401).json({ error: 'Authentication required. Missing Bearer token or cookie.' });
    }
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
