
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
  // PHASE 2: Normalize ALL section headers to consistent format
  // Handle every possible malformed pattern
  // ============================================
  const headers = ['Hint', 'Lore', 'Places of Interest', 'Strategy', 'What to focus on'];
  
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+'); // "Places of Interest" → "Places\s+of\s+Interest"
    
    // Pattern 1: ** Header:** : (with closing ** and extra colon)
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s*${h}\\s*:\\s*\\*\\*\\s*:?\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    
    // Pattern 2: ** Header: (space after **, with colon, no closing **)
    // Consume any trailing whitespace after the colon
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s+${h}\\s*:\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    
    // Pattern 3: **Header: (no space, with colon, no closing **)
    // Consume any trailing whitespace after the colon
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
  // PHASE 3: Add bold formatting to section headers
  // Now all headers are normalized as plain "Header:" with newlines
  // ============================================
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+');
    
    // Match Header: after punctuation or word character (with optional newlines between)
    cleanContent = cleanContent.replace(
      new RegExp(`([.!?\\w])([\\s\\n]*)${h}:\\s*`, 'gi'),
      `$1$2\n\n**${header}:**\n`
    );
    
    // Match Header: at very start of content
    cleanContent = cleanContent.replace(
      new RegExp(`^\\s*${h}:\\s*`, 'i'),
      `**${header}:**\n`
    );
    
    // Match Header: after newlines (not already bold)
    cleanContent = cleanContent.replace(
      new RegExp(`\\n\\s*${h}:\\s*`, 'gi'),
      `\n\n**${header}:**\n`
    );
  }

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
