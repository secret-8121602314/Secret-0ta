/**
 * Parses AI responses to extract OTAKON tags and clean content
 * Handles both simple tags [OTAKON_TAG: value] and complex tags with JSON arrays/objects
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  const tags = new Map<string, unknown>();
  let cleanContent = rawContent;

  console.log(`🏷️ [otakonTags] Parsing response (${rawContent.length} chars)...`);

  // First pass: Handle SUGGESTIONS tag with JSON array (special case - spans multiple brackets)
  // Matches: [OTAKON_SUGGESTIONS: ["item1", "item2", "item3"]]
  const suggestionsRegex = /\[OTAKON_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;
  let suggestionsMatch;
  while ((suggestionsMatch = suggestionsRegex.exec(rawContent)) !== null) {
    try {
      // Replace single quotes with double quotes for valid JSON
      const jsonStr = suggestionsMatch[1].replace(/'/g, '"');
      const suggestions = JSON.parse(jsonStr);
      tags.set('SUGGESTIONS', suggestions);
      cleanContent = cleanContent.replace(suggestionsMatch[0], '');
      console.log(`🏷️ [otakonTags] Extracted SUGGESTIONS:`, suggestions);
    } catch (_e) {
      console.warn('[OtakonTags] Failed to parse SUGGESTIONS JSON:', suggestionsMatch[1]);
    }
  }

  // Second pass: Handle SUBTAB_UPDATE with nested JSON object
  // Matches: [OTAKON_SUBTAB_UPDATE: {"tab": "name", "content": "text"}]
  const subtabUpdateRegex = /\[OTAKON_SUBTAB_UPDATE:\s*(\{[\s\S]*?\})\s*\]/g;
  let subtabMatch;
  const subtabUpdates: unknown[] = [];
  while ((subtabMatch = subtabUpdateRegex.exec(rawContent)) !== null) {
    try {
      const update = JSON.parse(subtabMatch[1]);
      subtabUpdates.push(update);
      cleanContent = cleanContent.replace(subtabMatch[0], '');
    } catch (_e) {
      console.warn('[OtakonTags] Failed to parse SUBTAB_UPDATE JSON:', subtabMatch[1]);
    }
  }
  if (subtabUpdates.length > 0) {
    tags.set('SUBTAB_UPDATE', subtabUpdates);
  }

  // Third pass: Handle remaining simple tags (non-JSON values)
  // Uses negative lookahead to avoid matching inside JSON already processed
  const simpleTagRegex = /\[OTAKON_([A-Z_]+):\s*([^\[\]]+?)\]/g;
  let match;

  // ✅ ROBUST PROGRESS DETECTION - Look for multiple formats
  // Check for progress in various formats that AI might output
  let progressValue: number | null = null;
  
  // Format 1: [OTAKON_PROGRESS: XX]
  const progressMatch1 = rawContent.match(/\[OTAKON_PROGRESS[:\s]+(\d+)/i);
  if (progressMatch1) {
    progressValue = parseInt(progressMatch1[1], 10);
    console.log(`📊 [otakonTags] Found OTAKON_PROGRESS format: ${progressMatch1[0]} → ${progressValue}%`);
  }
  
  // Format 2: [PROGRESS: XX] or PROGRESS: XX
  if (!progressValue) {
    const progressMatch2 = rawContent.match(/\[?PROGRESS[:\s]+(\d+)/i);
    if (progressMatch2) {
      progressValue = parseInt(progressMatch2[1], 10);
      console.log(`📊 [otakonTags] Found PROGRESS format: ${progressMatch2[0]} → ${progressValue}%`);
    }
  }
  
  // Format 3: Progress: XX% or progress is XX%
  if (!progressValue) {
    const progressMatch3 = rawContent.match(/(?:progress|completion|game progress)[:\s]+(?:approximately\s+)?(\d+)\s*%/i);
    if (progressMatch3) {
      progressValue = parseInt(progressMatch3[1], 10);
      console.log(`📊 [otakonTags] Found inline progress format: ${progressMatch3[0]} → ${progressValue}%`);
    }
  }
  
  // Format 4: Look for structured progress in stateUpdateTags
  if (!progressValue) {
    const stateTagMatch = rawContent.match(/"stateUpdateTags"[^}]*"PROGRESS[:\s]+(\d+)/i);
    if (stateTagMatch) {
      progressValue = parseInt(stateTagMatch[1], 10);
      console.log(`📊 [otakonTags] Found stateUpdateTags PROGRESS: ${stateTagMatch[0]} → ${progressValue}%`);
    }
  }
  
  // If we found a valid progress value, add it to tags
  if (progressValue !== null && progressValue >= 0 && progressValue <= 100) {
    tags.set('PROGRESS', progressValue);
    console.log(`📊 [otakonTags] ✅ Set PROGRESS tag to: ${progressValue}%`);
  } else {
    console.log(`📊 [otakonTags] ⚠️ No valid progress found in response`);
  }

  while ((match = simpleTagRegex.exec(rawContent)) !== null) {
    const tagName = match[1];
    let tagValue: unknown = match[2].trim();
    
    console.log(`🏷️ [otakonTags] Found tag: ${tagName} = ${match[2].substring(0, 50)}`);

    // Skip if already processed
    if (tagName === 'SUGGESTIONS' || tagName === 'SUBTAB_UPDATE') {
      continue;
    }

    // Parse JSON for complex tags that weren't caught above
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
      const strVal = String(tagValue).trim();
      // Handle various formats: "50", "50%", "40-60" (take first), "~45", etc.
      const numMatch = strVal.match(/(\d+)/);
      if (numMatch) {
        const numValue = parseInt(numMatch[1], 10);
        tagValue = Math.min(100, Math.max(0, numValue)); // Clamp 0-100
        console.log(`📊 [otakonTags] Parsed PROGRESS: "${strVal}" → ${tagValue}`);
      } else {
        console.warn(`📊 [otakonTags] Could not parse PROGRESS value: "${strVal}"`);
      }
    }

    tags.set(tagName, tagValue);
    cleanContent = cleanContent.replace(match[0], '');
  }

  // Additional cleanup: Remove any orphaned OTAKON tag fragments that might have leaked
  // This catches malformed tags or partial matches
  cleanContent = cleanContent
    // Remove any remaining OTAKON tag patterns (catches edge cases)
    .replace(/\[OTAKON_[A-Z_]+:[^\]]*\]/g, '')
    // Remove leaked JSON arrays that look like suggestions (question arrays at start of content)
    .replace(/^["'][^"']*\?["']\s*,?\s*/gm, '')
    // Remove fragments like: "and [4] in this region?", "What is..." at the start
    .replace(/^["'](?:and\s+)?\[\d+\][^"']*\?["']\s*,?\s*/gim, '')
    // Remove any line that starts with a quoted question fragment followed by ]
    .replace(/^["'][^"']*\?["']\s*\]\s*/gm, '')
    // Remove patterns like: "question?"] at the very start (orphaned array end)
    .replace(/^[^"']*\?["']\s*\]\s*/gm, '')
    // Remove any remaining suggestion array fragments at the very beginning
    .replace(/^(?:["'][^"']*["']\s*,?\s*)+\]/g, '');

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
    // ✅ FIX: Ensure numbered lists have proper line breaks
    // Fix patterns like "...text. 2." or "...text.2." where number follows period without break
    .replace(/\.\s*(\d+\.\*\*)/g, '.\n\n$1') // Period followed by numbered bold item
    .replace(/\.\s*(\d+\.\s+)/g, '.\n\n$1') // Period followed by numbered item
    // ✅ FIX: Ensure bold formatting is complete (no dangling **)
    .replace(/\*\*([^*\n]+)(?!\*\*)/g, (match, content) => {
      // If this bold section doesn't have a closing **, and ends with :, add closing
      if (content.endsWith(':')) return `**${content}**`;
      return match; // Otherwise leave as is
    })
    // ✅ CRITICAL: Add line breaks BEFORE section headers that follow text directly
    // This fixes: "...some text.Hint:" -> "...some text.\n\n**Hint:**"
    .replace(/([.!?])(\s*)Hint:/gi, '$1\n\n**Hint:**')
    .replace(/([.!?])(\s*)Lore:/gi, '$1\n\n**Lore:**')
    .replace(/([.!?])(\s*)Places of Interest:/gi, '$1\n\n**Places of Interest:**')
    .replace(/([.!?])(\s*)Strategy:/gi, '$1\n\n**Strategy:**')
    .replace(/([.!?])(\s*)What to focus on:/gi, '$1\n\n**What to focus on:**')
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

  // Log extracted tags summary
  if (tags.size > 0) {
    console.log(`🏷️ [otakonTags] Extracted ${tags.size} tags:`, Array.from(tags.keys()).join(', '));
  }

  return { cleanContent, tags };
};