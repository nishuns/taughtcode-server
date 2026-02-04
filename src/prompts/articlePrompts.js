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
You are an expert technical writer. Write a full, detailed article in Markdown based on the following structure.

Title: ${structure.title}
Description: ${structure.description}

Structure:
${JSON.stringify(structure.sections, null, 2)}

Image URLs (Map of Heading -> URL):
${JSON.stringify(imageUrls, null, 2)}

Instructions:
1. Write engaging, informative, and high-quality content for each section.
2. Use the provided "contentBrief" as a guide but expand on it significantly.
3. Insert the corresponding image URL from the provided map at the beginning or middle of each section where an image was planned. Use standard Markdown image syntax: ![Alt Text](URL).
4. Use proper Markdown formatting (headers, lists, bold, italics) to make the article readable.
5. Do NOT output the JSON structure again, just the final Markdown content.
`;
