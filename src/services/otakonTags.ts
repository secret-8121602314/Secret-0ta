/**
 * Parses AI responses to extract OTAKON tags and clean content
 * Handles both simple tags [OTAKON_TAG: value] and complex tags with JSON arrays/objects
 * Also extracts structured data from "Internal Data Structure" JSON blocks
 * 
 * 🚀 PERF OPTIMIZED: Reduced logging, consolidated regex patterns, early exits
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  const tags = new Map<string, unknown>();
  let cleanContent = rawContent;
  
  // 🚀 PERF: Skip processing for short responses (likely errors or simple messages)
  if (rawContent.length < 50) {
    return { cleanContent: rawContent.trim(), tags };
  }

  // ============================================
  // STEP 0: EXTRACT FROM "Internal Data Structure" JSON BLOCKS
  // This handles the new AI response format with embedded JSON
  // ============================================
  
  // 🚀 PERF: Combined pattern with alternation for single regex pass
  const internalDataMatch = rawContent.match(
    /(?:\*\*)?Internal Data Structure(?:\*\*)?:?\s*\n*\s*```(?:json)?\s*([\s\S]*?)```|Internal Data Structure:?\s*\n*(\{[\s\S]*?"followUpPrompts"[\s\S]*?\})\s*$/i
  );
  
  if (internalDataMatch) {
    const jsonStr = (internalDataMatch[1] || internalDataMatch[2] || '').trim();
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        
        // Extract followUpPrompts
        if (parsed.followUpPrompts && Array.isArray(parsed.followUpPrompts)) {
          tags.set('SUGGESTIONS', parsed.followUpPrompts);
        }
        
        // Extract stateUpdateTags for progress and objective in one pass
        if (parsed.stateUpdateTags && Array.isArray(parsed.stateUpdateTags)) {
          for (const tag of parsed.stateUpdateTags) {
            const tagStr = String(tag);
            const progressMatch = tagStr.match(/PROGRESS[:\s]+(\d+)/i);
            if (progressMatch) {
              const progress = parseInt(progressMatch[1], 10);
              if (progress >= 0 && progress <= 100) {
                tags.set('PROGRESS', progress);
              }
            }
            const objectiveMatch = tagStr.match(/OBJECTIVE[:\s]+(.+)/i);
            if (objectiveMatch) {
              tags.set('OBJECTIVE', objectiveMatch[1].trim());
            }
          }
        }
        
        // Extract progressiveInsightUpdates for subtabs
        if (parsed.progressiveInsightUpdates && Array.isArray(parsed.progressiveInsightUpdates)) {
          tags.set('SUBTAB_UPDATE', parsed.progressiveInsightUpdates);
        }
      } catch (_e) {
        // JSON parse failed, continue with legacy parsing
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
        }
      } catch (_e) {
        // Try simpler extraction - just the array
        try {
          const arrayMatch = rawContent.match(/"followUpPrompts"\s*:\s*\[([^\]]+)\]/);
          if (arrayMatch) {
            const prompts = JSON.parse(`[${arrayMatch[1]}]`);
            if (Array.isArray(prompts) && prompts.length > 0) {
              tags.set('SUGGESTIONS', prompts);
            }
          }
        } catch (_e2) {
          // Could not extract followUpPrompts
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
    } catch (_e) {
      // Silently skip malformed suggestions
    }
  }

  // 1b. Handle SUBTAB_UPDATE with nested JSON object
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
      // Skip malformed subtab updates
    }
    cleanContent = cleanContent.replace(subtabMatch[0], '');
  }
  if (subtabUpdates.length > 0) {
    tags.set('SUBTAB_UPDATE', subtabUpdates);
  }

  // 1b2. Handle SUBTAB_CONSOLIDATE with nested JSON object
  const subtabConsolidateRegex = /\[OTAKON_SUBTAB_CONSOLIDATE:\s*\{[^\]]*\}\s*\]/g;
  let consolidateMatch;
  const consolidateUpdates: unknown[] = [];
  while ((consolidateMatch = subtabConsolidateRegex.exec(rawContent)) !== null) {
    try {
      const jsonMatch = consolidateMatch[0].match(/\{[^\]]*\}/);
      if (jsonMatch) {
        const update = JSON.parse(jsonMatch[0]);
        consolidateUpdates.push(update);
      }
    } catch (_e) {
      // Skip malformed consolidate updates
    }
    cleanContent = cleanContent.replace(consolidateMatch[0], '');
  }
  if (consolidateUpdates.length > 0) {
    tags.set('SUBTAB_CONSOLIDATE', consolidateUpdates);
  }

  // 1c. PROGRESS DETECTION - Look for multiple formats using combined regex
  let progressValue: number | null = null;
  
  // Combined regex for all progress formats
  const progressPatterns = [
    /\[OTAKON_PROGRESS[:\s]+(\d+)/i,           // [OTAKON_PROGRESS: XX]
    /\[?PROGRESS[:\s]+(\d+)/i,                  // [PROGRESS: XX] or PROGRESS: XX
    /(?:progress|completion|game progress)[:\s]+(?:approximately\s+)?(\d+)\s*%/i,  // Progress: XX%
    /"stateUpdateTags"[^}]*"PROGRESS[:\s]+(\d+)/i  // stateUpdateTags PROGRESS
  ];
  
  for (const pattern of progressPatterns) {
    const match = rawContent.match(pattern);
    if (match) {
      progressValue = parseInt(match[1], 10);
      break;
    }
  }
  
  if (progressValue !== null && progressValue >= 0 && progressValue <= 100) {
    tags.set('PROGRESS', progressValue);
  }

  // 1d. Handle TTS markers (optional - for future use)
  const ttsMarkerMatch = rawContent.match(/\[OTAKON_TTS_START\]([\s\S]*?)\[OTAKON_TTS_END\]/i);
  if (ttsMarkerMatch && ttsMarkerMatch[1]) {
    const ttsContent = ttsMarkerMatch[1].trim();
    tags.set('TTS_CONTENT', ttsContent);
    cleanContent = cleanContent.replace(ttsMarkerMatch[0], '');
  }

  // 1e. Handle remaining simple tags (non-JSON values)
  const simpleTagRegex = /\[OTAKON_([A-Z_]+):\s*([^[\]]+?)\]/g;
  let match;
  while ((match = simpleTagRegex.exec(rawContent)) !== null) {
    const tagName = match[1];
    let tagValue: unknown = match[2].trim();

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
      const numMatch = strVal.match(/(\d+)/);
      if (numMatch) {
        tagValue = Math.min(100, Math.max(0, parseInt(numMatch[1], 10)));
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

  return { cleanContent, tags };
};