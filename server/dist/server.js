"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const error_1 = require("./middleware/error");
const connection_1 = require("./sockets/connection");
const api_1 = __importDefault(require("./routes/api"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Enable rate limit for API endpoints
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
});
const path_1 = __importDefault(require("path"));
// Configure middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false // Allows loading local media files across origins
}));
app.use((0, cors_1.default)({
    origin: env_1.env.CLIENT_URL,
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api', limiter);
// Serve uploads folder statically for local storage fallback
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
const swagger_1 = require("./utils/swagger");
(0, swagger_1.setupSwagger)(app);
// Register routes
app.use('/api/v1', api_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Global Error Handler
app.use(error_1.errorHandler);
// Setup Sockets
const io = (0, connection_1.setupSockets)(httpServer);
app.set('io', io);
// Start server listening
const port = env_1.env.PORT;
(0, database_1.connectDatabase)().then(() => {
    httpServer.listen(port, () => {
        logger_1.logger.info(`🚀 Server running in ${env_1.env.NODE_ENV} mode on port ${port}`);
        logger_1.logger.info(`☁️ Cloudinary initialized with cloud: ${env_1.env.CLOUDINARY_CLOUD_NAME}`);
    });
}).catch((err) => {
    logger_1.logger.error('❌ Server startup failure due to database connection error:', err);
    process.exit(1);
});
