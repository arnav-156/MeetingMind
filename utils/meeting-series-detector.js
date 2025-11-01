/**
 * Meeting Series Detector
 * 
 * Identifies recurring meetings and groups them into series.
 * Uses pattern matching on titles, participants, and timing to detect series.
 * 
 * Detection Strategies:
 * 1. Exact title match (with date/number variations)
 * 2. Similar participant sets
 * 3. Regular time intervals (daily, weekly, bi-weekly, monthly)
 * 4. Same meeting platform/URL patterns
 */

class MeetingSeriesDetector {
  constructor(storageManager) {
    this.storage = storageManager;
    
    // Common meeting title patterns
    this.patterns = {
      // Remove date/time/number suffixes
      datePatterns: [
        /\s*-\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, // " - 10/31/2025"
        /\s*\(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\)/g, // " (10/31/2025)"
        /\s*#\d+/g, // " #5"
        /\s*-\s*\d+/g, // " - 5"
        /\s*\d{1,2}[\/\-\.]\d{1,2}$/g, // "10/31" at end
        /\s*week\s*\d+/gi, // "Week 5"
        /\s*sprint\s*\d+/gi, // "Sprint 23"
      ],
      
      // Common recurring meeting types
      recurringKeywords: [
        'standup', 'stand-up', 'daily', 'weekly', 'monthly',
        'sync', 'check-in', 'retrospective', 'retro', 'planning',
        'review', 'sprint', 'scrum', '1:1', 'one-on-one', 'team meeting'
      ],
      
      // Time interval patterns (in milliseconds)
      intervals: {
        daily: 24 * 60 * 60 * 1000, // 1 day
        weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
        biweekly: 14 * 24 * 60 * 60 * 1000, // 14 days
        monthly: 30 * 24 * 60 * 60 * 1000, // ~30 days
      }
    };
  }

  /**
   * Normalize meeting title by removing dates, numbers, and common variations
   * @param {string} title - Original meeting title
   * @returns {string} - Normalized title
   */
  normalizeTitle(title) {
    if (!title) return '';
    
    let normalized = title.trim().toLowerCase();
    
    // Remove date patterns
    for (const pattern of this.patterns.datePatterns) {
      normalized = normalized.replace(pattern, '');
    }
    
    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Remove common prefixes/suffixes
    normalized = normalized.replace(/^(re:|fw:|fwd:)\s*/gi, '');
    normalized = normalized.replace(/\s*\(?\d+\)?\s*$/g, '');
    
    return normalized;
  }

  /**
   * Check if meeting title suggests recurring nature
   * @param {string} title - Meeting title
   * @returns {boolean}
   */
  isLikelyRecurring(title) {
    const lowerTitle = title.toLowerCase();
    return this.patterns.recurringKeywords.some(keyword => 
      lowerTitle.includes(keyword)
    );
  }

  /**
   * Calculate similarity between two participant lists
   * @param {Array<string>} participants1 - First participant list
   * @param {Array<string>} participants2 - Second participant list
   * @returns {number} - Similarity score (0-1)
   */
  calculateParticipantSimilarity(participants1, participants2) {
    if (!participants1 || !participants2) return 0;
    if (participants1.length === 0 && participants2.length === 0) return 1;
    if (participants1.length === 0 || participants2.length === 0) return 0;
    
    const set1 = new Set(participants1.map(p => p.toLowerCase()));
    const set2 = new Set(participants2.map(p => p.toLowerCase()));
    
    const intersection = [...set1].filter(p => set2.has(p)).length;
    const union = new Set([...set1, ...set2]).size;
    
    return intersection / union; // Jaccard similarity
  }

  /**
   * Detect time interval pattern between meetings
   * @param {Array<Date>} dates - Array of meeting dates
   * @returns {Object} - Detected interval pattern
   */
  detectInterval(dates) {
    if (!dates || dates.length < 2) {
      return { pattern: 'unknown', confidence: 0 };
    }
    
    // Sort dates
    const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);
    
