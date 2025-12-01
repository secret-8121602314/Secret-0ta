// Simulating ACTUAL AI response that might have different patterns
const inputs = [
  // Pattern 1: With extra spaces
  `** Hint: hint text\n** Lore: lore text\n** Places of Interest: places text`,
  
  // Pattern 2: Mixed - some with **, some without
  `**Hint: hint text\n**Lore: lore text\n**Places of Interest: places text`,
  
  // Pattern 3: With closing **
  `**Hint:** hint text\n**Lore:** lore text\n**Places of Interest:** places text`,
  
  // Pattern 4: Inline (no newlines between)
  `Some intro text. ** Hint: hint text ** Lore: lore text ** Places of Interest: places text`,
  
  // Pattern 5: Real world - Hint inline after period
  `You are here. ** Hint: Do this thing. ** Lore: Some lore. ** Places of Interest: * Place 1 * Place 2`,
];

const headers = ['Hint', 'Lore', 'Places of Interest', 'Strategy', 'What to focus on'];

function processContent(input) {
  let cleanContent = input;
  
  // PHASE 1: Fix inline bold
  cleanContent = cleanContent
    .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**')
    .replace(/\*\*([^*\n]+?)\s+\*\*/g, '**$1**');

  // PHASE 2: Normalize headers
  for (const header of headers) {
    const h = header.replace(/ /g, '\\s+');
    
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s*${h}\\s*:\\s*\\*\\*\\s*:?\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s+${h}\\s*:\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*${h}:\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*${h}\\*\\*\\s*`, 'gi'),
      `\n\n${header}:\n`
    );
    cleanContent = cleanContent.replace(
      new RegExp(`\\*\\*\\s+${h}(?![:\\w*])`, 'gi'),
      `\n\n${header}:\n`
    );
  }
  
  cleanContent = cleanContent.replace(/:{2,}/g, ':');

  // PHASE 3: Add bold
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

  // PHASE 6: Final
  cleanContent = cleanContent
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleanContent;
}

inputs.forEach((input, i) => {
  console.log(`\n========== TEST ${i + 1} ==========`);
  console.log('INPUT:', JSON.stringify(input));
  console.log('---');
  const output = processContent(input);
  console.log('OUTPUT:');
  console.log(output);
  
  // Check if headers are bold
  const hintBold = output.includes('**Hint:**');
  const loreBold = output.includes('**Lore:**');
  const placesBold = output.includes('**Places of Interest:**');
  console.log(`---`);
  console.log(`Hint bold: ${hintBold ? '✅' : '❌'}`);
  console.log(`Lore bold: ${loreBold ? '✅' : '❌'}`);
  console.log(`Places bold: ${placesBold ? '✅' : '❌'}`);
});
