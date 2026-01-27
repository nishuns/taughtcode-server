import * as docsService from '../services/docsService.js';
import { renderDocPage, renderTemplate } from '../utils/templateRenderer.js';

/**
 * Documentation Controller
 * Thin controller that delegates to service layer
 */

/**
 * Get documentation file
 * GET /docs/:path(*)
 */
async function getDoc(req, res) {
    try {
        // Extract path from request (Express 5 regex route)
        // req.path is relative to router mount point (/docs)
        // e.g., '/guides/quick-start' -> 'guides/quick-start'
        const routePath = req.path.replace(/^\/+/, '').replace(/\/+$/, '');

        // Check for refresh parameter (allow manual refresh via ?refresh=true)
        const forceRefresh = req.query.refresh === 'true';

        // Get documentation content from service (always fresh, no cache)
        const docData = await docsService.getDocContent(routePath);

        // Get navigation structure (with optional refresh)
        const navigation = await docsService.getNavigationStructure(forceRefresh);

        // Render page using template
        const html = await renderDocPage({
            title: docData.title,
            content: docData.content,
            currentPath: `/docs/${routePath}`,
            navigation
        });

        res.send(html);
    } catch (error) {
        console.error('Error serving documentation:', error);

        if (error.message === 'File not found') {
            return res.status(404).send(await get404Page());
        }

        if (error.message === 'Access denied') {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * List all documentation files
 * GET /docs
 */
async function listDocs(req, res) {
    try {
        // Check for refresh parameter (allow manual refresh via ?refresh=true)
        const forceRefresh = req.query.refresh === 'true';

        // Get index data from service (now async)
        const indexData = await docsService.getIndexData();

        // Get navigation structure (with optional refresh)
        const navigation = await docsService.getNavigationStructure(forceRefresh);

        // Render page using template
        const html = await renderDocPage({
            title: indexData.title,
            content: indexData.content,
            currentPath: '/docs',
            navigation
        });

        res.send(html);
    } catch (error) {
        console.error('Error listing documentation:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

/**
 * Get 404 page
 * @returns {Promise<string>} 404 HTML page
 */
async function get404Page() {
    const navigation = await docsService.getNavigationStructure();

    return await renderDocPage({
        title: 'Page Not Found',
        content: `
      <h1>404 - Page Not Found</h1>
      <p>The documentation page you're looking for doesn't exist.</p>
      <p><a href="/docs">Go to Documentation Index</a></p>
    `,
        currentPath: '',
        navigation
    });
}

export {
    getDoc,
    listDocs
};
