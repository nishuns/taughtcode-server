import { Book, Page, Conversation } from '../models/index.js';

/**
 * Service for handling Threaded Books and their Chapters/Pages
 */
class BookService {
    /**
     * Create a new Book
     * @param {string} userId 
     * @param {string} title 
     * @param {string} description 
     * @param {string} [threadId] - Optional thread to link this book to
     * @returns {Promise<object>}
     */
    async createBook(userId, title, description, threadId = null) {
        const bookData = {
            userId,
            title: title || 'Untitled Book',
            description: description || '',
            threadId,
            pageIds: [],
            status: 'draft'
        };

        const book = await Book.create(bookData);

        // If threadId is provided, link the conversation to this book
        if (threadId) {
            await Conversation.findByIdAndUpdate(threadId, { bookId: book.id });
        }

        return book;
    }

    /**
     * Get a book by ID
     * @param {string} bookId 
     * @returns {Promise<object>}
     */
    async getBook(bookId) {
        const book = await Book.findById(bookId);
        if (!book) {
            throw new Error('Book not found');
        }
        return book;
    }

    /**
     * Get all books for a specific user
     * @param {string} userId 
     * @returns {Promise<Array>}
     */
    async getUserBooks(userId) {
        return await Book.getByUserId(userId);
    }

    /**
     * Update book metadata
     * @param {string} bookId 
     * @param {object} updates 
     * @returns {Promise<object>}
     */
    async updateBook(bookId, updates) {
        const allowedUpdates = ['title', 'description', 'status', 'coverImage', 'metadata'];
        const filteredUpdates = {};

        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        });

        return await Book.findByIdAndUpdate(bookId, filteredUpdates, { new: true });
    }

    /**
     * Create a new Page within a Book
     * @param {string} bookId 
     * @param {string} title 
     * @param {string} content 
     * @param {string} [messageId] - Optional AI message ID context
     * @param {Array} [images] - Optional array of image URLs
     * @returns {Promise<object>}
     */
    async createPage(bookId, title, content, messageId = null, images = []) {
        // 1. Verify book exists
        const book = await this.getBook(bookId);

        // 2. Create the page
        const pageData = {
            bookId,
            title,
            content,
            images,
            lastDraftedFromMessageId: messageId,
            status: 'draft'
        };

        const page = await Page.create(pageData);

        // 3. Append to Book's pageIds array for ordering
        const updatedPageIds = [...(book.pageIds || []), page.id];
        await Book.findByIdAndUpdate(bookId, { pageIds: updatedPageIds });

        return page;
    }

    /**
     * Get all pages for a book in their explicit order
     * @param {string} bookId 
     * @returns {Promise<Array>}
     */
    async getBookPages(bookId) {
        const book = await this.getBook(bookId);
        const pages = await Page.getByBookId(bookId);

        // Sort pages based on the order in book.pageIds
        const pageMap = new Map(pages.map(p => [p.id, p]));
        return (book.pageIds || [])
            .map(id => pageMap.get(id))
            .filter(p => !!p); // Filter out any dangling references
    }

    /**
     * Update a specific page
     * @param {string} pageId 
     * @param {object} updates 
     * @returns {Promise<object>}
     */
    async updatePage(pageId, updates) {
        const allowedUpdates = ['title', 'content', 'status', 'images'];
        const filteredUpdates = {};

        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        });

        return await Page.findByIdAndUpdate(pageId, filteredUpdates, { new: true });
    }

    /**
     * Delete a page and remove its reference from the book
     * @param {string} pageId 
     */
    async deletePage(pageId) {
        const page = await Page.findById(pageId);
        if (!page) return;

        // 1. Delete the page document
        await Page.findByIdAndDelete(pageId);

        // 2. Remove from book.pageIds
        const book = await Book.findById(page.bookId);
        if (book && book.pageIds) {
            const updatedPageIds = book.pageIds.filter(id => id !== pageId);
            await Book.findByIdAndUpdate(page.bookId, { pageIds: updatedPageIds });
        }
    }

    /**
     * Delete a book and all its pages
     * @param {string} bookId 
     */
    async deleteBook(bookId) {
        const book = await this.getBook(bookId);
        
        // 1. Delete all pages
        const pages = await Page.getByBookId(bookId);
        const deletePromises = pages.map(p => Page.findByIdAndDelete(p.id));
        await Promise.all(deletePromises);

        // 2. Delete the book
        return await Book.findByIdAndDelete(bookId);
    }
}

export default new BookService();
