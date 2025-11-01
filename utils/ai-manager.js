// ============================================
// AI Manager - Handles all Chrome Built-in AI APIs
// ============================================

import { scheduleRemindersForActionItem } from './reminder-manager.js';

export class AIManager {
  constructor() {
    this.promptAPI = null;
    this.summarizerAPI = null;
    this.writerAPI = null;
    this.proofreaderAPI = null;
    this.translatorAPI = null;
    this.available = {
      prompt: false,
      summarizer: false,
      writer: false,
      proofreader: false,
      translator: false
    };
    this.fallbackToWebSpeech = false;
    
    // Response cache for performance optimization
    this.cache = new Map();
    this.cacheMaxSize = 100;
    this.cacheMaxAge = 1000 * 60 * 60; // 1 hour
  }
  
  /**
   * Generate cache key from input text
   * @param {string} type - Type of operation (summary, action-items, email)
   * @param {string} input - Input text
   * @returns {string} - Cache key
   */
  getCacheKey(type, input) {
    // Create a simple hash of the input
    const hash = input.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `${type}_${hash}`;
  }
  
  /**
   * Get cached response if available and not expired
   * @param {string} key - Cache key
   * @returns {any} - Cached response or null
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`✅ Cache hit for ${key}`);
    return cached.data;
  }
  
  /**
   * Store response in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCached(key, data) {
    // Limit cache size
    if (this.cache.size >= this.cacheMaxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  async initialize() {
    console.log('🤖 Initializing AI Manager...');
    
    try {
      await this.checkAvailability();
      
      // Initialize available APIs
      if (this.available.prompt) {
        await this.initializePromptAPI();
      }
      
      if (this.available.summarizer) {
        await this.initializeSummarizerAPI();
      }
      
      if (this.available.writer) {
        await this.initializeWriterAPI();
      }
      
      console.log('✅ AI Manager initialized:', this.available);
      
    } catch (error) {
      console.error('❌ Error initializing AI Manager:', error);
      this.fallbackToWebSpeech = true;
    }
  }

  async checkAvailability() {
    // Check if Chrome Built-in AI APIs are available
    try {
      // Prompt API
      if ('ai' in window && 'languageModel' in window.ai) {
        this.available.prompt = true;
      }
      
      // Summarizer API
      if ('ai' in window && 'summarizer' in window.ai) {
        this.available.summarizer = true;
      }
      
      // Writer API
      if ('ai' in window && 'writer' in window.ai) {
        this.available.writer = true;
      }
      
      // Proofreader API
      if ('ai' in window && 'rewriter' in window.ai) {
        this.available.proofreader = true;
      }
      
      // Translator API
      if ('ai' in window && 'translator' in window.ai) {
        this.available.translator = true;
      }
      
    } catch (error) {
      console.warn('⚠️ Chrome AI APIs not available:', error);
    }
    
    return this.available;
  }

  async initializePromptAPI() {
    try {
      const capabilities = await window.ai.languageModel.capabilities();
      if (capabilities.available === 'readily') {
        this.promptAPI = await window.ai.languageModel.create();
        console.log('✅ Prompt API initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing Prompt API:', error);
      this.available.prompt = false;
    }
  }

  async initializeSummarizerAPI() {
    try {
      const capabilities = await window.ai.summarizer.capabilities();
      if (capabilities.available === 'readily') {
        this.summarizerAPI = await window.ai.summarizer.create({
          type: 'key-points',
          format: 'markdown',
          length: 'medium'
        });
        console.log('✅ Summarizer API initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing Summarizer API:', error);
      this.available.summarizer = false;
    }
  }

  async initializeWriterAPI() {
    try {
      const capabilities = await window.ai.writer.capabilities();
      if (capabilities.available === 'readily') {
        this.writerAPI = await window.ai.writer.create();
        console.log('✅ Writer API initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing Writer API:', error);
      this.available.writer = false;
    }
  }

  // Transcribe audio (fallback to Web Speech API)
  async transcribeAudio(audioBlob) {
    try {
      // TODO: When Prompt API supports audio, use it here
      // For now, use Web Speech API as fallback
      
      return await this.transcribeWithWebSpeech(audioBlob);
      
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      return null;
    }
  }

  // Fallback: Web Speech API for transcription
  async transcribeWithWebSpeech(audioBlob) {
    return new Promise((resolve, reject) => {
      try {
        if (!('webkitSpeechRecognition' in window)) {
          reject(new Error('Web Speech API not supported'));
          return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        // Convert blob to audio element
        const audioURL = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioURL);

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;
          
          resolve({
            text: transcript,
            confidence: confidence,
            speaker: 'Unknown',
            method: 'webspeech'
          });
          
          URL.revokeObjectURL(audioURL);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          reject(new Error(event.error));
          URL.revokeObjectURL(audioURL);
        };

        recognition.onend = () => {
          URL.revokeObjectURL(audioURL);
        };

        // Play audio and start recognition
        audio.play();
        recognition.start();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate summary using Summarizer API
  async generateSummary(text) {
    try {
      if (!text || text.trim().length === 0) {
        return null;
      }
      
      // Check cache first
      const cacheKey = this.getCacheKey('summary', text);
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      let summaryText;
      let keyMoments = [];

      // Try Summarizer API first
      if (this.available.summarizer && this.summarizerAPI) {
        summaryText = await this.summarizerAPI.summarize(text);
        
        // Extract key moments using Prompt API
        if (this.available.prompt && this.promptAPI) {
          const keyMomentsPrompt = `From this meeting transcript, extract 3-5 key moments with timestamps (if available). Format as bullet points:\n\n${text}`;
          const keyMomentsResponse = await this.promptAPI.prompt(keyMomentsPrompt);
          keyMoments = keyMomentsResponse.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
        }
      } 
      // Fallback to Prompt API
      else if (this.available.prompt && this.promptAPI) {
        const prompt = `Summarize this meeting transcript in 3-5 bullet points:\n\n${text}`;
        summaryText = await this.promptAPI.prompt(prompt);
      } 
      // Manual fallback
      else {
        summaryText = this.generateSimpleSummary(text);
      }

      const result = {
        text: summaryText,
        keyMoments: keyMoments,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      this.setCached(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('❌ Error generating summary:', error);
      return {
        text: this.generateSimpleSummary(text),
        keyMoments: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Extract action items using Prompt API with STRUCTURED OUTPUT
  async extractActionItems(text) {
    try {
      if (!text || text.trim().length === 0) {
        return [];
      }
      
      // Check cache first
      const cacheKey = this.getCacheKey('action-items', text);
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }

      let actionItems = [];

      if (this.available.prompt && this.promptAPI) {
        console.log('🔍 Using Prompt API for action item extraction...');
        
        // ============================================
        // SIMPLIFIED BUT POWERFUL ACTION ITEM PROMPT
        // ============================================
        const prompt = `Extract action items from this meeting transcript. Return ONLY a JSON array, nothing else.

FORMAT (must be valid JSON):
[
  {"who": "Name", "task": "Description", "due": "Deadline or Not specified"}
]

RULES:
1. WHO: Person's first name (Sarah, John, etc.) or "Unassigned" or "Team"
2. TASK: Start with action verb, include key context
3. DUE: Extract deadline if mentioned, otherwise "Not specified"
4. Look for patterns: "X will", "X needs to", "X, can you", "X should", "X is going to"
5. Return [] if no action items found

EXAMPLES:
Input: "Sarah, can you send the report by Friday?"
Output: [{"who": "Sarah", "task": "Send the report", "due": "Friday"}]

Input: "John will review the code and Maria needs to update docs by EOD"
Output: [{"who": "John", "task": "Review the code", "due": "Not specified"}, {"who": "Maria", "task": "Update docs", "due": "EOD"}]

Input: "We should schedule a meeting"
Output: [{"who": "Team", "task": "Schedule a meeting", "due": "Not specified"}]

TRANSCRIPT:
${text}

Return ONLY the JSON array:`;

        const response = await this.promptAPI.prompt(prompt);
        console.log('📥 AI Response received, length:', response?.length || 0);
        console.log('📄 First 200 chars:', response?.substring(0, 200));
        
        try {
          // Extract JSON array from response
          const jsonMatch = response.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            console.log('✅ JSON found in response');
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON parsed successfully, items:', parsed.length);
            
            // Validate and normalize structure
            actionItems = parsed.map(item => ({
              who: this.normalizeAssignee(item.who || item.assignee || 'Unassigned'),
              task: this.normalizeTask(item.task || item.action || item.description || ''),
              due: this.normalizeDue(item.due || item.deadline || 'Not specified')
            })).filter(item => item.task && item.task.length > 0);
            
            console.log('✅ Structured action items extracted:', actionItems.length);
          } else {
            // Fallback: Parse line by line
            console.warn('⚠️ No JSON found, falling back to text parsing');
            actionItems = this.parseActionItemsFromText(response);
          }
        } catch (error) {
          console.error('❌ JSON parse error, using fallback:', error);
          actionItems = this.parseActionItemsFromText(response);
        }
      } else {
        // Simple keyword-based extraction
        actionItems = this.extractActionItemsSimple(text);
      }

      // Add IDs, timestamps, and internal fields
      const result = actionItems.map((item, index) => ({
        id: `${Date.now()}_${index}`,
        who: item.who || item.assignee || 'Unassigned',
        task: item.task || item,
        due: item.due || item.deadline || 'Not specified',
        priority: item.priority || 'medium', // Internal field (can be enhanced later)
        status: 'pending',
        timestamp: new Date().toISOString()
      }));
      
      // Cache the result
      this.setCached(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('❌ Error extracting action items:', error);
      return [];
    }
  }
  
  /**
   * Normalize assignee name
   */
  normalizeAssignee(who) {
    if (!who || who.trim().length === 0) return 'Unassigned';
    
    // Capitalize first letter
    const normalized = who.trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  
  /**
   * Normalize task description
   */
  normalizeTask(task) {
    if (!task || task.trim().length === 0) return '';
    
    // Remove leading bullets, dashes, numbers
    let normalized = task.trim().replace(/^[-•*\d.)\]]+\s*/, '');
    
