// Debug script to check what's in localStorage
// Run this in browser console

console.log('=== CONVERSATION DEBUG ===');

// Check localStorage
const conversations = localStorage.getItem('otakon_conversations');
console.log('localStorage conversations:', conversations);

if (conversations) {
  try {
    const parsed = JSON.parse(conversations);
    console.log('Parsed conversations:', parsed);
    console.log('Number of conversations:', Object.keys(parsed).length);
    Object.values(parsed).forEach((conv, index) => {
      console.log(`Conversation ${index + 1}:`, {
        id: conv.id,
        title: conv.title,
        messageCount: conv.messages?.length || 0,
        createdAt: new Date(conv.createdAt).toLocaleString()
      });
    });
  } catch (error) {
    console.error('Error parsing conversations:', error);
  }
} else {
  console.log('No conversations found in localStorage');
}

// Check all localStorage keys
console.log('All localStorage keys:', Object.keys(localStorage));

// Check if there are any conversation-related keys
const conversationKeys = Object.keys(localStorage).filter(key => 
  key.includes('conversation') || key.includes('chat') || key.includes('otakon')
);
console.log('Conversation-related keys:', conversationKeys);
