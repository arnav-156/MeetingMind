# MeetingMind Icons

This folder contains the extension icons in various sizes.

## Required Sizes
- **icon16.png** - Toolbar icon (16x16)
- **icon48.png** - Extension management (48x48)
- **icon128.png** - Chrome Web Store (128x128)

## Design Guidelines
- Use gradient purple/indigo theme (#667eea to #764ba2)
- Include microphone symbol 🎙️
- Professional, clean design
- High contrast for visibility

## Creating Icons

### Option 1: Use Online Tool
1. Go to https://www.canva.com or https://www.figma.com
2. Create square artboard
3. Add microphone icon with gradient
4. Export as PNG at required sizes

### Option 2: Use Python (PIL)
```python
from PIL import Image, ImageDraw, ImageFont

# Create icon with gradient and mic symbol
# Code example in /docs/create-icons.py
```

### Option 3: Convert from SVG
```bash
# If you have inkscape installed
inkscape icon.svg --export-png=icon16.png --export-width=16
inkscape icon.svg --export-png=icon48.png --export-width=48
inkscape icon.svg --export-png=icon128.png --export-width=128
```

## Temporary Placeholders

For development, you can use emoji or text-based placeholders:
- Chrome will show extension name if icons are missing
- Not suitable for production/distribution

---

**TODO**: Replace placeholder icons with professional designs before publishing to Chrome Web Store.
