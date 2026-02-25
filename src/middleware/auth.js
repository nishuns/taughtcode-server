import { getUserByToken, verifyAuth } from '../services/authService.js'
import apiKeyAuth from './apiKeyAuth.js';
import { validateClientAccess } from '../services/organizationService.js';

/**
 * Enhanced authentication middleware supporting both Bearer tokens and API Keys
 */
async function isAuthenticated(req, res, next) {
    // 1. Check if already authenticated by API Key (if mounted before this)
    if (req.authType === 'apikey') {
        return next();
    }

    // 2. Check Client Origin Whitelist
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
        try {
            // Strip out any trailing path from referer just in case
            const originUrl = origin.startsWith('http') ? new URL(origin).origin : origin;
            const orgId = await validateClientAccess(originUrl, req.path);
            
            if (orgId) {
                req.organizationId = orgId;
                req.authType = 'client_whitelist';
                req.user = {
                    id: `system_client_${orgId}`,
                    isSystem: true
                };
                return next();
            }
        } catch (e) {
            // Invalid origin URL, just proceed to next auth method
        }
    }

    // 3. Otherwise, attempt API Key auth directly (if not mounted separately)
    await apiKeyAuth(req, res, () => { });
    if (req.authType === 'apikey') {
        return next();
    }

    // 4. Fallback to Firebase Token Authentication
    try {
        const token = extractToken(req)

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No authentication provided (Bearer token or x-api-key required)'
            })
        }

        const isValid = await verifyAuth(token)

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            })
        }

        const user = await getUserByToken(token)
        req.user = user
        req.authType = 'token';

        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Authentication failed'
        })
    }
}

/**
 * Optional Authentication - Sets req.user if valid token provided, otherwise proceeds as guest
 */
async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req)

        if (!token) {
            return next(); // Guest
        }

        const isValid = await verifyAuth(token)

        if (isValid) {
            const user = await getUserByToken(token)
            req.user = user
            req.authType = 'token';
        }
        // If invalid token, we could either error or treat as guest. 
        // Let's treat as guest to avoid blocking public content due to stale tokens, 
        // but logging it might be good. For now, just proceed.
        
        next()
    } catch (error) {
        // If verification fails, proceed as guest
        next()
    }
}

function extractToken(req) {
    if (req.headers.authorization) {
        const parts = req.headers.authorization.split(' ')
        if (parts.length === 2 && parts[0] === 'Bearer') {
            return parts[1]
        }
    }

    if (req.cookies && req.cookies.token) {
        return req.cookies.token
    }

    return null
}

export { isAuthenticated, optionalAuth }