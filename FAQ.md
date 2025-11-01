# MeetingMind - Frequently Asked Questions (FAQ)

## 📋 Table of Contents
1. [General Questions](#general-questions)
2. [Installation & Setup](#installation--setup)
3. [Usage & Features](#usage--features)
4. [Chrome AI Integration](#chrome-ai-integration)
5. [Privacy & Security](#privacy--security)
6. [Troubleshooting](#troubleshooting)
7. [Technical Questions](#technical-questions)

---

## General Questions

### What is MeetingMind?
MeetingMind is a Chrome extension that provides AI-powered real-time transcription, smart summaries, and automated action item extraction for your online meetings. It works with Google Meet, Zoom, and Microsoft Teams.

### Is MeetingMind free?
Yes! MeetingMind is completely free and open-source. All processing happens locally on your device using Chrome's built-in AI APIs or the Web Speech API.

### What platforms does it support?
- ✅ Google Meet
- ✅ Zoom (web version)
- ✅ Microsoft Teams (web version)

### Do I need an internet connection?
Yes, you need an internet connection for:
- Joining online meetings
- Using Chrome's AI APIs (if available)
- Web Speech API requires internet for speech recognition

However, all data is processed locally and never sent to external servers (except Chrome's built-in APIs).

### What languages are supported?
Currently, MeetingMind supports:
- **Full support**: English (US, UK, AU)
- **Basic support**: Spanish, French, German, Portuguese, Italian
- **Web Speech API**: Depends on your browser's language settings

---

## Installation & Setup

### How do I install MeetingMind?

**Option 1: From Chrome Web Store (Coming Soon)**
1. Visit the Chrome Web Store
2. Search for "MeetingMind"
3. Click "Add to Chrome"
4. Follow the prompts

**Option 2: Developer Mode (Current)**
1. Download the extension files
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `meeting mind` folder
6. Done! The extension is now installed

### Do I need Chrome AI (Gemini Nano)?
No! MeetingMind works in three modes:
1. **Chrome AI** (best quality) - If you have Chrome AI enabled
2. **Web Speech API** (good quality) - Falls back automatically if Chrome AI unavailable
3. **Manual transcription** - You can always add notes manually

### How do I enable Chrome AI?
See the [Chrome AI Integration](#chrome-ai-integration) section below.

### The extension icon doesn't appear. What should I do?
1. Make sure the extension is enabled in `chrome://extensions`
2. Refresh the page you're on
3. Check if the icon is hidden in the extensions menu (puzzle piece icon in toolbar)
4. Pin the extension for easy access

---

## Usage & Features

### How do I start recording a meeting?

1. **Join a meeting** on Google Meet, Zoom, or Teams
2. **Look for the floating MeetingMind button** in the bottom-right corner
3. **Click the extension icon** in Chrome toolbar OR click the floating button
4. **Side panel opens** - Click "Start Recording"
5. **Speak naturally** - Transcription begins automatically!

### Can I pause and resume recording?
Yes! Click the "Pause" button to pause transcription. Click it again to resume. All transcripts are preserved.

### How do I generate a summary?
1. While recording (or after stopping), click "Generate Summary"
2. Wait a few seconds for AI processing
3. Summary appears with key points and action items
4. You can generate multiple summaries during a long meeting

### What are action items?
Action items are automatically extracted tasks, decisions, and follow-ups detected from your meeting conversation. They appear below the summary with:
- ✅ Checkboxes for completion tracking
- 📋 Brief description
- 🏷️ Category (task, decision, follow-up)

### How do I export my transcripts?

1. Click the **Export** dropdown button
2. Choose format:
   - **TXT** - Plain text transcript
   - **Markdown** - Formatted transcript with timestamps
   - **JSON** - Full data export (transcripts + summaries + action items)
3. File downloads automatically with meeting title and date

### Can I copy individual sections?
Yes! Hover over any transcript entry or summary card and click the **Copy** button (📋) that appears.

### Does auto-scroll work?
Yes! Auto-scroll is enabled by default. Toggle it ON/OFF using the switch at the top of the transcript section. When enabled, the view automatically scrolls to show the latest transcript.

### Can I use keyboard shortcuts?
Yes! MeetingMind supports these shortcuts:
- **Ctrl+R** (⌘+R on Mac) - Start/Stop Recording
- **Ctrl+S** (⌘+S on Mac) - Generate Summary
- **Ctrl+E** (⌘+E on Mac) - Export as TXT
- **Ctrl+K** (⌘+K on Mac) - Toggle Keyboard Shortcuts Help
- **Ctrl+P** (⌘+P on Mac) - Pause/Resume Recording

---

## Chrome AI Integration

### What is Chrome AI (Gemini Nano)?
Chrome AI is Google's built-in AI model that runs locally in Chrome 127+. It provides high-quality summarization and text generation without sending data to external servers.

### How do I check if I have Chrome AI?
1. Open Chrome and type `chrome://flags` in the address bar
2. Search for "Prompt API" or "AI"
3. If you see options like "prompt-api-for-gemini-nano", Chrome AI is available

### How do I enable Chrome AI?

**Prerequisites:**
- Chrome version 127 or higher
- Windows 10/11, macOS 13+, or ChromeOS

**Steps:**
1. Go to `chrome://flags`
2. Enable these flags:
   - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#summarization-api-for-gemini-nano` → **Enabled**
3. Restart Chrome
4. Go to `chrome://components`
5. Find "Optimization Guide On Device Model"
6. Click "Check for Update" and wait for download (~1.5GB)
7. Restart Chrome again

### How do I know if Chrome AI is working?
When you start recording, look for the AI status indicator:
- **"Chrome AI Active"** - Using Chrome AI ✅
- **"Web Speech API"** - Fallback mode (still works well!)
- **"No AI Available"** - Check your Chrome AI setup

### Chrome AI isn't working. What should I do?
1. Verify all flags are enabled (see above)
2. Check Chrome version: `chrome://version` (need 127+)
3. Ensure model downloaded: `chrome://components` (check "Optimization Guide")
4. Restart Chrome completely (close all windows)
5. Try incognito mode to rule out extension conflicts
6. Don't worry! Web Speech API is an excellent fallback

---

## Privacy & Security

### Where is my data stored?
All your meeting data is stored **locally in your browser** using IndexedDB. Nothing is sent to external servers (except when using Chrome AI or Web Speech API, which are Google services).

### Can others see my transcripts?
No! Your transcripts are private and stored only in your browser. They're not shared with anyone unless you explicitly export and share them.

### Does MeetingMind record audio files?
No! MeetingMind only captures live transcription text. No audio files are saved or stored.

### What data does MeetingMind collect?
MeetingMind does NOT collect:
- ❌ Audio recordings
- ❌ Personal information
- ❌ Meeting participants' data
- ❌ Usage analytics
- ❌ Any data sent to external servers

MeetingMind DOES store locally:
- ✅ Transcripts (text only)
- ✅ Generated summaries
- ✅ Action items
- ✅ Meeting metadata (title, date, platform)

### Is MeetingMind GDPR compliant?
Yes! Since all data is stored locally and we don't collect any personal information, MeetingMind is GDPR compliant. You have full control over your data.

### Can I delete my data?
Yes! You can:
- Delete individual meetings (coming in next version)
- Clear all data: Chrome Settings → Privacy and Security → Site Settings → View permissions and data stored → chrome-extension://[extension-id] → Clear data
- Uninstall the extension (removes all data)

### What permissions does MeetingMind need?

- **activeTab** - Access current tab to detect meetings
- **storage** - Store transcripts locally in IndexedDB
- **tabCapture** - Capture audio for transcription (not used currently due to Manifest V3 limitations)
- **sidePanel** - Display the side panel interface
- **scripting** - Inject floating button on meeting pages

---

## Troubleshooting

### The floating button doesn't appear on my meeting
1. **Refresh the page** after installing the extension
2. **Check supported platforms**: Google Meet, Zoom web, Teams web
3. **Enable the extension**: Go to `chrome://extensions` and ensure it's ON
4. **Look for the extension icon** in Chrome toolbar - click it to open side panel manually

### Recording doesn't start
1. **Check microphone permissions**: Chrome Settings → Privacy → Microphone
2. **Allow microphone access** for the meeting platform
3. **Reload the meeting page**
4. **Check browser console** for errors (F12 → Console tab)
5. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed steps

### Transcription is inaccurate
- **Speak clearly** and at a moderate pace
- **Reduce background noise**
- **Use a good microphone** (headset recommended)
- **Check your accent settings**: Chrome uses your system language
- **Try Chrome AI** instead of Web Speech API (better accuracy)

### Summary generation fails
1. **Ensure you have transcripts** - You need at least 30 seconds of speech
2. **Check Chrome AI status** - Is it enabled and downloaded?
3. **Wait a moment** - AI processing takes 5-15 seconds
4. **Check console errors** (F12)
5. **Try again** - Sometimes API calls fail temporarily

### "Extension context invalidated" error
This happens when the extension is reloaded while you're using it:
1. **Reload the meeting page**
2. **Reopen the side panel**
3. **Start recording again**
4. All previous data is still saved in IndexedDB

### Auto-scroll stopped working
1. **Check the toggle** - Make sure auto-scroll is enabled (switch at top)
2. **Manual scroll** - If you scroll manually, auto-scroll pauses temporarily
3. **Re-enable** - Toggle it OFF then ON again

### Export doesn't work
1. **Check Chrome download settings** - Ensure downloads are allowed
2. **Disable popup blockers** for the extension
3. **Try a different format** (TXT, MD, JSON)
4. **Check browser console** for errors

For more detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Technical Questions

### What technologies does MeetingMind use?
- **Manifest V3** - Latest Chrome extension standard
- **Chrome AI APIs** - Prompt API, Summarizer API, Writer API
- **Web Speech API** - Fallback speech recognition
- **IndexedDB** - Local data storage
- **Service Workers** - Background processing
- **Side Panel API** - Modern Chrome UI

### Why doesn't it use chrome.tabCapture anymore?
chrome.tabCapture API doesn't work in Manifest V3 service workers. We switched to Web Speech API, which provides better compatibility and doesn't require special permissions.

### Can I contribute to the project?
Yes! MeetingMind is open-source. Check the GitHub repository for contribution guidelines (coming soon).

### Does it work on Firefox or Edge?
- **Edge**: Yes! (Edge uses Chromium)
- **Firefox**: Not yet (different extension APIs)
- **Safari**: Not yet (different extension APIs)

### What's the maximum meeting duration?
Theoretically unlimited! However:
- Memory management limits transcripts to 10,000 characters per entry
- Buffer limited to 20 items to prevent memory issues
- For very long meetings (2+ hours), export regularly

### Can I use it for offline meetings?
No, MeetingMind is designed for online meetings only (Google Meet, Zoom, Teams). For offline meetings, you'd need separate audio recording software.

### How much storage does it use?
- **Extension size**: ~500KB
- **Chrome AI model**: ~1.5GB (one-time download)
- **Per meeting**: 10-50KB depending on length
- **IndexedDB**: No hard limit, but Chrome typically allows 10-50% of free disk space

### Is the code open source?
Yes! MeetingMind is open-source. You can view, modify, and contribute to the code. (GitHub link coming soon)

---

## Support & Contact

### Where can I get help?
1. **Read this FAQ** first
2. **Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for detailed guides
3. **Open an issue** on GitHub (link coming soon)
4. **Contact support** at [support email coming soon]

### How do I report a bug?
1. **Check if it's a known issue** in [TODO.md](./TODO.md)
2. **Open a GitHub issue** with:
   - Browser version
   - Extension version
   - Steps to reproduce
   - Error messages (if any)
   - Screenshots (if helpful)

### Can I request a feature?
Yes! We welcome feature requests. Open a GitHub issue labeled "feature request" with your idea.

### How often is MeetingMind updated?
We aim for regular updates:
- **Bug fixes**: Within 1-2 weeks
- **New features**: Monthly releases
- **Security updates**: Immediately

---

## Version History

### v1.0.0 (Current)
- ✅ Real-time transcription
- ✅ AI-powered summaries
- ✅ Action item extraction
- ✅ Export functionality (TXT, MD, JSON)
- ✅ Keyboard shortcuts
- ✅ Chrome AI + Web Speech API support
- ✅ Side panel UI
- ✅ Auto-scroll
- ✅ Copy buttons

### Coming Soon (v1.1.0)
- 🔜 Speaker detection
- 🔜 Search functionality
- 🔜 Past meetings view
- 🔜 PDF export
- 🔜 Better error messages

---

## Quick Tips 💡

1. **Use good audio** - Headset microphone works best
2. **Enable Chrome AI** - Better summaries than Web Speech API
3. **Generate summaries regularly** - Don't wait until the end of a long meeting
4. **Export often** - Save important meetings immediately
5. **Use keyboard shortcuts** - Faster than clicking
6. **Keep Chrome updated** - Latest features require Chrome 127+
7. **Check console errors** - F12 → Console shows helpful debugging info

---

**Last Updated**: October 28, 2025  
**Version**: 1.0.0  
**License**: MIT  

For more help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or [README.md](./README.md).
