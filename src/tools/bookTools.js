/**
 * Tool Schema for drafting a new book page
 */
export const draftBookPageToolSchema = {
    name: "draft_book_page",
    description: "Drafts a new page or chapter for the attached book based on the current conversational context. Use this when the user wants to solidify part of the conversation into their book.",
    parameters: {
        type: "OBJECT",
        properties: {
            title: { 
                type: "STRING", 
                description: "A fitting, descriptive title for the page or chapter." 
            },
            brief: { 
                type: "STRING", 
                description: "A short brief or topic describing what this page should cover based on the conversation. The background worker will use this to generate the full content." 
            }
        },
        required: ["title", "brief"]
    }
};

/**
 * Tool Schema for updating an existing book page
 */
export const updateBookPageToolSchema = {
    name: "update_book_page",
    description: "Updates the content or title of an existing page in the book. Use this when the user asks to refine, expand, or correct a previously drafted page.",
    parameters: {
        type: "OBJECT",
        properties: {
            pageId: {
                type: "STRING",
                description: "The ID of the page to update."
            },
            title: { 
                type: "STRING", 
                description: "The new title for the page (optional)." 
            },
            content: { 
                type: "STRING", 
                description: "The updated markdown content for the page (optional)." 
            }
        },
        required: ["pageId"]
    }
};

/**
 * Tool Schema for deleting a book page
 */
export const deleteBookPageToolSchema = {
    name: "delete_book_page",
    description: "Deletes a specific page from the book. Use this only when the user explicitly asks to remove a page.",
    parameters: {
        type: "OBJECT",
        properties: {
            pageId: {
                type: "STRING",
                description: "The ID of the page to delete."
            }
        },
        required: ["pageId"]
    }
};
