import { Book, Page, Conversation } from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling Threaded Books, Chapters, and Pages
 */
class BookService {
    /**
     * Create a new Book or Paper
     * @param {string} userId 
     * @param {string} title 
     * @param {string} description 
     * @param {string} [type] - 'book' or 'paper'
     * @param {string} [threadId] - Optional thread to link
     * @returns {Promise<object>}
     */
    async createBook(userId, title, description, type = 'book', threadId = null) {
        const bookData = {
            userId,
            title: title || 'Untitled',
            description: description || '',
            type: type || 'book',
            threadId,
            chapters: [],
            status: 'draft'
        };

        // For 'paper', initialize with one nameless chapter
        if (bookData.type === 'paper') {
            bookData.chapters.push({
                id: uuidv4(),
                title: null,
                pageIds: []
            });
        }

        const book = await Book.create(bookData);

        if (threadId) {
            await Conversation.findByIdAndUpdate(threadId, { bookId: book.id });
        }

        return book;
    }

    /**
     * Add a named chapter to a book
     * @param {string} bookId 
     * @param {string} title 
     */
    async addChapter(bookId, title) {
        const book = await this.getBook(bookId);
        
        const newChapter = {
            id: uuidv4(),
            title: title || 'New Chapter',
            pageIds: []
        };

        const updatedChapters = [...(book.chapters || []), newChapter];
        return await Book.findByIdAndUpdate(bookId, { chapters: updatedChapters }, { new: true });
    }

    /**
     * Get a book by ID
     * @param {string} bookId 
     * @returns {Promise<object>}
     */
    async getBook(bookId) {
        const book = await Book.findById(bookId);
        if (!book) throw new Error('Book not found');
        return book;
    }

    /**
     * Get all books for a specific user
     */
    async getUserBooks(userId) {
        return await Book.getByUserId(userId);
    }

    /**
     * Update book metadata
     */
    async updateBook(bookId, updates) {
        const allowedUpdates = ['title', 'description', 'status', 'coverImage', 'metadata', 'type'];
        const filteredUpdates = {};
        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
        });
        return await Book.findByIdAndUpdate(bookId, filteredUpdates, { new: true });
    }

    /**
     * Create a new Page within a specific Chapter
     * @param {string} bookId 
     * @param {string} chapterId 
     * @param {string} content 
     * @param {string} [messageId]
     * @param {Array} [images]
     * @returns {Promise<object>}
     */
    async createPage(bookId, chapterId, content, messageId = null, images = []) {
        const book = await this.getBook(bookId);
        
        // Find the chapter
        const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
        if (chapterIndex === -1 && book.type !== 'paper') {
             throw new Error('Chapter not found in book');
        }

        // If paper and no chapterId provided, use the first one
        const targetChapterId = (book.type === 'paper' && !chapterId) ? book.chapters[0].id : chapterId;
        const targetChapterIndex = book.chapters.findIndex(c => c.id === targetChapterId);

        const pageData = {
            bookId,
            chapterId: targetChapterId,
            content,
            images,
            lastDraftedFromMessageId: messageId,
            status: 'draft'
        };

        const page = await Page.create(pageData);

        // Update book chapters array
        const updatedChapters = [...book.chapters];
        updatedChapters[targetChapterIndex].pageIds.push(page.id);
        
        await Book.findByIdAndUpdate(bookId, { chapters: updatedChapters });

        return page;
    }

    /**
     * Get the full hierarchy of a book (Chapters -> Pages)
     * @param {string} bookId 
     */
    async getFullBookContents(bookId) {
        const book = await this.getBook(bookId);
        const pages = await Page.find({ bookId });
        const pageMap = new Map(pages.map(p => [p.id, p]));

        return {
            ...book,
            chapters: book.chapters.map(chapter => ({
                ...chapter,
                pages: chapter.pageIds.map(id => pageMap.get(id)).filter(p => !!p)
            }))
        };
    }

    /**
     * Update a specific page
     */
    async updatePage(pageId, updates) {
        const allowedUpdates = ['content', 'status', 'images'];
        const filteredUpdates = {};
        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
        });
        return await Page.findByIdAndUpdate(pageId, filteredUpdates, { new: true });
    }

    /**
     * Delete a page and clean up references
     */
    async deletePage(pageId) {
        const page = await Page.findById(pageId);
        if (!page) return;

        await Page.findByIdAndDelete(pageId);

        const book = await Book.findById(page.bookId);
        if (book && book.chapters) {
            const updatedChapters = book.chapters.map(c => {
                if (c.id === page.chapterId) {
                    return { ...c, pageIds: c.pageIds.filter(id => id !== pageId) };
                }
                return c;
            });
            await Book.findByIdAndUpdate(page.bookId, { chapters: updatedChapters });
        }
    }

    /**
     * Delete a book and its pages
     */
    async deleteBook(bookId) {
        const pages = await Page.find({ bookId });
        await Promise.all(pages.map(p => Page.findByIdAndDelete(p.id)));
        return await Book.findByIdAndDelete(bookId);
    }
}

export default new BookService();