    // Calculate intervals between consecutive meetings
    const intervals = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(sortedDates[i] - sortedDates[i - 1]);
    }
    
    // Calculate average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Match to known patterns (with 20% tolerance)
    const tolerance = 0.2;
    for (const [pattern, expectedInterval] of Object.entries(this.patterns.intervals)) {
      const minInterval = expectedInterval * (1 - tolerance);
      const maxInterval = expectedInterval * (1 + tolerance);
      
      if (avgInterval >= minInterval && avgInterval <= maxInterval) {
        // Check consistency (all intervals should be similar)
        const variance = intervals.reduce((sum, interval) => {
          return sum + Math.pow(interval - avgInterval, 2);
        }, 0) / intervals.length;
        
        const stdDev = Math.sqrt(variance);
        const coefficient = stdDev / avgInterval; // Coefficient of variation
        
        return {
          pattern,
          avgInterval: Math.round(avgInterval / (1000 * 60 * 60 * 24)), // days
          confidence: Math.max(0, 1 - coefficient), // Lower variance = higher confidence
          nextExpected: new Date(sortedDates[sortedDates.length - 1].getTime() + avgInterval)
        };
      }
    }
    
    return {
      pattern: 'custom',
      avgInterval: Math.round(avgInterval / (1000 * 60 * 60 * 24)), // days
      confidence: 0.5,
      nextExpected: new Date(sortedDates[sortedDates.length - 1].getTime() + avgInterval)
    };
  }

  /**
   * Find meetings that belong to the same series
   * @param {string} meetingId - Current meeting ID
   * @returns {Promise<Array>} - Array of related meetings
   */
  async findSeriesMeetings(meetingId) {
    try {
      const currentMeeting = await this.storage.getMeeting(meetingId);
      if (!currentMeeting) {
        console.log('⚠️ Meeting not found:', meetingId);
        return [];
      }
      
      const allMeetings = await this.storage.getAllMeetings();
      const normalizedTitle = this.normalizeTitle(currentMeeting.title);
      
      const seriesMeetings = allMeetings.filter(meeting => {
        // Skip current meeting
        if (meeting.id === meetingId) return false;
        
        // Title similarity
        const meetingNormalizedTitle = this.normalizeTitle(meeting.title);
        if (meetingNormalizedTitle !== normalizedTitle) return false;
        
        // Participant similarity (at least 60%)
        const participantSimilarity = this.calculateParticipantSimilarity(
          currentMeeting.participants,
          meeting.participants
        );
        
        return participantSimilarity >= 0.6;
      });
      
      // Sort by date (newest first)
      seriesMeetings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log(`🔗 Found ${seriesMeetings.length} meetings in series for:`, normalizedTitle);
      return seriesMeetings;
      
    } catch (error) {
      console.error('❌ Error finding series meetings:', error);
      return [];
    }
  }

  /**
   * Generate a unique series ID based on normalized title
   * @param {string} title - Meeting title
   * @returns {string} - Series ID
   */
  generateSeriesId(title) {
    const normalized = this.normalizeTitle(title);
    // Convert to kebab-case
    return normalized
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  /**
   * Analyze a meeting series and extract patterns
   * @param {Array} meetings - Array of meetings in series
   * @returns {Object} - Series analysis
   */
  analyzeSeries(meetings) {
    if (!meetings || meetings.length === 0) {
      return {
        seriesId: 'unknown',
        meetingCount: 0,
        pattern: 'unknown',
        confidence: 0
      };
    }
    
    // Generate series ID
    const seriesId = this.generateSeriesId(meetings[0].title);
    
    // Extract dates
    const dates = meetings.map(m => m.timestamp).filter(Boolean);
    const interval = this.detectInterval(dates);
    
    // Calculate average duration
    const durations = meetings
      .map(m => m.duration)
      .filter(d => d && d > 0);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;
    
    // Extract all participants across series
    const allParticipants = new Set();
    meetings.forEach(m => {
      if (m.participants) {
        m.participants.forEach(p => allParticipants.add(p));
      }
    });
    
    // Find recurring topics (from summaries and transcripts)
    const topicFrequency = this.extractRecurringTopics(meetings);
    
    // Calculate average IQ score
    const iqScores = meetings
      .map(m => m.meetingIQ?.overall?.score)
      .filter(s => s && s > 0);
    const avgIQScore = iqScores.length > 0
      ? Math.round(iqScores.reduce((a, b) => a + b, 0) / iqScores.length)
      : null;
    
    return {
      seriesId,
      meetingCount: meetings.length,
      interval: interval.pattern,
      avgInterval: interval.avgInterval,
      intervalConfidence: interval.confidence,
      nextExpected: interval.nextExpected,
      avgDuration,
      avgIQScore,
      totalParticipants: allParticipants.size,
      commonTopics: topicFrequency.slice(0, 5),
      isRecurring: this.isLikelyRecurring(meetings[0].title),
      firstMeeting: new Date(Math.min(...dates)),
      lastMeeting: new Date(Math.max(...dates))
    };
  }

  /**
   * Extract recurring topics from meeting transcripts and summaries
   * @param {Array} meetings - Array of meetings
   * @returns {Array} - Topics with frequency
   */
  extractRecurringTopics(meetings) {
    const topicCounts = new Map();
    
    meetings.forEach(meeting => {
      // Extract from summary
      if (meeting.summary) {
        const words = this.extractKeywords(meeting.summary);
        words.forEach(word => {
          topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
        });
      }
      
      // Extract from action items
      if (meeting.actionItems) {
        meeting.actionItems.forEach(item => {
          if (item.task) {
            const words = this.extractKeywords(item.task);
            words.forEach(word => {
              topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
            });
          }
        });
      }
    });
    
    // Convert to array and sort by frequency
    const topics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({
        topic,
        count,
        frequency: count / meetings.length
      }))
      .sort((a, b) => b.count - a.count);
    
    return topics;
  }

  /**
   * Extract keywords from text (simple implementation)
   * @param {string} text - Input text
   * @returns {Array<string>} - Keywords
   */
  extractKeywords(text) {
    if (!text) return [];
    
    // Common stop words to ignore
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'we', 'us', 'our', 'i', 'me', 'my', 'you', 'your', 'they', 'them', 'their'
    ]);
    
    // Extract words (3+ characters, not stop words)
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.has(word));
    
    return words;
  }

  /**
   * Check if meeting is starting soon (within 5 minutes)
   * @param {Object} meetingInfo - Meeting information with start time
   * @returns {boolean}
   */
  isMeetingStartingSoon(meetingInfo) {
    if (!meetingInfo || !meetingInfo.startTime) return false;
    
    const now = Date.now();
    const startTime = new Date(meetingInfo.startTime).getTime();
    const timeDiff = startTime - now;
    
    // Within 5 minutes before start
    return timeDiff > 0 && timeDiff <= 5 * 60 * 1000;
  }

  /**
   * Get meeting series information for upcoming meeting
   * @param {Object} upcomingMeeting - Upcoming meeting details
   * @returns {Promise<Object>} - Series information
   */
  async getSeriesInfo(upcomingMeeting) {
    try {
      const allMeetings = await this.storage.getAllMeetings();
      const normalizedTitle = this.normalizeTitle(upcomingMeeting.title);
      
      // Find similar past meetings
      const pastMeetings = allMeetings.filter(meeting => {
        const meetingNormalizedTitle = this.normalizeTitle(meeting.title);
        return meetingNormalizedTitle === normalizedTitle;
      });
      
      if (pastMeetings.length === 0) {
        return {
          isFirstMeeting: true,
          seriesId: this.generateSeriesId(upcomingMeeting.title),
          message: 'This appears to be a new meeting series.'
        };
      }
      
      // Analyze series
      const analysis = this.analyzeSeries(pastMeetings);
      
      return {
        isFirstMeeting: false,
        seriesId: analysis.seriesId,
        pastMeetingCount: pastMeetings.length,
        analysis,
        pastMeetings: pastMeetings.slice(0, 3) // Last 3 meetings
      };
      
    } catch (error) {
      console.error('❌ Error getting series info:', error);
      return {
        error: error.message,
        isFirstMeeting: true
      };
    }
  }
}

// ES6 Export
export { MeetingSeriesDetector };
