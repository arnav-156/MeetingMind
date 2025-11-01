/**
 * AI-Powered Meeting Type Detector
 * 
 * Analyzes meeting conversations in real-time to automatically
 * detect meeting type with confidence scoring.
 * 
 * Uses multiple signals:
 * - Title pattern matching
 * - Conversation pattern analysis
 * - Speaking patterns and dynamics
 * - Chrome AI Prompt API for semantic understanding
 */

export class MeetingTypeDetector {
  constructor() {
    this.analysisData = {
      transcripts: [],
      speakerCount: 0,
      avgSpeakingTime: 0,
      questionCount: 0,
      statementCount: 0,
      actionWords: [],
      decisionWords: [],
      ideaMarkers: [],
      updatePatterns: []
    };
    
    this.detectionHistory = [];
    this.lastDetection = null;
  }

  /**
   * Analyze and detect meeting type
   * @param {Object} context - Meeting context (title, duration, transcripts, etc.)
   * @returns {Object} Detection result with type and confidence
   */
  async detectMeetingType(context) {
    console.log('🔍 Analyzing meeting type...', context);
    
    // Step 1: Title-based signals (quick, high confidence if match)
    const titleSignals = this.analyzeTitleSignals(context.title);
    
    // Step 2: Conversation pattern analysis
    const conversationSignals = this.analyzeConversationPatterns(context.transcripts);
    
    // Step 3: Speaking dynamics
    const speakingSignals = this.analyzeSpeakingDynamics(context);
    
    // Step 4: Temporal patterns
    const temporalSignals = this.analyzeTemporalPatterns(context);
    
    // Step 5: AI semantic analysis (if available)
    let aiSignals = null;
    if (context.transcripts && context.transcripts.length > 0) {
      aiSignals = await this.performAIAnalysis(context.transcripts);
    }
    
    // Combine all signals
    const detection = this.combineSignals({
      title: titleSignals,
      conversation: conversationSignals,
      speaking: speakingSignals,
      temporal: temporalSignals,
      ai: aiSignals
    });
    
    // Store detection history
    this.detectionHistory.push({
      ...detection,
      timestamp: Date.now()
    });
    
    this.lastDetection = detection;
    
    console.log(`✨ Detected type: ${detection.type} (${detection.confidence}% confidence)`);
    return detection;
  }

  /**
   * Analyze meeting title for type signals
   */
  analyzeTitleSignals(title) {
    if (!title) return { scores: {}, confidence: 0 };
    
    const lowerTitle = title.toLowerCase();
    const scores = {};
    
    const patterns = {
      STANDUP: {
        keywords: ['standup', 'stand up', 'daily', 'sync', 'status', 'scrum'],
        weight: 0.9
      },
      BRAINSTORM: {
        keywords: ['brainstorm', 'ideation', 'ideas', 'creative', 'innovation'],
        weight: 0.9
      },
      DECISION_MAKING: {
        keywords: ['decision', 'approve', 'approval', 'vote', 'choose'],
        weight: 0.85
      },
      ONE_ON_ONE: {
        keywords: ['1:1', '1-1', 'one on one', 'check-in', 'catch up'],
        weight: 0.95 // Very distinctive
      },
      PLANNING: {
        keywords: ['planning', 'roadmap', 'strategy', 'quarterly', 'sprint planning', 'okr'],
        weight: 0.85
      },
      REVIEW: {
        keywords: ['review', 'demo', 'presentation', 'showcase', 'sprint review'],
        weight: 0.8
      },
      PROBLEM_SOLVING: {
        keywords: ['bug', 'issue', 'problem', 'incident', 'troubleshoot', 'debug', 'fix'],
        weight: 0.85
      },
      CLIENT_MEETING: {
        keywords: ['client', 'customer', 'partner', 'vendor', 'external'],
        weight: 0.9
      }
    };
    
    // Score each type
    for (const [type, config] of Object.entries(patterns)) {
      const matches = config.keywords.filter(kw => lowerTitle.includes(kw));
      if (matches.length > 0) {
        scores[type] = config.weight * Math.min(matches.length / 2, 1);
      }
    }
    
    // Find highest scoring type
    const topType = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b, null
    );
    
