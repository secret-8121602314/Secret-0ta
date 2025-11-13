/**
 * Parses AI responses to extract OTAKON tags and clean content
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, any> } => {
  const tags = new Map<string, any>();
  const tagRegex = /\[OTAKON_([A-Z_]+):\s*(.*?)\]/g;

  let cleanContent = rawContent;
  let match;

  while ((match = tagRegex.exec(rawContent)) !== null) {
    const tagName = match[1];
    let tagValue: any = match[2].trim();

    console.log(`🔍 [OtakonTags] Found tag: ${tagName}, raw value: "${tagValue}"`);

    // Parse JSON for complex tags
    try {
      if (tagValue.startsWith('{') && tagValue.endsWith('}')) {
        tagValue = JSON.parse(tagValue);
        console.log(`🔍 [OtakonTags] Parsed as JSON object:`, tagValue);
      }
      if (tagValue.startsWith('[') && tagValue.endsWith(']')) {
        tagValue = JSON.parse(tagValue.replace(/'/g, '"'));
        console.log(`🔍 [OtakonTags] Parsed as JSON array:`, tagValue);
      }
    } catch (_e) {
      console.log(`🔍 [OtakonTags] JSON parsing failed, keeping as string:`, tagValue);
      // Keep as string if not valid JSON
    }

    tags.set(tagName, tagValue);
    cleanContent = cleanContent.replace(match[0], '');
  }

  // Clean up extra whitespace and empty lines
  cleanContent = cleanContent
    .replace(/^Hint:\s*\n\s*Hint:\s*/gm, 'Hint: ') // Fix duplicate Hint headers
    .replace(/^Hint:\s*\n\s*Hint:\s*/gm, 'Hint: ') // Fix multiple duplicate Hint headers
    .replace(/\s*\]\s*$/, '') // Remove trailing ] characters with surrounding whitespace
    .replace(/\s*\[\s*$/, '') // Remove trailing [ characters with surrounding whitespace
    .replace(/^\s*\]\s*/, '') // Remove leading ] characters with surrounding whitespace
    .replace(/^\s*\[\s*/, '') // Remove leading [ characters with surrounding whitespace
    // ✅ Fix malformed bold markers (spaces between ** and text)
    .replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**') // Fix ** text ** → **text**
    .replace(/\*\*\s+([^*]+?):/g, '**$1:**') // Fix ** Header: → **Header:**
    // ✅ Format section headers with proper spacing and bold (ONLY for image responses)
    // Apply bold formatting directly to headers at line boundaries
    .replace(/^Hint:/i, '**Hint:**') // First Hint at very start
    .replace(/\nHint:/gi, '\n\n**Hint:**') // Subsequent Hints after newline
    .replace(/\nLore:/gi, '\n\n**Lore:**') // Lore after newline
    .replace(/\nPlaces of Interest:/gi, '\n\n**Places of Interest:**') // Places after newline
    .replace(/\nStrategy:/gi, '\n\n**Strategy:**') // Strategy after newline  
    .replace(/\nWhat to focus on:/gi, '\n\n**What to focus on:**') // What to focus after newline
    // Clean up spacing
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks (3+ newlines → 2)
    .replace(/^\s+|\s+$/g, '') // Trim start and end
    .trim();

  return { cleanContent, tags };
};

