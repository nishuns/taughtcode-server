import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import * as storageService from './storageService.js';

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

/**
 * Get the primary admin profile (for public landing page)
 */
async function getPrimaryAdmin() {
    const admins = await User.find({ role: 'admin', status: 'active' }, { limit: 1 });
    return admins[0] || null;
}

/**
 * Update user's profile picture
 * @param {string} uid 
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 */
async function updateProfilePicture(uid, fileBuffer, mimeType) {
    const user = await getUser(uid);
    if (!user) throw new Error('User not found');

    const filename = `profile_${Date.now()}.${mimeType.split('/')[1]}`;
    const uploadResult = await storageService.uploadUserAsset(
        user.uid,
        fileBuffer,
        mimeType,
        'profile',
        filename
    );

    return await updateUser(uid, { photoURL: uploadResult.url });
}

/**
 * Update user's cover photo
 * @param {string} uid 
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 */
async function updateCoverPhoto(uid, fileBuffer, mimeType) {
    const user = await getUser(uid);
    if (!user) throw new Error('User not found');

    const filename = `cover_${Date.now()}.${mimeType.split('/')[1]}`;
    const uploadResult = await storageService.uploadUserAsset(
        user.uid,
        fileBuffer,
        mimeType,
        'profile',
        filename
    );

    return await updateUser(uid, { coverURL: uploadResult.url });
}

/**
 * Add an asset to the user's gallery
 * @param {string} uid 
 * @param {Buffer} fileBuffer 
 * @param {string} mimeType 
 * @param {Object} metadata { title, description, type: 'photo'|'video' }
 */
async function addGalleryAsset(uid, fileBuffer, mimeType, metadata = {}) {
    const user = await getUser(uid);
    if (!user) throw new Error('User not found');

    const fileType = metadata.type || (mimeType.startsWith('video') ? 'video' : 'photo');
    const filename = `gallery_${Date.now()}.${mimeType.split('/')[1]}`;
    
    const uploadResult = await storageService.uploadUserAsset(
        user.uid,
        fileBuffer,
        mimeType,
        'gallery',
        filename
    );

    const newAsset = {
        url: uploadResult.url,
        type: fileType,
        title: metadata.title || '',
        description: metadata.description || '',
        createdAt: new Date()
    };

    const updatedGallery = [...(user.gallery || []), newAsset];
    return await updateUser(uid, { gallery: updatedGallery });
}

/**
 * Remove an asset from the user's gallery
 * @param {string} uid 
 * @param {string} assetUrl 
 */
async function deleteGalleryAsset(uid, assetUrl) {
    const user = await getUser(uid);
    if (!user) throw new Error('User not found');

    // 1. Delete from storage if it's our storage
    if (assetUrl.includes('storage.googleapis.com')) {
        try {
            const urlObj = new URL(assetUrl);
            const path = urlObj.pathname.split('/').slice(2).join('/');
            await storageService.deleteFile(path);
        } catch (e) {
            logger.warn(`Failed to delete gallery file from storage: ${assetUrl}`);
        }
    }

    // 2. Remove from database
    const updatedGallery = (user.gallery || []).filter(item => item.url !== assetUrl);
    return await updateUser(uid, { gallery: updatedGallery });
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
    listUsers,
    updateProfilePicture,
    updateCoverPhoto,
    addGalleryAsset,
    deleteGalleryAsset
};