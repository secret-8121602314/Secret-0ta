# Google Generative AI & Gemini API Complete Guide

Comprehensive guide to Google's Gemini API for generative AI—featuring content generation, function calling, embeddings, multimodal processing, and advanced features like context caching and batch operations.

## Table of Contents

1. [Setup & Installation](#setup--installation)
2. [Basic Text Generation](#basic-text-generation)
3. [Model Selection](#model-selection)
4. [Streaming Responses](#streaming-responses)
5. [Multimodal Input](#multimodal-input)
6. [Function Calling](#function-calling)
7. [Embeddings](#embeddings)
8. [Advanced Features](#advanced-features)
9. [Safety & Content Filtering](#safety--content-filtering)
10. [Token Counting](#token-counting)
11. [Error Handling](#error-handling)
12. [Best Practices](#best-practices)

## Setup & Installation

### Install SDK

```bash
npm install @google/generative-ai
```

### Initialize Client

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.REACT_APP_GEMINI_API_KEY
);
```

### Environment Setup

Create `.env.local`:

```
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Basic Text Generation

### Simple Prompt

```typescript
async function generateText(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  console.log(response.text());
  return response.text();
}

// Usage
const text = await generateText('Explain quantum computing in simple terms');
```

### Generate with Configuration

```typescript
async function generateTextWithConfig(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
    responseMimeType: 'text/plain'
  };

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig
  });

  return result.response.text();
}
```

### Multi-turn Conversation

```typescript
async function chat() {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'Hi, I am learning about AI' }]
      },
      {
        role: 'model',
        parts: [{ text: 'That\'s great! AI is a fascinating field. What aspect interests you most?' }]
      }
    ]
  });

  const msg = 'Tell me more about machine learning';
  const result = await chat.sendMessage(msg);
  
  console.log(result.response.text());
  
  // Continue conversation
  const nextResult = await chat.sendMessage('How does deep learning differ?');
  console.log(nextResult.response.text());
}
```

## Model Selection

### Available Models

```typescript
// Gemini 2.5 Pro - Most capable, best for complex reasoning
const prModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro-exp-05-21'
});

// Gemini 1.5 Pro - Advanced reasoning, longer context (128k)
const pro = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro'
});

// Gemini 1.5 Flash - Fast, cost-effective (128k context)
const flash = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
});

// Gemini 2 Flash - Latest, optimized for speed and efficiency
const flash2 = genAI.getGenerativeModel({
  model: 'gemini-2-flash-exp'
});

// Legacy Models
const pro8k = genAI.getGenerativeModel({
  model: 'gemini-pro'
});

const proVision = genAI.getGenerativeModel({
  model: 'gemini-pro-vision'
});
```

### Choose Model Based on Use Case

```typescript
// Short, quick responses - use Flash
const fastResult = await genAI
  .getGenerativeModel({ model: 'gemini-1.5-flash' })
  .generateContent('Write a haiku');

// Complex reasoning - use Pro
const complexResult = await genAI
  .getGenerativeModel({ model: 'gemini-1.5-pro' })
  .generateContent('Analyze the philosophical implications of quantum mechanics');

// High-volume API calls - use Flash (50% cheaper)
const batchResults = [];
for (let i = 0; i < 1000; i++) {
  const result = await genAI
    .getGenerativeModel({ model: 'gemini-1.5-flash' })
    .generateContent(`Generate item ${i}`);
  batchResults.push(result);
}
```

## Streaming Responses

### Stream Text Generation

```typescript
async function streamText(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    console.log(chunkText);
    // Update UI in real-time
  }

  const response = await result.response;
  return response.text();
}

// React hook
function useStreamingGeneration() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function generate(prompt) {
    setIsLoading(true);
    setText('');

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      setText(prev => prev + chunk.text());
    }

    setIsLoading(false);
  }

  return { text, isLoading, generate };
}
```

### Stream Multi-turn Chat

```typescript
async function streamChat(messages) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const chat = model.startChat();

  const result = await chat.sendMessageStream(messages[messages.length - 1]);

  let fullResponse = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullResponse += chunkText;
    console.log(chunkText);
  }

  return fullResponse;
}
```

## Multimodal Input

### Image Input

```typescript
import fs from 'fs';
import path from 'path';

// From file
async function analyzeImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro'
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    },
    { text: 'Describe what you see in this image' }
  ]);

  return result.response.text();
}

// From URL
async function analyzeImageUrl(imageUrl) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro'
  });

  const result = await model.generateContent([
    {
      url: imageUrl
    },
    { text: 'What objects are in this image?' }
  ]);

  return result.response.text();
}

// From FileReader (browser)
async function analyzeUploadedImage(file) {
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash'
      });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: file.type,
            data: base64
          }
        },
        { text: 'Describe this image in detail' }
      ]);

      resolve(result.response.text());
    };

    reader.readAsDataURL(file);
  });
}
```

### Video Input (with File API)

```typescript
import { FileManager } from '@google/generative-ai/server';

async function analyzeVideo(videoPath) {
  const fileManager = new FileManager();

  // Upload video
  const uploadResponse = await fileManager.uploadFile(videoPath, {
    mimeType: 'video/mp4'
  });

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro'
  });

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: uploadResponse.file.uri
      }
    },
    { text: 'Summarize the key points in this video' }
  ]);

  return result.response.text();
}
```

### Audio Input

```typescript
async function transcribeAudio(audioPath) {
  const audioBuffer = fs.readFileSync(audioPath);
  const base64Audio = audioBuffer.toString('base64');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'audio/wav',
        data: base64Audio
      }
    },
    { text: 'Transcribe this audio and summarize the main topics' }
  ]);

  return result.response.text();
}
```

## Function Calling

### Define Tools

```typescript
const tools = [
  {
    name: 'getWeather',
    description: 'Get the current weather for a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit'
        }
      },
      required: ['location']
    }
  },
  {
    name: 'searchWeb',
    description: 'Search the web for information',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  }
];
```

### Call Functions

```typescript
// Simulated function implementations
const functionImplementations = {
  getWeather: (location, unit = 'celsius') => {
    return {
      location,
      temperature: 22,
      condition: 'Sunny',
      unit
    };
  },
  searchWeb: (query) => {
    return {
      query,
      results: [
        { title: 'Result 1', url: 'https://...' },
        { title: 'Result 2', url: 'https://...' }
      ]
    };
  }
};

async function runAgentWithTools(userQuery) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: { functionDeclarations: tools }
  });

  const chat = model.startChat();

  let response = await chat.sendMessage(userQuery);

  // Process function calls in a loop
  while (response.response.candidates?.[0].content.parts.some(
    p => p.functionCall
  )) {
    const functionCall = response.response.candidates[0].content.parts.find(
      p => p.functionCall
    ).functionCall;

    const functionName = functionCall.name;
    const args = functionCall.args;

    console.log(`Calling function: ${functionName}`);
    const functionResult = functionImplementations[functionName](...Object.values(args));

    response = await chat.sendMessage([
      {
        functionResponse: {
          name: functionName,
          response: functionResult
        }
      }
    ]);
  }

  return response.response.text();
}

// Usage
const result = await runAgentWithTools('What\'s the weather in Paris and find me a good restaurant there');
console.log(result);
```

## Embeddings

### Generate Embeddings

```typescript
async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({
    model: 'embedding-001'
  });

  const result = await model.embedContent(text);
  const embedding = result.embedding;

  return embedding.values;
}

// Get multiple embeddings
async function getEmbeddings(texts) {
  const model = genAI.getGenerativeModel({
    model: 'embedding-001'
  });

  const results = await Promise.all(
    texts.map(text => model.embedContent(text))
  );

  return results.map(r => r.embedding.values);
}
```

### Semantic Search

```typescript
// Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function semanticSearch(query, documents) {
  const queryEmbedding = await getEmbedding(query);
  const docEmbeddings = await getEmbeddings(documents);

  const similarities = docEmbeddings.map((embedding, i) => ({
    index: i,
    score: cosineSimilarity(queryEmbedding, embedding),
    doc: documents[i]
  }));

  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// Usage
const docs = [
  'The quick brown fox jumps over the lazy dog',
  'Machine learning is a subset of AI',
  'Artificial intelligence powers modern technology'
];

const results = await semanticSearch('AI and technology', docs);
console.log(results);
```

## Advanced Features

### Context Caching

```typescript
async function generateWithCache(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro'
  });

  // Large context that will be cached
  const largeContext = 'Large document or conversation history...';

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: largeContext },
          { text: prompt }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: 'You are an expert assistant with access to cached context'
        }
      ],
      cachedContent: {
        parts: [{ text: largeContext }]
      }
    }
  });

  return result.response.text();
}
```

### Batch Processing

```typescript
async function batchGenerateContent(prompts) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const requests = prompts.map(prompt => ({
    generateContent: {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    }
  }));

  // Submit batch (50% cost reduction)
  const batchRequest = {
    requests,
    displayNames: ['batch_request']
  };

  // Note: Actual batch submission requires additional setup
  // This demonstrates the structure
  
  return requests.map(req => model.generateContent(req.generateContent));
}
```

### Structured Output

```typescript
async function generateStructuredOutput(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro'
  });

  const schema = {
    type: 'object',
    properties: {
      recipe_name: { type: 'string' },
      ingredients: {
        type: 'array',
        items: { type: 'string' }
      },
      instructions: {
        type: 'array',
        items: { type: 'string' }
      },
      prep_time: { type: 'string' },
      servings: { type: 'number' }
    },
    required: [
      'recipe_name',
      'ingredients',
      'instructions',
      'prep_time',
      'servings'
    ]
  };

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema
    }
  });

  return JSON.parse(result.response.text());
}

// Usage
const recipe = await generateStructuredOutput('Create a chocolate chip cookie recipe');
console.log(recipe);
```

### Code Execution

```typescript
async function generateAndExecuteCode(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro'
  });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Write Python code to ${prompt}. The code should be complete and executable.`
          }
        ]
      }
    ]
  });

  return result.response.text();
}

// Returns Python code that can be executed
const code = await generateAndExecuteCode('calculate fibonacci numbers up to 100');
```

## Safety & Content Filtering

### Set Safety Settings

```typescript
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_NONE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_LOW_AND_ABOVE'
  }
];

async function generateWithSafetySettings(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    safetySettings
  });

  return result.response.text();
}
```

### Handle Content Filtering

```typescript
async function safeGenerate(prompt) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const result = await model.generateContent(prompt);

    const response = result.response;
    const content = response.candidates?.[0].content;

    if (!content) {
      const finishReason = response.candidates?.[0].finishReason;
      
      if (finishReason === 'SAFETY') {
        return {
          error: 'Content blocked due to safety guidelines'
        };
      } else if (finishReason === 'MAX_TOKENS') {
        return {
          error: 'Response exceeded maximum token length'
        };
      }
    }

    return {
      text: response.text()
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}
```

## Token Counting

### Count Tokens Before Generation

```typescript
async function countTokens(text) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const result = await model.countTokens(text);
  
  console.log(`Total Tokens: ${result.totalTokens}`);
  console.log(`Input tokens: ${result.usageMetadata.promptTokenCount}`);
  console.log(`Output tokens: ${result.usageMetadata.candidatesTokenCount}`);
  
  return result.totalTokens;
}

