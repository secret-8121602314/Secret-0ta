import type { OtakonSubtabUpdate } from '../types';

/**
 * Parses AI responses to extract OTAKON tags and clean content.
 * Handles both simple tags [OTAKON_TAG: value] and complex tags with JSON arrays/objects.
 * 
 * @param rawContent - Raw AI response string
 * @returns Object with cleaned content and extracted tags Map
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  const tags = new Map<string, unknown>();
  
  // ============================================
  // STEP 1: Pre-clean escaped characters
  // ============================================
  let cleanContent = rawContent.replace(/\\\*/g, '*');

  // ============================================
  // STEP 2: Extract structured tags (JSON payloads)
  // ============================================
  
  // Extract SUGGESTIONS array: [OTAKON_SUGGESTIONS: ["item1", "item2"]]
  cleanContent = extractJsonArrayTag(cleanContent, 'SUGGESTIONS', tags);
  
  // Extract SUBTAB_UPDATE objects: [OTAKON_SUBTAB_UPDATE: {"tab": "name", "content": "text"}]
  cleanContent = extractJsonObjectTags(cleanContent, 'SUBTAB_UPDATE', tags);

  // ============================================
  // STEP 3: Extract progress (multiple format support)
  // ============================================
  const progressValue = extractProgress(rawContent);
  if (progressValue !== null) {
    tags.set('PROGRESS', progressValue);
  }

  // ============================================
  // STEP 4: Extract remaining simple tags
  // ============================================
  cleanContent = extractSimpleTags(cleanContent, rawContent, tags);

  // ============================================
  // STEP 5: Clean up orphaned tag fragments
  // ============================================
  cleanContent = removeOrphanedFragments(cleanContent);

  // ============================================
  // STEP 6: Normalize section headers
  // ============================================
  cleanContent = normalizeHeaders(cleanContent);

  // ============================================
  // STEP 7: Fix formatting issues
  // ============================================
  cleanContent = fixFormatting(cleanContent);

  return { cleanContent, tags };
};

// ============================================
// Helper Functions
// ============================================

/** Known section headers that need special formatting */
const SECTION_HEADERS = ['Hint', 'Lore', 'Places of Interest', 'Strategy', 'What to focus on'];

/**
 * Extracts a JSON array tag like [OTAKON_SUGGESTIONS: [...]]
 */
function extractJsonArrayTag(content: string, tagName: string, tags: Map<string, unknown>): string {
  const regex = new RegExp(`\\[OTAKON_${tagName}:\\s*(\\[[\\s\\S]*?\\])\\s*\\]`, 'g');
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    try {
      const jsonStr = match[1].replace(/'/g, '"');
      const parsed = JSON.parse(jsonStr);
      tags.set(tagName, parsed);
      content = content.replace(match[0], '');
    } catch {
      // Skip malformed JSON
    }
  }
  
  return content;
}

/**
 * Extracts JSON object tags like [OTAKON_SUBTAB_UPDATE: {...}]
 * Collects multiple occurrences into an array
 */
function extractJsonObjectTags(content: string, tagName: string, tags: Map<string, unknown>): string {
  const regex = new RegExp(`\\[OTAKON_${tagName}:\\s*(\\{[\\s\\S]*?\\})\\s*\\]`, 'g');
  const collected: unknown[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      collected.push(parsed);
      content = content.replace(match[0], '');
    } catch {
      // Skip malformed JSON
    }
  }
  
  if (collected.length > 0) {
    tags.set(tagName, collected as OtakonSubtabUpdate[]);
  }
  
  return content;
}

/**
 * Extracts progress value from various formats AI might use
 */
function extractProgress(rawContent: string): number | null {
  // Priority order: most specific to least specific
  const patterns = [
    /\[OTAKON_PROGRESS[:\s]+(\d+)/i,                              // [OTAKON_PROGRESS: XX]
    /\[?PROGRESS[:\s]+(\d+)/i,                                    // [PROGRESS: XX] or PROGRESS: XX
    /(?:progress|completion|game progress)[:\s]+(?:approximately\s+)?(\d+)\s*%/i,  // progress: XX%
    /"stateUpdateTags"[^}]*"PROGRESS[:\s]+(\d+)/i                 // Inside stateUpdateTags JSON
  ];
  
  for (const pattern of patterns) {
    const match = rawContent.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      if (value >= 0 && value <= 100) {
        return value;
      }
    }
  }
  
  return null;
}

/**
 * Extracts simple [OTAKON_TAG: value] tags
 */
function extractSimpleTags(content: string, rawContent: string, tags: Map<string, unknown>): string {
  const simpleTagRegex = /\[OTAKON_([A-Z_]+):\s*([^\[\]]+?)\]/g;
  let match;
  
  while ((match = simpleTagRegex.exec(rawContent)) !== null) {
    const tagName = match[1];
    let tagValue: unknown = match[2].trim();
    
    // Skip already processed tags
    if (tagName === 'SUGGESTIONS' || tagName === 'SUBTAB_UPDATE') {
      continue;
    }
    
    // Try to parse as JSON if it looks like JSON
    tagValue = tryParseJson(tagValue as string);
    
    // Special handling for PROGRESS - ensure it's a number
    if (tagName === 'PROGRESS') {
      const numMatch = String(tagValue).match(/(\d+)/);
      if (numMatch) {
        tagValue = Math.min(100, Math.max(0, parseInt(numMatch[1], 10)));
      }
    }
    
    tags.set(tagName, tagValue);
    content = content.replace(match[0], '');
  }
  
  return content;
}

