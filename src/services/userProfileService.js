import { User } from '../models/index.js';
import { StorageProvider } from '../providers/storage/registry.js';
import logger from '../utils/logger.js';

class UserProfileService {
    constructor() {
        this.storage = StorageProvider('firebase');
    }

    /**
     * Complete user onboarding and create profile
     * @param {string} uid - Firebase Auth User ID
     * @param {Object} profileData - Data from onboarding form
     * @param {Buffer} [photoBuffer] - Optional profile photo buffer
     * @param {string} [photoMimeType] - Mime type of the photo
     */
    async onboardUser(uid, profileData, photoBuffer = null, photoMimeType = null) {
        try {
            logger.info(`Starting onboarding for user: ${uid}`);

            // 1. Check if profile already exists
            const existingUser = await User.findById(uid);
            if (existingUser) {
                throw new Error('User profile already exists');
            }

            let photoURL = profileData.photoURL || null;

            // 2. Handle Profile Picture Upload if provided
            if (photoBuffer) {
                const uploadResult = await this.uploadUserAsset(
                    uid, 
                    photoBuffer, 
                    'profile_picture', 
                    photoMimeType, 
                    true // isPublic
                );
                photoURL = uploadResult.url;
            }

            // 3. Create User Profile in Firestore
            const userData = {
                uid: uid, // Use Auth ID as Document ID
                id: uid,  // Explicitly set ID for FirebaseModel
                email: profileData.email,
                displayName: profileData.displayName,
                photoURL: photoURL,
                occupation: profileData.occupation,
                bio: profileData.bio,
                hobbies: profileData.hobbies || [],
                interests: profileData.interests || [],
                expertise: profileData.expertise || [],
                writingStyle: profileData.writingStyle || 'casual',
                socialLinks: profileData.socialLinks || {},
                role: 'user',
                preferences: profileData.preferences || {},
                status: 'active'
            };

            const newUser = await User.create(userData);
            
            logger.info(`User onboarding complete for: ${uid}`);
            return newUser;

        } catch (error) {
            logger.error(`Onboarding failed for ${uid}:`, error);
            throw error;
        }
    }

    /**
     * Upload an asset for a user (Profile Pic, Background, etc.)
     * Stores in: users/{userId}/{assetType}.{ext}
     * @param {string} userId 
     * @param {Buffer} fileBuffer 
     * @param {string} assetType - e.g., 'profile_picture', 'background', 'blog_images/post1'
     * @param {string} mimeType 
     * @param {boolean} isPublic 
     */
    async uploadUserAsset(userId, fileBuffer, assetType, mimeType, isPublic = false) {
        // Determine extension from mimeType
        const ext = mimeType.split('/')[1] || 'bin';
        const filename = `${assetType}.${ext}`;
        const destination = `users/${userId}/${filename}`;

        logger.info(`Uploading asset for user ${userId} to ${destination}`);

        return await this.storage.upload(fileBuffer, destination, {
            mimeType: mimeType,
            isPublic: isPublic,
            metadata: {
                userId: userId,
                type: assetType
            }
        });
    }

    /**
     * Update user profile
     * @param {string} uid 
     * @param {Object} updateData 
     */
    async updateProfile(uid, updateData) {
        return await User.update(uid, updateData);
    }

    /**
     * Get user profile
     * @param {string} uid 
     */
    async getProfile(uid) {
        const user = await User.findById(uid);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}

export default new UserProfileService();