    // Capitalize first letter
    if (normalized.length > 0) {
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    
    // Ensure ends with period if it doesn't have punctuation
    if (!/[.!?]$/.test(normalized)) {
      normalized += '.';
    }
    
    return normalized;
  }
  
  /**
   * Normalize due date
   */
  normalizeDue(due) {
    if (!due || due.trim().length === 0 || due.toLowerCase() === 'null' || due.toLowerCase() === 'none') {
      return 'Not specified';
    }
    
    const normalized = due.trim();
    
    // Common patterns
    if (/^(not specified|no deadline|tbd|to be determined)$/i.test(normalized)) {
      return 'Not specified';
    }
    
    return normalized;
  }

  // Generate email using Writer API or Prompt API with STRUCTURED DATA
  async generateEmail(data) {
    try {
      const { meetingTitle, date, summaries, actionItems } = data;

      let emailBody;

      if (this.available.prompt && this.promptAPI) {
        // ============================================
        // PROFESSIONAL EMAIL DRAFT PROMPT
        // ============================================
        
        // Format action items as structured list
        const actionItemsList = actionItems.map(a => 
          `- ${a.task || a.text} (Assigned: ${a.who || a.assignee || 'Unassigned'}${a.due && a.due !== 'Not specified' ? ', Due: ' + a.due : ''})`
        ).join('\n');
        
        // Format summaries
        const summaryText = summaries && summaries.length > 0 
          ? summaries.map(s => s.text || s.summary).join('\n\n')
          : 'No summary available yet.';
        
        const prompt = `You are a professional executive assistant. Create a polished follow-up email for this meeting.

MEETING DETAILS:
- Title: ${meetingTitle}
- Date: ${date}

KEY DISCUSSION POINTS:
${summaryText}

ACTION ITEMS:
${actionItemsList || '(No action items identified)'}

INSTRUCTIONS:
1. Write a professional, warm, but concise follow-up email
2. Start with a brief thank you for attending
3. Summarize 2-3 key highlights from the discussion (bullet points)
4. List all action items clearly with assignees and due dates
5. Include a friendly closing inviting questions or clarifications
6. Keep the tone professional but approachable
7. Use proper email formatting with line breaks

DO NOT include:
- Subject line (will be added separately)
- Email signatures
- "From/To" fields

Write ONLY the email body:`;

        emailBody = await this.promptAPI.prompt(prompt);
        
        // Clean up the response
        emailBody = emailBody.trim();
        
        // Remove any accidental subject lines
        emailBody = emailBody.replace(/^Subject:.*\n\n?/i, '');
        
      } else if (this.available.writer && this.writerAPI) {
        const context = `Meeting: ${meetingTitle}\nDate: ${date}\n\nSummary:\n${summaries.map(s => s.summary || s.text).join('\n\n')}\n\nAction Items:\n${actionItems.map(a => `- ${a.task || a.text} (${a.who || a.assignee}${a.due && a.due !== 'Not specified' ? ', ' + a.due : ''})`).join('\n')}`;
        
        emailBody = await this.writerAPI.write(context, {
          tone: 'professional',
          format: 'email',
          length: 'medium'
        });
      } else {
        emailBody = this.generateSimpleEmail(data);
      }

      return {
        subject: `Follow-up: ${meetingTitle}`,
        body: emailBody,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating email:', error);
      return {
        subject: `Follow-up: ${data.meetingTitle}`,
        body: this.generateSimpleEmail(data),
        timestamp: new Date().toISOString()
      };
    }
  }

  // Utility: Simple summary fallback
  generateSimpleSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const numSentences = Math.min(5, Math.ceil(sentences.length * 0.2));
    return sentences.slice(0, numSentences).join('. ') + '.';
  }

