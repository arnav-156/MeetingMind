/**
 * Meeting IQ Engine - AI-Powered Meeting Quality Analyzer
 * Analyzes meeting quality in real-time and provides actionable insights
 * 
 * Now with ADAPTIVE SCORING: Adjusts weights based on meeting type!
 */

import { getMeetingType, getScoringWeights, getContextualInsight } from './meeting-types-config.js';

export class MeetingIQEngine {
  constructor(meetingType = 'GENERAL') {
    // Store meeting type for context-aware scoring
    this.meetingType = meetingType;
    this.meetingTypeConfig = getMeetingType(meetingType);
    
    // Get adaptive weights based on meeting type
    const adaptiveWeights = getScoringWeights(meetingType);
    
    // Scoring dimensions with ADAPTIVE weights (total = 100%)
    this.dimensions = {
      participation: {
        name: 'Participation Balance',
        weight: adaptiveWeights.participation,
        score: 0,
        description: 'Are all voices heard?',
        icon: '👥'
      },
      focus: {
        name: 'Clarity & Focus',
        weight: adaptiveWeights.focus,
        score: 0,
        description: 'Staying on topic?',
        icon: '🎯'
      },
      actions: {
        name: 'Action-Oriented',
        weight: adaptiveWeights.actions,
        score: 0,
        description: 'Concrete next steps?',
        icon: '✅'
      },
      decisions: {
        name: 'Decision Velocity',
        weight: adaptiveWeights.decisions,
        score: 0,
        description: 'Quick decisions?',
        icon: '⚡'
      },
      engagement: {
        name: 'Engagement Quality',
        weight: adaptiveWeights.engagement,
        score: 0,
        description: 'Active participation?',
        icon: '💬'
      },
      efficiency: {
        name: 'Time Efficiency',
        weight: adaptiveWeights.time_efficiency,
        score: 0,
        description: 'On schedule?',
        icon: '⏱️'
      }
    };

    // Meeting state tracking
    this.meetingData = {
      startTime: null,
      duration: 0,
      transcripts: [],
      speakers: new Map(), // speaker -> { name, talkTime, lastSpoke }
      topics: [],
      actionItems: [],
      decisions: [],
      questions: [],
      silencePeriods: [],
      topicSwitches: 0
    };

    // Score history for trend analysis
    this.scoreHistory = [];
    this.lastScore = 0;
    this.updateInterval = 60000; // Update every minute
    this.lastUpdateTime = 0;

    // Performance thresholds
    this.thresholds = {
      participation: {
        excellent: 85,
        good: 70,
        fair: 50,
        maxSpeakerDominance: 0.40 // No one should speak >40%
      },
      focus: {
        excellent: 85,
        good: 70,
        fair: 50,
        maxTopicSwitches: 3,
        acceptableTopicSwitches: 6
      },
      actions: {
        excellent: 85,
        good: 70,
        fair: 50,
        minActionsPerTenMin: 1,
        goodActionsPerTenMin: 2
      },
      decisions: {
        excellent: 85,
        good: 70,
        fair: 50,
        maxDecisionTime: 300, // 5 minutes
        goodDecisionTime: 180 // 3 minutes
      },
      engagement: {
        excellent: 85,
        good: 70,
        fair: 50,
        minQuestionRate: 0.1, // Questions per minute
        goodQuestionRate: 0.3
      },
      efficiency: {
        excellent: 90,
        good: 75,
        fair: 60
      }
    };
  }

  /**
   * Initialize new meeting session
   */
  startMeeting() {
    this.meetingData.startTime = Date.now();
    this.meetingData.duration = 0;
    this.meetingData.transcripts = [];
    this.meetingData.speakers.clear();
    this.meetingData.topics = [];
    this.meetingData.actionItems = [];
    this.meetingData.decisions = [];
    this.meetingData.questions = [];
    this.meetingData.topicSwitches = 0;
    this.scoreHistory = [];
    this.lastScore = 0;
    this.lastUpdateTime = Date.now();

    console.log('[MeetingIQ] Meeting started');
  }

