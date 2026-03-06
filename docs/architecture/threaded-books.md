# Threaded Books Architecture

## Concept Overview
The "Threaded Books" concept shifts the paradigm of content creation from single-shot AI generation (like traditional articles) to collaborative, iterative co-authoring. A "book" (which could range from a 5-page paper to a 1000-page comprehensive guide) is attached to a conversational thread. As the user engages in deep dialogue with the AI—debating, exploring, and refining ideas—they can instruct the AI to draft a specific "page" or "chapter" based on the ongoing conversation.

This approach ensures the user's unique perspective, reasoning, and voice are deeply embedded in the final output, resulting in content with a much deeper level of information and nuance than standard AI articles. In traditional article generation, the AI thinks autonomously based on a single prompt. In Threaded Books, the user and AI stand on equal footing, exchanging ideas over time.

## Core Entities & Relationships

### 1. Book (or Publication)
Represents the overarching collection of drafted content.
- **Attributes**: `id`, `userId`, `threadId` (reference to the primary conversational thread), `title`, `description`, `coverImage`, `status` (draft, published), `metadata` (tags, category).

### 2. Page (or Chapter/Section)
Represents a discrete unit of content within a Book.
- **Attributes**: `id`, `bookId`, `order` (for sequencing), `title`, `content` (Markdown/HTML), `images` (array of URLs), `status`, `lastDraftedFromMessageId` (to track context and origin).

### 3. Thread (Existing Conversation Model)
The conversational context where ideation occurs.
- **Modifications**: Add an optional `bookId` to link a conversation directly to a specific book project.

## Workflow

### 1. Initialization
- The user creates a new "Book" entity from the frontend UI.
- A new Conversational Thread is initialized and linked to the Book (`thread.bookId = book.id`), or an existing thread is explicitly attached.

### 2. Collaborative Ideation
- The user and AI converse within the thread, exploring topics, theories, and concepts.
- Standard tools (like `generate_image`) remain available to brainstorm and create visuals directly within the chat interface.

### 3. Drafting a Page (Tool Call Integration)
- **Trigger**: The user explicitly asks the AI in the chat to solidify the current discussion (e.g., "Draft a page about what we just discussed regarding the origin of linguistics").
- **Action**: The AI triggers a specialized tool: `draft_book_page`.
- **Tool Payload**: The AI synthesizes the recent conversational context, generates comprehensive Markdown content (incorporating any previously generated images or relevant concepts), and suggests a title.
- **Execution**:
  - The backend receives the tool call and creates a new `Page` record linked to the `bookId` of the current thread.
  - The content is saved to the database.
  - The AI responds in the thread confirming the page has been drafted and added to the book, optionally providing a short preview or a link for the user to view/edit the page in the Book editor.

### 4. Review and Assembly
- Outside the primary chat interface (or in a split-pane view), the user can view the Book as an aggregation of its Pages.
- The user can reorder pages, edit them manually, or continue conversing in the thread to refine specific sections or add entirely new chapters.

## AI Tool Integration: `draft_book_page`

**Proposed Schema**:
```javascript
export const draftBookPageToolSchema = {
    name: "draft_book_page",
    description: "Drafts a new page or chapter for the attached book based on the current conversational context. Use this ONLY when the user explicitly requests to draft, write, or add a page/chapter to their book.",
    parameters: {
        type: "OBJECT",
        properties: {
            title: { 
                type: "STRING", 
                description: "A fitting, descriptive title for the page or chapter." 
            },
            content: { 
                type: "STRING", 
                description: "The highly detailed, comprehensive markdown content synthesized from the conversation. Must be thorough and capture the depth of the user's insights. Include markdown image links if relevant visuals were generated during the chat." 
            }
        },
        required: ["title", "content"]
    }
};
```

## Future Extensions & Considerations
- **Page Refinement Tool**: An additional tool (`rewrite_book_page`) to update or rewrite an *existing* page based on new feedback or continued conversation.
- **Context Management**: As books grow large, the thread might require an injected summary of the existing book outline (e.g., "Current Book Outline: Chapter 1..., Chapter 2...") so the AI maintains structural awareness without overwhelming the context window limit.
- **Exporting**: Functionality to generate PDF or EPUB formats from the assembled pages once the book is marked as 'published'.
