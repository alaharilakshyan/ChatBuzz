"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const error_1 = require("./error");
function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            return next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
                return next(new error_1.ValidationError(errorMessages));
            }
            return next(err);
        }
    };
}
