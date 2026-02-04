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
      "imagePrompt": "..." // Used for image generation step
    }
  ]
}`
```

**Key Features**:
-   **Strict JSON**: Ensures the output can be parsed programmatically.
-   **Image Prompts**: Ask the AI to visualize each section, which drives the image generation step.
-   **Content Briefs**: Provides a roadmap for the second step, ensuring the AI stays on topic.

## 2. Content Generation Prompt

**Goal**: To generate the final Markdown content, integrating the previously generated structure and images.

**Prompt Template**:
```javascript
`You are an expert technical writer. Write a full... based on the following structure.

Structure:
${JSON.stringify(structure)}

Image URLs (Map of Heading -> URL):
${JSON.stringify(imageUrls)}

Instructions:
1. Write engaging... content...
2. Use the "contentBrief"...
3. Insert the corresponding image URL... using ![Alt](URL)...
4. Use proper Markdown...`
```

**Key Features**:
-   **Context Injection**: We feed the *plan* back to the AI so it knows exactly what to write.
-   **Asset Integration**: We provide the URLs of the images (generated in between steps 1 and 2) mapped to headings, instructing the AI to place them contextually.
-   **Markdown Output**: Ensures the final result is ready for rendering on the frontend.

## Workflow

1.  **User Input**: Topic received via API.
2.  **Step 1 (AI)**: Generate JSON Structure.
3.  **Step 1.5 (AI & Storage)**: Iterate through sections. If `imagePrompt` exists, generate image with AI, upload to Storage, and get URL.
4.  **Step 2 (AI)**: Generate Markdown content using the Structure + Image URLs.
5.  **Save**: Store the final Article object in the database.