  // Utility: Simple action item extraction (fallback when AI unavailable)
  extractActionItemsSimple(text) {
    const keywords = ['will', 'should', 'need to', 'must', 'have to', 'going to', 'action item', 'todo', 'task', 'follow up', 'make sure'];
    const sentences = text.split(/[.!?]+/);
    
    return sentences
      .filter(sentence => keywords.some(keyword => sentence.toLowerCase().includes(keyword)))
      .slice(0, 10)
      .map(sentence => {
        const cleanTask = sentence.trim();
        
        // Try to extract who from sentence
        let who = 'Unassigned';
        const namePatterns = [
          /(?:^|\s)([A-Z][a-z]+)\s+(?:will|should|needs?|must)/,
          /(?:assign|give)\s+(?:to|it to)\s+([A-Z][a-z]+)/i,
          /([A-Z][a-z]+),?\s+(?:can you|could you|please)/
        ];
        
        for (const pattern of namePatterns) {
          const match = cleanTask.match(pattern);
          if (match) {
            who = match[1];
            break;
          }
        }
        
        return {
          who: this.normalizeAssignee(who),
          task: this.normalizeTask(cleanTask),
          due: 'Not specified'
        };
      });
  }

  // Utility: Parse action items from text response (fallback for non-JSON)
  parseActionItemsFromText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    return lines.map(line => {
      const cleanLine = line.replace(/^[-•*\d.)\]]+\s*/, '').trim();
      
