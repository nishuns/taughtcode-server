import { NOTIFICATION_TYPES } from '../../config/notifications.js';
// import { orgInviteHandler } from './orgInvite.js';

const handlers = {
    // [NOTIFICATION_TYPES.ORG_INVITE]: orgInviteHandler,
    // Add other handlers here as they are implemented
};

/**
 * Get handler for a specific notification type
 * @param {string} type 
 * @returns {Object|null} Handler object or null
 */
export const getHandler = (type) => {
    return handlers[type] || null;
};
