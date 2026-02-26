import * as integrationService from '../services/integrationService.js';
import * as userService from '../services/userProfileService.js';
import logger from '../utils/logger.js';

/**
 * Get user Doc ID from request context
 */
async function getUserId(req) {
    if (req.user.id) return req.user.id;
    const profile = await userService.getUser(req.user.uid);
    return profile?.id;
}

/**
 * Update dynamic integration (e.g. GitHub)
 */
export async function updateIntegration(req, res) {
    try {
        const { provider } = req.params;
        const config = req.body;
        const userId = await getUserId(req);

        if (!userId) throw new Error('User profile not found');

        const updated = await integrationService.updateIntegration(userId, provider, config);
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error(`IntegrationController: Error updating ${req.params.provider}:`, error);
        res.status(400).json({ success: false, error: error.message });
    }
}

/**
 * Sync data from an integration
 */
export async function syncIntegration(req, res) {
    try {
        const { provider } = req.params;
        const syncOptions = req.body;
        const userId = await getUserId(req);

        if (!userId) throw new Error('User profile not found');

        const data = await integrationService.syncIntegration(userId, provider, syncOptions);
        res.json({ success: true, data });
    } catch (error) {
        logger.error(`IntegrationController: Error syncing ${req.params.provider}:`, error);
        res.status(400).json({ success: false, error: error.message });
    }
}

/**
 * Remove an integration
 */
export async function removeIntegration(req, res) {
    try {
        const { provider } = req.params;
        const userId = await getUserId(req);

        if (!userId) throw new Error('User profile not found');

        const updated = await integrationService.removeIntegration(userId, provider);
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error(`IntegrationController: Error removing ${req.params.provider}:`, error);
        res.status(400).json({ success: false, error: error.message });
    }
}

/**
 * List all integrations for the current user
 */
export async function listIntegrations(req, res) {
    try {
        const userId = await getUserId(req);
        if (!userId) throw new Error('User profile not found');

        const integrations = await integrationService.listIntegrations(userId);
        res.json({ success: true, data: integrations });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
