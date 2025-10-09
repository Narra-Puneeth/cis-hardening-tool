const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // OS Detection
  getOSPlatform: () => ipcRenderer.invoke('get-os-platform'),
  
  // Load CIS configuration
  loadCISConfig: (osType) => ipcRenderer.invoke('load-cis-config', osType),
  
  // Load hardening level preset
  loadLevelPreset: (level) => ipcRenderer.invoke('load-level-preset', level),
  
  // Generate tailoring XML from selected rules
  generateTailoringXML: (selectedRules, configName) => 
    ipcRenderer.invoke('generate-tailoring-xml', selectedRules, configName),
  
  // Execute audit command
  executeAudit: (configFilePath, level) => 
    ipcRenderer.invoke('execute-audit', configFilePath, level),
  
  // Execute fix command
  executeFix: (configFilePath, level) => 
    ipcRenderer.invoke('execute-fix', configFilePath, level),
  
  // Execute shell command
  executeShellCommand: (command) => 
    ipcRenderer.invoke('execute-shell-command', command),
  
  // Listen for command output
  onCommandOutput: (callback) => {
    ipcRenderer.on('command-output', (event, data) => callback(data));
  },
  
  // Remove command output listener
  removeCommandOutputListener: () => {
    ipcRenderer.removeAllListeners('command-output');
  }
});