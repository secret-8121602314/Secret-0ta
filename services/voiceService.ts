import { ttsService } from './ttsService';

export interface VoiceCommand {
  command: string;
  confidence: number;
  transcript: string;
}

export interface VoiceResponse {
  text: string;
  shouldSpeak: boolean;
  audioUrl?: string;
}

class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSpeaking = false;
  private onCommandCallback?: (command: VoiceCommand) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;

      this.recognition.onresult = (event: any) => {
        const result = event.results[0];
        if (result.isFinal) {
          const command: VoiceCommand = {
            command: this.parseVoiceCommand(result[0].transcript),
            confidence: result[0].confidence,
            transcript: result[0].transcript
          };
          
          this.onCommandCallback?.(command);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.onErrorCallback?.(event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  private initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }

  private parseVoiceCommand(transcript: string): string {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Common gaming voice commands
    const commands = {
      // Help commands
      'help me': 'help',
      'i need help': 'help',
      'what should i do': 'help',
      'give me a hint': 'hint',
      'i need a hint': 'hint',
      'hint please': 'hint',
      
      // Game progress commands
      'where am i': 'location',
      'what is my objective': 'objective',
      'what should i do next': 'next_step',
      'how do i progress': 'progress',
      'what am i missing': 'missing',
      
      // Combat/action commands
      'how do i fight': 'combat',
      'what weapon should i use': 'weapon',
      'how do i defeat this enemy': 'enemy',
      'what is my strategy': 'strategy',
      
      // Exploration commands
      'where should i go': 'direction',
      'what is this place': 'location_info',
      'is there a secret here': 'secrets',
      'what did i miss': 'missed_items',
      
      // Story/lore commands
      'what is the story': 'story',
      'who is this character': 'character',
      'what happened here': 'lore',
      'explain this': 'explain',
      
      // General commands
      'stop talking': 'stop_speech',
      'repeat that': 'repeat',
      'speak slower': 'slow_speech',
      'speak faster': 'fast_speech'
    };

    // Find the best matching command
    for (const [phrase, command] of Object.entries(commands)) {
      if (lowerTranscript.includes(phrase)) {
        return command;
      }
    }

    // If no specific command found, treat as a general question
    return 'general_question';
  }

  // Start listening for voice commands
  startListening(): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  // Stop listening for voice commands
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Speak text response
  speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    voice?: string;
    onEnd?: () => void;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      
      // Try to use a preferred voice
      if (options?.voice) {
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes(options.voice!));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.isSpeaking = true;
      this.synthesis.speak(utterance);
    });
  }

  // Stop speaking
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // Set callback for voice commands
  onCommand(callback: (command: VoiceCommand) => void): void {
    this.onCommandCallback = callback;
  }

  // Set callback for errors
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // Check if voice features are supported
  isSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  // Get current listening state
  getListeningState(): boolean {
    return this.isListening;
  }

  // Get current speaking state
  getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  // Process voice command and generate AI response
  async processVoiceCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const responses: Record<string, string> = {
      help: "I'd be happy to help! What specific aspect of the game are you struggling with?",
      hint: "Let me give you a hint. What area or puzzle are you currently working on?",
      location: "I can help you figure out where you are. What does your current area look like?",
      objective: "Let me check your current objective. What quest or goal are you working on?",
      next_step: "I'll help you figure out the next step. What have you accomplished so far?",
      progress: "Let me assess your progress. What's the last thing you completed?",
      missing: "I can help identify what you might have missed. What area are you exploring?",
      combat: "I'll help with combat strategy. What type of enemy are you facing?",
      weapon: "Let me suggest the best weapon. What enemies are you encountering?",
      enemy: "I can help you defeat this enemy. What are its characteristics?",
      strategy: "Let me develop a strategy for you. What's the current situation?",
      direction: "I'll help guide you. What's your current location and goal?",
      location_info: "I can tell you about this place. What do you see around you?",
      secrets: "Let me help you find secrets. What area are you in?",
      missed_items: "I'll help you find missed items. What area did you just explore?",
      story: "I can explain the story. What part are you curious about?",
      character: "I'll tell you about this character. Who are you asking about?",
      lore: "I can explain the lore. What event or place are you asking about?",
      explain: "I'd be happy to explain. What would you like me to clarify?",
      stop_speech: "I'll stop talking now.",
      repeat: "I'll repeat my last response.",
      slow_speech: "I'll speak more slowly from now on.",
      fast_speech: "I'll speak more quickly from now on.",
      general_question: "I heard your question. Let me help you with that."
    };

    const response = responses[command.command] || "I heard you say: " + command.transcript + ". How can I help you with that?";
    
    return {
      text: response,
      shouldSpeak: true
    };
  }

  // Generate voice-friendly AI response
  generateVoiceFriendlyResponse(aiResponse: string): string {
    // Remove markdown formatting for voice
    let voiceResponse = aiResponse
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic
      .replace(/`(.*?)`/g, '$1')       // Remove code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
      .replace(/\n+/g, '. ')            // Replace newlines with periods
      .replace(/\s+/g, ' ')             // Normalize whitespace
      .trim();

    // Add natural speech patterns
    if (voiceResponse.length > 200) {
      voiceResponse = voiceResponse.substring(0, 200) + "... Would you like me to continue with more details?";
    }

    return voiceResponse;
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.onCommandCallback = undefined;
    this.onErrorCallback = undefined;
  }
}

export const voiceService = new VoiceService();
