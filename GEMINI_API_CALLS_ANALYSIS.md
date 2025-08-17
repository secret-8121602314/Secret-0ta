# 🔍 Gemini API Calls Analysis

## 📍 **When & Where Users Make API Calls to Gemini**

### **🎯 Primary API Call Triggers**

#### **1. User Chat Messages (Most Common)**
- **Location**: `services/geminiService.ts` → `sendMessage()` function
- **Trigger**: User types and sends a text message in chat
- **Model Used**: `gemini-2.5-pro` (via `getOptimalModel('chat')`)
- **API Endpoint**: `chat.sendMessageStream({ message })`
- **When**: Every time user sends a chat message
- **Cooldown**: 1 hour if quota exceeded

#### **2. Image Analysis (Screenshot Uploads)**
- **Location**: `services/geminiService.ts` → `sendMessageWithImages()` function
- **Trigger**: User uploads screenshot/image
- **Model Used**: `gemini-2.5-pro` (via `getOptimalModel('chat_with_images')`)
- **API Endpoint**: `chat.sendMessageStream({ message: [...imageParts, textPart] })`
- **When**: Every screenshot upload
- **Cooldown**: 1 hour if quota exceeded

#### **3. Insight Tab Generation (Pro/Vanguard Users Only)**
- **Location**: `services/geminiService.ts` → `generateInsightStream()` function
- **Trigger**: 
  - **Initial**: When creating new game pill (background generation)
  - **On-Demand**: When user clicks on placeholder insight tab
  - **Progress Updates**: When game progress changes significantly (>10%)
- **Model Used**: `gemini-2.5-pro` (via `getOptimalModel('insight_generation')`)
- **API Endpoint**: `ai.models.generateContentStream({ model, contents, config })`
- **When**: 
  - Game pill creation (automatic)
  - User clicks insight tab (manual)
  - Progress changes (automatic)
- **Cooldown**: 1 hour if quota exceeded

#### **4. News & Content Generation**
- **Location**: `services/geminiService.ts` → `getGameNews()` function
- **Trigger**: User requests gaming news
- **Model Used**: `gemini-2.5-pro` (default)
- **API Endpoint**: `ai.models.generateContentStream()`
- **When**: News requests (cached for 24 hours)
- **Cooldown**: 1 hour if quota exceeded

### **🔄 API Call Flow & Timing**

#### **Immediate API Calls (User-Triggered)**
```
User Action → Immediate Gemini API Call
├── Type message → sendMessage() → gemini-2.5-pro
├── Upload image → sendMessageWithImages() → gemini-2.5-pro  
└── Click insight tab → generateInsightStream() → gemini-2.5-pro
```

#### **Background API Calls (Automatic)**
```
System Event → Background Gemini API Call
├── Create game pill → generateInsightsInBackground() → Progressive generation
├── Progress change → updateInsightsForProgress() → Regenerate relevant insights
└── News request → getGameNews() → Generate news content
```

### **⏱️ API Call Timing & Frequency**

#### **High Frequency (Every User Action)**
- **Chat Messages**: Every message sent
- **Image Analysis**: Every screenshot uploaded
- **Insight Tab Clicks**: Every tab clicked (if not loaded)

#### **Medium Frequency (Automatic)**
- **Game Pill Creation**: Once per new game
- **Progress Updates**: When progress changes >10%
- **Background Generation**: Progressive, every 2 seconds

#### **Low Frequency (Cached)**
- **News Content**: Once per day (24-hour cache)
- **Game Information**: Cached based on usage patterns

### **🎮 User Tier Impact on API Calls**

#### **Free Tier**
- **Chat Messages**: ✅ Limited by quota
- **Image Analysis**: ✅ Limited by quota
- **Insight Tabs**: ❌ Not available
- **News**: ✅ Limited by quota

#### **Pro Tier**
- **Chat Messages**: ✅ Full access
- **Image Analysis**: ✅ Full access
- **Insight Tabs**: ✅ Full access + background generation
- **News**: ✅ Full access

#### **Vanguard Pro Tier**
- **Chat Messages**: ✅ Full access + priority
- **Image Analysis**: ✅ Full access + priority
- **Insight Tabs**: ✅ Full access + priority + faster generation
- **News**: ✅ Full access + priority

### **🚫 API Call Prevention & Cooldowns**

#### **Cooldown System**
```typescript
const COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hour

const checkCooldown = (onError: (error: string) => void): boolean => {
    const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
    if (cooldownEnd && Date.now() < parseInt(cooldownEnd, 10)) {
        const timeRemaining = Math.ceil((parseInt(cooldownEnd, 10) - Date.now()) / (1000 * 60));
        onError(`The AI is currently resting due to high traffic. Please try again in about ${timeRemaining} minute(s).`);
        return true;
    }
    return false;
};
```

#### **Quota Management**
- **Text Queries**: Tracked per user tier
- **Image Queries**: Tracked per user tier
- **Insight Generation**: Counted against text quota
- **News Generation**: Counted against text quota

### **🔧 API Call Optimization Features**

#### **Smart Model Selection**
```typescript
const getOptimalModel = (task: string): GeminiModel => {
    // Use Pro model for better performance on complex tasks
    // Flash model can be slower for complex reasoning
    return 'gemini-2.5-pro';
};
```

#### **Progressive Insight Generation**
```typescript
// Generate insights one by one with smart delays
for (let i = 0; i < tabs.length; i++) {
    // Generate content for each tab
    const content = await generateInsightContent(...);
    
    // Smart delay between generations (2 seconds)
    if (i < tabs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
```

#### **Caching & Reuse**
- **Chat History**: Reused for context
- **News Content**: 24-hour cache
- **Insight Content**: Cached per game + progress
- **User Context**: Cached for personalization

### **📊 API Call Volume Estimation**

#### **Per User Session (Typical)**
- **Chat Messages**: 5-20 calls
- **Image Analysis**: 1-5 calls
- **Insight Generation**: 3-8 calls (Pro/Vanguard)
- **News Requests**: 0-2 calls

#### **Per Game Pill (Pro/Vanguard)**
- **Initial Creation**: 0 API calls (instant tabs)
- **Background Generation**: 3-8 calls over 6-16 seconds
- **User Clicks**: 0-3 calls (if not background-generated)
- **Progress Updates**: 1-3 calls per significant progress change

### **🎯 Key Takeaways**

1. **Most API Calls**: User chat messages and image uploads
2. **Smart Optimization**: Background generation prevents blocking
3. **Tier-Based Access**: Pro/Vanguard get more API calls for insights
4. **Cooldown Protection**: 1-hour cooldown prevents abuse
5. **Progressive Loading**: Spreads API load over time
6. **Caching Strategy**: Reduces unnecessary API calls

### **💡 Optimization Recommendations**

1. **Use Background Generation**: Let insights generate automatically
2. **Batch Image Uploads**: Upload multiple images at once
3. **Cache Frequently**: Reuse generated content when possible
4. **Monitor Quota**: Check usage limits for your tier
5. **Smart Timing**: Avoid rapid-fire API calls

---

**🔍 Result: Users make Gemini API calls primarily for chat, image analysis, and insight generation, with smart optimization to minimize blocking and maximize performance!**
