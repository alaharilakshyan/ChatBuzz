"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = require("../models/User");
class UserRepository {
    async findById(id) {
        return await User_1.User.findById(id).where({ deletedAt: null });
    }
    async findByEmail(email) {
        return await User_1.User.findOne({ email: email.toLowerCase(), deletedAt: null });
    }
    async findByAuth0Id(auth0Id) {
        return await User_1.User.findOne({ auth0Id, deletedAt: null });
    }
    async create(userData) {
        return await User_1.User.create(userData);
    }
    async update(id, updateData) {
        return await User_1.User.findByIdAndUpdate(id, updateData, { new: true }).where({ deletedAt: null });
    }
    async delete(id) {
        return await User_1.User.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    }
}
exports.UserRepository = UserRepository;
