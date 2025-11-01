/**
 * Pre-Meeting Brief Generator
 * 
 * Generates intelligent pre-meeting briefs using:
 * - Historical meeting data from series
 * - AI-powered analysis via Prompt API
 * - Pattern recognition for engagement and topics
 * - Predictive suggestions for agenda and duration
 * 
 * Brief includes:
 * - Last meeting summary
 * - Open action items with owners
 * - Recurring discussion topics
 * - Participant engagement patterns
 * - Suggested agenda structure
 * - Predicted meeting duration
 */

class PreMeetingBriefGenerator {
  constructor(storageManager, seriesDetector) {
    this.storage = storageManager;
    this.seriesDetector = seriesDetector;
    this.aiSession = null;
  }

  /**
   * Initialize Prompt API session
   * @returns {Promise<boolean>}
   */
  async initializeAI() {
    try {
      // Check if Prompt API is available
      if (!window.ai || !window.ai.languageModel) {
        console.log('⚠️ Prompt API not available for pre-meeting briefs');
        return false;
      }

      const capabilities = await window.ai.languageModel.capabilities();
      
      if (capabilities.available === 'no') {
        console.log('⚠️ Prompt API not available on this device');
        return false;
      }

      if (capabilities.available === 'after-download') {
        console.log('📥 Prompt API model downloading...');
      }

      // Create session for brief generation
      this.aiSession = await window.ai.languageModel.create({
        systemPrompt: `You are an expert meeting facilitator and productivity coach. 
Your role is to analyze past meeting data and generate concise, actionable pre-meeting briefs.

Focus on:
- Key outcomes and decisions from previous meetings
- Outstanding action items that need follow-up
- Patterns in discussions and engagement
- Practical suggestions for making this meeting effective

Keep briefs concise (300-500 words) and structured.
Use clear headings and bullet points.
Prioritize actionable insights over general observations.`
      });

      console.log('✅ Prompt API initialized for pre-meeting briefs');
      return true;

    } catch (error) {
      console.error('❌ Error initializing Prompt API:', error);
      return false;
    }
  }

