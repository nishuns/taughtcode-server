import express from 'express';
const router = express.Router();
import * as docsController from '../controllers/docsController.js';

// Documentation Routes
// Base path: /docs
// Public access

/**
 * @route   GET /docs
 * @desc    Documentation index page
 * @access  Public
 */
router.get('/', docsController.listDocs);

/**
 * @route   GET /docs/*
 * @desc    Get documentation file by path
 * @access  Public
 * 
 * Examples:
 * - /docs/guides/quick-start
 * - /docs/api/endpoints
 * - /docs/architecture/plugin-provider-system
 * 
 * Note: Express 5 uses regex pattern for catch-all routes (excluding root)
 */
router.get(/^\/.+/, docsController.getDoc);

export default router;