      // Try to extract assignee with IMPROVED patterns
      let who = 'Unassigned';
      let task = cleanLine;
      let due = 'Not specified';
      
      // Pattern 1: "Name: task" or "Name - task" (most common)
      const colonMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[\s:-]+(.+)/);
      if (colonMatch) {
        who = colonMatch[1];
        task = colonMatch[2].trim();
      }
      
      // Pattern 2: "@Name" (social media style)
      const atMatch = cleanLine.match(/@([A-Za-z]+)/);
      if (atMatch && who === 'Unassigned') {
        who = atMatch[1];
        task = cleanLine.replace(/@\w+/g, '').trim();
      }
      
      // Pattern 3: "(Name)" or "[Name]" at start or end
      const parenMatch = cleanLine.match(/[\(\[]([A-Z][a-z]+)[\)\]]|[\(\[]([A-Z][a-z]+)[\)\]]$/);
      if (parenMatch && who === 'Unassigned') {
        who = parenMatch[1] || parenMatch[2];
        task = cleanLine.replace(/[\(\[]([A-Z][a-z]+)[\)\]]/g, '').trim();
      }
      
      // Pattern 4: "Name will/should/needs to" within text
      const willMatch = task.match(/\b([A-Z][a-z]+)\s+(?:will|should|needs? to|has to|must|is going to)\s+(.+)/i);
      if (willMatch && who === 'Unassigned') {
        who = willMatch[1];
        task = willMatch[2].trim();
      }
      
      // Pattern 5: "Task (assignee: Name)" or "Task - Name"
      const assigneeMatch = task.match(/(.+?)(?:\(assignee:\s*([A-Za-z]+)\)|\s*-\s*([A-Z][a-z]+)\s*$)/i);
      if (assigneeMatch && who === 'Unassigned') {
        task = assigneeMatch[1].trim();
        who = assigneeMatch[2] || assigneeMatch[3];
      }
      
      // Try to extract deadline with IMPROVED patterns
      const duePatterns = [
        // "by Friday", "by tomorrow", "by next week"
        /\b(?:by|due|deadline|before)\s+([^,.()\[\]]+?)(?:\s*[,.()\[\]]|$)/i,
        // "EOD", "end of day", "end of week"
        /\b(eod|end of day|end of week|asap|this week|next week|tomorrow|today)\b/i,
        // Dates like "May 15", "5/15", "2024-05-15"
        /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\w+ \d{1,2}|\d{4}-\d{2}-\d{2})\b/,
        // "Friday", "Monday", etc
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
      ];
      
      for (const pattern of duePatterns) {
        const match = task.match(pattern);
        if (match) {
          due = match[1] || match[0];
          // Remove deadline from task
          task = task.replace(match[0], '').trim();
          break;
        }
      }
      
      return {
        who: this.normalizeAssignee(who),
        task: this.normalizeTask(task),
        due: this.normalizeDue(due),
        priority: 'medium'
      };
    }).filter(item => item.task && item.task.length > 5); // Filter out very short tasks
  }

  // Utility: Simple email generation (fallback when AI unavailable)
  generateSimpleEmail(data) {
    const summaryText = data.summaries && data.summaries.length > 0
      ? data.summaries.map(s => s.text || s.summary).join('\n\n')
      : 'Discussion covered various topics and team alignment.';
    
    const actionItemsList = data.actionItems && data.actionItems.length > 0
      ? data.actionItems.map(a => {
          const who = a.who || a.assignee || 'Unassigned';
          const task = a.task || a.text || '';
          const due = a.due && a.due !== 'Not specified' ? ` (Due: ${a.due})` : '';
          return `  • ${task} - ${who}${due}`;
        }).join('\n')
      : '  • No action items identified';
    
    return `Hi Team,

Thank you for attending "${data.meetingTitle}" on ${data.date}.

KEY HIGHLIGHTS:
${summaryText}

ACTION ITEMS:
${actionItemsList}

Please reach out if you have any questions or need clarification on your action items.

Best regards`;
  }

  // Check if AI is available
  isAvailable() {
    return Object.values(this.available).some(v => v === true);
  }

  /**
   * ============================================
   * MEETING IQ ANALYSIS METHODS
   * ============================================
   */

  /**
   * Analyze participation balance using AI
   * @param {Array} transcripts - Array of transcript objects
   * @param {Map} speakers - Speaker data map
   * @returns {Object} - Participation analysis
   */
  async analyzeParticipation(transcripts, speakers) {
    if (!transcripts || transcripts.length === 0) {
      return { score: 0, analysis: 'No data available' };
    }

    const speakersArray = Array.from(speakers.values());
    const totalTalkTime = speakersArray.reduce((sum, s) => sum + s.talkTime, 0);

    const prompt = `Analyze this meeting participation data:

Speakers: ${speakersArray.length}
Speaker breakdown:
${speakersArray.map(s => {
  const percentage = totalTalkTime > 0 ? Math.round((s.talkTime / totalTalkTime) * 100) : 0;
  const timeSinceLastSpoke = Math.round((Date.now() - s.lastSpoke) / 60000);
  return `- ${s.name}: ${percentage}% talk time, ${s.contributions} contributions, last spoke ${timeSinceLastSpoke} min ago`;
}).join('\n')}

Analyze:
1. Is participation balanced?
2. Who should be encouraged to speak more?
3. Is anyone dominating the conversation?
4. Rate participation balance: 0-100

Return JSON:
{
  "score": 0-100,
  "balanced": true/false,
  "quietParticipants": ["name"],
  "dominantSpeaker": "name or null",
  "recommendation": "actionable tip"
}`;

    try {
      if (this.available.prompt && this.promptAPI) {
        const response = await this.promptAPI.prompt(prompt);
        const parsed = this.parseJSONResponse(response);
        return parsed || { score: 50, analysis: 'Unable to analyze' };
      }
    } catch (error) {
      console.warn('[AI Manager] Participation analysis failed:', error);
    }

    // Fallback: Simple calculation
    const maxPercentage = Math.max(...speakersArray.map(s => 
      totalTalkTime > 0 ? s.talkTime / totalTalkTime : 0
    ));

    return {
      score: maxPercentage > 0.6 ? 40 : (maxPercentage > 0.4 ? 70 : 90),
      balanced: maxPercentage <= 0.4,
      recommendation: maxPercentage > 0.6 ? 'Encourage others to participate' : 'Good balance'
    };
  }

  /**
   * Analyze meeting focus and topic coherence
   * @param {Array} transcripts - Recent transcripts
   * @returns {Object} - Focus analysis
   */
  async analyzeFocus(transcripts) {
    if (!transcripts || transcripts.length < 5) {
      return { score: 100, analysis: 'Too early to analyze' };
    }

    const recentTranscripts = transcripts.slice(-20); // Last 20 entries
    const conversationText = recentTranscripts
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const prompt = `Analyze this meeting conversation for focus and clarity:

${conversationText}

Evaluate:
1. How many distinct topics are being discussed?
2. Is the conversation staying focused or jumping around?
3. Are there clear main themes?
4. Is there productive discussion or circular talking?
5. Rate focus/clarity: 0-100

Return JSON:
{
  "score": 0-100,
  "topicsIdentified": ["topic1", "topic2"],
  "topicSwitches": number,
  "mainTheme": "description",
  "isFocused": true/false,
  "recommendation": "actionable tip"
}`;

    try {
      if (this.available.prompt && this.promptAPI) {
        const response = await this.promptAPI.prompt(prompt);
        const parsed = this.parseJSONResponse(response);
        return parsed || { score: 70, analysis: 'Unable to analyze' };
      }
    } catch (error) {
      console.warn('[AI Manager] Focus analysis failed:', error);
    }

    // Fallback: Simple heuristic
    return {
      score: 70,
      isFocused: true,
      recommendation: 'Continue discussion'
    };
  }

  /**
   * Analyze action items and outcome orientation
   * @param {Array} actionItems - Current action items
   * @param {number} durationMinutes - Meeting duration
   * @returns {Object} - Action analysis
   */
  async analyzeActionOrientation(actionItems, durationMinutes) {
    const actionCount = actionItems.length;
    const actionsPerTenMin = (actionCount / durationMinutes) * 10;

    const prompt = `Analyze action items from a meeting:

Meeting duration: ${Math.round(durationMinutes)} minutes
Action items identified: ${actionCount}

Action items:
${actionItems.map((a, i) => `${i + 1}. ${a.text || a}`).join('\n')}

Evaluate:
1. Are these concrete, actionable items?
2. Is the rate of action items appropriate (target: 1-2 per 10 min)?
3. Are items specific enough?
4. Rate action orientation: 0-100

Return JSON:
{
  "score": 0-100,
  "actionRate": "low/good/high",
  "specificity": "vague/clear/excellent",
  "recommendation": "actionable tip"
}`;

    try {
      if (this.available.prompt && this.promptAPI) {
        const response = await this.promptAPI.prompt(prompt);
        const parsed = this.parseJSONResponse(response);
        return parsed || { score: 60, analysis: 'Unable to analyze' };
      }
    } catch (error) {
      console.warn('[AI Manager] Action analysis failed:', error);
    }

    // Fallback: Simple calculation
    let score = 20;
    if (actionsPerTenMin >= 2) score = 90;
    else if (actionsPerTenMin >= 1) score = 75;
    else if (actionCount > 0) score = 50;

    return {
      score,
      actionRate: actionsPerTenMin >= 1 ? 'good' : 'low',
      recommendation: actionCount === 0 ? 'Define clear next steps' : 'Good progress'
    };
  }

  /**
   * Analyze decision-making velocity
   * @param {Array} questions - Questions asked
   * @param {Array} decisions - Decisions made
   * @returns {Object} - Decision analysis
   */
  async analyzeDecisionVelocity(questions, decisions) {
    const questionCount = questions.length;
    const decisionCount = decisions.length;

    const prompt = `Analyze decision-making in a meeting:

Questions raised: ${questionCount}
Decisions made: ${decisionCount}

Questions:
${questions.slice(-5).map((q, i) => `${i + 1}. ${q.text || q}`).join('\n')}

Decisions:
${decisions.slice(-5).map((d, i) => `${i + 1}. ${d.text || d}`).join('\n')}

Evaluate:
1. Are questions being resolved quickly?
2. Is decision-making efficient?
3. Are there pending unresolved items?
4. Rate decision velocity: 0-100

Return JSON:
{
  "score": 0-100,
  "resolutionRate": "low/medium/high",
  "pendingItems": number,
  "recommendation": "actionable tip"
}`;

    try {
      if (this.available.prompt && this.promptAPI) {
        const response = await this.promptAPI.prompt(prompt);
        const parsed = this.parseJSONResponse(response);
        return parsed || { score: 60, analysis: 'Unable to analyze' };
      }
    } catch (error) {
      console.warn('[AI Manager] Decision analysis failed:', error);
    }

    // Fallback: Simple calculation
    const resolutionRate = questionCount > 0 ? decisionCount / questionCount : 1;
    const score = Math.min(100, Math.round(resolutionRate * 100));

    return {
      score,
      resolutionRate: score > 70 ? 'high' : (score > 40 ? 'medium' : 'low'),
      recommendation: score < 50 ? 'Speed up decision-making' : 'Good velocity'
    };
  }

  /**
   * Analyze engagement quality
   * @param {Array} transcripts - All transcripts
   * @param {number} durationMinutes - Meeting duration
   * @returns {Object} - Engagement analysis
   */
  async analyzeEngagement(transcripts, durationMinutes) {
    if (!transcripts || transcripts.length === 0) {
      return { score: 0, analysis: 'No data' };
    }

    const recentTranscripts = transcripts.slice(-15);
    const conversationText = recentTranscripts
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');

    const prompt = `Analyze engagement quality in this conversation:

${conversationText}

Evaluate:
1. Are people actively engaged or passive?
2. Is there good back-and-forth dialogue?
3. Are questions being asked?
4. Is discussion substantive or superficial?
5. Rate engagement quality: 0-100

Return JSON:
{
  "score": 0-100,
  "engagementLevel": "low/medium/high",
  "dialogueQuality": "poor/good/excellent",
  "recommendation": "actionable tip"
}`;

    try {
      if (this.available.prompt && this.promptAPI) {
        const response = await this.promptAPI.prompt(prompt);
        const parsed = this.parseJSONResponse(response);
        return parsed || { score: 70, analysis: 'Unable to analyze' };
      }
    } catch (error) {
      console.warn('[AI Manager] Engagement analysis failed:', error);
    }

    // Fallback: Simple calculation
    const interactionRate = transcripts.length / durationMinutes;
    const score = Math.min(100, Math.round(interactionRate * 8));

    return {
      score: Math.max(50, score),
      engagementLevel: score > 70 ? 'high' : (score > 50 ? 'medium' : 'low'),
      recommendation: 'Continue discussion'
    };
  }

  /**
   * Helper: Parse JSON from AI response
   */
  parseJSONResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.warn('[AI Manager] JSON parse failed:', error);
      return null;
    }
  }
}
