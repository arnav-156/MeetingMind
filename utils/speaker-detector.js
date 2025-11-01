// ============================================
// Speaker Detection - Enhanced Implementation
// ============================================

/**
 * Enhanced speaker detection based on multiple signals:
 * - Pause patterns (time gaps between speech)
 * - Text content analysis (pronouns, speech patterns)
 * - Conversation flow (questions vs answers)
 * - Speech length consistency
 */

class SpeakerDetector {
  constructor() {
    this.speakers = []; // Array of speaker objects { id, name, transcripts: [], patterns: {} }
    this.currentSpeaker = null;
    this.lastSpeechTime = null;
    this.lastTranscriptText = '';
    this.speakerChangeThreshold = 1500; // 1.5 seconds of silence = potential speaker change
    this.speakerCount = 0;
    this.conversationContext = []; // Last few transcripts for context
    this.maxContextSize = 10;
  }

  /**
   * Detect if speaker has changed based on multiple signals
   * @param {number} currentTime - Current timestamp
   * @param {string} transcriptText - The text being spoken
   * @returns {boolean} - True if speaker likely changed
   */
  detectSpeakerChange(currentTime, transcriptText = '') {
    if (!this.lastSpeechTime) {
      this.lastSpeechTime = currentTime;
      this.lastTranscriptText = transcriptText;
      return true; // First speaker
    }

    const pauseDuration = currentTime - this.lastSpeechTime;
    let changeScore = 0;
    
    // SIGNAL 1: Pause duration (most reliable)
    if (pauseDuration > this.speakerChangeThreshold) {
      changeScore += 3; // Strong signal
    } else if (pauseDuration > 800) {
      changeScore += 1; // Weak signal
    }
    
    // SIGNAL 2: Conversation turn indicators
    const turnIndicators = this.detectConversationTurn(this.lastTranscriptText, transcriptText);
    if (turnIndicators.isQuestionAnswer) {
      changeScore += 2; // Question followed by answer = likely speaker change
    }
    if (turnIndicators.hasAddressingPattern) {
      changeScore += 2; // "Thanks", "I agree", "Actually" = likely response from different speaker
    }
    
    // SIGNAL 3: Speech pattern change
    const patternChange = this.detectPatternChange(this.lastTranscriptText, transcriptText);
    if (patternChange.significantChange) {
      changeScore += 1;
    }
    
    // SIGNAL 4: Long monologue detection (same speaker continuing)
    if (pauseDuration < 600 && transcriptText.length > 30 && this.lastTranscriptText.length > 30) {
      changeScore -= 2; // Likely same speaker continuing
    }
    
    this.lastSpeechTime = currentTime;
    this.lastTranscriptText = transcriptText;
    
    // Decision: Change speaker if score >= 3
    return changeScore >= 3;
  }

  /**
   * Detect conversation turn patterns
   * @param {string} previousText - Previous transcript text
   * @param {string} currentText - Current transcript text
   * @returns {object} - Turn detection signals
   */
  detectConversationTurn(previousText, currentText) {
    const prev = previousText.toLowerCase().trim();
    const curr = currentText.toLowerCase().trim();
    
    // Question-Answer pattern
    const isQuestionAnswer = 
      (prev.endsWith('?') || prev.includes('what') || prev.includes('how') || 
       prev.includes('when') || prev.includes('why') || prev.includes('who') ||
       prev.includes('can you') || prev.includes('could you') || prev.includes('would you')) &&
      (curr.length > 10); // and we have a substantial answer
    
    // Addressing/Response patterns
    const addressingPatterns = [
      'thanks', 'thank you', 'i agree', 'i disagree', 'actually', 'well',
      'yes', 'yeah', 'no', 'sure', 'okay', 'right', 'exactly', 'absolutely',
      'i think', 'in my opinion', 'from my perspective', 'let me',
      'i would say', 'i believe', 'personally', 'to answer', 'regarding',
      'about that', 'on that point', 'you mentioned', 'as you said'
    ];
    
    const hasAddressingPattern = addressingPatterns.some(pattern => 
      curr.startsWith(pattern) || curr.includes(' ' + pattern + ' ')
    );
    
    return {
      isQuestionAnswer,
      hasAddressingPattern
    };
  }
  
