/**
 * Parses AI responses to extract OTAKON tags and clean content
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  const tags = new Map<string, unknown>();
  const tagRegex = /\[OTAKON_([A-Z_]+):\s*(.*?)\]/g;

  let cleanContent = rawContent;
  let match;

  while ((match = tagRegex.exec(rawContent)) !== null) {
    const tagName = match[1];
    let tagValue: unknown = match[2].trim();

    // Parse JSON for complex tags
    try {
      const strValue = tagValue as string;
      if (strValue.startsWith('{') && strValue.endsWith('}')) {
        tagValue = JSON.parse(strValue);
      }
      if (strValue.startsWith('[') && strValue.endsWith(']')) {
        tagValue = JSON.parse(strValue.replace(/'/g, '"'));
      }
    } catch (_e) {
      // Keep as string if not valid JSON
    }
    
    // Handle PROGRESS tag - ensure it's a number
    if (tagName === 'PROGRESS') {
      const numValue = parseInt(tagValue as string, 10);
      if (!isNaN(numValue)) {
        tagValue = Math.min(100, Math.max(0, numValue)); // Clamp 0-100
      }
    }
    
    // Handle SUBTAB_UPDATE - collect multiple updates into an array
    if (tagName === 'SUBTAB_UPDATE') {
      const existingUpdates = tags.get('SUBTAB_UPDATE') as Array<unknown> || [];
      existingUpdates.push(tagValue);
      tagValue = existingUpdates;
    }

    tags.set(tagName, tagValue);
    cleanContent = cleanContent.replace(match[0], '');
  }

  // Clean up extra whitespace and empty lines
  cleanContent = cleanContent
    .replace(/^Hint:\s*\n\s*Hint:\s*/gm, 'Hint: ') // Fix duplicate Hint headers
    .replace(/^Hint:\s*\n\s*Hint:\s*/gm, 'Hint: ') // Fix multiple duplicate Hint headers
    // Remove ALL stray brackets (global replacement)
    .replace(/\]\s*$/gm, '') // Remove trailing ] at end of any line
    .replace(/^\s*\]/gm, '') // Remove ] at start of any line
    .replace(/\[\s*$/gm, '') // Remove trailing [ at end of any line  
    .replace(/^\s*\[/gm, '') // Remove [ at start of any line
    // Remove isolated brackets with whitespace around them
    .replace(/\s+\]\s+/g, ' ') // Replace ] surrounded by spaces with single space
    .replace(/\s+\[\s+/g, ' ') // Replace [ surrounded by spaces with single space
    // ✅ Fix malformed bold markers (spaces between ** and text)
    .replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**') // Fix ** text ** → **text**
    .replace(/\*\*\s+([^*]+?):/g, '**$1:**') // Fix ** Header: → **Header:**
    // ✅ Format section headers with proper spacing and bold
    // First, ensure headers are properly closed with ** and add line breaks
    .replace(/\*\*Hint:\*\*\s*/gi, '**Hint:**\n') // Add line break after Hint (handles trailing space)
    .replace(/\*\*Lore:\*\*\s*/gi, '\n\n**Lore:**\n') // Add line breaks around Lore
    .replace(/\*\*Places of Interest:\*\*\s*/gi, '\n\n**Places of Interest:**\n') // Add line breaks around Places
    .replace(/\*\*Strategy:\*\*\s*/gi, '\n\n**Strategy:**\n') // Add line breaks around Strategy
    .replace(/\*\*What to focus on:\*\*\s*/gi, '\n\n**What to focus on:**\n') // Add line breaks around What to focus
    // Handle headers without existing bold (with or without trailing space)
    .replace(/^Hint:\s*/i, '**Hint:**\n') // First Hint at very start
    .replace(/\nHint:\s*/gi, '\n\n**Hint:**\n') // Subsequent Hints after newline
    .replace(/\nLore:\s*/gi, '\n\n**Lore:**\n') // Lore after newline
    .replace(/\nPlaces of Interest:\s*/gi, '\n\n**Places of Interest:**\n') // Places after newline
    .replace(/\nStrategy:\s*/gi, '\n\n**Strategy:**\n') // Strategy after newline  
    .replace(/\nWhat to focus on:\s*/gi, '\n\n**What to focus on:**\n') // What to focus after newline
    // Clean up spacing
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks (3+ newlines → 2)
    .replace(/^\s+|\s+$/g, '') // Trim start and end
    .trim();

  return { cleanContent, tags };
};

