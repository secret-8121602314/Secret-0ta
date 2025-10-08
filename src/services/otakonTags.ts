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
    } catch (e) {
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
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
    .replace(/^\s+|\s+$/g, '') // Trim start and end
    .replace(/\s+$/gm, '') // Trim end of each line
    .replace(/^$\n/gm, '') // Remove empty lines
    .replace(/\n\s*\n/g, '\n\n') // Ensure proper paragraph spacing
    .replace(/\n/g, '\n\n') // Add line breaks for better readability
    .replace(/\n\n\n+/g, '\n\n') // Remove excessive line breaks
    .replace(/\]\s*$/, '') // Remove trailing ] characters
    .replace(/\[\s*$/, '') // Remove trailing [ characters
    .trim();

  return { cleanContent, tags };
};
