/**
 * Parses AI responses to extract OTAKON tags and clean content
 * Handles both simple tags [OTAKON_TAG: value] and complex tags with JSON arrays/objects
 * Also extracts structured data from "Internal Data Structure" JSON blocks
 * 
 * SIMPLIFIED FORMATTING CLEANUP - Consolidated from 12+ regex phases into streamlined logic
 * ORDER: 1) Extract tags from raw 2) Clean content after extraction
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  const tags = new Map<string, unknown>();
  let cleanContent = rawContent;
  
  console.log(`🏷️ [otakonTags] Parsing response (${rawContent.length} chars)...`);

  // ============================================
  // STEP 0: EXTRACT FROM "Internal Data Structure" JSON BLOCKS
  // This handles the new AI response format with embedded JSON
  // ============================================
  
  // Look for JSON block after "Internal Data Structure" header (with optional markdown formatting)
  const internalDataPatterns = [
    /\*\*Internal Data Structure\*\*:?\s*\n*\s*```json\s*([\s\S]*?)```/i, // **Internal Data Structure** with json
    /\*\*Internal Data Structure\*\*:?\s*\n*\s*```\s*([\s\S]*?)```/i, // **Internal Data Structure** without json tag
    /Internal Data Structure:?\s*\n*\s*```json\s*([\s\S]*?)```/i, // Plain text with json
    /Internal Data Structure:?\s*\n*\s*```\s*([\s\S]*?)```/i, // Plain text without json tag
    /Internal Data Structure:?\s*\n*(\{[\s\S]*?\})\s*```/i, // Match until closing ```
    /Internal Data Structure:?\s*\n*(\{[\s\S]*?"followUpPrompts"[\s\S]*?\})\s*$/i,
    /"Internal Data Structure":?\s*\n*(\{[\s\S]*?"followUpPrompts"[\s\S]*?\})/i,
  ];
  
  for (const pattern of internalDataPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);
        console.log(`🏷️ [otakonTags] Found Internal Data Structure JSON:`, Object.keys(parsed));
        
        // Extract followUpPrompts
        if (parsed.followUpPrompts && Array.isArray(parsed.followUpPrompts)) {
          tags.set('SUGGESTIONS', parsed.followUpPrompts);
          console.log(`🏷️ [otakonTags] ✅ Extracted followUpPrompts from JSON:`, parsed.followUpPrompts);
        }
        
        // Extract stateUpdateTags for progress
        if (parsed.stateUpdateTags && Array.isArray(parsed.stateUpdateTags)) {
          for (const tag of parsed.stateUpdateTags) {
            const progressMatch = String(tag).match(/PROGRESS[:\s]+(\d+)/i);
            if (progressMatch) {
              const progress = parseInt(progressMatch[1], 10);
              if (progress >= 0 && progress <= 100) {
                tags.set('PROGRESS', progress);
                console.log(`📊 [otakonTags] ✅ Extracted PROGRESS from stateUpdateTags: ${progress}%`);
              }
            }
            const objectiveMatch = String(tag).match(/OBJECTIVE[:\s]+(.+)/i);
            if (objectiveMatch) {
              tags.set('OBJECTIVE', objectiveMatch[1].trim());
              console.log(`🎯 [otakonTags] ✅ Extracted OBJECTIVE from stateUpdateTags`);
            }
          }
        }
        
        // Extract progressiveInsightUpdates for subtabs
        if (parsed.progressiveInsightUpdates && Array.isArray(parsed.progressiveInsightUpdates)) {
          tags.set('SUBTAB_UPDATE', parsed.progressiveInsightUpdates);
          console.log(`📑 [otakonTags] ✅ Extracted ${parsed.progressiveInsightUpdates.length} subtab updates from JSON`);
        }
        
        break; // Found and parsed successfully
      } catch (e) {
        console.warn('[otakonTags] Failed to parse Internal Data Structure JSON:', e);
      }
    }
  }
  
  // Also try to extract followUpPrompts directly from raw content (without "Internal Data Structure" header)
  if (!tags.has('SUGGESTIONS')) {
    const directJsonMatch = rawContent.match(/\{[\s\S]*?"followUpPrompts"\s*:\s*\[([\s\S]*?)\][\s\S]*?\}/);
    if (directJsonMatch) {
      try {
        // Try to extract the full JSON object
        const jsonStartIndex = rawContent.indexOf(directJsonMatch[0]);
        let braceCount = 0;
        let jsonEndIndex = jsonStartIndex;
        for (let i = jsonStartIndex; i < rawContent.length; i++) {
          if (rawContent[i] === '{') {
            braceCount++;
          }
          if (rawContent[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEndIndex = i + 1;
              break;
            }
          }
        }
        const jsonStr = rawContent.substring(jsonStartIndex, jsonEndIndex);
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.followUpPrompts && Array.isArray(parsed.followUpPrompts)) {
          tags.set('SUGGESTIONS', parsed.followUpPrompts);
          console.log(`🏷️ [otakonTags] ✅ Extracted followUpPrompts from embedded JSON:`, parsed.followUpPrompts);
        }
      } catch (_e) {
        // Try simpler extraction - just the array
        try {
          const arrayMatch = rawContent.match(/"followUpPrompts"\s*:\s*\[([^\]]+)\]/);
          if (arrayMatch) {
            const prompts = JSON.parse(`[${arrayMatch[1]}]`);
            if (Array.isArray(prompts) && prompts.length > 0) {
              tags.set('SUGGESTIONS', prompts);
              console.log(`🏷️ [otakonTags] ✅ Extracted followUpPrompts array:`, prompts);
            }
          }
        } catch (_e2) {
          console.warn('[otakonTags] Could not extract followUpPrompts from JSON');
        }
      }
    }
  }

  // ============================================
  // STEP 1: EXTRACT TAGS FROM RAW CONTENT FIRST
  // ============================================

  // 1a. Handle SUGGESTIONS tag with JSON array (special case - spans multiple brackets)
  const suggestionsRegex = /\[OTAKON_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;
  let suggestionsMatch;
  while ((suggestionsMatch = suggestionsRegex.exec(rawContent)) !== null) {
    try {
      const arrayContent = suggestionsMatch[1];
      
      // Try parsing as-is first (if it's already valid JSON)
      try {
        const suggestions = JSON.parse(arrayContent);
        if (Array.isArray(suggestions)) {
          tags.set('SUGGESTIONS', suggestions);
          cleanContent = cleanContent.replace(suggestionsMatch[0], '');
          console.log(`🏷️ [otakonTags] Extracted SUGGESTIONS:`, suggestions);
          continue;
        }
      } catch (_e) {
        // Not valid JSON, try fixing it
      }
      
      // Fallback: Replace single quotes with double quotes for valid JSON
      const jsonStr = arrayContent.replace(/'/g, '"');
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

  // 1b2. Handle SUBTAB_CONSOLIDATE with nested JSON object (full replacement)
  // This is used when AI consolidates old collapsed content into a summary
  const subtabConsolidateRegex = /\[OTAKON_SUBTAB_CONSOLIDATE:\s*\{[^\]]*\}\s*\]/g;
  let consolidateMatch;
  const consolidateUpdates: unknown[] = [];
  while ((consolidateMatch = subtabConsolidateRegex.exec(rawContent)) !== null) {
    try {
      const jsonMatch = consolidateMatch[0].match(/\{[^\]]*\}/);
      if (jsonMatch) {
        const update = JSON.parse(jsonMatch[0]);
        consolidateUpdates.push(update);
        console.log(`📦 [otakonTags] Extracted SUBTAB_CONSOLIDATE:`, update);
      }
    } catch (_e) {
      console.warn('[OtakonTags] Failed to parse SUBTAB_CONSOLIDATE JSON:', consolidateMatch[0]);
    }
    // Always remove the tag from content
    cleanContent = cleanContent.replace(consolidateMatch[0], '');
  }
  if (consolidateUpdates.length > 0) {
    tags.set('SUBTAB_CONSOLIDATE', consolidateUpdates);
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
  if (progressValue === null) {
    const progressMatch2 = rawContent.match(/\[?PROGRESS[:\s]+(\d+)/i);
    if (progressMatch2) {
      progressValue = parseInt(progressMatch2[1], 10);
      console.log(`📊 [otakonTags] Found PROGRESS format: ${progressMatch2[0]} → ${progressValue}%`);
    }
  }
  
  // Format 3: Progress: XX% or progress is XX%
  if (progressValue === null) {
    const progressMatch3 = rawContent.match(/(?:progress|completion|game progress)[:\s]+(?:approximately\s+)?(\d+)\s*%/i);
    if (progressMatch3) {
      progressValue = parseInt(progressMatch3[1], 10);
      console.log(`📊 [otakonTags] Found inline progress format: ${progressMatch3[0]} → ${progressValue}%`);
    }
  }
  
  // Format 4: Look for structured progress in stateUpdateTags
  if (progressValue === null) {
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

  // 1d. Handle TTS markers (optional - for future use)
  // Extract content between [OTAKON_TTS_START] and [OTAKON_TTS_END]
  const ttsMarkerMatch = rawContent.match(/\[OTAKON_TTS_START\]([\s\S]*?)\[OTAKON_TTS_END\]/i);
  if (ttsMarkerMatch && ttsMarkerMatch[1]) {
    const ttsContent = ttsMarkerMatch[1].trim();
    tags.set('TTS_CONTENT', ttsContent);
    cleanContent = cleanContent.replace(ttsMarkerMatch[0], '');
    console.log(`🔊 [otakonTags] Extracted TTS_CONTENT (${ttsContent.length} chars):`, ttsContent.substring(0, 50) + '...');
  }

  // 1e. Handle remaining simple tags (non-JSON values)
  const simpleTagRegex = /\[OTAKON_([A-Z_]+):\s*([^[\]]+?)\]/g;
  let match;
  while ((match = simpleTagRegex.exec(rawContent)) !== null) {
    const tagName = match[1];
    let tagValue: unknown = match[2].trim();
    
    console.log(`🏷️ [otakonTags] Found tag: ${tagName} = ${match[2].substring(0, 50)}`);

    // Skip if already processed
    if (tagName === 'SUGGESTIONS' || tagName === 'SUBTAB_UPDATE' || tagName === 'TTS_START' || tagName === 'TTS_END') {
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
  // STEP 2: AGGRESSIVE CLEANUP - Remove all tag remnants and trim
  // ============================================
  
  // Remove AI self-introduction only (keep all other content as-is)
  cleanContent = cleanContent
    // Remove "I'm Otagon, your dedicated gaming lore expert..." intro
    .replace(/^I['']?m\s+Otagon,\s+your\s+dedicated\s+gaming\s+lore\s+expert[^\n]*\n*/i, '')
    // Remove any remaining OTAKON_SUGGESTIONS tags (in case regex didn't catch all variants)
    .replace(/\[OTAKON_SUGGESTIONS:[^\]]*\]/gi, '')
    // Remove any remaining OTAKON tags
    .replace(/\[OTAKON_[A-Z_]+:[^\]]*\]/g, '')
    // ✅ NEW: Remove "Internal Data Structure" section and everything after it
    .replace(/\*\*Internal Data Structure\*\*[\s\S]*$/gi, '') // **Internal Data Structure** (bold markdown)
    .replace(/\*+\s*#+\s*Internal Data Structure[\s\S]*$/gi, '') // ***## Internal Data Structure
    .replace(/\*+\s*Internal Data Structure[\s\S]*$/gi, '') // *** Internal Data Structure
    .replace(/#+\s*Internal Data Structure[\s\S]*$/gi, '') // ## Internal Data Structure
    .replace(/Internal Data Structure:?[\s\S]*$/gi, '') // Internal Data Structure (any case)
    .replace(/"Internal Data Structure":?[\s\S]*$/gi, '') // With quotes
    // ✅ NEW: Remove standalone JSON blocks with structured data at the end
    .replace(/\{[\s\S]*?"followUpPrompts"[\s\S]*?\}\s*$/gi, '')
    .replace(/\{[\s\S]*?"progressiveInsightUpdates"[\s\S]*?\}\s*$/gi, '')
    .replace(/\{[\s\S]*?"stateUpdateTags"[\s\S]*?\}\s*$/gi, '')
    .replace(/\{[\s\S]*?"gamePillData"[\s\S]*?\}\s*$/gi, '')
    // ✅ NEW: Remove code blocks containing JSON
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/```\s*\{[\s\S]*?```/gi, '')
    // Remove orphaned closing brackets that might remain at the end
    .replace(/\]\s*$/g, '')
    .replace(/\}\s*$/g, '') // Also remove trailing }
    // ✅ FIX: Convert escaped newlines to actual newlines
    .replace(/\\n/g, '\n')
    // ✅ FIX: Remove JSON string artifacts (trailing quotes and brackets)
    .replace(/"\s*\}\s*\]\s*$/g, '')
    .replace(/"\s*\]\s*$/g, '')
    .trim();

  // Log extracted tags summary
  if (tags.size > 0) {
    console.log(`🏷️ [otakonTags] Extracted ${tags.size} tags:`, Array.from(tags.keys()).join(', '));
  }

  return { cleanContent, tags };
};