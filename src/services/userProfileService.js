import { User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Create a new user profile
 * @param {Object} userData 
 * @returns {Promise<Object>} Created user
 */
async function createUser(userData) {
    const existing = await User.findById(userData.uid);
    if (existing) {
        throw new Error('User already exists');
    }

    const payload = {
        ...userData,
        id: userData.uid,
        status: userData.status || 'active',
        role: userData.role || 'user'
    };

    logger.info(`UserService: Creating profile for ${userData.uid}`);
    return await User.create(payload);
}

/**
 * Get user by ID
 * @param {string} uid 
 */
async function getUser(uid) {
    const user = await User.findById(uid);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

/**
 * Update user profile
 * @param {string} uid 
 * @param {Object} updates 
 */
async function updateUser(uid, updates) {
    logger.info(`UserService: Updating profile for ${uid}`);
    return await User.update(uid, updates);
}

/**
 * Delete user profile
 * @param {string} uid 
 */
async function deleteUser(uid) {
    logger.info(`UserService: Deleting profile for ${uid}`);
    return await User.delete(uid);
}

/**
 * Check if a display name is taken
 * @param {string} displayName 
 */
async function isDisplayNameTaken(displayName) {
    const users = await User.find({ displayName });
    return users.length > 0;
}

export {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    isDisplayNameTaken
};
