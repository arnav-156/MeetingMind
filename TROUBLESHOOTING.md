# MeetingMind - Troubleshooting Guide

This guide helps you diagnose and fix common issues with MeetingMind.

## 📋 Table of Contents
1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [Recording Issues](#recording-issues)
4. [Transcription Issues](#transcription-issues)
5. [AI & Summary Issues](#ai--summary-issues)
6. [UI & Display Issues](#ui--display-issues)
7. [Performance Issues](#performance-issues)
8. [Error Messages](#error-messages)
9. [Advanced Debugging](#advanced-debugging)

---

## Quick Diagnostics

### Run This Checklist First ✅

Before diving into specific issues, run through this quick checklist:

1. **Chrome Version**: Go to `chrome://version` - Need Chrome 120+ (127+ for Chrome AI)
2. **Extension Enabled**: Go to `chrome://extensions` - MeetingMind should be ON
3. **Page Refresh**: Refresh the meeting page (F5 or Ctrl+R)
4. **Microphone Permission**: Check Chrome Settings → Privacy → Microphone
5. **Console Errors**: Press F12 → Console tab - Look for red errors
6. **Internet Connection**: Verify you're online
7. **Meeting Platform**: Confirm you're on Google Meet, Zoom web, or Teams web

---

## Installation Issues

### ❌ "Could not load extension"

**Symptom**: Extension fails to load in Chrome

**Solutions**:

1. **Check manifest.json syntax**:
   ```powershell
   # Validate JSON syntax online or with:
   python -m json.tool manifest.json
   ```

2. **Verify all required files exist**:
   - `manifest.json`
   - `background.js`
   - `content/content.js`
   - `sidepanel/sidepanel.html`, `sidepanel/sidepanel.js`
   - `utils/ai-manager.js`, `utils/storage.js`, `utils/audio-processor.js`
   - `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

3. **Check file permissions**: Ensure you have read access to all files

4. **Try different folder**: Copy extension to a new location and reload

### ❌ "Could not load icon 'icons/icon16.png'"

**Symptom**: Extension loads but shows broken icon

**Solutions**:

1. **Verify icon files exist** in the `icons/` folder:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. **Create missing icons**:
   ```powershell
   # Option 1: Use the Python script
   cd icons
   python create-icons.py
   
   # Option 2: Create manually in Paint/GIMP
   # - Create square images at exact sizes
   # - Save as PNG format
   ```

3. **Check file names**: Must match exactly (case-sensitive on some systems)

4. **Verify PNG format**: Open icons in image viewer to confirm they're valid PNGs

### ❌ Extension doesn't appear in toolbar

**Symptom**: Extension installed but icon not visible

**Solutions**:

1. **Check extensions menu**: Click puzzle piece icon (🧩) in Chrome toolbar
2. **Pin the extension**: Click pin icon next to MeetingMind
3. **Verify it's enabled**: Go to `chrome://extensions` - toggle should be blue
4. **Restart Chrome**: Close ALL Chrome windows and reopen

---

## Recording Issues

### ❌ "Failed to start recording"

**Symptom**: Click "Start Recording" but nothing happens

**Diagnosis Steps**:

1. **Check Console Errors**:
   ```javascript
   // Press F12, go to Console tab
   // Look for errors starting with "❌ Failed to start recording:"
   ```

2. **Verify microphone permissions**:
   - Chrome Settings → Privacy and Security → Site Settings → Microphone
   - Check if meeting platform (meet.google.com, zoom.us, teams.microsoft.com) is allowed
   - Browser toolbar should show microphone icon when in use

3. **Check extension permissions**:
   - `chrome://extensions` → MeetingMind → Details
   - Verify "Site access" includes meeting platforms

**Solutions**:

**For "Microphone blocked" error**:
1. Click microphone icon in Chrome address bar
2. Select "Always allow" for the meeting platform
3. Reload page and try again

**For "Extension context invalidated" error**:
1. The extension was reloaded while you were using it
2. **Solution**: Refresh the meeting page (F5)
3. Click extension icon again to reopen side panel

**For "Meeting not detected" warning**:
1. This is just a warning - recording will still work!
2. Make sure you're on a supported platform:
   - ✅ `meet.google.com/*`
   - ✅ `*.zoom.us/*`
   - ✅ `teams.microsoft.com/*`
3. Refresh page if needed

### ❌ Recording starts but no transcripts appear

**Symptom**: Status shows "Recording" but transcript list is empty

**Diagnosis**:

1. **Check if anyone is speaking**: MeetingMind only transcribes when it detects speech
2. **Verify Web Speech API is working**:
   ```javascript
   // Open Console (F12) and run:
   const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
   console.log('Speech Recognition available:', !!recognition);
   ```

3. **Check microphone input**:
   - Go to Chrome Settings → Privacy → Microphone
   - Click "Test" to verify microphone is working
   - Speak and watch for input level bars

**Solutions**:

1. **Speak clearly** into microphone
2. **Check microphone volume**: System Settings → Sound → Input
3. **Try different microphone**: Switch to headset if using built-in mic
4. **Restart Chrome**: Sometimes Speech Recognition gets stuck
5. **Check internet connection**: Web Speech API requires online access

### ❌ "currentMeetingId is not defined" error

**Symptom**: Console shows `ReferenceError: currentMeetingId is not defined`

**This should be fixed in latest version**. If you see this:

1. **Check your version**: Should be 1.0.0 or higher
2. **Reload extension**: `chrome://extensions` → Reload button
3. **Clear cache**: Chrome Settings → Privacy → Clear browsing data → Cached files

---

## Transcription Issues

### ❌ Transcription is inaccurate or garbled

**Symptom**: Words are misspelled, incorrect, or nonsensical

**Causes & Solutions**:

1. **Background Noise**:
   - Use headset with noise-canceling microphone
   - Close windows, turn off fans
   - Mute when not speaking

2. **Poor Microphone Quality**:
   - Built-in laptop mics are often poor quality
   - **Recommended**: Use external USB microphone or headset
   - Check microphone positioning (6-12 inches from mouth)

3. **Fast or Unclear Speech**:
   - Speak at moderate pace
   - Enunciate clearly
   - Avoid mumbling or trailing off

4. **Accent Recognition**:
   - Web Speech API uses your browser's language setting
   - Chrome Settings → Languages → Set preferred language
   - Chrome AI (Gemini Nano) has better accent recognition

5. **Technical Jargon**:
   - Speech recognition struggles with uncommon words
   - Spell out acronyms when possible
   - **Tip**: Edit transcripts manually after meeting

### ❌ Missing words or sentences

**Symptom**: Transcription has gaps or skips parts

**Causes**:

1. **Quiet speech**: Increase microphone volume or speak louder
2. **Poor internet connection**: Web Speech API requires stable connection
3. **Buffer overflow**: Very long speeches may get truncated

**Solutions**:

1. **Check microphone levels**: Should peak around 70-80%
2. **Test internet speed**: Need at least 1 Mbps upload
3. **Speak in shorter sentences**: Pause briefly between thoughts
4. **Check console for errors**: May show "no-speech" or "audio-capture" errors

### ❌ Wrong language detected

**Symptom**: Transcription is in wrong language or gibberish

**Solution**:

1. **Set browser language**:
   - Chrome Settings → Languages
   - Move your preferred language to top
   - Restart Chrome

2. **Check Web Speech API language**:
   ```javascript
   // In content/content.js, the language is set to:
   recognition.lang = 'en-US'; // English (US)
   
   // To change, edit this line in content.js
   // Supported: 'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', etc.
   ```

3. **Verify microphone input**: System might be picking up background audio

---

## AI & Summary Issues

### ❌ "Failed to generate summary"

**Symptom**: Click "Generate Summary" but get error message

**Diagnosis**:

1. **Check if you have transcripts**: Need at least 30 seconds of speech
2. **Check Chrome AI status**: Look at AI status indicator in side panel
3. **Check console errors**:
   ```
   Error: Chrome AI not available
   Error: Insufficient transcript data
   Error: window is not defined (should be fixed in v1.0.0+)
   ```

**Solutions**:

**If "Chrome AI not available"**:
1. Chrome AI is not required - Web Speech API will work
2. To enable Chrome AI (optional):
   - See [FAQ.md - Chrome AI Integration](./FAQ.md#chrome-ai-integration)
   - Enable flags at `chrome://flags`
   - Download model at `chrome://components`

**If "Insufficient transcript data"**:
1. Record more speech (need 100+ words)
2. Wait at least 30 seconds before generating summary
3. Speak into microphone to generate transcripts first

**If summary is low quality**:
1. **Use Chrome AI** instead of Web Speech API (better results)
2. **Record longer meetings**: More context = better summaries
3. **Speak clearly**: Better transcripts = better summaries
4. **Generate multiple summaries**: Create summary every 15-20 minutes in long meetings

### ❌ Action items not detected

**Symptom**: Summary generates but no action items found

**This is normal!** Action items are only detected if meeting contains:
- Task assignments ("John, can you handle X?")
- Decisions made ("We decided to...")
- Follow-up items ("Let's follow up on...")
- TODO items ("We need to...")
- Questions to answer ("Can someone research...")

**To get better action items**:
1. Use explicit task language: "Action item: X should do Y"
2. Be specific: "John will send the report by Friday"
3. Use decision language: "We decided to move forward with option A"

### ❌ "window is not defined" error

**Symptom**: Console shows `ReferenceError: window is not defined` in background.js

**This is fixed in v1.0.0+**. If you still see it:

1. **Update to latest version**: Should be 1.0.0 or higher
2. **Check background.js line 539**: Should use `summaryInterval` not `window.summaryInterval`
3. **Reload extension**: `chrome://extensions` → Reload

---

## UI & Display Issues

### ❌ Side panel doesn't open

**Symptom**: Click extension icon but side panel doesn't appear

**Solutions**:

1. **Check Chrome version**: Side Panel API requires Chrome 114+
   ```
   chrome://version → Check version number
   ```

2. **Try alternative method**:
   - Click floating button in bottom-right of meeting page
   - Right-click extension icon → "Open Side Panel"

3. **Disable conflicting extensions**:
   - Go to `chrome://extensions`
   - Temporarily disable other extensions
   - Try opening side panel again

4. **Check console errors**:
   ```javascript
   // Press F12 in the meeting tab
   // Look for errors about "side panel" or "chrome.sidePanel"
   ```

5. **Clear extension storage**:
   - Chrome Settings → Privacy → Site Settings
   - View permissions and data → Find MeetingMind
   - Clear data and try again

### ❌ Floating button doesn't appear

**Symptom**: No floating button in bottom-right corner of meeting page

**Solutions**:

1. **Refresh the page**: Extension injected on page load
2. **Check if you're on supported platform**:
   - ✅ meet.google.com
   - ✅ *.zoom.us
   - ✅ teams.microsoft.com
   - ❌ zoom.us/download (desktop app download page)

3. **Check console errors**:
   ```javascript
   // F12 → Console
   // Look for "MeetingMind: Initialized on [platform]"
   ```

4. **Verify content script loaded**:
   ```javascript
   // F12 → Sources tab
   // Look for "content/content.js" in file tree
   ```

5. **Check CSS conflicts**: Another extension might be hiding it
   - Try disabling other extensions temporarily

### ❌ Auto-scroll not working

**Symptom**: New transcripts appear but view doesn't scroll down

**Solutions**:

1. **Check toggle**: Auto-scroll switch should be ON (blue)
2. **Manual scroll disables auto-scroll temporarily**:
   - If you scroll manually, auto-scroll pauses
   - Toggle OFF then ON to re-enable

3. **Check for JavaScript errors**: F12 → Console
4. **Disable smooth scroll**: Some systems have issues with smooth scrolling
5. **Try scrolling to bottom manually** then toggle auto-scroll

### ❌ Copy button doesn't work

**Symptom**: Click copy button but nothing happens

**Solutions**:

1. **Check clipboard permissions**:
   - Chrome may block clipboard access
   - Click "Allow" if prompted

2. **Try manual copy**:
   - Select text with mouse
   - Right-click → Copy
   - Or Ctrl+C (⌘+C on Mac)

3. **Check console errors**: F12 → Console
4. **Try in HTTPS context**: Clipboard API requires secure context

---

## Performance Issues

### ❌ Extension is slow or laggy

**Symptom**: Side panel takes a long time to respond

**Causes & Solutions**:

1. **Too many transcripts**:
   - Long meetings generate thousands of DOM elements
   - **Solution**: Export and restart recording every 1-2 hours
   - **Coming soon**: Virtual scrolling for better performance

2. **Memory leak**:
   - Service worker or side panel consuming excessive memory
   - **Check**: Chrome Task Manager (Shift+Esc)
   - **Solution**: Reload extension at `chrome://extensions`

3. **Other extensions**: Disable other extensions temporarily

4. **Low system resources**:
   - Close unnecessary tabs/programs
   - Restart Chrome
   - Check system RAM usage

### ❌ Chrome becomes unresponsive

**Symptom**: Browser freezes or crashes during recording

**Immediate Action**:
1. Press Ctrl+Shift+Esc → End Chrome process
2. Restart Chrome
3. Data is saved in IndexedDB (should be recoverable)

**Prevention**:

1. **Don't record extremely long meetings** (2+ hours) without breaks
2. **Export regularly**: Save transcripts every 30-60 minutes
3. **Close unnecessary tabs**: Each tab uses memory
4. **Increase Chrome memory limit** (Advanced):
   ```powershell
   # Launch Chrome with more memory
   chrome.exe --max-old-space-size=4096
   ```

5. **Use a better computer**: Minimum 8GB RAM recommended

### ❌ High CPU usage

**Symptom**: Fan runs loudly, system slow, CPU usage high

**Solutions**:

1. **Check Chrome Task Manager** (Shift+Esc):
   - Look for MeetingMind processes
   - Note CPU% and Memory usage

2. **Disable Chrome AI** if not needed:
   - Uses significant CPU for local processing
   - Web Speech API is lighter weight

3. **Reduce transcript buffer**:
   - Edit `background.js`:
   ```javascript
   const MAX_BUFFER_SIZE = 10; // Reduce from 20
   const MAX_TRANSCRIPT_LENGTH = 5000; // Reduce from 10000
   ```

4. **Close other Chrome tabs**
5. **Disable hardware acceleration**:
   - Chrome Settings → System → Use hardware acceleration (toggle OFF)

---

## Error Messages

### Common Error Messages & Solutions

#### ❌ "Extension context invalidated"

**Meaning**: Extension was reloaded/updated while you were using it

**Solution**:
1. Refresh the meeting page (F5)
2. Reopen side panel
3. Previous data is saved and recoverable

**Prevention**: Don't reload extension during active meetings

---

#### ❌ "Failed to capture audio: Extension has not been invoked for current page"

**Meaning**: Old error from chrome.tabCapture implementation (deprecated)

**Solution**: This should not appear in v1.0.0+. If you see it:
1. Update to latest version
2. Verify you're not using old code with chrome.tabCapture

---

#### ❌ "chrome.tabCapture.capture is not a function"

**Meaning**: Old error (chrome.tabCapture doesn't work in Manifest V3)

**Solution**: Update to v1.0.0+ which uses Web Speech API instead

---

#### ❌ "TypeError: Cannot read properties of null (reading 'meetingTitle')"

**Meaning**: Code tried to access meeting data that doesn't exist

**Solution**: Fixed in v1.0.0+. If you see this:
1. Update to latest version
2. Check `sidepanel.js` has null checks:
   ```javascript
   if (response && response.isRecording && response.meeting) {
     // Safe to access response.meeting.meetingTitle
   }
   ```

---

#### ❌ "Loading script 'https://cdn.tailwindcss.com/' violates Content Security Policy"

**Meaning**: Manifest V3 blocks external scripts (Tailwind CDN)

**Solution**: Fixed in v1.0.0+ (uses inline CSS instead)

---

#### ❌ "Uncaught Error: A listener indicated an asynchronous response by returning true"

**Meaning**: Message listener didn't properly handle async response

**Usually harmless** but if it causes issues:
1. Check message handlers use `sendResponse` correctly
2. Verify `return true` in async listeners
3. Check console for specific file/line number

---

#### ❌ "Service worker registration failed"

**Meaning**: Background service worker couldn't start

**Solutions**:
1. Check `manifest.json` syntax
2. Verify `background.js` exists and has no syntax errors
3. Check browser console for specific error
4. Reload extension at `chrome://extensions`

---

#### ❌ "Unable to load IndexedDB"

**Meaning**: Database initialization failed

**Solutions**:
1. Check if browser storage is full
2. Clear Chrome storage: Settings → Privacy → Clear browsing data
3. Try incognito mode (tests if extension storage is corrupt)
4. Check `storage.js` for errors

---

## Advanced Debugging

### Enable Verbose Logging

Add more detailed logging to track down issues:

1. **Edit background.js**:
   ```javascript
   // At top of file, add:
   const DEBUG = true;
   
   function log(...args) {
     if (DEBUG) console.log('[MeetingMind]', ...args);
   }
   
   // Replace console.log with log() throughout file
   ```

2. **Check logs**:
   - Open `chrome://extensions`
   - Click "Inspect views: service worker" under MeetingMind
   - Console shows all background script logs

### Inspect Service Worker

1. Go to `chrome://extensions`
2. Find MeetingMind
3. Click **"Inspect views: service worker"**
4. DevTools opens for background script
5. Check Console, Sources, Network tabs

### Inspect Side Panel

1. Open side panel
2. Right-click in side panel
3. Select **"Inspect"**
4. DevTools opens for side panel
5. Check Console for errors

### Inspect Content Script

1. Go to meeting page
2. Press **F12** (open DevTools)
3. Go to **Console** tab
4. Filter for "MeetingMind" messages
5. Check for initialization and error messages

### Check IndexedDB

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Find **MeetingMindDB**
5. Inspect tables:
   - `meetings` - All meeting records
   - `transcripts` - Transcript entries
   - `summaries` - Generated summaries
   - `actionItems` - Extracted action items

### Export Debug Info

Create a debug report to share with support:

```javascript
// Run in Console (F12) on side panel:
const debugInfo = {
  version: '1.0.0',
  chrome: navigator.userAgent,
  storage: await chrome.storage.local.get(null),
  errors: console.memory,
  // Add any relevant state
};
console.log(JSON.stringify(debugInfo, null, 2));
```

### Reset Extension Completely

If nothing works, completely reset the extension:

1. **Uninstall**:
   - `chrome://extensions`
   - Remove MeetingMind

2. **Clear all data**:
   - Chrome Settings → Privacy → Clear browsing data
   - Time range: All time
   - Check: Cookies, Cached files

3. **Restart Chrome**:
   - Close ALL Chrome windows
   - Wait 10 seconds
   - Reopen Chrome

4. **Reinstall extension**:
   - Load unpacked from fresh folder
   - Reload meeting page

---

## Still Having Issues?

If you've tried everything and still have problems:

1. **Check [FAQ.md](./FAQ.md)** for additional info
2. **Search [GitHub Issues](link-coming-soon)** for similar problems
3. **Open a new issue** with:
   - Chrome version (`chrome://version`)
   - Extension version
   - Operating system
   - Steps to reproduce
   - Console errors (F12 → Console)
   - Screenshots if helpful

4. **Contact support** at [email coming soon]

---

**Last Updated**: October 28, 2025  
**Version**: 1.0.0  

For general questions, see [FAQ.md](./FAQ.md).