  /**
   * Extract open action items from past meetings
   * @param {Array} meetings - Array of past meetings
   * @returns {Array} - Open action items with context
   */
  extractOpenActionItems(meetings) {
    const openItems = [];
    
    meetings.forEach(meeting => {
      if (meeting.actionItems && Array.isArray(meeting.actionItems)) {
        meeting.actionItems.forEach(item => {
          // Check if item has completion status
          const isOpen = !item.completed && !item.status?.includes('done');
          
          if (isOpen) {
            openItems.push({
              task: item.task,
              owner: item.assignee || item.owner || 'Unassigned',
              dueDate: item.dueDate,
              source: {
                meetingDate: meeting.timestamp,
                meetingTitle: meeting.title,
                meetingId: meeting.id
              },
              priority: this.calculateItemPriority(item, meeting),
              ageInDays: Math.floor((Date.now() - new Date(meeting.timestamp)) / (1000 * 60 * 60 * 24))
            });
          }
        });
      }
    });
    
    // Sort by priority (high to low) and age (older first)
    openItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.ageInDays - a.ageInDays;
    });
    
    return openItems;
  }

  /**
   * Calculate priority score for action item
   * @param {Object} item - Action item
   * @param {Object} meeting - Source meeting
   * @returns {number} - Priority score (0-100)
   */
  calculateItemPriority(item, meeting) {
    let priority = 50; // Base priority
    
    // Increase if has due date
    if (item.dueDate) {
      const daysUntilDue = Math.floor((new Date(item.dueDate) - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue < 0) priority += 30; // Overdue
      else if (daysUntilDue < 3) priority += 20; // Due soon
      else if (daysUntilDue < 7) priority += 10; // Due this week
    }
    
    // Increase if explicitly marked urgent/important
    const taskLower = (item.task || '').toLowerCase();
    if (taskLower.includes('urgent') || taskLower.includes('asap')) priority += 20;
    if (taskLower.includes('critical') || taskLower.includes('blocker')) priority += 25;
    
    // Increase based on meeting IQ score (high-quality meetings = important items)
    if (meeting.meetingIQ?.overall?.score) {
      priority += Math.floor(meeting.meetingIQ.overall.score / 10);
    }
    
    return Math.min(100, Math.max(0, priority));
  }

  /**
   * Analyze participant engagement patterns
   * @param {Array} meetings - Array of past meetings
   * @returns {Object} - Engagement analysis
   */
  analyzeEngagement(meetings) {
    const participantStats = new Map();
    
    meetings.forEach(meeting => {
      if (meeting.meetingIQ?.dimensions?.participation?.participantBreakdown) {
        Object.entries(meeting.meetingIQ.dimensions.participation.participantBreakdown).forEach(([name, stats]) => {
          if (!participantStats.has(name)) {
            participantStats.set(name, {
              totalContributions: 0,
              totalMeetings: 0,
              avgScore: 0
            });
          }
          
          const pStats = participantStats.get(name);
          pStats.totalContributions += stats.contributions || 0;
          pStats.totalMeetings += 1;
          pStats.avgScore += stats.score || 0;
        });
      }
      
      // Also check participants array
      if (meeting.participants) {
        meeting.participants.forEach(name => {
          if (!participantStats.has(name)) {
            participantStats.set(name, {
              totalContributions: 0,
              totalMeetings: 0,
              avgScore: 0
            });
          }
          // Mark attendance
          if (!meeting.meetingIQ?.dimensions?.participation?.participantBreakdown?.[name]) {
            participantStats.get(name).totalMeetings += 1;
          }
        });
      }
    });
    
    // Calculate averages and categorize
    const engagement = {
      active: [],
      moderate: [],
      quiet: []
    };
    
    participantStats.forEach((stats, name) => {
      const avgContributions = stats.totalContributions / stats.totalMeetings;
      const avgScore = stats.avgScore / stats.totalMeetings;
      
      const participant = {
        name,
        avgContributions: Math.round(avgContributions),
        avgScore: Math.round(avgScore),
        meetingsAttended: stats.totalMeetings
      };
      
      if (avgContributions >= 10 || avgScore >= 70) {
        engagement.active.push(participant);
      } else if (avgContributions >= 3 || avgScore >= 40) {
        engagement.moderate.push(participant);
      } else {
        engagement.quiet.push(participant);
      }
    });
    
    return engagement;
  }

  /**
   * Predict meeting duration based on history
   * @param {Array} meetings - Array of past meetings
   * @returns {Object} - Duration prediction
   */
  predictDuration(meetings) {
    const durations = meetings
      .map(m => m.duration)
      .filter(d => d && d > 0);
    
    if (durations.length === 0) {
      return {
        predicted: 30,
        confidence: 'low',
        message: 'No historical data available. Estimated 30 minutes.'
      };
    }
    
    // Calculate statistics
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const sorted = [...durations].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate variance
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    
    // Determine confidence
    const coefficientOfVariation = stdDev / avg;
    let confidence;
    if (coefficientOfVariation < 0.2) confidence = 'high';
    else if (coefficientOfVariation < 0.4) confidence = 'medium';
    else confidence = 'low';
    
    return {
      predicted: Math.round(median),
      average: Math.round(avg),
      min: Math.min(...durations),
      max: Math.max(...durations),
      confidence,
      variance: Math.round(stdDev),
      dataPoints: durations.length
    };
  }

  /**
   * Generate agenda suggestions based on patterns
   * @param {Array} meetings - Past meetings
   * @param {Array} openItems - Open action items
   * @returns {Array} - Suggested agenda items
   */
  generateAgendaSuggestions(meetings, openItems) {
    const agenda = [];
    
    // 1. Review action items (if any open)
    if (openItems.length > 0) {
      agenda.push({
        title: 'Action Items Review',
        duration: Math.min(10, openItems.length * 2),
        description: `Review ${openItems.length} open action item${openItems.length > 1 ? 's' : ''} from previous meetings`,
        priority: 'high'
      });
    }
    
    // 2. Recurring topics (from series analysis)
    if (meetings.length > 0 && meetings[0].seriesAnalysis?.commonTopics) {
      const topTopics = meetings[0].seriesAnalysis.commonTopics.slice(0, 3);
      if (topTopics.length > 0) {
        agenda.push({
          title: 'Status Updates',
          duration: 10,
          description: `Discuss: ${topTopics.map(t => t.topic).join(', ')}`,
          priority: 'medium'
        });
      }
    }
    
    // 3. New discussion items
    agenda.push({
      title: 'New Topics',
      duration: 15,
      description: 'Open discussion for new items and concerns',
      priority: 'medium'
    });
    
    // 4. Next steps and action items
    agenda.push({
      title: 'Next Steps & Action Items',
      duration: 5,
      description: 'Define clear action items and owners',
      priority: 'high'
    });
    
    return agenda;
  }

  /**
   * Generate pre-meeting brief using AI
   * @param {Object} seriesInfo - Meeting series information
   * @param {Array} pastMeetings - Past meetings in series
   * @returns {Promise<Object>} - Generated brief
   */
  async generateBrief(seriesInfo, pastMeetings) {
    try {
      // Extract data
      const lastMeeting = pastMeetings[0];
      const openItems = this.extractOpenActionItems(pastMeetings);
      const engagement = this.analyzeEngagement(pastMeetings);
      const durationPrediction = this.predictDuration(pastMeetings);
      const agendaSuggestions = this.generateAgendaSuggestions(pastMeetings, openItems);
      
      // Prepare context for AI
      const context = {
        seriesInfo: {
          name: lastMeeting.title,
          meetingCount: pastMeetings.length,
          frequency: seriesInfo.analysis?.interval || 'unknown',
          avgIQScore: seriesInfo.analysis?.avgIQScore
        },
        lastMeeting: {
          date: lastMeeting.timestamp,
          duration: lastMeeting.duration,
          summary: lastMeeting.summary,
          iqScore: lastMeeting.meetingIQ?.overall?.score,
          keyPoints: lastMeeting.keyPoints || []
        },
        openActionItems: openItems.slice(0, 10), // Top 10 items
        engagement: {
          activeParticipants: engagement.active.map(p => p.name),
          quietParticipants: engagement.quiet.map(p => p.name)
        },
        patterns: {
          commonTopics: seriesInfo.analysis?.commonTopics?.slice(0, 5).map(t => t.topic) || [],
          typicalDuration: durationPrediction.predicted
        }
      };
      
      // Generate brief with AI
      let aiBrief = null;
      if (this.aiSession) {
        try {
          const prompt = `Generate a concise pre-meeting brief for an upcoming meeting.

Meeting Series: ${context.seriesInfo.name}
Meeting History: ${context.seriesInfo.meetingCount} previous meetings
Last Meeting: ${new Date(context.lastMeeting.date).toLocaleDateString()}

LAST MEETING SUMMARY:
${context.lastMeeting.summary || 'No summary available'}

OPEN ACTION ITEMS (${context.openActionItems.length}):
${context.openActionItems.slice(0, 5).map(item => `• ${item.task} (Owner: ${item.owner}, Age: ${item.ageInDays} days)`).join('\n')}

RECURRING TOPICS:
${context.patterns.commonTopics.join(', ')}

ENGAGEMENT PATTERNS:
Active contributors: ${context.engagement.activeParticipants.join(', ') || 'None identified'}
Participants who may benefit from encouragement: ${context.engagement.quietParticipants.join(', ') || 'None identified'}

Generate a brief that includes:
1. Quick recap of last meeting's key outcomes
2. Priority action items that need attention
3. Suggested focus areas for this meeting
4. Any patterns or trends to be aware of

Keep it under 400 words and actionable.`;

          const response = await this.aiSession.prompt(prompt);
          aiBrief = response.trim();
          
          console.log('✅ AI brief generated, length:', aiBrief.length);
          
        } catch (aiError) {
          console.error('❌ AI generation failed:', aiError);
          aiBrief = null;
        }
      }
      
      // Construct complete brief
      const brief = {
        meeting_series_id: seriesInfo.seriesId,
        generated_at: new Date().toISOString(),
        series_info: context.seriesInfo,
        last_meeting: {
          date: context.lastMeeting.date,
          summary: context.lastMeeting.summary,
          iq_score: context.lastMeeting.iqScore,
          duration: context.lastMeeting.duration
        },
        open_items: openItems.map(item => ({
          task: item.task,
          owner: item.owner,
          due_date: item.dueDate,
          age_days: item.ageInDays,
          priority: item.priority,
          source_meeting: item.source.meetingDate
        })),
        patterns: {
          typical_duration: durationPrediction.predicted,
          duration_range: `${durationPrediction.min}-${durationPrediction.max} min`,
          confidence: durationPrediction.confidence,
          common_topics: context.patterns.commonTopics,
          active_participants: context.engagement.activeParticipants,
          quiet_participants: context.engagement.quietParticipants
        },
        suggestions: {
          agenda: agendaSuggestions,
          focus_areas: this.generateFocusAreas(context),
          predicted_duration: durationPrediction.predicted,
          preparation_tips: this.generatePreparationTips(context)
        },
        ai_brief: aiBrief,
        metadata: {
          past_meetings_analyzed: pastMeetings.length,
          open_items_count: openItems.length,
          data_quality: this.assessDataQuality(pastMeetings)
        }
      };
      
      console.log('📋 Pre-meeting brief generated:', brief.meeting_series_id);
      return brief;
      
    } catch (error) {
      console.error('❌ Error generating brief:', error);
      throw error;
    }
  }

  /**
   * Generate focus areas based on context
   * @param {Object} context - Meeting context
   * @returns {Array<string>}
   */
  generateFocusAreas(context) {
    const areas = [];
    
    // High priority if many open items
    if (context.openActionItems.length > 5) {
      areas.push('Action Item Accountability - Multiple items pending follow-up');
    }
    
    // Low IQ score
    if (context.lastMeeting.iqScore && context.lastMeeting.iqScore < 60) {
      areas.push('Meeting Effectiveness - Previous meeting scored below target');
    }
    
    // Quiet participants
    if (context.engagement.quietParticipants.length > 0) {
      areas.push(`Inclusive Participation - Engage ${context.engagement.quietParticipants.slice(0, 2).join(', ')}`);
    }
    
    // Long duration trend
    if (context.patterns.typicalDuration > 60) {
      areas.push('Time Management - Meetings typically run long, consider tighter agenda');
    }
    
    // Default areas
    if (areas.length === 0) {
      areas.push('Clear Objectives - Define specific outcomes for this meeting');
      areas.push('Action Items - Ensure all decisions have clear next steps');
    }
    
    return areas;
  }

  /**
   * Generate preparation tips
   * @param {Object} context - Meeting context
   * @returns {Array<string>}
   */
  generatePreparationTips(context) {
    const tips = [];
    
    if (context.openActionItems.length > 0) {
      tips.push(`📌 Review ${context.openActionItems.length} open action items before meeting`);
    }
    
    if (context.patterns.commonTopics.length > 0) {
      tips.push(`📊 Prepare updates on: ${context.patterns.commonTopics.slice(0, 3).join(', ')}`);
    }
    
    if (context.lastMeeting.iqScore && context.lastMeeting.iqScore < 70) {
      tips.push('🎯 Set clear objectives at start to improve meeting quality');
    }
    
    tips.push(`⏱️ Allocate ~${context.patterns.typicalDuration} minutes for this meeting`);
    
    return tips;
  }

  /**
   * Assess quality of historical data
   * @param {Array} meetings - Past meetings
   * @returns {string} - Quality rating
   */
  assessDataQuality(meetings) {
    if (meetings.length === 0) return 'none';
    if (meetings.length < 2) return 'low';
    
    // Check for rich data
    const hasTranscripts = meetings.filter(m => m.transcript?.length > 0).length;
    const hasSummaries = meetings.filter(m => m.summary).length;
    const hasActionItems = meetings.filter(m => m.actionItems?.length > 0).length;
    const hasIQScores = meetings.filter(m => m.meetingIQ?.overall?.score).length;
    
    const richness = (hasTranscripts + hasSummaries + hasActionItems + hasIQScores) / (meetings.length * 4);
    
    if (richness > 0.7) return 'high';
    if (richness > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Generate brief for upcoming meeting
   * @param {Object} upcomingMeeting - Upcoming meeting details
   * @returns {Promise<Object|null>} - Generated brief or null if not applicable
   */
  async generateBriefForUpcoming(upcomingMeeting) {
    try {
      console.log('🔍 Checking if brief needed for:', upcomingMeeting.title);
      
      // Get series information
      const seriesInfo = await this.seriesDetector.getSeriesInfo(upcomingMeeting);
      
      // If first meeting, no brief needed
      if (seriesInfo.isFirstMeeting) {
        console.log('ℹ️ First meeting in series, no brief needed');
        return null;
      }
      
      // If no past meetings, no brief
      if (!seriesInfo.pastMeetings || seriesInfo.pastMeetings.length === 0) {
        console.log('ℹ️ No past meetings found, no brief needed');
        return null;
      }
      
      // Initialize AI if not already done
      if (!this.aiSession) {
        await this.initializeAI();
      }
      
      // Generate comprehensive brief
      const brief = await this.generateBrief(seriesInfo, seriesInfo.pastMeetings);
      
      return brief;
      
    } catch (error) {
      console.error('❌ Error generating brief for upcoming meeting:', error);
      return null;
    }
  }

  /**
   * Clean up AI session
   */
  async cleanup() {
    if (this.aiSession) {
      try {
        await this.aiSession.destroy();
        this.aiSession = null;
        console.log('✅ Pre-meeting brief AI session cleaned up');
      } catch (error) {
        console.error('❌ Error cleaning up AI session:', error);
      }
    }
  }
}

// ES6 Export
export { PreMeetingBriefGenerator };
