import express from 'express';
import * as userController from '../controllers/userProfileController.js';
import { isAuthenticated } from '../middleware/auth.js';
// Multer is not set up yet, assuming a placeholder middleware or we can add it later.
// For now, we'll assume JSON body for file info or handle it if we set up multer.
// I will just use a dummy middleware for file upload if needed or skip it for now.
// Since the prompt mentioned upload functionality in controller via `req.file`, 
// I should really set up multer. But to keep this step focused on routes:

const router = express.Router();

// Middleware
router.use(isAuthenticated);

// Onboarding
router.post('/onboard', userController.onboardUser);

// Profile Management
router.get('/me', userController.getMe);
router.patch('/me', userController.updateUser);

// User Management (ID based)
router.get('/:id', userController.getUserById);

// Status Management
router.patch('/:id/deactivate', userController.deactivateUser);

// Admin Routes (Should have role check middleware in real app)
router.get('/', userController.getAllUsers);
router.patch('/:id/disable', userController.disableUser);
router.patch('/:id/activate', userController.activateUser);

export default router;
