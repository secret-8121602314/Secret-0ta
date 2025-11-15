# Google Gemini API Documentation

Google Gemini API provides access to Google's advanced multimodal AI models that can process text, images, audio, and video inputs to generate intelligent responses.

## Version: 0.24.1 (@google/generative-ai)

## Setup

### Installation
```bash
npm install @google/generative-ai
```

### Initialize Client
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
```

## Text Generation

### Basic Text Generation
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const prompt = 'Write a short story about a robot learning to love.';

const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();

console.log(text);
```

### Streaming Responses
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const prompt = 'Write a detailed guide on climate change.';
const result = await model.generateContentStream(prompt);

for await (const chunk of result.stream) {
  const chunkText = chunk.text();
  console.log(chunkText);
  // Update UI with streaming text
}
```

### Structured Output
```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-pro',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

const prompt = `Generate a JSON object with three random haikus about coding. 
Return as array of objects with "title" and "poem" fields.`;

const result = await model.generateContent(prompt);
const response = await result.response;
const jsonResponse = JSON.parse(response.text());

console.log(jsonResponse);
```

## Multimodal Content

### Image Analysis
```typescript
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

// Read image file
const imageBuffer = fs.readFileSync('image.jpg');
const base64Image = imageBuffer.toString('base64');

const prompt = 'Describe what you see in this image';

const result = await model.generateContent([
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  },
  prompt,
]);

const response = await result.response;
console.log(response.text());
```

### Image URL
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

const result = await model.generateContent([
  {
    fileData: {
      mimeType: 'image/jpeg',
      fileUri: 'https://example.com/image.jpg',
    },
  },
  'What is in this image?',
]);

console.log(result.response.text());
```

### Multiple Images
```typescript
const result = await model.generateContent([
  'Compare these two images:',
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image1,
    },
  },
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image2,
    },
  },
]);

console.log(result.response.text());
```

## Function Calling

### Define Functions
```typescript
const tools = {
  functionDeclarations: [
    {
      name: 'search_web',
      description: 'Search the web for information',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: {
            type: 'STRING',
            description: 'Search query string',
          },
          limit: {
            type: 'NUMBER',
            description: 'Number of results (default 10)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'OBJECT',
        properties: {
          location: {
            type: 'STRING',
            description: 'City name or coordinates',
          },
        },
        required: ['location'],
      },
    },
  ],
};

const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  tools: [tools],
});
```

### Handle Function Calls
```typescript
async function chat(userMessage: string) {
  const result = await model.generateContent(userMessage);

  if (result.response.candidates[0].content.parts[0].functionCall) {
    const functionCall = result.response.candidates[0].content.parts[0].functionCall;
    const functionName = functionCall.name;
    const args = functionCall.args;

    console.log(`Calling function: ${functionName}`);
    console.log('Arguments:', args);

    let functionResult;

    if (functionName === 'search_web') {
      functionResult = await searchWeb(args.query, args.limit);
    } else if (functionName === 'get_weather') {
      functionResult = await getWeather(args.location);
    }

    // Send function result back to model
    const response2 = await model.generateContent([
      userMessage,
      result.response.candidates[0].content,
      {
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: functionName,
              response: functionResult,
            },
          },
        ],
      },
    ]);

    return response2.response.text();
  }

  return result.response.text();
}
```

## Chat/Conversation

### Multi-turn Conversation
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const chat = model.startChat({
  history: [
    {
      role: 'user',
      parts: [{ text: 'Hello, I have 2 apples.' }],
    },
    {
      role: 'model',
      parts: [{ text: 'Great! You have 2 apples. How can I help?' }],
    },
  ],
});

const msg = 'How many apples do I have?';
const result = await chat.sendMessage(msg);

console.log(result.response.text());

// Continue conversation
const result2 = await chat.sendMessage('I buy 5 more apples.');
console.log(result2.response.text());
```

### Streaming Chat
```typescript
const chat = model.startChat();

const result = await chat.sendMessageStream('Write a poem about code');

for await (const chunk of result.stream) {
  const chunkText = chunk.text();
  console.log(chunkText);
}
```

## Embeddings

### Generate Embeddings
```typescript
const model = genAI.getGenerativeModel({ model: 'embedding-001' });

