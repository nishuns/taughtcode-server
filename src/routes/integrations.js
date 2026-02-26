import express from 'express';
import * as integrationController from '../controllers/integrationController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Third-party service integrations management
 */

// All integration routes require authentication
router.use(isAuthenticated);

/**
 * @swagger
 * /integrations:
 *   get:
 *     summary: List all active integrations for the current user
 *     tags: [Integrations]
 */
router.get('/', integrationController.listIntegrations);

/**
 * @swagger
 * /integrations/{provider}:
 *   put:
 *     summary: Update/Setup a third-party integration (e.g., github)
 *     tags: [Integrations]
 */
router.put('/:provider', integrationController.updateIntegration);

/**
 * @swagger
 * /integrations/{provider}/sync:
 *   post:
 *     summary: Manually trigger a sync for an integration
 *     tags: [Integrations]
 */
router.post('/:provider/sync', integrationController.syncIntegration);

/**
 * @swagger
 * /integrations/{provider}:
 *   delete:
 *     summary: Remove an integration
 *     tags: [Integrations]
 */
router.delete('/:provider', integrationController.removeIntegration);

export default router;
