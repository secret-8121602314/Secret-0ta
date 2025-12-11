// Test with EXACT AI response pattern
const input = `Otagon here. You are navigating the dense, neon-soaked heart of Night City.

Hint:

Cyberpunk 2077 - The Space In Between Head immediately to Jig-Jig Street.

** Lore:**

You are currently deep in the main narrative questline.

** Places of Interest:**

Westbrook, particularly the Japantown area where you are, is rich with high-tier opportunities.`;

const headers = ['Hint', 'Lore', 'Places of Interest', 'Strategy', 'What to focus on'];

function processContent(input) {
  let cleanContent = input;
  
  // PHASE 1: Normalize section headers FIRST
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+');
    
    // Pattern 0: ** Header:** (space after **, colon directly before closing **)
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

  // PHASE 2: Fix inline bold (AFTER headers normalized)
  cleanContent = cleanContent
    .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**')
    .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1**');

  // PHASE 3: Add bold formatting
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+');
    
    cleanContent = cleanContent.replace(
      new RegExp(`([.!?\\w])([\\s\\n]*)${h}:\\s*`, 'gi'),
      `$1$2\n\n**${header}:**\n\n`
    );
    
    cleanContent = cleanContent.replace(
      new RegExp(`^\\s*${h}:\\s*`, 'i'),
      `**${header}:**\n\n`
    );
    
    cleanContent = cleanContent.replace(
      new RegExp(`\\n\\s*${h}:\\s*`, 'gi'),
      `\n\n**${header}:**\n\n`
    );
  }

  // PHASE 4: Cleanup
  cleanContent = cleanContent
    .replace(/^\s*\*\*\s*$/gm, '')
    .replace(/^\*\*\s*\n/gm, '\n')
    .replace(/([^:])\*\*\s*$/gm, '$1');

  // Final cleanup
  cleanContent = cleanContent
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleanContent;
}

console.log('=== INPUT ===');
console.log(input);
console.log('');
console.log('=== OUTPUT ===');
const output = processContent(input);
console.log(output);
console.log('');
console.log('=== VERIFICATION ===');
console.log('Hint bold:', output.includes('**Hint:**') ? '✅' : '❌');
console.log('Lore bold:', output.includes('**Lore:**') ? '✅' : '❌');
console.log('Places bold:', output.includes('**Places of Interest:**') ? '✅' : '❌');
