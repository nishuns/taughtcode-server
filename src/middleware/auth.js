import { getUserByToken, verifyAuth } from '../services/authService.js'
import apiKeyAuth from './apiKeyAuth.js';

/**
 * Enhanced authentication middleware supporting both Bearer tokens and API Keys
 */
async function isAuthenticated(req, res, next) {
    // 1. Check if already authenticated by API Key (if mounted before this)
    if (req.authType === 'apikey') {
        return next();
    }

    // 2. Otherwise, attempt API Key auth directly (if not mounted separately)
    await apiKeyAuth(req, res, () => { });
    if (req.authType === 'apikey') {
        return next();
    }

    // 3. Fallback to Firebase Token Authentication
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