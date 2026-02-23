import * as templateService from '../services/articleTemplateService.js';

/**
 * Generate a template using AI
 */
const generateTemplate = async (req, res) => {
    try {
        const { uid } = req.user;
        const { description, category } = req.body;

        if (!description) {
            return res.status(400).json({ success: false, error: 'Description is required' });
        }

        const template = await templateService.generateTemplate(uid, description, category);

        res.status(201).json({
            success: true,
            data: template
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * List all templates
 */
const listTemplates = async (req, res) => {
    try {
        const filters = req.query;
        const templates = await templateService.listTemplates(filters);

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get template by slug
 */
const getTemplateBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const template = await templateService.getTemplateBySlug(slug);

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
};

export {
    generateTemplate,
    listTemplates,
    getTemplateBySlug
};
