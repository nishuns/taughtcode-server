import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Template Renderer Utility
 * Handles HTML template rendering
 */

const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Render template with data
 * @param {string} templateName - Template file name (without .html)
 * @param {Object} data - Data to inject into template
 * @returns {Promise<string>} Rendered HTML
 */
async function renderTemplate(templateName, data = {}) {
    try {
        const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
        let template = await fs.readFile(templatePath, 'utf-8');

        // Template variable replacement
        // Replace {{variable}} with data.variable
        // Handles both simple variables and HTML content
        template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (data[key] !== undefined) {
                // Return the value as-is (allows HTML content)
                return String(data[key]);
            }
            return match; // Keep original if not found
        });

        return template;
    } catch (error) {
        console.error(`Error rendering template ${templateName}:`, error);
        throw new Error(`Template ${templateName} not found`);
    }
}

/**
 * Render documentation page
 * @param {Object} options - Rendering options
 * @param {string} options.title - Page title
 * @param {string} options.content - HTML content
 * @param {string} options.currentPath - Current path for navigation
 * @param {Array} options.navigation - Navigation structure
 * @returns {Promise<string>} Rendered HTML
 */
async function renderDocPage({ title, content, currentPath = '', navigation = [] }) {
    // Build navigation HTML
    const navHTML = buildNavigationHTML(navigation, currentPath);

    return renderTemplate('docs', {
        title: `${title} - TaughtCode Documentation`,
        content,
        navigation: navHTML
    });
}

/**
 * Build navigation HTML from structure
 * @param {Array} navigation - Navigation structure
 * @param {string} currentPath - Current path
 * @returns {string} Navigation HTML
 */
function buildNavigationHTML(navigation, currentPath) {
    let html = '';

    for (const section of navigation) {
        html += `<div class="nav-section">`;
        html += `<div class="nav-section-title">${section.section}</div>`;

        for (const item of section.items) {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            html += `<div class="nav-item">`;
            html += `<a href="${item.path}" class="${isActive ? 'active' : ''}">${item.name}</a>`;
            html += `</div>`;
        }

        html += `</div>`;
    }

    return html;
}

export {
    renderTemplate,
    renderDocPage
};

