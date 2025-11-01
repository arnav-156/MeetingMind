# MeetingMind - Setup Guide

## 🎯 Quick Start (5 minutes)

### Step 1: Enable Chrome AI Features

**CRITICAL**: You must use **Chrome Canary** or **Chrome Dev** channel.

1. Download Chrome Canary: https://www.google.com/chrome/canary/
2. Open Chrome Canary
3. Enable AI flags:

```
chrome://flags/#optimization-guide-on-device-model
→ Set to "Enabled"

chrome://flags/#prompt-api-for-gemini-nano  
→ Set to "Enabled"

chrome://flags/#summarization-api-for-gemini-nano
→ Set to "Enabled"

chrome://flags/#writer-api-for-gemini-nano
→ Set to "Enabled"
```

4. **Restart Chrome Canary**

### Step 2: Verify AI Model Download

1. Open `chrome://components/`
2. Look for "Optimization Guide On Device Model"
3. If version is `0.0.0.0`, click "Check for update"
4. Wait for model to download (may take 5-10 minutes)
5. Version should update to something like `2024.10.12.1234`

### Step 3: Load Extension

1. Download/clone the MeetingMind folder
2. Open `chrome://extensions/` in Chrome Canary
3. Toggle "Developer mode" ON (top right)
4. Click "Load unpacked"
5. Select the `meeting mind` folder
6. Extension icon 🎙️ appears in toolbar

### Step 4: Test It!

1. Go to https://meet.google.com/ and start a test meeting
2. Click the MeetingMind floating button (or extension icon)
3. Click "Start Recording"
4. Grant microphone/audio permissions
5. Speak a few test sentences
6. Watch transcript appear in real-time! ✨

---

## 🐛 Troubleshooting

### Issue: "Chrome AI APIs not available"

**Solution**:
- Make sure you're using Chrome Canary/Dev (not stable Chrome)
- Verify all flags are enabled (Step 1)
- Check that AI model is downloaded (Step 2)
- Restart browser completely

### Issue: "Failed to capture audio"

**Solution**:
- Grant microphone/audio permissions when prompted
- Make sure you're on a supported platform (Google Meet, Zoom, Teams)
- Check browser permissions: `chrome://settings/content/microphone`
- Try closing other apps using microphone

### Issue: "No transcription appearing"

**Solution**:
- Check browser console for errors (F12)
- Verify audio is playing (check volume)
- Try speaking louder or closer to microphone
- Web Speech API might need better audio quality

### Issue: Service worker inactive

**Solution**:
- Go to `chrome://extensions/`
- Find MeetingMind
- Click "Inspect views: service worker"
- Check console for errors

---

## 📝 Usage Tips

### Best Practices
1. **Start recording AFTER** joining the meeting
2. **Speak clearly** for better transcription
3. **Use @mentions** for action items (e.g., "@John please review")
4. **Export regularly** don't rely on auto-retention
5. **Test first** in a solo meeting to verify setup

### Keyboard Shortcuts (coming soon)
- `Ctrl+Shift+M` - Open side panel
- `Ctrl+Shift+R` - Start/stop recording
- `Ctrl+Shift+S` - Generate summary

---

## 🔧 Advanced Configuration

### Custom AI Prompts

Edit `utils/ai-manager.js` to customize AI behavior:

```javascript
// Example: Custom summary style
const prompt = `Summarize this meeting in a professional tone...`;
```

### Storage Limits

IndexedDB default quota: ~60% of available disk space
- Monitor usage: `navigator.storage.estimate()`
- Implement custom cleanup in `utils/storage.js`

### Audio Quality

Adjust in `utils/audio-processor.js`:

```javascript
const options = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000 // Increase for better quality
};
```

---

## 🚀 Performance Optimization

### For Long Meetings (2+ hours)

1. Reduce summary interval (Settings → 10 minutes)
2. Clear old transcripts periodically
3. Monitor memory usage (Chrome Task Manager)
4. Consider splitting into multiple sessions

### For Slow Devices

1. Disable auto-summaries (manual only)
2. Increase audio chunk size
3. Reduce data retention period
4. Use fallback transcription only

---

## 🧪 Testing Checklist

Before using in important meetings:

- [ ] Test audio capture works
- [ ] Verify transcription quality
- [ ] Check summary generation
- [ ] Test action item extraction
- [ ] Verify export functions
- [ ] Test with actual meeting platform
- [ ] Check data persistence (close/reopen)
- [ ] Test pause/resume functionality

---

## 📱 Platform-Specific Notes

### Google Meet
- ✅ Full support
- Works best with Chrome tab audio
- Enable "Original sound" for better quality

### Zoom (Web)
- ⚠️ Limited support
- Must use web version (not desktop app)
- May require additional permissions

### Microsoft Teams
- ⚠️ Limited support
- Web version only
- Some features may not work

---

## 🔍 Debug Mode

Enable verbose logging:

1. Open background service worker console
2. Run: `localStorage.setItem('DEBUG', 'true')`
3. Reload extension
4. More detailed logs appear

---

## 💾 Data Backup

Export all meetings:

```javascript
// Open side panel console
// Run this script to export all data

const exportAll = async () => {
  const db = await indexedDB.open('MeetingMindDB', 1);
  // ... export logic
};
```

---

## 🆘 Getting Help

1. Check console errors (F12)
2. Review [GitHub Issues](https://github.com/yourusername/meetingmind/issues)
3. Join [Discussions](https://github.com/yourusername/meetingmind/discussions)
4. Email: support@meetingmind.dev

---

## 📊 System Requirements

### Minimum
- Chrome Canary/Dev 120+
- 4GB RAM
- 1GB free disk space
- Microphone access

### Recommended
- Chrome Canary/Dev 125+
- 8GB+ RAM
- 5GB free disk space
- High-quality microphone
- Stable internet connection

---

**Ready to go? Join a meeting and let MeetingMind do the work! 🚀**
