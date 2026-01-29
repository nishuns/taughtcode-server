import { User } from '../models/index.js';
import logger from '../utils/logger.js';

class UserProfileService {
    
    /**
     * Create a new user profile
     * @param {Object} userData 
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        // Business Logic: Check for duplicates
        const existing = await User.findById(userData.uid);
        if (existing) {
            throw new Error('User already exists');
        }

        // Prepare data with defaults
        const payload = {
            ...userData,
            id: userData.uid, // Ensure ID matches Auth UID
            status: userData.status || 'active',
            role: userData.role || 'user'
        };

        logger.info(`UserService: Creating profile for ${userData.uid}`);
        return await User.create(payload);
    }

    /**
     * Get user by ID
     * @param {string} uid 
     * @returns {Promise<Object>}
     */
    async getUser(uid) {
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
     * @returns {Promise<Object>}
     */
    async updateUser(uid, updates) {
        // Business Logic: Validate updates if needed (e.g. restrict role changes)
        if (updates.role) {
            // Add logic to prevent unauthorized role escalation if this method is generic
        }
        
        logger.info(`UserService: Updating profile for ${uid}`);
        return await User.update(uid, updates);
    }

    /**
     * Delete user profile
     * @param {string} uid 
     */
    async deleteUser(uid) {
        logger.info(`UserService: Deleting profile for ${uid}`);
        return await User.delete(uid);
    }

    /**
     * Check if a username/display name is taken (Example business logic)
     * @param {string} displayName 
     */
    async isDisplayNameTaken(displayName) {
        const users = await User.find({ displayName });
        return users.length > 0;
    }
}

export default new UserProfileService();