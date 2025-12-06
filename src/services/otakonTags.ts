/**
 * Parses AI responses to extract OTAKON tags and clean content
 * Handles both simple tags [OTAKON_TAG: value] and complex tags with JSON arrays/objects
 * 
 * SIMPLIFIED FORMATTING CLEANUP - Consolidated from 12+ regex phases into streamlined logic
 * ORDER: 1) Extract tags from raw 2) Clean content after extraction
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  const tags = new Map<string, unknown>();
  let cleanContent = rawContent;
  
  console.log(`🏷️ [otakonTags] Parsing response (${rawContent.length} chars)...`);

  // ============================================
  // STEP 1: EXTRACT TAGS FROM RAW CONTENT FIRST
  // ============================================

  // 1a. Handle SUGGESTIONS tag with JSON array (special case - spans multiple brackets)
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

  // 1b. Handle SUBTAB_UPDATE with nested JSON object
  // Match and remove ALL occurrences even if parsing fails
  const subtabUpdateRegex = /\[OTAKON_SUBTAB_UPDATE:\s*\{[^\]]*\}\s*\]/g;
  let subtabMatch;
  const subtabUpdates: unknown[] = [];
  while ((subtabMatch = subtabUpdateRegex.exec(rawContent)) !== null) {
    try {
      const jsonMatch = subtabMatch[0].match(/\{[^\]]*\}/);
      if (jsonMatch) {
        const update = JSON.parse(jsonMatch[0]);
        subtabUpdates.push(update);
      }
    } catch (_e) {
      console.warn('[OtakonTags] Failed to parse SUBTAB_UPDATE JSON:', subtabMatch[0]);
    }
    // Always remove the tag from content, even if parsing failed
    cleanContent = cleanContent.replace(subtabMatch[0], '');
  }
  if (subtabUpdates.length > 0) {
    tags.set('SUBTAB_UPDATE', subtabUpdates);
  }

  // 1c. ROBUST PROGRESS DETECTION - Look for multiple formats
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

  // 1d. Handle remaining simple tags (non-JSON values)
  const simpleTagRegex = /\[OTAKON_([A-Z_]+):\s*([^[\]]+?)\]/g;
  let match;
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

  // ============================================
  // STEP 2: MINIMAL CLEANUP - Remove AI intro and trim
  // ============================================
  
  // Remove AI self-introduction only (keep all other content as-is)
  cleanContent = cleanContent
    // Remove "I'm Otagon, your dedicated gaming lore expert..." intro
    .replace(/^I['']?m\s+Otagon,\s+your\s+dedicated\s+gaming\s+lore\s+expert[^\n]*\n*/i, '')
    .trim();

  // Log extracted tags summary
  if (tags.size > 0) {
    console.log(`🏷️ [otakonTags] Extracted ${tags.size} tags:`, Array.from(tags.keys()).join(', '));
  }

  return { cleanContent, tags };
};