/**
 * Attempts to parse a string as JSON, returns original if not valid JSON
 */
function tryParseJson(value: string): unknown {
  try {
    if ((value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']'))) {
      return JSON.parse(value.replace(/'/g, '"'));
    }
  } catch {
    // Not valid JSON
  }
  return value;
}

/**
 * Removes orphaned tag fragments and malformed patterns
 */
function removeOrphanedFragments(content: string): string {
  return content
    .replace(/\[OTAKON_[A-Z_]+:[^\]]*\]/g, '')           // Remaining OTAKON tags
    .replace(/^["'][^"']*\?["']\s*,?\s*/gm, '')          // Quoted question fragments
    .replace(/^["'](?:and\s+)?\[\d+\][^"']*\?["']\s*,?\s*/gim, '')
    .replace(/^["'][^"']*\?["']\s*\]\s*/gm, '')
    .replace(/^[^"']*\?["']\s*\]\s*/gm, '')
    .replace(/^(?:["'][^"']*["']\s*,?\s*)+\]/g, '');
}

/**
 * Normalizes section headers to consistent format
 */
function normalizeHeaders(content: string): string {
  for (const header of SECTION_HEADERS) {
    const h = header.replace(/ /g, '\\s+');
    
    // Match various malformed header patterns and normalize
    const patterns = [
      new RegExp(`\\*+\\s*${h}(?:\\s*[:\\*]+\\s*:?|\\s*:)\\s*\\**`, 'gi'),
      new RegExp(`\\*\\*\\s*${h}\\s*\\*\\*`, 'gi'),
      new RegExp(`\\*\\*\\s+${h}(?![:\\w*])`, 'gi'),
      new RegExp(`(?:^|\\n)\\s*${h}:\\s*`, 'gi')
    ];
    
    for (const pattern of patterns) {
      content = content.replace(pattern, `\n\n**${header}:**\n\n`);
    }
  }
  
  // Fix double/triple colons
  content = content.replace(/:{2,}/g, ':');
  
  return content;
}

/**
 * Fixes various formatting issues in the content
 */
function fixFormatting(content: string): string {
  let result = content
    // Fix bold text spacing: ** Text** → **Text**
    .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**')
    .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1**')
    
    // Fix inline malformed bold markers within paragraphs
    // Pattern: "** Text" without closing → remove the opening **
    .replace(/\*\*\s+([A-Za-z][A-Za-z\s]+?)(?=\s+(?:is|are|was|were|has|have|and|or|but|the|a|an|of|to|in|on|at|for|with|as|by|from|serves?|often|usually)\s)/gi, '$1')
    // Pattern: "Text**" without opening → remove the orphaned closing **
    .replace(/(\b[A-Za-z]+)\s*\*\*(?=,|\s|\.)/g, '$1')
    // Pattern: Incomplete bold ending at punctuation
    .replace(/\*\*\s*([^*\n]{3,}?)([.!?])(?!\*\*)/g, '$1$2')
    
    // Remove empty bold markers
    .replace(/^\s*\*\*\s*$/gm, '')
    .replace(/^\*\*\s*\n/gm, '\n')
    .replace(/\*\*\s*\*\*/g, '')
    
    // Remove stray brackets
    .replace(/[\[\]]\s*$/gm, '')
    .replace(/^\s*[\[\]]/gm, '')
    .replace(/\s+[\[\]]\s+/g, ' ')
    
    // Fix list formatting
    .replace(/\.\s*(\d+\.\s*\*\*)/g, '.\n\n$1')
    .replace(/\.\s*(\d+\.\s+[A-Z])/g, '.\n\n$1')
    .replace(/^(\d+)\.([A-Z])/gm, '$1. $2')
    
    // Fix word spacing around bold
    .replace(/\*\*([^*]+)\*\*([A-Za-z])/g, '**$1** $2')
    .replace(/([a-z])\*\*([A-Z])/g, '$1 **$2')
    
    // Fix colon spacing (but not in URLs)
    .replace(/([^htfps*]):([A-Z])/g, '$1: $2')
    
    // Fix preposition + capital (likeContagion → like Contagion)
    .replace(/\b(like|or|and|the|a|an|for|with|from|to|in|on|at|by|as)([A-Z])/g, '$1 $2')
    
    // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();
    
  // Clean orphaned bold markers (unmatched **)
  const boldCount = (result.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    result = result.replace(/\*\*\s*$/g, '');
    result = result.replace(/^\s*\*\*/g, '');
    result = result.replace(/\s\*\*\s+([A-Z])/g, ' $1');
    result = result.replace(/(\w)\*\*(?=[\s,.])/g, '$1');
  }
  
  return result;
}
