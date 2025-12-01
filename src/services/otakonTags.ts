/**
 * Parses AI responses to extract OTAKON tags and clean content
 * Handles both simple tags [OTAKON_TAG: value] and complex tags with JSON arrays/objects
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  const tags = new Map<string, unknown>();
  let cleanContent = rawContent;

  console.log(`🏷️ [otakonTags] Parsing response (${rawContent.length} chars)...`);
  
  // DEBUG: Log if content contains any header patterns
  const headerPatterns = ['Hint', 'Lore', 'Places of Interest'];
  headerPatterns.forEach(h => {
    if (rawContent.includes(h)) {
      const snippet = rawContent.substring(
        Math.max(0, rawContent.indexOf(h) - 10),
        rawContent.indexOf(h) + h.length + 20
      );
      console.log(`🔍 [otakonTags] Found "${h}" pattern: "${snippet}"`);
    }
  });

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

  // ============================================
  // PHASE 1: Normalize section headers FIRST (before fixing inline bold)
  // This must happen before inline bold fixing to prevent headers being corrupted
  // ============================================
  const headers = ['Hint', 'Lore', 'Places of Interest', 'Strategy', 'What to focus on'];
  
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+'); // "Places of Interest" → "Places\s+of\s+Interest"
    
    // Pattern 0: ** Header:** (space after **, colon directly before closing **)
    // This is the EXACT pattern from AI: "** Lore:**"
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s+${h}:\\*\\*\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    
    // Pattern 1: ** Header:** : (with closing ** and extra colon)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s*${h}\\s*:\\s*\\*\\*\\s*:?\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    
    // Pattern 2: ** Header: (space after **, with colon, no closing **)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s+${h}\\s*:\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    
    // Pattern 3: **Header: (no space, with colon, no closing **)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*${h}:\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    
    // Pattern 4: **Header** (with closing **, no colon)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*${h}\\*\\*\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    
    // Pattern 5: ** Header (space after **, no colon, no closing)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s+${h}(?![:\\w*])`, 'gi'),
      `\n\n${header}:\n`
    );
  }
  
  // Fix double/triple colons
  cleanContent = cleanContent.replace(/:{2,}/g, ':');

  // ============================================
  // PHASE 2: Fix inline bold text (AFTER headers are normalized)
  // ============================================
  cleanContent = cleanContent
    // Fix ** with space after opening: ** Text** → **Text**
    .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**')
    // Fix ** with space before closing: **Text ** → **Text**
    .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1**');

  // ============================================
  // PHASE 3: Add bold formatting to section headers
  // Now all headers are normalized as plain "Header:" with newlines
  // ============================================
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+');
    
    // Match Header: after punctuation or word character (with optional newlines between)
    cleanContent = cleanContent.replace(
      new RegExp(`([.!?\\w])([\\s\\n]*)${h}:\\s*`, 'gi'),
      `$1$2\n\n**${header}:**\n\n`
    );
    
    // Match Header: at very start of content
    cleanContent = cleanContent.replace(
      new RegExp(`^\\s*${h}:\\s*`, 'i'),
      `**${header}:**\n\n`
    );
    
    // Match Header: after newlines (not already bold)
    cleanContent = cleanContent.replace(
      new RegExp(`\\n\\s*${h}:\\s*`, 'gi'),
      `\n\n**${header}:**\n\n`
    );
  }
  
  // DEBUG: Log after Phase 3
  console.log(`🔍 [otakonTags] After Phase 3 - Hint bold: ${cleanContent.includes('**Hint:**')}, Lore bold: ${cleanContent.includes('**Lore:**')}, Places bold: ${cleanContent.includes('**Places of Interest:**')}`);

  // ============================================
  // PHASE 4: Fix remaining formatting issues
  // ============================================
  cleanContent = cleanContent
    // Remove standalone ** on its own line (but not valid headers like **Hint:**)
    .replace(/^\s*\*\*\s*$/gm, '')
    // Remove orphaned ** NOT part of a header (only if not preceded by : or text)
    // This catches dangling ** at start of line followed by newline
    .replace(/^\*\*\s*\n/gm, '\n')
    // Remove dangling ** at end of content (not after :)
    .replace(/([^:])\*\*\s*$/gm, '$1')
    // Fix duplicate Hint headers
    .replace(/^Hint:\s*\n\s*Hint:\s*/gm, '**Hint:**\n\n')
    // Remove ALL stray brackets
    .replace(/\]\s*$/gm, '')
    .replace(/^\s*\]/gm, '')
    .replace(/\[\s*$/gm, '')
    .replace(/^\s*\[/gm, '')
    .replace(/\s+\]\s+/g, ' ')
    .replace(/\s+\[\s+/g, ' ')
    // Ensure numbered lists have proper line breaks
    .replace(/\.\s*(\d+\.\s*\*\*)/g, '.\n\n$1')
    .replace(/\.\s*(\d+\.\s+[A-Z])/g, '.\n\n$1')
    // Add space after numbered list items (1.Text → 1. Text)
    .replace(/^(\d+)\.([A-Z])/gm, '$1. $2')
    // Add space after colons when followed by capital letter (but not in URLs or after **)
    .replace(/([^htfps*]):([A-Z])/g, '$1: $2');

  // ============================================
  // PHASE 5: Fix word spacing issues
  // ============================================
  cleanContent = cleanContent
    // Add space after closing ** when followed directly by a letter
    .replace(/\*\*([^*]+)\*\*([A-Za-z])/g, '**$1** $2')
    // Add space before opening ** when preceded by a lowercase letter
    .replace(/([a-z])\*\*([A-Z])/g, '$1 **$2')
    // Fix common camelCase issues (but preserve gaming terms)
    .replace(/([a-z])([A-Z][a-z]{2,})/g, (match, lower, upper) => {
      const preserveTerms = ['PlayStation', 'GamePass', 'GameStop', 'YouTube', 'OpenWorld'];
      if (preserveTerms.some(term => (lower + upper).includes(term))) return match;
      return lower + ' ' + upper;
    })
    // Fix common preposition + capital (likeContagion → like Contagion)
    .replace(/\b(like|or|and|the|a|an|for|with|from|to|in|on|at|by|as)([A-Z])/g, '$1 $2');

  // ============================================
  // PHASE 6: Final cleanup
  // ============================================
  cleanContent = cleanContent
    // Remove any remaining empty ** pairs
    .replace(/\*\*\s*\*\*/g, '')
    // Remove excessive line breaks (3+ newlines → 2)
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .replace(/^\s+|\s+$/g, '')
    .trim();

  // Log extracted tags summary
  if (tags.size > 0) {
    console.log(`🏷️ [otakonTags] Extracted ${tags.size} tags:`, Array.from(tags.keys()).join(', '));
  }

  return { cleanContent, tags };
};