const text = 'The quick brown fox jumps over the lazy dog';

const result = await model.embedContent(text);
const embedding = result.embedding;

console.log('Embedding dimensions:', embedding.values.length);
console.log('First 5 values:', embedding.values.slice(0, 5));
```

### Batch Embeddings
```typescript
const texts = [
  'The cat sat on the mat',
  'The dog ran in the park',
  'Birds sing in the morning',
];

const embeddings = await Promise.all(
  texts.map(text =>
    model.embedContent(text).then(result => ({
      text,
      embedding: result.embedding.values,
    }))
  )
);
```

## Safety Settings

### Configure Safety
```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
  ],
});

const result = await model.generateContent('Your prompt here');
```

## System Instructions

### Add System Context
```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  systemInstruction: `You are an expert software developer helping junior developers learn. 
Always provide clear explanations with code examples. 
Be encouraging and patient.`,
});

const result = await model.generateContent(
  'How do I implement a binary search algorithm?'
);

console.log(result.response.text());
```

## Otagon Project Integration

```typescript
// Example: AI-powered message suggestion
async function generateMessageSuggestion(
  conversationContext: string,
  userQuery: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Based on this conversation:
${conversationContext}

The user is asking: "${userQuery}"

Generate a helpful, concise response suggestion.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Example: Content analysis with streaming
async function analyzeUserMessage(message: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analyze this message for sentiment and intent:
"${message}"

Provide: sentiment (positive/negative/neutral), intent (question/statement/request), and confidence level.
Format as JSON.`;

  const result = await model.generateContentStream(prompt);

  let fullText = '';
  for await (const chunk of result.stream) {
    fullText += chunk.text();
  }

  return JSON.parse(fullText);
}

// Example: Conversation with user profile context
async function chatWithContext(
  userMessage: string,
  userProfile: UserProfile,
  conversationHistory: Message[]
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-pro',
    systemInstruction: `You are a helpful AI assistant for ${userProfile.name}.
User interests: ${userProfile.interests.join(', ')}.
Keep responses concise and relevant to their interests.`,
  });

  const chat = model.startChat({
    history: conversationHistory.map(msg => ({
      role: msg.senderType === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

// Example: Image analysis for user uploads
async function analyzeUserPhoto(imageFile: File) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  const reader = new FileReader();
  const base64Data = await new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(imageFile);
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: imageFile.type,
        data: base64Data,
      },
    },
    'Provide a brief description of this image and identify any objects or text.',
  ]);

  return result.response.text();
}
```

## Advanced Features

### Token Counting
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const prompt = 'Count the tokens in this prompt';
const countResult = await model.countTokens(prompt);

console.log('Input tokens:', countResult.totalTokens);
```

### Batch Processing
```typescript
// Process multiple prompts efficiently
const prompts = [
  'What is 2+2?',
  'Explain quantum computing',
  'Write a haiku about programming',
];

const results = await Promise.all(
  prompts.map(prompt => model.generateContent(prompt))
);

results.forEach((result, index) => {
  console.log(`Response ${index + 1}:`, result.response.text());
});
```

## Error Handling

```typescript
try {
  const result = await model.generateContent('Your prompt');
  console.log(result.response.text());
} catch (error) {
  if (error.status === 429) {
    console.error('Rate limited - wait before retrying');
  } else if (error.status === 403) {
    console.error('Invalid API key or permission denied');
  } else {
    console.error('API error:', error.message);
  }
}
```

## Best Practices

1. **Stream long responses** - Use streaming for better UX
2. **Set safety levels appropriately** - Balance safety with functionality
3. **Use system instructions** - Guide model behavior with context
4. **Handle errors gracefully** - Implement retry logic for failures
5. **Cache embeddings** - Reuse embeddings for similar content
6. **Monitor token usage** - Track costs and optimize prompts
7. **Test with sample inputs** - Validate outputs before production

## Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [API Reference](https://ai.google.dev/api)
- [Model Cards](https://ai.google.dev/models)

## Related Documentation

- [React](./REACT.md) - UI integration
- [TypeScript](./TYPESCRIPT.md) - Type safety
