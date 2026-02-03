import express from 'express';
import * as articleController from '../controllers/articleController.js';
import { isAuthenticated, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createArticleSchema, updateArticleSchema, addReviewSchema } from '../validation/articleSchemas.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Article management and monetization
 */

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleInput'
 *     responses:
 *       201:
 *         description: Article created
 */
router.post('/', 
    isAuthenticated, 
    validateRequest(createArticleSchema), 
    articleController.createArticle
);

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: List articles
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of articles
 */
router.get('/', articleController.listArticles);

/**
 * @swagger
 * /articles/{slug}:
 *   get:
 *     summary: Get article by slug
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article data (full or preview)
 */
router.get('/:slug', 
    optionalAuth, 
    articleController.getArticle
);

/**
 * @swagger
 * /articles/{id}:
 *   patch:
 *     summary: Update article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleUpdate'
 *     responses:
 *       200:
 *         description: Article updated
 */
router.patch('/:id', 
    isAuthenticated, 
    validateRequest(updateArticleSchema), 
    articleController.updateArticle
);

/**
 * @swagger
 * /articles/{id}/reviews:
 *   post:
 *     summary: Add a review
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added
 */
router.post('/:id/reviews', 
    isAuthenticated, 
    validateRequest(addReviewSchema), 
    articleController.addReview
);

export default router;
