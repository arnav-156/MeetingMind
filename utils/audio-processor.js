// ============================================
// Audio Processor - Handles audio chunking and processing
// ============================================

export class AudioProcessor {
  constructor() {
    this.chunkSize = 30000; // 30 seconds in milliseconds
    this.audioQueue = [];
    this.isProcessing = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  // Initialize audio capture from tab
  async startCapture(tabId) {
    try {
      console.log('🎤 Starting audio capture for tab:', tabId);

      // Request tab audio stream
      const streamId = await new Promise((resolve, reject) => {
        chrome.tabCapture.capture(
          {
            audio: true,
            video: false
          },
          (stream) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (stream) {
              resolve(stream);
            } else {
              reject(new Error('No stream captured'));
            }
          }
        );
      });

      if (!streamId) {
        throw new Error('Failed to capture tab audio');
      }

      // Set up MediaRecorder
      this.setupMediaRecorder(streamId);

      return { success: true };

    } catch (error) {
      console.error('❌ Error starting audio capture:', error);
      throw error;
    }
  }

  // Set up MediaRecorder with chunking
  setupMediaRecorder(stream) {
    try {
      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];

      // Handle data available (chunk ready)
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('🎵 Audio chunk received:', event.data.size, 'bytes');
          
          // Process chunk
          this.processChunk(event.data);
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
      };

      // Handle stop
      this.mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with time slices (chunks every 30 seconds)
      this.mediaRecorder.start(this.chunkSize);
      console.log('✅ MediaRecorder started with', this.chunkSize, 'ms chunks');

    } catch (error) {
      console.error('❌ Error setting up MediaRecorder:', error);
      throw error;
    }
  }

  // Process audio chunk
  async processChunk(audioBlob) {
    try {
      // Add to queue
      this.audioQueue.push({
        blob: audioBlob,
        timestamp: new Date().toISOString()
      });

      console.log('📦 Audio chunk queued. Queue size:', this.audioQueue.length);

      // Start processing if not already processing
      if (!this.isProcessing) {
        await this.processQueue();
      }

    } catch (error) {
      console.error('❌ Error processing chunk:', error);
    }
  }

  // Process audio queue
  async processQueue() {
    if (this.audioQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift();

      try {
        // Send to background for transcription
        await chrome.runtime.sendMessage({
          type: 'AUDIO_CHUNK',
          data: {
            audioBlob: audioData.blob,
            timestamp: audioData.timestamp
          }
        });

        console.log('✅ Audio chunk sent for transcription');

      } catch (error) {
        console.error('❌ Error sending audio chunk:', error);
      }

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  // Stop capturing
  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('🛑 Audio capture stopped');
    }
    this.audioQueue = [];
    this.audioChunks = [];
  }

  // Pause capturing
  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('⏸️ Audio capture paused');
    }
  }

  // Resume capturing
  resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('▶️ Audio capture resumed');
    }
  }

  // Get current state
  getState() {
    return {
      isRecording: this.mediaRecorder?.state === 'recording',
      isPaused: this.mediaRecorder?.state === 'paused',
      queueSize: this.audioQueue.length
    };
  }

  // Analyze audio for speaker detection (simplified)
  async analyzeSpeaker(audioBlob) {
    try {
      // This is a placeholder for future speaker detection
      // Would use Web Audio API to analyze frequency patterns
      
      // For now, return unknown speaker
      return {
        speaker: 'Unknown',
        confidence: 0
      };

    } catch (error) {
      console.error('❌ Error analyzing speaker:', error);
      return {
        speaker: 'Unknown',
        confidence: 0
      };
    }
  }

  // Convert blob to base64 (for storage if needed)
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Convert base64 to blob
  base64ToBlob(base64, mimeType) {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeType });
  }
}
