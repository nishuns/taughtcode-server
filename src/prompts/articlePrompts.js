export const generateStructurePrompt = (topic) => `
You are an expert article writer and editor. Your task is to plan a comprehensive, engaging, and well-structured article on the topic: "${topic}".

Please provide the output in strict JSON format with the following structure:
{
  "title": "Catchy Article Title",
  "description": "A short, engaging summary (max 200 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "sections": [
    {
      "heading": "Introduction",
      "contentBrief": "Briefly introduce the topic...",
      "imagePrompt": "A high-quality, photorealistic image describing..." (optional, null if no image needed)
    },
    {
      "heading": "Section 1 Heading",
      "contentBrief": "Details about section 1...",
      "imagePrompt": "Description of an image illustrating this section..."
    }
    // ... more sections
  ]
}

Ensure the image prompts are descriptive and suitable for an AI image generator.
`;

export const generateContentPrompt = (structure, imageUrls) => `
You are an expert web content creator. Write a full, detailed article in clean, semantic **HTML** based on the following structure.

Title: ${structure.title}
Description: ${structure.description}

Structure:
${JSON.stringify(structure.sections, null, 2)}

Image URLs (Map of Heading -> URL):
${JSON.stringify(imageUrls, null, 2)}

Instructions:
1. Output ONLY the HTML content that would go inside an <article> tag. Do not include <html>, <head>, or <body> tags.
2. Use semantic HTML5 tags: <h2> for section headings, <p> for paragraphs, <section> to wrap logical parts, <ul>/<ol> for lists.
3. For images, use a modern structure:
   <figure class="my-6">
     <img src="URL" alt="Description" class="rounded-xl shadow-lg w-full object-cover max-h-[500px]">
     <figcaption class="text-center text-sm text-gray-500 mt-2 italic">Figure: Description</figcaption>
   </figure>
4. Insert the corresponding image URL from the provided map at the start of each relevant section.
5. Apply subtle inline styles or standard class names (assuming a Tailwind-like environment) to ensure the content looks professional:
   - Use <p class="mb-4 leading-relaxed text-gray-800"> for paragraphs.
   - Use <h2 class="text-2xl font-bold mt-8 mb-4 text-slate-900"> for headings.
6. Expand significantly on the "contentBrief" to provide high-value, informative text.
7. Do NOT output the JSON structure or any Markdown syntax.
`;

export const generateTemplatePrompt = (topic, category) => `
You are an expert content strategist. Create a reusable **Article Template** for the category "${category}" focusing on "${topic}".

The goal is to create a structure that can be used to generate multiple specific articles in this domain.

Please provide the output in strict JSON format matching this structure:
{
  "name": "Template Name (e.g., 'Ultimate Guide to ${topic}')",
  "description": "Description of what this template is for",
  "category": "${category}",
  "aiInstructions": "General instructions for the AI when using this template (e.g., 'Tone should be professional', 'Focus on practical examples')",
  "structure": [
    {
      "heading": "Section Heading (Generic)",
      "contentBrief": "Instructions on what this section should cover (e.g., 'Explain the core concept of...')",
      "imagePrompt": "Description of a generic image for this section (optional)"
    }
    // ... 4-6 sections recommended
  ]
}
`;
