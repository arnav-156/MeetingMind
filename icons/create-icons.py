# Python script to generate placeholder icons
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient (simplified)
    for i in range(size):
        color = int(102 + (118 - 102) * i / size)  # Purple to Indigo gradient
        draw.rectangle([(0, i), (size, i+1)], fill=(color, 126, 234))
    
    # Add text (🎙️ or MM)
    try:
        font = ImageFont.truetype("arial.ttf", int(size * 0.5))
    except:
        font = ImageFont.load_default()
    
    text = "MM"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2)
    draw.text(position, text, fill='white', font=font)
    
    # Save
    img.save(filename)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_icon(16, "icon16.png")
    create_icon(48, "icon48.png")
    create_icon(128, "icon128.png")
    print("✅ All icons created!")
