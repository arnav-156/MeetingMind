// ============================================
// Storage Manager - IndexedDB wrapper
// ============================================

export class StorageManager {
  constructor() {
    this.db = null;
    this.dbName = 'MeetingMindDB';
    this.version = 4; // Incremented for pre-meeting briefs store
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ Error opening database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Meetings store
        if (!db.objectStoreNames.contains('meetings')) {
          const meetingsStore = db.createObjectStore('meetings', { keyPath: 'id' });
          meetingsStore.createIndex('platform', 'platform', { unique: false });
          meetingsStore.createIndex('startTime', 'startTime', { unique: false });
          meetingsStore.createIndex('status', 'status', { unique: false });
        }

        // Transcripts store
        if (!db.objectStoreNames.contains('transcripts')) {
          const transcriptsStore = db.createObjectStore('transcripts', { keyPath: 'id', autoIncrement: true });
          transcriptsStore.createIndex('meetingId', 'meetingId', { unique: false });
          transcriptsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Summaries store
        if (!db.objectStoreNames.contains('summaries')) {
          const summariesStore = db.createObjectStore('summaries', { keyPath: 'id', autoIncrement: true });
          summariesStore.createIndex('meetingId', 'meetingId', { unique: false });
          summariesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Action items store
        if (!db.objectStoreNames.contains('actionItems')) {
          const actionItemsStore = db.createObjectStore('actionItems', { keyPath: 'id' });
          actionItemsStore.createIndex('meetingId', 'meetingId', { unique: false });
          actionItemsStore.createIndex('status', 'status', { unique: false });
          actionItemsStore.createIndex('assignee', 'assignee', { unique: false });
        }

        // Reminders store
        if (!db.objectStoreNames.contains('reminders')) {
          const remindersStore = db.createObjectStore('reminders', { keyPath: 'id' });
          remindersStore.createIndex('actionItemId', 'actionItemId', { unique: false });
          remindersStore.createIndex('type', 'type', { unique: false });
          remindersStore.createIndex('status', 'status', { unique: false });
          remindersStore.createIndex('scheduledTime', 'scheduledTime', { unique: false });
        }

        // Notification mappings store (map notification ID to reminder ID)
        if (!db.objectStoreNames.contains('notificationMappings')) {
          const mappingsStore = db.createObjectStore('notificationMappings', { keyPath: 'notificationId' });
          mappingsStore.createIndex('reminderId', 'reminderId', { unique: false });
        }

        // Shared transcripts store (for shareable links)
        if (!db.objectStoreNames.contains('sharedTranscripts')) {
          const sharedStore = db.createObjectStore('sharedTranscripts', { keyPath: 'id' });
          sharedStore.createIndex('meetingId', 'meetingId', { unique: false });
          sharedStore.createIndex('status', 'status', { unique: false });
          sharedStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          sharedStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Pre-meeting briefs store (for upcoming meetings)
        if (!db.objectStoreNames.contains('preMeetingBriefs')) {
          const briefsStore = db.createObjectStore('preMeetingBriefs', { keyPath: 'id' });
          briefsStore.createIndex('seriesId', 'meeting_series_id', { unique: false });
          briefsStore.createIndex('meetingDate', 'meeting_date', { unique: false });
          briefsStore.createIndex('generatedAt', 'generated_at', { unique: false });
          briefsStore.createIndex('status', 'status', { unique: false }); // 'pending', 'shown', 'dismissed'
        }

        // Meeting series tracking store
        if (!db.objectStoreNames.contains('meetingSeries')) {
          const seriesStore = db.createObjectStore('meetingSeries', { keyPath: 'seriesId' });
          seriesStore.createIndex('normalizedTitle', 'normalizedTitle', { unique: false });
          seriesStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        console.log('📦 Database schema created');
      };
    });
  }

  // ============================================
  // Meetings
  // ============================================

  async saveMeeting(meeting) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['meetings'], 'readwrite');
      const store = transaction.objectStore('meetings');
      const request = store.add(meeting);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getMeeting(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['meetings'], 'readonly');
      const store = transaction.objectStore('meetings');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateMeeting(id, updates) {
    return new Promise(async (resolve, reject) => {
      try {
        const meeting = await this.getMeeting(id);
        const updatedMeeting = { ...meeting, ...updates };
        
        const transaction = this.db.transaction(['meetings'], 'readwrite');
        const store = transaction.objectStore('meetings');
        const request = store.put(updatedMeeting);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAllMeetings() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['meetings'], 'readonly');
      const store = transaction.objectStore('meetings');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMeeting(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['meetings'], 'readwrite');
      const store = transaction.objectStore('meetings');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Transcripts
  // ============================================

  async saveTranscript(meetingId, transcript) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcripts'], 'readwrite');
      const store = transaction.objectStore('transcripts');
      const request = store.add({
        meetingId,
        ...transcript
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTranscripts(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcripts'], 'readonly');
      const store = transaction.objectStore('transcripts');
      const index = store.index('meetingId');
      const request = index.getAll(meetingId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Summaries
  // ============================================

  async saveSummary(meetingId, summary) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['summaries'], 'readwrite');
      const store = transaction.objectStore('summaries');
      const request = store.add({
        meetingId,
        ...summary
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSummaries(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['summaries'], 'readonly');
      const store = transaction.objectStore('summaries');
      const index = store.index('meetingId');
      const request = index.getAll(meetingId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Action Items
  // ============================================

  async saveActionItem(meetingId, actionItem) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['actionItems'], 'readwrite');
      const store = transaction.objectStore('actionItems');
      const request = store.add({
        meetingId,
        ...actionItem
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getActionItems(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['actionItems'], 'readonly');
      const store = transaction.objectStore('actionItems');
      const index = store.index('meetingId');
      const request = index.getAll(meetingId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateActionItem(id, updates) {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = this.db.transaction(['actionItems'], 'readwrite');
        const store = transaction.objectStore('actionItems');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const item = getRequest.result;
          const updatedItem = { ...item, ...updates };
          const putRequest = store.put(updatedItem);
          
          putRequest.onsuccess = () => resolve(putRequest.result);
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getActionItem(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['actionItems'], 'readonly');
      const store = transaction.objectStore('actionItems');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllActionItems() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['actionItems'], 'readonly');
      const store = transaction.objectStore('actionItems');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Reminders
  // ============================================

  async addReminder(reminder) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reminders'], 'readwrite');
      const store = transaction.objectStore('reminders');
      const request = store.add(reminder);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getReminder(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reminders'], 'readonly');
      const store = transaction.objectStore('reminders');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateReminder(id, updates) {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = this.db.transaction(['reminders'], 'readwrite');
        const store = transaction.objectStore('reminders');
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const reminder = getRequest.result;
          if (!reminder) {
            reject(new Error('Reminder not found'));
            return;
          }
          const updatedReminder = { ...reminder, ...updates };
          const putRequest = store.put(updatedReminder);
          
          putRequest.onsuccess = () => resolve(putRequest.result);
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAllReminders() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reminders'], 'readonly');
      const store = transaction.objectStore('reminders');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteReminder(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reminders'], 'readwrite');
      const store = transaction.objectStore('reminders');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRemindersForActionItem(actionItemId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reminders'], 'readonly');
      const store = transaction.objectStore('reminders');
      const index = store.index('actionItemId');
      const request = index.getAll(actionItemId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Notification Mappings
  // ============================================

  async addNotificationMapping(notificationId, reminderId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notificationMappings'], 'readwrite');
      const store = transaction.objectStore('notificationMappings');
      const request = store.add({ notificationId, reminderId, createdAt: Date.now() });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getNotificationMapping(notificationId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notificationMappings'], 'readonly');
      const store = transaction.objectStore('notificationMappings');
      const request = store.get(notificationId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Cleanup (auto-delete old meetings)
  // ============================================

  async cleanupOldMeetings(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const meetings = await this.getAllMeetings();
      
      for (const meeting of meetings) {
        const meetingDate = new Date(meeting.startTime);
        if (meetingDate < cutoffDate) {
          // Delete meeting and related data
          await this.deleteMeeting(meeting.id);
          await this.deleteTranscripts(meeting.id);
          await this.deleteSummaries(meeting.id);
          await this.deleteActionItems(meeting.id);
          
          console.log(`🗑️ Cleaned up old meeting: ${meeting.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up old meetings:', error);
    }
  }

  async deleteTranscripts(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcripts'], 'readwrite');
      const store = transaction.objectStore('transcripts');
      const index = store.index('meetingId');
      const request = index.openCursor(meetingId);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteSummaries(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['summaries'], 'readwrite');
      const store = transaction.objectStore('summaries');
      const index = store.index('meetingId');
      const request = index.openCursor(meetingId);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteActionItems(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['actionItems'], 'readwrite');
      const store = transaction.objectStore('actionItems');
      const index = store.index('meetingId');
      const request = index.openCursor(meetingId);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save Meeting IQ Report
   */
  async saveMeetingIQReport(meetingId, report) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['meetings'], 'readwrite');
      const store = transaction.objectStore('meetings');
      const request = store.get(meetingId);

      request.onsuccess = () => {
        const meeting = request.result;
        if (meeting) {
          meeting.meetingIQReport = report;
          meeting.meetingIQScore = report.finalScore;
          const updateRequest = store.put(meeting);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Meeting not found'));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get Meeting IQ Report
   */
  async getMeetingIQReport(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['meetings'], 'readonly');
      const store = transaction.objectStore('meetings');
      const request = store.get(meetingId);

      request.onsuccess = () => {
        const meeting = request.result;
        resolve(meeting?.meetingIQReport || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Shared Transcripts (for shareable links)
  // ============================================

  /**
   * Add shared transcript
   */
  async addSharedTranscript(sharedData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sharedTranscripts'], 'readwrite');
      const store = transaction.objectStore('sharedTranscripts');
      const request = store.add(sharedData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get shared transcript by ID
   */
  async getSharedTranscript(shareId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sharedTranscripts'], 'readonly');
      const store = transaction.objectStore('sharedTranscripts');
      const request = store.get(shareId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update shared transcript
   */
  async updateSharedTranscript(shareId, updates) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sharedTranscripts'], 'readwrite');
      const store = transaction.objectStore('sharedTranscripts');
      const getRequest = store.get(shareId);

      getRequest.onsuccess = () => {
        const shared = getRequest.result;
        if (shared) {
          const updatedShared = { ...shared, ...updates };
          const updateRequest = store.put(updatedShared);
          updateRequest.onsuccess = () => resolve(updatedShared);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Shared transcript not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Get all shared transcripts
   */
  async getAllSharedTranscripts() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sharedTranscripts'], 'readonly');
      const store = transaction.objectStore('sharedTranscripts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get shared transcripts by meeting ID
   */
  async getSharedTranscriptsByMeetingId(meetingId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sharedTranscripts'], 'readonly');
      const store = transaction.objectStore('sharedTranscripts');
      const index = store.index('meetingId');
      const request = index.getAll(meetingId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete shared transcript
   */
  async deleteSharedTranscript(shareId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sharedTranscripts'], 'readwrite');
      const store = transaction.objectStore('sharedTranscripts');
      const request = store.delete(shareId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // Pre-Meeting Briefs
  // ============================================

  /**
   * Save pre-meeting brief
   */
  async savePreMeetingBrief(brief) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['preMeetingBriefs'], 'readwrite');
      const store = transaction.objectStore('preMeetingBriefs');
      
      // Generate ID if not present
      const briefWithId = {
        ...brief,
        id: brief.id || `brief-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generated_at: brief.generated_at || new Date().toISOString(),
        status: brief.status || 'pending'
      };
      
      const request = store.put(briefWithId);

      request.onsuccess = () => resolve(briefWithId);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pre-meeting brief by ID
   */
  async getPreMeetingBrief(briefId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['preMeetingBriefs'], 'readonly');
      const store = transaction.objectStore('preMeetingBriefs');
      const request = store.get(briefId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get briefs by series ID
   */
  async getBriefsBySeriesId(seriesId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['preMeetingBriefs'], 'readonly');
      const store = transaction.objectStore('preMeetingBriefs');
      const index = store.index('seriesId');
      const request = index.getAll(seriesId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending briefs
   */
  async getPendingBriefs() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['preMeetingBriefs'], 'readonly');
      const store = transaction.objectStore('preMeetingBriefs');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update brief status
   */
  async updateBriefStatus(briefId, status) {
    return new Promise(async (resolve, reject) => {
      try {
        const brief = await this.getPreMeetingBrief(briefId);
        if (!brief) {
          reject(new Error('Brief not found'));
          return;
        }

        const updatedBrief = {
          ...brief,
          status,
          updated_at: new Date().toISOString()
        };

        const transaction = this.db.transaction(['preMeetingBriefs'], 'readwrite');
        const store = transaction.objectStore('preMeetingBriefs');
        const request = store.put(updatedBrief);

        request.onsuccess = () => resolve(updatedBrief);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete old briefs (cleanup)
   */
  async deleteOldBriefs(daysOld = 30) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction(['preMeetingBriefs'], 'readwrite');
        const store = transaction.objectStore('preMeetingBriefs');
        const request = store.openCursor();
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const brief = cursor.value;
            const briefDate = new Date(brief.generated_at);
            
            if (briefDate < cutoffDate) {
              cursor.delete();
              deletedCount++;
            }
            
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ============================================
  // Meeting Series Tracking
  // ============================================

  /**
   * Save or update meeting series metadata
   */
  async saveMeetingSeries(seriesData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['meetingSeries'], 'readwrite');
      const store = transaction.objectStore('meetingSeries');
      
      const seriesWithTimestamp = {
        ...seriesData,
        lastUpdated: new Date().toISOString()
      };
      
      const request = store.put(seriesWithTimestamp);

      request.onsuccess = () => resolve(seriesWithTimestamp);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get meeting series by ID
   */
  async getMeetingSeries(seriesId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['meetingSeries'], 'readonly');
      const store = transaction.objectStore('meetingSeries');
      const request = store.get(seriesId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all meeting series
   */
  async getAllMeetingSeries() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['meetingSeries'], 'readonly');
      const store = transaction.objectStore('meetingSeries');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================
// Export singleton instance
// ============================================
export const storageDB = new StorageManager();
