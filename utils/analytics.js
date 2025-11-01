// ============================================
// Analytics Manager - Meeting statistics and insights
// ============================================

export class AnalyticsManager {
  constructor() {
    this.currentSession = null;
  }

  /**
   * Start tracking analytics for a meeting
   */
  startSession(meetingId) {
    this.currentSession = {
      meetingId,
      startTime: Date.now(),
      speakers: new Map(), // speakerId -> { name, wordCount, timeActive }
      wordFrequency: new Map(), // word -> count
      totalWords: 0,
      transcriptCount: 0
    };
  }

  /**
   * Process a transcript entry for analytics
   */
  processTranscript(transcript) {
    if (!this.currentSession) return;

    const { speakerId, speaker, text } = transcript;
    
    // Update transcript count
    this.currentSession.transcriptCount++;

    // Process speaker stats
    if (speakerId) {
      if (!this.currentSession.speakers.has(speakerId)) {
        this.currentSession.speakers.set(speakerId, {
          id: speakerId,
          name: speaker || 'Unknown',
          wordCount: 0,
          transcriptCount: 0,
          firstSeen: Date.now(),
          lastSeen: Date.now()
        });
      }

      const speakerStats = this.currentSession.speakers.get(speakerId);
      const words = this.extractWords(text);
      
      speakerStats.wordCount += words.length;
      speakerStats.transcriptCount++;
      speakerStats.lastSeen = Date.now();

      // Update total words
      this.currentSession.totalWords += words.length;

      // Update word frequency
      words.forEach(word => {
        const count = this.currentSession.wordFrequency.get(word) || 0;
        this.currentSession.wordFrequency.set(word, count + 1);
      });
    }
  }

  /**
   * Extract words from text (lowercase, alphanumeric only)
   */
  extractWords(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 2); // Filter short words
  }

  /**
   * Generate meeting statistics
   */
  getStatistics() {
    if (!this.currentSession) return null;

    const duration = Date.now() - this.currentSession.startTime;
    const durationMinutes = Math.floor(duration / 60000);
    const durationSeconds = Math.floor((duration % 60000) / 1000);

    // Calculate speaker time distribution
    const speakerStats = Array.from(this.currentSession.speakers.values()).map(speaker => {
      const percentage = this.currentSession.totalWords > 0 
        ? (speaker.wordCount / this.currentSession.totalWords * 100).toFixed(1)
        : 0;
      
      const activeTime = speaker.lastSeen - speaker.firstSeen;
      const activeMinutes = Math.floor(activeTime / 60000);

      return {
        ...speaker,
        percentage: parseFloat(percentage),
        activeTime: activeMinutes,
        wordsPerMinute: activeMinutes > 0 ? Math.round(speaker.wordCount / activeMinutes) : 0
      };
    });

    // Sort by word count (most active first)
    speakerStats.sort((a, b) => b.wordCount - a.wordCount);

    // Get top words (word cloud data)
    const topWords = this.getTopWords(30);

    return {
      duration: {
        total: duration,
        minutes: durationMinutes,
        seconds: durationSeconds,
        formatted: `${durationMinutes}m ${durationSeconds}s`
      },
      speakers: {
        count: this.currentSession.speakers.size,
        stats: speakerStats,
        mostActive: speakerStats[0] || null
      },
      words: {
        total: this.currentSession.totalWords,
        unique: this.currentSession.wordFrequency.size,
        topWords: topWords,
        averagePerMinute: durationMinutes > 0 ? Math.round(this.currentSession.totalWords / durationMinutes) : 0
      },
      transcripts: {
        count: this.currentSession.transcriptCount
      }
    };
  }

  /**
   * Get top N most frequent words
   */
  getTopWords(limit = 30) {
    if (!this.currentSession) return [];

    // Common words to exclude (stop words)
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
      'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
      'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did',
      'its', 'let', 'put', 'say', 'she', 'too', 'use', 'that', 'this', 'have',
      'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time',
      'very', 'when', 'your', 'come', 'here', 'just', 'like', 'long', 'make',
      'many', 'over', 'such', 'take', 'than', 'them', 'well', 'only', 'going',
      'yeah', 'okay', 'alright', 'umm', 'uhh', 'hmm', 'well'
    ]);

    const words = Array.from(this.currentSession.wordFrequency.entries())
      .filter(([word, count]) => 
        !stopWords.has(word) && // Not a stop word
        count > 1 && // Appears more than once
        word.length > 3 // Longer than 3 characters
      )
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return words;
  }

  /**
   * Generate word cloud data (with font sizes)
   */
  getWordCloudData(limit = 50) {
    const topWords = this.getTopWords(limit);
    if (topWords.length === 0) return [];

    const maxCount = topWords[0].count;
    const minCount = topWords[topWords.length - 1].count;

    // Normalize to font size range (12-48px)
    return topWords.map(({ word, count }) => {
      const normalized = (count - minCount) / (maxCount - minCount) || 0;
      const fontSize = Math.floor(12 + normalized * 36); // 12-48px range

      return {
        word,
        count,
        size: fontSize,
        weight: normalized
      };
    });
  }

  /**
   * Get speaker time distribution for chart
   */
  getSpeakerDistribution() {
    const stats = this.getStatistics();
    if (!stats) return [];

    return stats.speakers.stats.map(speaker => ({
      name: speaker.name,
      value: speaker.wordCount,
      percentage: speaker.percentage,
      color: this.getSpeakerColor(speaker.id)
    }));
  }

  /**
   * Get speaker color (matches side panel colors)
   */
  getSpeakerColor(speakerId) {
    const colors = [
      '#7e22ce', // purple
      '#1d4ed8', // blue
      '#15803d', // green
      '#c2410c', // orange
      '#be185d'  // pink
    ];
    const hash = (speakerId || '').split('_')[1] || 1;
    return colors[(hash - 1) % colors.length];
  }

  /**
   * Export analytics data
   */
  export() {
    return {
      session: this.currentSession,
      statistics: this.getStatistics(),
      wordCloud: this.getWordCloudData(),
      distribution: this.getSpeakerDistribution()
    };
  }

  /**
   * End session and return final stats
   */
  endSession() {
    const finalStats = this.getStatistics();
    this.currentSession = null;
    return finalStats;
  }

  /**
   * Reset analytics
   */
  reset() {
    this.currentSession = null;
  }
}