    return {
      scores,
      topMatch: topType,
      confidence: topType ? Math.round(scores[topType] * 100) : 0
    };
  }

  /**
   * Analyze conversation patterns from transcripts
   */
  analyzeConversationPatterns(transcripts) {
    if (!transcripts || transcripts.length === 0) {
      return { scores: {}, features: {} };
    }
    
    const fullText = transcripts.map(t => t.text || '').join(' ').toLowerCase();
    const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Feature extraction
    const features = {
      updatePattern: this.detectUpdatePattern(fullText),
      questionDensity: this.calculateQuestionDensity(fullText),
      ideaMarkers: this.detectIdeaMarkers(fullText),
      decisionLanguage: this.detectDecisionLanguage(fullText),
      actionItems: this.detectActionLanguage(fullText),
      timeReferences: this.detectTimeReferences(fullText),
      problemLanguage: this.detectProblemLanguage(fullText),
      clientIndicators: this.detectClientIndicators(fullText)
    };
    
    // Score types based on features
    const scores = {};
    
    // STANDUP: Update patterns, brevity, blockers
    if (features.updatePattern.score > 0.6) {
      scores.STANDUP = 0.7 + (features.timeReferences.yesterday * 0.2);
    }
    
    // BRAINSTORM: High question density, idea markers, "what if" language
    if (features.questionDensity > 0.15 && features.ideaMarkers.count > 3) {
      scores.BRAINSTORM = 0.6 + (Math.min(features.ideaMarkers.count / 10, 0.3));
    }
    
    // DECISION_MAKING: Decision language, weighing options
    if (features.decisionLanguage.score > 0.5) {
      scores.DECISION_MAKING = 0.65 + (features.decisionLanguage.score * 0.25);
    }
    
    // PLANNING: Action items, timeline references, ownership language
    if (features.actionItems.count > 5 && features.timeReferences.future > 3) {
      scores.PLANNING = 0.7;
    }
    
    // PROBLEM_SOLVING: Problem language, solution discussions
    if (features.problemLanguage.score > 0.6) {
      scores.PROBLEM_SOLVING = 0.65 + (features.problemLanguage.score * 0.25);
    }
    
    // CLIENT_MEETING: Client indicators, formal language
    if (features.clientIndicators.score > 0.5) {
      scores.CLIENT_MEETING = 0.6 + (features.clientIndicators.score * 0.3);
    }
    
    return {
      scores,
      features,
      confidence: Math.max(...Object.values(scores), 0) * 100
    };
  }

  /**
   * Detect update pattern (for standups)
   */
  detectUpdatePattern(text) {
    const patterns = [
      /i (worked|did|completed|finished|shipped)/gi,
      /yesterday (i|we)/gi,
      /my update|status update/gi,
      /blocked (on|by)/gi,
      /working on/gi,
      /today (i|we) (will|plan)/gi
    ];
    
    const matches = patterns.reduce((count, pattern) => {
      const found = text.match(pattern) || [];
      return count + found.length;
    }, 0);
    
    return {
      score: Math.min(matches / 5, 1),
      matches
    };
  }

  /**
   * Calculate question density
   */
  calculateQuestionDensity(text) {
    const questions = (text.match(/\?/g) || []).length;
    const sentences = text.split(/[.!?]/).length;
    return sentences > 0 ? questions / sentences : 0;
  }

  /**
   * Detect idea generation markers
   */
  detectIdeaMarkers(text) {
    const markers = [
      /what if/gi,
      /we could/gi,
      /how about/gi,
      /maybe we/gi,
      /another idea/gi,
      /building on/gi,
      /(yes|yeah) and/gi
    ];
    
    const matches = markers.reduce((arr, pattern) => {
      const found = text.match(pattern) || [];
      return [...arr, ...found];
    }, []);
    
    return {
      count: matches.length,
      markers: matches
    };
  }

  /**
   * Detect decision-making language
   */
  detectDecisionLanguage(text) {
    const patterns = [
      /let's decide/gi,
      /we need to choose/gi,
      /vote on/gi,
      /should we go with/gi,
      /final decision/gi,
      /approve|approval/gi,
      /(agree|agreed) on/gi
    ];
    
    const matches = patterns.reduce((count, pattern) => {
      return count + (text.match(pattern) || []).length;
    }, 0);
    
    return {
      score: Math.min(matches / 4, 1),
      matches
    };
  }

  /**
   * Detect action-oriented language
   */
  detectActionLanguage(text) {
    const patterns = [
      /(will|should) (do|create|build|implement)/gi,
      /action item/gi,
      /next step/gi,
      /who (will|should|can)/gi,
      /by (when|friday|monday|tomorrow)/gi,
      /assign|owner|responsible/gi
    ];
    
    const matches = patterns.reduce((count, pattern) => {
      return count + (text.match(pattern) || []).length;
    }, 0);
    
    return {
      count: matches,
      score: Math.min(matches / 6, 1)
    };
  }

  /**
   * Detect time references
   */
  detectTimeReferences(text) {
    return {
      yesterday: (text.match(/yesterday|last (week|sprint)/gi) || []).length,
      today: (text.match(/today|currently|right now/gi) || []).length,
      future: (text.match(/tomorrow|next (week|sprint)|will|planning/gi) || []).length
    };
  }

  /**
   * Detect problem-solving language
   */
  detectProblemLanguage(text) {
    const patterns = [
      /issue|problem|bug/gi,
      /root cause/gi,
      /fix|solve|resolve/gi,
      /why (is|did|does)/gi,
      /not working/gi,
      /broken|failing/gi
    ];
    
    const matches = patterns.reduce((count, pattern) => {
      return count + (text.match(pattern) || []).length;
    }, 0);
    
    return {
      score: Math.min(matches / 5, 1),
      matches
    };
  }

  /**
   * Detect client meeting indicators
   */
  detectClientIndicators(text) {
    const patterns = [
      /client|customer/gi,
      /understand your needs/gi,
      /how can we help/gi,
      /demo|showcase/gi,
      /feedback from you/gi,
      /your (team|organization)/gi
    ];
    
    const matches = patterns.reduce((count, pattern) => {
      return count + (text.match(pattern) || []).length;
    }, 0);
    
    return {
      score: Math.min(matches / 4, 1),
      matches
    };
  }

  /**
   * Analyze speaking dynamics
   */
  analyzeSpeakingDynamics(context) {
    const scores = {};
    
    // ONE_ON_ONE: Typically 2 speakers, balanced talk time
    if (context.speakerCount === 2) {
      scores.ONE_ON_ONE = 0.7;
    }
    
    // STANDUP: Multiple speakers, short turns
    if (context.speakerCount >= 3 && context.avgTurnLength < 60) {
      scores.STANDUP = 0.6;
    }
    
    // REVIEW: One dominant speaker (presenter)
    if (context.speakerDominance > 0.6) {
      scores.REVIEW = 0.5;
    }
    
    return { scores };
  }

  /**
   * Analyze temporal patterns
   */
  analyzeTemporalPatterns(context) {
    const scores = {};
    const duration = context.duration || 0;
    const timeOfDay = new Date().getHours();
    
    // STANDUP: Short duration (<20 min), morning hours
    if (duration < 1200000 && timeOfDay >= 8 && timeOfDay <= 11) {
      scores.STANDUP = 0.5;
    }
    
    // BRAINSTORM: Medium-long duration (45-90 min)
    if (duration >= 2700000 && duration <= 5400000) {
      scores.BRAINSTORM = 0.4;
    }
    
    return { scores };
  }

  /**
   * Perform AI semantic analysis using Chrome Prompt API
   */
  async performAIAnalysis(transcripts) {
    try {
      // Only analyze if we have at least 3 minutes of content
      if (transcripts.length < 5) {
        return null;
      }
      
      const recentTranscripts = transcripts.slice(-20); // Last 20 segments
      const conversationSample = recentTranscripts
        .map(t => t.text || '')
        .join('\n')
        .slice(0, 2000); // Limit to 2000 chars
      
      if (!conversationSample.trim()) return null;
      
      const prompt = `Analyze this meeting conversation and classify its type.

Conversation excerpt:
"""
${conversationSample}
"""

Based on the conversation patterns, classify this meeting as ONE of:
- STANDUP: Quick status updates, what people worked on, blockers
- BRAINSTORM: Generating ideas, creative thinking, "what if" questions
- DECISION_MAKING: Choosing between options, making decisions, voting
- ONE_ON_ONE: Personal conversation, career development, feedback
- PLANNING: Setting goals, creating roadmaps, assigning tasks
- REVIEW: Presentation, demo, status review, feedback gathering
- PROBLEM_SOLVING: Fixing issues, troubleshooting, finding solutions
- CLIENT_MEETING: External stakeholder, customer conversation
- GENERAL: Standard meeting, doesn't fit above categories

Respond with ONLY this JSON format:
{
  "type": "MEETING_TYPE_HERE",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;

      // Try Chrome AI
      if (typeof ai !== 'undefined' && ai.languageModel) {
        const session = await ai.languageModel.create({
          temperature: 0.3,
          topK: 1
        });
        
        const response = await session.prompt(prompt);
        const result = JSON.parse(response);
        
        return {
          type: result.type,
          confidence: result.confidence / 100,
          reasoning: result.reasoning
        };
      }
      
      return null;
    } catch (error) {
      console.warn('AI analysis failed:', error);
      return null;
    }
  }

  /**
   * Combine all signals to make final detection
   */
  combineSignals(signals) {
    const scores = {};
    
    // Weight different signal sources
    const weights = {
      title: 0.35,       // Titles are often very accurate
      conversation: 0.30, // Pattern analysis is good
      ai: 0.25,          // AI is helpful but can be wrong
      speaking: 0.05,    // Dynamics are weak signals
      temporal: 0.05     // Time patterns are weak signals
    };
    
    // Aggregate scores
    const types = ['STANDUP', 'BRAINSTORM', 'DECISION_MAKING', 'ONE_ON_ONE', 
                   'PLANNING', 'REVIEW', 'PROBLEM_SOLVING', 'CLIENT_MEETING', 'GENERAL'];
    
    types.forEach(type => {
      let totalScore = 0;
      let totalWeight = 0;
      
      // Title signal
      if (signals.title?.scores?.[type]) {
        totalScore += signals.title.scores[type] * weights.title;
        totalWeight += weights.title;
      }
      
      // Conversation signal
      if (signals.conversation?.scores?.[type]) {
        totalScore += signals.conversation.scores[type] * weights.conversation;
        totalWeight += weights.conversation;
      }
      
      // AI signal
      if (signals.ai?.type === type) {
        totalScore += signals.ai.confidence * weights.ai;
        totalWeight += weights.ai;
      }
      
      // Speaking signal
      if (signals.speaking?.scores?.[type]) {
        totalScore += signals.speaking.scores[type] * weights.speaking;
        totalWeight += weights.speaking;
      }
      
      // Temporal signal
      if (signals.temporal?.scores?.[type]) {
        totalScore += signals.temporal.scores[type] * weights.temporal;
        totalWeight += weights.temporal;
      }
      
      if (totalWeight > 0) {
        scores[type] = totalScore / totalWeight;
      }
    });
    
    // Find top match
    let topType = 'GENERAL';
    let topScore = 0;
    
    Object.entries(scores).forEach(([type, score]) => {
      if (score > topScore) {
        topScore = score;
        topType = type;
      }
    });
    
    // Calculate confidence (0-100)
    const confidence = Math.round(topScore * 100);
    
    // Get reasoning
    const reasoning = this.generateReasoning(topType, signals);
    
    return {
      type: topType,
      confidence,
      scores,
      reasoning,
      signals
    };
  }

  /**
   * Generate human-readable reasoning
   */
  generateReasoning(type, signals) {
    const reasons = [];
    
    if (signals.title?.topMatch === type) {
      reasons.push('title match');
    }
    
    if (signals.conversation?.features) {
      const f = signals.conversation.features;
      if (type === 'STANDUP' && f.updatePattern?.score > 0.5) {
        reasons.push('update pattern detected');
      }
      if (type === 'BRAINSTORM' && f.ideaMarkers?.count > 3) {
        reasons.push(`${f.ideaMarkers.count} idea markers`);
      }
      if (type === 'DECISION_MAKING' && f.decisionLanguage?.score > 0.5) {
        reasons.push('decision language');
      }
    }
    
    if (signals.ai?.type === type) {
      reasons.push('AI analysis confirms');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'pattern analysis';
  }
  
  /**
   * Get detection history
   */
  getDetectionHistory() {
    return this.detectionHistory;
  }
  
  /**
   * Get last detection
   */
  getLastDetection() {
    return this.lastDetection;
  }
}
