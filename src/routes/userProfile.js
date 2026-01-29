import express from 'express';
import * as userController from '../controllers/userProfileController.js';
import { isAuthenticated } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { onboardUserSchema, updateUserSchema } from '../validation/userSchemas.js';

const router = express.Router();

// Middleware
router.use(isAuthenticated);

// Onboarding
// Expects multipart/form-data: 'photo' (file) + other fields
router.post('/onboard', 
    upload.single('photo'), 
    validateRequest(onboardUserSchema), 
    userController.onboardUser
);

// Profile Management
router.get('/me', userController.getMe);
router.patch('/me', 
    validateRequest(updateUserSchema), 
    userController.updateUser
);

// User Management (ID based)
router.get('/:id', userController.getUserById);

// Status Management
router.patch('/:id/deactivate', userController.deactivateUser);

// Admin Routes (Should have role check middleware in real app)
router.get('/', userController.getAllUsers);
router.patch('/:id/disable', userController.disableUser);
router.patch('/:id/activate', userController.activateUser);

export default router;
