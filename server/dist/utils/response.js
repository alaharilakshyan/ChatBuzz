"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.created = created;
exports.accepted = accepted;
exports.noContent = noContent;
exports.paginated = paginated;
exports.error = error;
function success(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
}
function created(res, message, data) {
    return success(res, message, data, 201);
}
function accepted(res, message, data) {
    return success(res, message, data, 202);
}
function noContent(res, message) {
    return res.status(204).json({
        success: true,
        message,
        data: null,
        timestamp: new Date().toISOString()
    });
}
function paginated(res, message, paginatedData) {
    return success(res, message, paginatedData);
}
function error(res, statusCode, message, errorCode) {
    return res.status(statusCode).json({
        success: false,
        error: message,
        errorCode,
        timestamp: new Date().toISOString()
    });
}
