import * as userService from '../services/userProfileService.js';
import * as storageService from '../services/storageService.js';
import Organization from '../models/organizationModel.js';

/**
 * Onboard a new user
 * Handles profile creation and optional organization setup
 */
const onboardUser = async (req, res) => {
    try {
        const { uid } = req.user; // From auth middleware
        const profileData = req.body;
        const file = req.file; // From multer or similar middleware

        // 1. Handle Profile Picture Upload
        let photoURL = profileData.photoURL || null;
        if (file) {
            const upload = await storageService.uploadUserAsset(
                uid,
                file.buffer,
                file.mimetype,
                'profile',
                'avatar'
            );
            photoURL = upload.url;
        }

        // 2. Handle Organization
        let organizationId = profileData.organizationId || null;

        // If creating a new organization during onboarding
        if (profileData.createOrganization && profileData.organizationName) {
            const newOrg = await Organization.create({
                name: profileData.organizationName,
                ownerId: uid,
                type: profileData.organizationType || 'personal',
                description: `Organization for ${profileData.displayName}`
            });
            organizationId = newOrg.id;
        }

        // 3. Create User Profile
        const newUser = await userService.createUser(uid, {
            ...profileData,
            photoURL,
            organizationId,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            data: newUser
        });

    } catch (error) {
        console.error('Onboarding Error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get current user profile
 */
const getMe = async (req, res) => {
    try {
        const user = await userService.getUser(req.user.uid);
        if (!user && req.user) {
            return res.json({
                success: true,
                data: {
                    ...req.user,
                    isOnboarded: false
                }
            });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
};

/**
 * Get user by ID (Admin or public profile depending on logic)
 */
const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
};

/**
 * Update user profile
 */
const updateUser = async (req, res) => {
    try {
        const { uid } = req.user;
        const updates = req.body;

        // Prevent updating sensitive fields directly
        delete updates.uid;
        delete updates.role;
        delete updates.status;

        const updatedUser = await userService.updateUser(uid, updates);
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * List all users (Admin only likely)
 */
const getAllUsers = async (req, res) => {
    try {
        const filters = req.query; // Basic filtering from query params
        const users = await userService.listUsers(filters);
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Deactivate User (Soft Delete)
 * User cannot log in but data persists
 */
const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Verify permission (Admin or Self)
        if (req.user.uid !== id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await userService.deleteUserById(id);
        res.json({ success: true, message: 'User deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Disable User (Admin Ban)
 * User cannot access anything
 */
const disableUser = async (req, res) => {
    try {
        // Admin only
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { id } = req.params;
        await userService.updateUserById(id, { status: 'disabled' });
        res.json({ success: true, message: 'User disabled' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Activate User
 */
const activateUser = async (req, res) => {
    try {
        // Admin only
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { id } = req.params;
        await userService.updateUserById(id, { status: 'active' });
        res.json({ success: true, message: 'User activated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update dynamic integration (e.g. GitHub)
 */
const updateIntegration = async (req, res) => {
    try {
        const { provider } = req.params;
        const config = req.body;
        const userId = req.user.id; // Doc ID from session if available, otherwise we need to find it

        if (!userId && req.user.uid) {
            const profile = await userService.getUser(req.user.uid);
            if (profile) {
                const updated = await userService.updateIntegration(profile.id, provider, config);
                return res.json({ success: true, data: updated });
            }
        } else if (userId) {
            const updated = await userService.updateIntegration(userId, provider, config);
            return res.json({ success: true, data: updated });
        }

        throw new Error('User context not found');
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export {
    onboardUser,
    getMe,
    getUserById,
    updateUser,
    getAllUsers,
    deactivateUser,
    disableUser,
    activateUser,
    updateIntegration
};