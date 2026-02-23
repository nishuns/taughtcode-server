import express from 'express';
import userProfileRoutes from './userProfile.js';
import articleRoutes from './articles.js';
import jobRoutes from './jobs.js';

const router = express.Router();

/**
 * API Routes Aggregator
 * 
 * Base path: /api/v1
 */

// User Profile Routes
router.use('/users', userProfileRoutes);

// Article Routes
router.use('/articles', articleRoutes);

// Job Routes
router.use('/jobs', jobRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-11-19T08:00:00.000Z"
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});



export default router;