  /**
   * Update meeting duration
   */
  updateDuration() {
    if (this.meetingData.startTime) {
      this.meetingData.duration = Date.now() - this.meetingData.startTime;
    }
  }

  /**
   * Add transcript entry
   */
  addTranscript(speaker, text, timestamp) {
    this.meetingData.transcripts.push({
      speaker,
      text,
      timestamp: timestamp || Date.now()
    });

    // Update speaker stats
    if (!this.meetingData.speakers.has(speaker)) {
      this.meetingData.speakers.set(speaker, {
        name: speaker,
        talkTime: 0,
        lastSpoke: timestamp || Date.now(),
        contributions: 0
      });
    }

    const speakerData = this.meetingData.speakers.get(speaker);
    speakerData.contributions++;
    speakerData.lastSpoke = timestamp || Date.now();

    // Estimate talk time (rough: 150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedTime = (wordCount / 150) * 60 * 1000; // ms
    speakerData.talkTime += estimatedTime;
  }

  /**
   * Add action item
   */
  addActionItem(item, timestamp) {
    this.meetingData.actionItems.push({
      text: item,
      timestamp: timestamp || Date.now()
    });
  }

  /**
   * Add decision
   */
  addDecision(decision, timestamp) {
    this.meetingData.decisions.push({
      text: decision,
      timestamp: timestamp || Date.now()
    });
  }

  /**
   * Add question
   */
  addQuestion(question, timestamp) {
    this.meetingData.questions.push({
      text: question,
      timestamp: timestamp || Date.now(),
      resolved: false
    });
  }

  /**
   * Calculate overall Meeting IQ score
   */
  async calculateScore() {
    this.updateDuration();

    // Don't calculate if meeting just started (< 2 minutes)
    if (this.meetingData.duration < 120000) {
      return {
        overallScore: 0,
        breakdown: this.dimensions,
        insights: [{
          type: 'info',
          message: 'Meeting IQ will calculate after 2 minutes...',
          dimension: null
        }],
        trend: 0,
        isReady: false
      };
    }

    // Calculate each dimension score
    const participationScore = this.calculateParticipationScore();
    const focusScore = this.calculateFocusScore();
    const actionsScore = this.calculateActionsScore();
    const decisionsScore = this.calculateDecisionsScore();
    const engagementScore = this.calculateEngagementScore();
    const efficiencyScore = this.calculateEfficiencyScore();

    // Update dimension scores
    this.dimensions.participation.score = participationScore;
    this.dimensions.focus.score = focusScore;
    this.dimensions.actions.score = actionsScore;
    this.dimensions.decisions.score = decisionsScore;
    this.dimensions.engagement.score = engagementScore;
    this.dimensions.efficiency.score = efficiencyScore;

    // Calculate weighted average
    const totalScore = Math.round(
      participationScore * this.dimensions.participation.weight +
      focusScore * this.dimensions.focus.weight +
      actionsScore * this.dimensions.actions.weight +
      decisionsScore * this.dimensions.decisions.weight +
      engagementScore * this.dimensions.engagement.weight +
      efficiencyScore * this.dimensions.efficiency.weight
    );

    // Track score history
    const trend = totalScore - this.lastScore;
    this.scoreHistory.push({
      score: totalScore,
      timestamp: Date.now()
    });
    this.lastScore = totalScore;
    this.lastUpdateTime = Date.now();

    // Generate insights
    const insights = this.generateInsights();

    return {
      overallScore: totalScore,
      breakdown: this.dimensions,
      insights,
      trend,
      isReady: true,
      meetingData: this.getMeetingStats(),
      meetingType: this.meetingType,
      meetingTypeName: this.meetingTypeConfig.name,
      meetingTypeIcon: this.meetingTypeConfig.icon
    };
  }

