# CIS Hardening Tool (Linux + Windows)

This is a consolidated single Electron application containing both Linux and Windows CIS hardening flows.

## Project Structure

- `main.js`, `preload.js`, `cis-renderer.js`, `cis-index.html`: desktop app entrypoints and UI integration
- `cli/`: Linux hardening scripts
- `cli/win_cli/`: Windows hardening/audit scripts
- `config/`: Linux and Windows benchmark/config data
- `windows/`: Cannon Crew-compatible Windows utility modules
- `assets/`: app icons/static assets

## Prerequisites

- Node.js 16+ and npm
- Windows PowerShell 5.1+ (for Windows hardening scripts)
- Linux shell utilities (for Linux hardening scripts)

## Run Steps

1. Open terminal in this folder:
   - `c:/Users/narra/Documents/sih/cis-hardening-tool`
2. Install dependencies:
   - `npm install`
3. Start the Electron application:
   - `npm start`

## Optional Commands

- Development mode:
  - `npm run dev`
- Build Windows package:
  - `npm run build:win`
- Build Linux package:
  - `npm run build:linux`

## Notes

- Linux and Windows scripts are included under `cli/` and `cli/win_cli/`.
- Windows policy data is included under `config/windows-11-standalone-table-t.json`.
