
const parseOtakonTags = (rawContent) => {
  let cleanContent = rawContent;
  const tags = new Map();

  // ============================================
  // PHASE 1: Fix inline bold text (not section headers)
  // ============================================
  cleanContent = cleanContent
    // Fix ** with space after opening: ** Text** → **Text**
    .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**')
    // Fix ** with space before closing: **Text ** → **Text**
    .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1**');

  // ============================================
  // PHASE 2: Direct replacement of ALL malformed header patterns
  // Replace directly with properly formatted bold headers
  // ============================================
  const headers = ['Hint', 'Lore', 'Places of Interest', 'Strategy', 'What to focus on'];
  
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+'); // "Places of Interest" → "Places\s+of\s+Interest"
    
    // Pattern: **Header: or ** Header: (with/without space, with colon, no closing **)
    // This is the most common malformed pattern from AI
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s*${h}\\s*:`, 'gi'),
      `\n\n**${header}:**`
    );
    
    // Pattern: ** Header:** : (with closing ** and extra colon)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s*${h}\\s*:\\s*\\*\\*\\s*:?`, 'gi'),
      `\n\n**${header}:**`
    );
    
    // Pattern: **Header** (with closing **, no colon)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s*${h}\\s*\\*\\*`, 'gi'),
      `\n\n**${header}:**`
    );
  }
  
  // Fix double/triple colons
  cleanContent = cleanContent.replace(/:{2,}/g, ':');

  // ============================================
  // PHASE 3: Handle plain headers (no ** at all) - add bold
  // ============================================
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+');
    
    // Match plain Header: after newlines (not already bold)
    cleanContent = cleanContent.replace(
      new RegExp(`(?<!\\*)\\n\\s*${h}:\\s*(?!\\*)`, 'gi'),
      `\n\n**${header}:**\n`
    );
    
    // Match plain Header: at very start of content
    cleanContent = cleanContent.replace(
      new RegExp(`^\\s*${h}:\\s*(?!\\*)`, 'i'),
      `**${header}:**\n`
    );
  }

  // ============================================
  // PHASE 4: Fix remaining formatting issues
  // ============================================
  cleanContent = cleanContent
    // Remove standalone ** on its own line (but not **Header:**)
    .replace(/^\s*\*\*\s*$/gm, '')
    // Remove orphaned ** NOT part of a header (only ** followed by just whitespace and newline)
    .replace(/(?<![:\w])\*\*\s*\n(?![A-Z])/g, '\n')
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

  // PHASE 5 & 6...
  cleanContent = cleanContent
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();

  return cleanContent;
};

const input = `Greetings, Tarnished. You stand at the threshold of one of the Lands Between's most magnificent and terrifying structures. This is the grand approach to the Raya Lucaria Academy in Liurnia of the Lakes. The atmosphere, thick with arcane mist and the cold glow of Glintstone, suggests you are about to delve deep into the heart of Carian sorcery.

** Hint: Elden Ring - Raya Lucaria Academy Your immediate obstacle is gaining entry to the Academy itself. The main gate is sealed by a magical barrier only dispelled by the Academy Glintstone Key**. If you have not found it already, you must consult the map fragment you acquired in Liurnia. The location of the key is marked by a specific point of interest on that map, typically west of the Academy itself, guarded by a formidable dragon. Preparation is key before confronting the sorcerers within—they rely heavily on ranged magic and swift, unpredictable movements.

** Lore: Raya Lucaria is the pinnacle of Glintstone Sorcery, founded by the Carian Royal Family long ago. While the Great Runes shattered and the demigods waged war across the Lands Between, the Academy remained largely neutral, sealing itself off from the chaos. It is a place of rigorous intellectual pursuit and dark magical tradition. The Academy houses the Shardbearer, Rennala, Queen of the Full Moon, who wields one of the Great Runes. However, Rennala's power is tied not just to the Rune, but to the Carian family's deep connection to the stars and the moon. The Academy's architecture—part cathedral, part clockwork mechanism—reflects the Carians' obsession with celestial bodies and their belief that life is born from the cosmos.

** Places of Interest:

* Academy Gate Town: Just outside the main gate, this flooded ruin is often patrolled by various hostile sorcerers and Living Jars. It is a good place to farm Runes and practice dealing with magical projectiles before entering the dungeon.
* The Glintstone Key Location: The key is typically found on an island southwest of the Academy, guarded by the intimidating Glintstone Dragon Smarag. Defeating or bypassing Smarag is necessary to gain entry, but the key is found on a corpse nearby.`;

console.log("--- INPUT ---");
console.log(input);
console.log("\n--- OUTPUT ---");
console.log(parseOtakonTags(input));
