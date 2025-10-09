# Security Checklist Application

An Electron-based desktop application that automatically detects your operating system and displays relevant security configuration checklists.

## Features

- **Automatic OS Detection**: Detects Windows, Linux, or macOS on application startup
- **OS-Specific Checklists**: 
  - **Windows**: Account Policies → Password Policy configurations
  - **Linux**: Filesystem → Configure Filesystem Kernel Modules
- **Interactive Checkboxes**: Click to mark items as completed
- **Progress Tracking**: Visual progress bar and completion counter
- **Persistent State**: Checkbox states are saved and restored between sessions
- **Export Functionality**: Export progress report as text file (Ctrl+E)
- **Keyboard Navigation**: Navigate with arrow keys, toggle with spacebar
- **Reset Function**: Reset all checkboxes (Ctrl+R)

## Installation

1. Make sure you have Node.js installed on your system
2. Clone or download this project
3. Navigate to the project directory
4. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Starting the Application
```bash
npm start
```

### Development Mode (with DevTools)
```bash
npm run dev
```

## Supported Operating Systems

### Windows
Displays security checklist for:
- Account Policies
  - Password Policy (6 items)
    - Enforce password history
    - Maximum password age
    - Minimum password age
    - Minimum password length
    - Password complexity requirements
    - Store passwords using reversible encryption

### Linux
Displays security checklist for:
- Filesystem
  - Configure Filesystem Kernel Modules (10 items)
    - cramfs, freevxfs, hfs, hfsplus, jffs2
    - overlayfs, squashfs, udf, usb-storage
    - unused filesystems kernel modules

### Unsupported OS
For macOS or other operating systems, displays an informational message.

## Keyboard Shortcuts

- **Arrow Keys**: Navigate between checkboxes
- **Spacebar**: Toggle focused checkbox
- **Ctrl+E**: Export progress report
- **Ctrl+R**: Reset all checkboxes (with confirmation)

## File Structure

```
├── main.js          # Main Electron process
├── preload.js       # Preload script for secure IPC
├── index.html       # Main UI
├── styles.css       # Application styling
├── renderer.js      # Renderer process logic
├── package.json     # Node.js dependencies and scripts
└── README.md        # This file
```

## Technical Details

- **Framework**: Electron
- **Security**: Context isolation enabled, Node integration disabled
- **IPC**: Secure communication between main and renderer processes
- **Storage**: LocalStorage for persistent checkbox states
- **Responsive**: Mobile-friendly design

## Security Considerations

This application follows Electron security best practices:
- Context isolation is enabled
- Node integration is disabled in the renderer
- Secure IPC communication via preload script
- No eval() or unsafe content execution

## Customization

To add more checklist items:
1. Edit `index.html` to add new checkbox items
2. Update `renderer.js` if additional functionality is needed
3. Modify `styles.css` for custom styling

## Troubleshooting

**GPU Process Errors**: These are common in Electron apps on Windows and don't affect functionality.

**Application Won't Start**: Make sure all dependencies are installed with `npm install`.

**Checkboxes Not Saving**: Check browser localStorage permissions and disk space.