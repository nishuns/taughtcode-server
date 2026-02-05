# Article Generation Prompts

This document explains the prompt engineering strategy used to generate high-quality, structured articles using AI.

## Overview

The article generation process is a two-step pipeline designed to ensure structural integrity and content quality.

1.  **Structure Generation**: The AI first plans the article skeleton (JSON).
2.  **Content Generation**: The AI then fills in the content based on the plan (Markdown).

## 1. Structure Generation Prompt

**Goal**: To create a valid JSON object defining the article's metadata and sections.

**Prompt Template**:
```javascript
`You are an expert article writer and editor. Your task is to plan a comprehensive... topic: "${topic}".

Please provide the output in strict JSON format...:
{
  "title": "...",
  "description": "...",
  "tags": [...],
  "sections": [
    {
      "heading": "...",
      "contentBrief": "...",
      "imagePrompt": "...",
      "layout": "two-column" // "standard", "two-column", "hero", "quote-block"
    }
  ]
}`
```

**Key Features**:
-   **Strict JSON**: Ensures the output can be parsed programmatically.
-   **Layout Control**: The `layout` field dictates how the section is rendered (e.g., side-by-side text and image).
-   **Image Prompts**: Ask the AI to visualize each section, which drives the image generation step.

## 2. Content Generation Prompt

**Goal**: To generate the final **Semantic HTML** content with embedded styling.

**Prompt Template**:
```javascript
`You are an expert web content creator. Write a full... based on the following structure.

Structure: ...
Image URLs: ...

Instructions:
1. Output HTML content inside <article>...
2. **Layout Handling**:
   - **two-column**: Use <div class="grid md:grid-cols-2 gap-8">...
   - **hero**: Use full-width containers...
3. Insert corresponding image URL...
4. Apply Tailwind-like classes...`
```

**Key Features**:
-   **Semantic HTML**: Outputs clean `<section>`, `<figure>`, `<h2>` tags.
-   **Responsive Layouts**: Directives to use CSS Grid/Flexbox classes for complex layouts like columns.
-   **Asset Integration**: Images are placed contextually based on the chosen layout.

## Workflow

1.  **User Input**: Topic received via API.
2.  **Step 1 (AI)**: Generate JSON Structure.
3.  **Step 1.5 (AI & Storage)**: Iterate through sections. If `imagePrompt` exists, generate image with AI, upload to Storage, and get URL.
4.  **Step 2 (AI)**: Generate Markdown content using the Structure + Image URLs.
5.  **Save**: Store the final Article object in the database.