// Batch token counting
async function countTokensForBatch(texts) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const totalTokens = 0;
  
  for (const text of texts) {
    const result = await model.countTokens(text);
    totalTokens += result.totalTokens;
  }

  return totalTokens;
}

// Estimate costs
async function estimateCost(prompt) {
  const tokens = await countTokens(prompt);
  
  // Pricing example (check current rates)
  const costPerMillion = {
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 }
  };

  return {
    tokens,
    estimatedCost: (tokens / 1000000) * costPerMillion['gemini-1.5-flash'].input
  };
}
```

## Error Handling

### Handle Common Errors

```typescript
async function robustGenerate(prompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
  });

  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;

      if (error.status === 429) {
        // Rate limited - wait before retry
        const wait = Math.pow(2, i) * 1000;
        console.log(`Rate limited. Waiting ${wait}ms`);
        await new Promise(resolve => setTimeout(resolve, wait));
      } else if (error.status === 400) {
        // Bad request - don't retry
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.status === 401 || error.status === 403) {
        // Auth error - don't retry
        throw new Error(`Authentication error: ${error.message}`);
      }
    }
  }

  throw lastError;
}
```

## Best Practices

### 1. Use Appropriate Models

```typescript
// Flash for speed and cost
const summary = await genAI
  .getGenerativeModel({ model: 'gemini-1.5-flash' })
  .generateContent('Summarize this: ' + text);