  /**
   * Calculate Participation Balance score (0-100)
   */
  calculateParticipationScore() {
    const speakers = Array.from(this.meetingData.speakers.values());
    
    if (speakers.length === 0) return 0;
    if (speakers.length === 1) return 30; // Single speaker = poor participation

    // Calculate total talk time
    const totalTalkTime = speakers.reduce((sum, s) => sum + s.talkTime, 0);
    if (totalTalkTime === 0) return 0;

    // Calculate talk time percentages
    const percentages = speakers.map(s => s.talkTime / totalTalkTime);

    // Find max speaker dominance
    const maxDominance = Math.max(...percentages);

    // Calculate balance score
    // Perfect balance: everyone speaks equally
    // Poor balance: one person dominates
    let score = 100;

    if (maxDominance > this.thresholds.participation.maxSpeakerDominance) {
      // Penalize dominance
      const dominancePenalty = (maxDominance - this.thresholds.participation.maxSpeakerDominance) * 200;
      score -= dominancePenalty;
    }

    // Bonus for having multiple speakers
    const speakerBonus = Math.min(speakers.length * 5, 20);
    score += speakerBonus;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate Clarity & Focus score (0-100)
   */
  calculateFocusScore() {
    // For MVP: Use topic switches as proxy
    // In full version: Use semantic analysis with AI
    
    const durationMinutes = this.meetingData.duration / 60000;
    if (durationMinutes < 2) return 100; // Too early to judge

    // Estimate topic switches based on conversation patterns
    // For now, use a simple heuristic
    const topicSwitches = this.meetingData.topicSwitches || 0;

    let score = 100;

    if (topicSwitches > this.thresholds.focus.maxTopicSwitches) {
      const switchPenalty = (topicSwitches - this.thresholds.focus.maxTopicSwitches) * 10;
      score -= switchPenalty;
    }

    // Bonus for focused discussion (few transcripts, longer messages)
    const avgTranscriptLength = this.meetingData.transcripts.reduce(
      (sum, t) => sum + t.text.length, 0
    ) / (this.meetingData.transcripts.length || 1);

    if (avgTranscriptLength > 100) {
      score += 10; // Bonus for substantial contributions
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate Action-Oriented score (0-100)
   */
  calculateActionsScore() {
    const durationMinutes = this.meetingData.duration / 60000;
    if (durationMinutes < 5) return 50; // Too early

    const actionCount = this.meetingData.actionItems.length;
    const actionsPerTenMin = (actionCount / durationMinutes) * 10;

    let score = 0;

    if (actionsPerTenMin >= this.thresholds.actions.goodActionsPerTenMin) {
      score = this.thresholds.actions.excellent;
    } else if (actionsPerTenMin >= this.thresholds.actions.minActionsPerTenMin) {
      score = this.thresholds.actions.good;
    } else if (actionCount > 0) {
      score = this.thresholds.actions.fair;
    } else {
      score = 20; // No actions = low score
    }

    return Math.round(score);
  }

  /**
   * Calculate Decision Velocity score (0-100)
   */
  calculateDecisionsScore() {
    const decisionCount = this.meetingData.decisions.length;
    const questionCount = this.meetingData.questions.length;

    if (questionCount === 0 && decisionCount === 0) {
      return 60; // Neutral if no decisions needed
    }

    // Decision resolution rate
    const resolutionRate = questionCount > 0 ? decisionCount / questionCount : 1;

    let score = resolutionRate * 100;

    // Bonus for multiple decisions
    if (decisionCount >= 3) score += 10;
    if (decisionCount >= 5) score += 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate Engagement Quality score (0-100)
   */
  calculateEngagementScore() {
    const durationMinutes = this.meetingData.duration / 60000;
    if (durationMinutes < 2) return 50;

    const questionRate = this.meetingData.questions.length / durationMinutes;
    const speakerCount = this.meetingData.speakers.size;
    const transcriptCount = this.meetingData.transcripts.length;
    const interactionRate = transcriptCount / durationMinutes;

    let score = 50; // Base score

    // Question rate scoring
    if (questionRate >= this.thresholds.engagement.goodQuestionRate) {
      score += 25;
    } else if (questionRate >= this.thresholds.engagement.minQuestionRate) {
      score += 15;
    }

    // Interaction rate scoring
    if (interactionRate > 5) score += 15; // Good back-and-forth
    if (interactionRate > 10) score += 10; // Very active

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate Time Efficiency score (0-100)
   */
  calculateEfficiencyScore() {
    // For MVP: Simple heuristic based on meeting progress
    // In full version: Compare against agenda and time allocation

    const durationMinutes = this.meetingData.duration / 60000;
    const actionCount = this.meetingData.actionItems.length;
    const decisionCount = this.meetingData.decisions.length;

    // Efficiency = outcomes per minute
    const outcomesPerMin = (actionCount + decisionCount) / (durationMinutes || 1);

    let score = 50; // Base

    if (outcomesPerMin > 0.5) score = 90;
    else if (outcomesPerMin > 0.3) score = 75;
    else if (outcomesPerMin > 0.1) score = 60;

    return Math.round(score);
  }

  /**
   * Generate actionable insights
   */
  generateInsights() {
    const insights = [];
    const durationMinutes = this.meetingData.duration / 60000;
    
    // Calculate overall score for context-aware insight
    const overallScore = this.calculateScore();

    // Add meeting-type-specific contextual insight FIRST
    const contextualMessage = getContextualInsight(this.meetingType, overallScore);
    insights.push({
      type: overallScore >= 81 ? 'success' : overallScore >= 61 ? 'info' : overallScore >= 41 ? 'warning' : 'critical',
      dimension: 'overall',
      message: `${this.meetingTypeConfig.icon} ${this.meetingTypeConfig.name}: ${contextualMessage}`,
      action: this.getSuggestedAction(overallScore),
      priority: 'high'
    });

    // Check participation balance
    const speakers = Array.from(this.meetingData.speakers.values());
    const totalTalkTime = speakers.reduce((sum, s) => sum + s.talkTime, 0);
    
    if (speakers.length > 1) {
      const quietSpeakers = speakers.filter(s => {
        const timeSinceLastSpoke = Date.now() - s.lastSpoke;
        return timeSinceLastSpoke > 600000; // 10 minutes
      });

      if (quietSpeakers.length > 0) {
        insights.push({
          type: 'warning',
          dimension: 'participation',
          message: `${quietSpeakers[0].name} hasn't spoken in ${Math.round((Date.now() - quietSpeakers[0].lastSpoke) / 60000)} minutes`,
          action: 'Consider asking for their input',
          priority: 'high'
        });
      }

      // Check for speaker dominance
      speakers.forEach(s => {
        const percentage = s.talkTime / totalTalkTime;
        if (percentage > 0.6 && speakers.length > 2) {
          insights.push({
            type: 'warning',
            dimension: 'participation',
            message: `${s.name} has spoken ${Math.round(percentage * 100)}% of the time`,
            action: 'Encourage others to contribute',
            priority: 'medium'
          });
        }
      });
    }

    // Check action items
    if (durationMinutes > 10 && this.meetingData.actionItems.length === 0) {
      insights.push({
        type: 'critical',
        dimension: 'actions',
        message: `No action items defined in ${Math.round(durationMinutes)} minutes`,
        action: 'Ask: "What are our next steps?"',
        priority: 'high'
      });
    }

    // Check decisions
    const unresolvedQuestions = this.meetingData.questions.filter(q => !q.resolved);
    if (unresolvedQuestions.length > 0) {
      insights.push({
        type: 'warning',
        dimension: 'decisions',
        message: `${unresolvedQuestions.length} question(s) remain unresolved`,
        action: 'Review pending items before ending',
        priority: 'medium'
      });
    }

    // Positive reinforcement
    if (this.dimensions.participation.score > 85) {
      insights.push({
        type: 'success',
        dimension: 'participation',
        message: 'Great participation balance! 🎉',
        action: 'Keep encouraging diverse viewpoints',
        priority: 'low'
      });
    }

    if (this.meetingData.actionItems.length >= 5) {
      insights.push({
        type: 'success',
        dimension: 'actions',
        message: `${this.meetingData.actionItems.length} action items defined!`,
        action: 'Excellent progress',
        priority: 'low'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights.slice(0, 5); // Return top 5 insights
  }

  /**
   * Get meeting statistics
   */
  getMeetingStats() {
    return {
      duration: this.meetingData.duration,
      durationMinutes: Math.round(this.meetingData.duration / 60000),
      speakerCount: this.meetingData.speakers.size,
      transcriptCount: this.meetingData.transcripts.length,
      actionItemCount: this.meetingData.actionItems.length,
      decisionCount: this.meetingData.decisions.length,
      questionCount: this.meetingData.questions.length
    };
  }

  /**
   * Get score rating and color
   */
  getScoreRating(score) {
    if (score >= 81) {
      return { rating: 'Excellent', color: '#10b981', emoji: '🟢' };
    } else if (score >= 61) {
      return { rating: 'Good', color: '#3b82f6', emoji: '🔵' };
    } else if (score >= 41) {
      return { rating: 'Needs Work', color: '#f59e0b', emoji: '🟠' };
    } else {
      return { rating: 'Poor', color: '#ef4444', emoji: '🔴' };
    }
  }

  /**
   * Should update score? (Check if enough time has passed)
   */
  shouldUpdate() {
    return Date.now() - this.lastUpdateTime >= this.updateInterval;
  }

  /**
   * Generate post-meeting report
   */
  generateReport() {
    const finalScore = this.lastScore;
    const rating = this.getScoreRating(finalScore);
    const stats = this.getMeetingStats();

    // Find strengths and weaknesses
    const dimensionScores = Object.entries(this.dimensions).map(([key, dim]) => ({
      key,
      name: dim.name,
      score: dim.score,
      icon: dim.icon
    }));

    dimensionScores.sort((a, b) => b.score - a.score);
    const strengths = dimensionScores.slice(0, 2);
    const weaknesses = dimensionScores.slice(-2);

    return {
      finalScore,
      rating: rating.rating,
      color: rating.color,
      emoji: rating.emoji,
      stats,
      strengths,
      weaknesses,
      scoreHistory: this.scoreHistory,
      insights: this.generateInsights(),
      timestamp: Date.now()
    };
  }

  /**
   * Get suggested action based on overall score and meeting type
   */
  getSuggestedAction(score) {
    const type = this.meetingTypeConfig;
    
    if (score >= 81) {
      return 'Keep up the excellent work!';
    } else if (score >= 61) {
      return 'You\'re doing well - small tweaks can make it excellent';
    } else if (score >= 41) {
      // Suggest based on meeting type
      const suggestions = {
        'STANDUP': 'Keep it shorter and more focused',
        'BRAINSTORM': 'Encourage more diverse participation',
        'DECISION_MAKING': 'Drive toward a clear decision',
        'ONE_ON_ONE': 'Make it more conversational and balanced',
        'PLANNING': 'Define clearer action items and owners',
        'REVIEW': 'Tighten the message and allow Q&A time',
        'PROBLEM_SOLVING': 'Focus on root cause and concrete solution',
        'CLIENT_MEETING': 'Listen more, let client lead the conversation',
        'GENERAL': 'Improve focus and ensure clear outcomes'
      };
      return suggestions[this.meetingType] || 'Focus on key objectives';
    } else {
      return 'Meeting needs significant improvements - consider restructuring';
    }
  }
}
