import { User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Create a new user profile
 * @param {string} uid 
 * @param {Object} profileData 
 * @returns {Promise<Object>} Created user
 */
async function createUser(uid, profileData) {
    const existingProfile = await User.findOne({ uid });
    
    if (existingProfile) {
        throw new Error('Profile already exists for this user');
    }

    const profile = await User.create({
        uid,
        ...profileData,
        status: profileData.status || 'active',
        role: profileData.role || 'user',
        lastActiveAt: new Date()
    });

    logger.debug('UserService: profile created', profile);

    return profile;
}

/**
 * Get user profile by UID (field)
 * @param {string} uid 
 */
async function getUser(uid) {
    const profile = await User.findOne({ uid });
    
    if (!profile || profile.status === 'deactivated') {
        return null;
    }

    return profile;
}

/**
 * Get user profile by Doc ID
 * @param {string} id 
 */
async function getUserById(id) {
    const profile = await User.findById(id);
    
    if (!profile || profile.status === 'deactivated') {
        return null;
    }

    return profile;
}

/**
 * Update user profile by UID
 * @param {string} uid 
 * @param {Object} updateData 
 */
async function updateUser(uid, updateData) {
    const profile = await User.findOne({ uid });
    
    if (!profile || profile.status === 'deactivated') {
        throw new Error('Profile not found');
    }

    const updatedProfile = await User.findByIdAndUpdate(
        profile.id,
        {
            ...updateData,
            updatedAt: new Date()
        },
        { new: true }
    );

    return updatedProfile;
}

/**
 * Update user profile by Doc ID
 * @param {string} id 
 * @param {Object} updateData 
 */
async function updateUserById(id, updateData) {
    const profile = await User.findById(id);
    
    if (!profile || profile.status === 'deactivated') {
        throw new Error('Profile not found');
    }

    const updatedProfile = await User.findByIdAndUpdate(
        id,
        {
            ...updateData,
            updatedAt: new Date()
        },
        { new: true }
    );

    return updatedProfile;
}

/**
 * Deactivate user profile by UID
 * @param {string} uid 
 */
async function deleteUser(uid) {
    const profile = await User.findOne({ uid });
    
    if (!profile || profile.status === 'deactivated') {
        throw new Error('Profile not found');
    }

    const deactivatedProfile = await User.findByIdAndUpdate(
        profile.id,
        {
            status: 'deactivated',
            updatedAt: new Date()
        },
        { new: true }
    );

    return deactivatedProfile;
}

/**
 * Delete user profile by Doc ID
 * @param {string} id 
 */
async function deleteUserById(id) {
    const profile = await User.findById(id);
    
    if (!profile || profile.status === 'deactivated') {
        throw new Error('Profile not found');
    }

    const deactivatedProfile = await User.findByIdAndUpdate(
        id,
        {
            status: 'deactivated',
            updatedAt: new Date()
        },
        { new: true }
    );

    return deactivatedProfile;
}

/**
 * Update last active timestamp
 * @param {string} uid 
 */
async function updateLastActive(uid) {
    const profile = await User.findOne({ uid });
    
    if (!profile || profile.status === 'deactivated') {
        return null;
    }

    const updatedProfile = await User.findByIdAndUpdate(
        profile.id,
        {
            lastActiveAt: new Date()
        },
        { new: true }
    );

    return updatedProfile;
}

/**
 * Check if a display name is taken
 * @param {string} displayName 
 */
async function isDisplayNameTaken(displayName) {
    const users = await User.find({ displayName });
    return users.length > 0;
}

/**
 * List users with filters
 * @param {Object} query 
 * @param {Object} options 
 */
async function listUsers(query = {}, options = {}) {
    return await User.find(
        { ...query, status: 'active' },
        options
    );
}

export {
    createUser,
    getUser,
    getUserById,
    updateUser,
    updateUserById,
    deleteUser,
    deleteUserById,
    updateLastActive,
    isDisplayNameTaken,
    listUsers
};