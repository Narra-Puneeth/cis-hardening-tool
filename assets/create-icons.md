# App Icons Required

Create icons in the following formats:

## Linux
- **icon.png**: 512x512 PNG (main Linux icon)
- **icon@2x.png**: 1024x1024 PNG (high-DPI displays)

## Windows  
- **icon.ico**: ICO format with multiple sizes (16, 32, 48, 256 pixels)

## macOS
- **icon.icns**: Apple Icon format with multiple sizes

## Quick Icon Creation Options:

### Option 1: Use Online Converters
1. Create a 1024x1024 PNG icon
2. Use tools like:
   - https://convertio.co/png-ico/ (PNG to ICO)
   - https://cloudconvert.com/png-to-icns (PNG to ICNS)

### Option 2: Use Electron Icon Maker
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=icon-1024.png --output=assets/
```

### Option 3: Manual Creation
- Use tools like GIMP, Photoshop, or Figma
- Create security/shield themed icon
- Export in required formats

## Temporary Solution
For testing purposes, you can:
1. Download any 512x512 PNG and rename it to icon.png
2. Convert to other formats as needed
3. Place in assets/ directory