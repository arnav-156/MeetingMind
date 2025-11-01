# ⚡ MeetingMind - Quick Setup Guide for Judges

**Time Required**: 2-3 minutes  
**Purpose**: Get MeetingMind running for evaluation

---

## 🚀 Quick Start (3 Steps)

### Step 1: Prerequisites Check (30 seconds)
You'll need:
- ✅ **Chrome Canary** or **Chrome Dev** (v120+)
- ✅ **Windows, Mac, or Linux**
- ✅ **15 MB free disk space**

[Download Chrome Canary](https://www.google.com/chrome/canary/)

---

### Step 2: Enable Chrome AI (1 minute)

**Required for AI features to work!**

1. Open Chrome Canary
2. Navigate to: `chrome://flags/#optimization-guide-on-device-model`
3. Set to: **Enabled BypassPerfRequirement**
4. Navigate to: `chrome://flags/#prompt-api-for-gemini-nano`
5. Set to: **Enabled**
6. Navigate to: `chrome://flags/#summarization-api-for-gemini-nano`
7. Set to: **Enabled**
8. Click **"Relaunch"** button at bottom
9. Wait 2-3 minutes for AI model download (happens automatically)

**Verify AI is ready**:
- Open DevTools (F12)
- Run: `await ai.languageModel.capabilities()`
- Should show: `{available: "readily"}`

---

### Step 3: Install Extension (1 minute)

#### Option A: From ZIP File
1. Download `MeetingMind-v1.0.0.zip`
2. Extract to folder
3. Go to: `chrome://extensions/`
4. Enable **"Developer mode"** (top right)
5. Click **"Load unpacked"**
6. Select extracted folder
7. Done! ✅

#### Option B: From GitHub
1. Clone or download: `https://github.com/arnav-156/MeetingMind`
2. Go to: `chrome://extensions/`
3. Enable **"Developer mode"** (top right)
4. Click **"Load unpacked"**
5. Select the `meeting mind` folder
6. Done! ✅

**Verify Installation**:
- Extension icon (🎙️) should appear in toolbar
- Click icon → Side panel should open

---

## 🧪 Test Scenarios (5 minutes)

### Test 1: Basic Transcription (2 minutes)

1. **Join test meeting**:
   - Go to: `https://meet.google.com/new`
   - Click "Start an instant meeting"
   - Allow microphone access

2. **Start MeetingMind**:
   - Click floating MeetingMind button (bottom right)
   - Click "Start Recording"
   - Allow audio capture permission

3. **Speak into microphone**:
   ```
   "This is a test meeting to demonstrate MeetingMind's 
   real-time transcription capabilities. We will discuss 
   the quarterly roadmap and assign action items to team members."
   ```

4. **Verify**:
   - ✅ Transcript appears in side panel
   - ✅ Words appear in real-time
   - ✅ Speaker labels visible
   - ✅ Timestamps on each transcript

---

### Test 2: AI Summary (1 minute)

1. **Generate summary**:
   - Click "📝 Summarize Now" button
   - Wait 2-3 seconds

2. **Verify**:
   - ✅ Loading spinner appears
   - ✅ Summary appears with bullet points
   - ✅ Key topics, decisions, action items listed
   - ✅ Professional formatting

**Expected Output**:
```
📋 Meeting Summary

Key Topics:
• Quarterly roadmap discussion
• Team action item assignment
• Testing MeetingMind features

Decisions Made:
• Proceeding with MeetingMind evaluation

Action Items:
• Continue testing features
```

---

### Test 3: Action Items (30 seconds)

1. **Speak action items**:
   ```
   "John, please review the design docs by Friday. 
   Sarah, can you send the metrics report by end of day?"
   ```

2. **Click "Extract Actions"** button

3. **Verify**:
   - ✅ Action items appear with checkboxes
   - ✅ Assignees detected (@John, @Sarah)
   - ✅ Deadlines extracted (Friday, EOD)
   - ✅ Can click checkbox to mark complete

---

### Test 4: Meeting IQ (30 seconds)

1. **Stop recording** (after 2-3 minutes)
2. **Click "Meeting IQ" tab**

3. **Verify**:
   - ✅ Score displayed (0-100)
   - ✅ Insights shown (clarity, engagement, productivity)
   - ✅ Suggestions for improvement
   - ✅ Visual indicators (✅ ⚠️)

---

### Test 5: Export (30 seconds)

1. **Click "Export" dropdown**

2. **Try each option**:
   - ✅ Generate Email → Shows email draft
   - ✅ Export Markdown → Downloads .md file
   - ✅ Copy to Clipboard → Copies text
   - ✅ Export JSON → Downloads .json file

3. **Verify**:
   - ✅ All formats work
   - ✅ Content is complete
   - ✅ Professional formatting

---

## 🎯 Key Features to Evaluate

### Innovation (Chrome Built-in AI)
- Uses **Prompt API** for intelligent queries
- Uses **Writer API** for content generation
- Uses **Summarizer API** for meeting summaries
- **100% local processing** (no external APIs)
- **No API keys required**

### Technical Complexity
- **15,000+ lines** of vanilla JavaScript
- **9 IndexedDB stores** for data persistence
- **Manifest V3** Chrome extension
- **Web Speech API** integration
- **Real-time audio processing** with MediaRecorder

### User Experience
- **Zero-config setup** (works out of box)
- **Real-time feedback** (live transcription)
- **Smart UI** (auto-scroll, speaker colors, timestamps)
- **Keyboard shortcuts** (Ctrl+Shift+R to start/stop)
- **Dark mode** support

### Privacy & Security
- **Local-first** architecture
- **No external servers**
- **No data collection**
- **Auto-cleanup** after 30 days
- **GDPR/CCPA compliant**

---

## 🐛 Troubleshooting

### Issue: "AI not available"
**Solution**:
1. Check `chrome://components/` → "Optimization Guide On Device Model"
2. If not present, wait 5 minutes for download
3. If still missing, go to `chrome://flags/#optimization-guide-on-device-model`
4. Set to "Enabled BypassPerfRequirement"
5. Restart Chrome

### Issue: "Extension not loading"
**Solution**:
1. Check you're using Chrome Canary/Dev (not stable)
2. Enable Developer mode in `chrome://extensions/`
3. Check folder has `manifest.json` file
4. Check for error messages in Extensions page

### Issue: "No audio detected"
**Solution**:
1. Check microphone is working (test in Google Meet)
2. Grant microphone permission when prompted
3. Check Chrome has system audio permissions
4. Try refreshing meeting tab

### Issue: "Transcription not appearing"
**Solution**:
1. Check microphone icon is green (recording active)
2. Speak louder or closer to microphone
3. Check language setting (default: English)
4. Try stopping and restarting recording

### Issue: "Summary generation fails"
**Solution**:
1. Verify Chrome AI is enabled (see Step 2)
2. Check `await ai.languageModel.capabilities()` returns "readily"
3. Wait for AI model download to complete
4. Try with shorter meeting (< 5 minutes first)

---

## 📊 Expected Performance

### Transcription
- **Accuracy**: 85-95% (depends on audio quality)
- **Latency**: ~1-2 seconds
- **Languages**: English (primary), 50+ others supported

### AI Processing
- **Summary generation**: 2-5 seconds
- **Action item extraction**: 1-3 seconds
- **Meeting IQ calculation**: 1-2 seconds

### Storage
- **Transcript**: ~10 KB per minute
- **Full meeting**: ~100 KB for 10-minute meeting
- **Total extension**: ~500 KB

---

## 📞 Contact for Issues

If you encounter problems during evaluation:

**GitHub Issues**: https://github.com/arnav-156/MeetingMind/issues  
**Documentation**: See README.md, FAQ.md, TROUBLESHOOTING.md  
**Email**: [Add your email here]

---

## ✅ Evaluation Checklist

Use this to verify all features work:

- [ ] Extension loads without errors
- [ ] Floating button appears on meeting pages
- [ ] Side panel opens when clicked
- [ ] Recording starts and shows green indicator
- [ ] Real-time transcription appears
- [ ] Speaker detection works
- [ ] Manual summary generation works
- [ ] Automatic summaries generate (after 5 min)
- [ ] Action items extract correctly
- [ ] Meeting IQ calculates and displays
- [ ] Export options all work
- [ ] Email generation produces professional draft
- [ ] Dark mode toggle works
- [ ] Data persists after browser restart
- [ ] No console errors (check DevTools)

---

## 🏆 Ready for Evaluation!

**Total setup time**: 2-3 minutes  
**Total testing time**: 5-10 minutes  
**Full feature evaluation**: 15-20 minutes

MeetingMind is production-ready with:
- ✅ 40+ features fully functional
- ✅ Professional UI/UX
- ✅ Comprehensive documentation
- ✅ Zero known critical bugs
- ✅ Chrome Web Store ready

Thank you for evaluating MeetingMind! 🚀