// Pro for complex tasks
const analysis = await genAI
  .getGenerativeModel({ model: 'gemini-1.5-pro' })
  .generateContent('Deeply analyze: ' + complexText);
```

### 2. Implement Caching for Repeated Context

```typescript
const cachedSystemPrompt = 'You are an expert...'; // Reuse across requests

const result = await model.generateContent({
  contents: [
    {
      role: 'user',
      parts: [{ text: userPrompt }]
    }
  ],
  systemInstruction: cachedSystemPrompt
});
```

### 3. Stream for Better UX

```typescript
// Always stream for better user experience
const result = await model.generateContentStream(prompt);
for await (const chunk of result.stream) {
  updateUI(chunk.text());
}
```

### 4. Monitor Token Usage

```typescript
async function generateWithTracking(prompt) {
  const tokens = await countTokens(prompt);
  console.log(`Prompt uses ${tokens} tokens`);

  const result = await model.generateContent(prompt);
  const response = result.response;

  console.log(`Total tokens used: ${
    response.usageMetadata.promptTokenCount +
    response.usageMetadata.candidatesTokenCount
  }`);
  
  return response.text();
}
```

### 5. Version Your API Calls

```typescript
const MODELS = {
  FAST: 'gemini-1.5-flash',
  CAPABLE: 'gemini-1.5-pro',
  LATEST: 'gemini-2-flash-exp'
};

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || MODELS.FAST
});
```

## Conclusion

Google's Gemini API provides powerful generative AI capabilities with multiple models for different use cases. Mastering text generation, function calling, multimodal inputs, and optimization techniques enables building intelligent applications with natural language understanding and generation at scale.