  /**
   * Detect speech pattern changes
   * @param {string} previousText - Previous transcript text
   * @param {string} currentText - Current transcript text
   * @returns {object} - Pattern change analysis
   */
  detectPatternChange(previousText, currentText) {
    // Compare word length, sentence structure, formality
    const prevWords = previousText.split(/\s+/).filter(w => w.length > 0);
    const currWords = currentText.split(/\s+/).filter(w => w.length > 0);
    
    if (prevWords.length < 3 || currWords.length < 3) {
      return { significantChange: false };
    }
    
    const prevAvgWordLength = prevWords.reduce((sum, w) => sum + w.length, 0) / prevWords.length;
    const currAvgWordLength = currWords.reduce((sum, w) => sum + w.length, 0) / currWords.length;
    
    // Significant difference in word length patterns
    const wordLengthDiff = Math.abs(prevAvgWordLength - currAvgWordLength);
    const significantChange = wordLengthDiff > 2;
    
    return { significantChange };
  }

  /**
   * Get or create speaker based on multi-signal analysis
   * @param {number} timestamp - Current timestamp
   * @param {string} transcriptText - The text being spoken
   * @returns {object} - Speaker object { id, name }
   */
  getCurrentSpeaker(timestamp, transcriptText = '') {
    const speakerChanged = this.detectSpeakerChange(timestamp, transcriptText);

    if (speakerChanged) {
      // Add context to history
      if (this.currentSpeaker && transcriptText) {
        this.conversationContext.push({
          speaker: this.currentSpeaker,
          text: this.lastTranscriptText,
          timestamp: this.lastSpeechTime
        });
        
        // Keep only recent context
        if (this.conversationContext.length > this.maxContextSize) {
          this.conversationContext.shift();
        }
      }
      
      // Potential speaker change - create new speaker
      this.speakerCount++;
      this.currentSpeaker = {
        id: `speaker_${this.speakerCount}`,
        name: `Speaker ${this.speakerCount}`,
        firstSeen: timestamp,
        patterns: {
          avgWordLength: 0,
          transcriptCount: 0
        }
      };
      this.speakers.push(this.currentSpeaker);
      
      console.log(`🎤 New speaker detected: ${this.currentSpeaker.name}`);
    }
    
    // Update speaker patterns
    if (this.currentSpeaker && transcriptText) {
      const words = transcriptText.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0) {
        const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const count = this.currentSpeaker.patterns.transcriptCount;
        this.currentSpeaker.patterns.avgWordLength = 
          (this.currentSpeaker.patterns.avgWordLength * count + avgLength) / (count + 1);
        this.currentSpeaker.patterns.transcriptCount++;
      }
    }

    return this.currentSpeaker;
  }

  /**
   * Rename a speaker
   * @param {string} speakerId - Speaker ID to rename
   * @param {string} newName - New name for the speaker
   */
  renameSpeaker(speakerId, newName) {
    const speaker = this.speakers.find(s => s.id === speakerId);
    if (speaker) {
      speaker.name = newName;
      return true;
    }
    return false;
  }

  /**
   * Get all speakers
   * @returns {Array} - Array of speaker objects
   */
  getAllSpeakers() {
    return this.speakers;
  }

  /**
   * Reset speaker detection
   */
  reset() {
    this.speakers = [];
    this.currentSpeaker = null;
    this.lastSpeechTime = null;
    this.lastTranscriptText = '';
    this.conversationContext = [];
    this.speakerCount = 0;
  }

  /**
   * Export speaker data for storage
   * @returns {object} - Serializable speaker data
   */
  export() {
    return {
      speakers: this.speakers,
      speakerCount: this.speakerCount
    };
  }

  /**
   * Import speaker data from storage
   * @param {object} data - Previously exported speaker data
   */
  import(data) {
    if (data && data.speakers) {
      this.speakers = data.speakers;
      this.speakerCount = data.speakerCount || this.speakers.length;
      this.currentSpeaker = this.speakers.length > 0 ? this.speakers[this.speakers.length - 1] : null;
    }
  }
}

// ES6 Export
export { SpeakerDetector };
export default SpeakerDetector;
