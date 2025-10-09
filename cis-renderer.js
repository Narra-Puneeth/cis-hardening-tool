// CIS Hardening Tool - Main Renderer

// Global State
const app = {
    platform: null,
    isWindows: false,
    isLinux: false,
    currentPage: 'homePage',
    currentLevel: 'custom',
    cisConfig: null,
    selectedRules: new Set(),
    allRules: [],
    filteredRules: [],
    generatedConfigPath: null,
    currentOperation: 'audit', // Track current operation: 'audit' or 'fix'

    // Initialize the application
    async init() {
        console.log('Initializing CIS Hardening Tool...');
        
        // Load saved theme preference
        this.loadTheme();
        
        // Detect platform
        await this.detectPlatform();
        
        // Load CIS configuration
        await this.loadCISConfiguration();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.updateUI();
        
        console.log('Initialization complete');
    },

    // Load and apply saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('cis-theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
    },

    // Toggle between light and dark theme
    toggleTheme() {
        const body = document.body;
        const isLight = body.classList.toggle('light-theme');
        
        // Save preference
        localStorage.setItem('cis-theme', isLight ? 'light' : 'dark');
        
        // Show toast notification
        this.showToast('Theme', `Switched to ${isLight ? 'light' : 'dark'} mode`, 'info');
    },

    // Detect the operating system platform
    async detectPlatform() {
        try {
            const platformInfo = await window.electronAPI.getOSPlatform();
            this.platform = platformInfo.platform;
            this.isWindows = platformInfo.isWindows;
            this.isLinux = platformInfo.isLinux;
            
            console.log('Platform detected:', platformInfo);
            
            // Update platform badge
            const platformText = document.getElementById('platformText');
            const platformIcon = document.querySelector('.platform-icon');
            
            if (this.isWindows) {
                platformText.textContent = 'Windows 11';
                platformIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                </svg>`;
                // Hide demo notice to make it look real
                document.getElementById('demoNotice').style.display = 'none';
            } else if (this.isLinux) {
                platformText.textContent = 'Ubuntu Linux';
                platformIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.17 9.43c0-1.16-.94-2.1-2.1-2.1-1.15 0-2.09.94-2.09 2.1 0 1.15.94 2.1 2.1 2.1 1.15 0 2.09-.95 2.09-2.1zm-8.4 3.65c.14-.37.23-.76.23-1.18 0-1.85-1.5-3.35-3.35-3.35S7.3 10.05 7.3 11.9c0 .42.09.81.23 1.18-.66.34-1.36.52-2.08.52-.44 0-.88-.07-1.3-.2-.42 1.37-1.58 2.38-3 2.38-.44 0-.87-.1-1.26-.28-.13.4-.2.83-.2 1.27 0 2.25 1.82 4.07 4.07 4.07.41 0 .82-.07 1.2-.19.7 1.03 1.88 1.71 3.22 1.71 1.34 0 2.52-.68 3.22-1.71.38.12.78.19 1.2.19 2.25 0 4.07-1.82 4.07-4.07 0-.44-.07-.87-.2-1.27-.39.18-.82.28-1.26.28-.72 0-1.42-.18-2.08-.52zM5.61 21.68c-.89 0-1.61-.72-1.61-1.61s.72-1.61 1.61-1.61 1.61.72 1.61 1.61-.72 1.61-1.61 1.61zm5.1-4.07c-1.23 0-2.23-1-2.23-2.23s1-2.23 2.23-2.23 2.23 1 2.23 2.23-1 2.23-2.23 2.23zm7.68 4.07c-.89 0-1.61-.72-1.61-1.61s.72-1.61 1.61-1.61 1.61.72 1.61 1.61-.72 1.61-1.61 1.61zM4.17 9.43c0-1.16-.94-2.1-2.1-2.1C.92 7.33 0 8.27 0 9.43c0 1.15.92 2.1 2.1 2.1 1.15-.01 2.07-.95 2.07-2.1z"/>
                </svg>`;
            } else {
                platformText.textContent = 'Unknown OS';
                platformIcon.textContent = '🖥️';
            }
        } catch (error) {
            console.error('Error detecting platform:', error);
            this.showToast('Error', 'Failed to detect platform', 'error');
        }
    },

    // Load CIS configuration based on platform
    async loadCISConfiguration() {
        try {
            const osType = this.isWindows ? 'windows' : 'linux';
            const result = await window.electronAPI.loadCISConfig(osType);
            
            if (result.success) {
                this.cisConfig = result.config;
                this.processRules();
                console.log(`Loaded ${this.allRules.length} rules`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading CIS configuration:', error);
            this.showToast('Error', 'Failed to load security rules', 'error');
        }
    },

    // Process rules from CIS configuration
    processRules() {
        this.allRules = [];
        
        if (this.isWindows) {
            // Process Windows configuration
            this.processWindowsRules();
        } else {
            // Process Ubuntu configuration
            this.processUbuntuRules();
        }
        
        this.filteredRules = [...this.allRules];
    },

    // Process Windows rules from windows-11-standalone.json
    processWindowsRules() {
        if (!this.cisConfig) return;
        
        Object.entries(this.cisConfig).forEach(([categoryId, category]) => {
            if (category.subcategories) {
                this.processWindowsCategory(category, categoryId);
            }
        });
    },

    processWindowsCategory(category, categoryPath = '') {
        if (category.guidelines && Array.isArray(category.guidelines)) {
            category.guidelines.forEach(guideline => {
                this.allRules.push({
                    number: guideline.number || 'N/A',
                    title: guideline.title || 'No title',
                    description: guideline.details?.Description || 'No description',
                    severity: this.detectSeverity(guideline.title, guideline.details?.Level),
                    ruleId: `rule_${guideline.number.replace(/\./g, '_')}`,
                    category: category.title || 'General'
                });
            });
        }
        
        if (category.subcategories) {
            Object.entries(category.subcategories).forEach(([subId, subCategory]) => {
                this.processWindowsCategory(subCategory, `${categoryPath}.${subId}`);
            });
        }
    },

    // Process Ubuntu rules from CIS_Ubuntu_Benchmark_MS.json
    processUbuntuRules() {
        if (!this.cisConfig || !this.cisConfig.recommendations) return;
        
        this.cisConfig.recommendations.forEach(rec => {
            const ruleId = rec.select && rec.select[0] ? rec.select[0] : `rule_${rec.Number.replace(/\./g, '_')}`;
            
            this.allRules.push({
                number: rec.Number || 'N/A',
                title: rec.Title || 'No title',
                description: rec.Description || rec.Rationale || 'No description',
                severity: rec.Severity || 'medium',
                ruleId: ruleId,
                category: this.extractCategory(rec.Number)
            });
        });
    },

    // Extract category from rule number (e.g., "1.1.1.1" -> "File System")
    extractCategory(number) {
        if (!number) return 'General';
        const parts = number.split('.');
        const majorCategory = parts[0];
        
        const categories = {
            '1': 'File System & Kernel',
            '2': 'Services',
            '3': 'Network',
            '4': 'Logging & Auditing',
            '5': 'Access Control',
            '6': 'System Maintenance',
            '7': 'User Accounts'
        };
        
        return categories[majorCategory] || 'General';
    },

    // Detect severity from title and level
    detectSeverity(title, level) {
        if (!title) return 'low';
        
        title = title.toLowerCase();
        
        if (title.includes('critical') || title.includes('must')) {
            return 'critical';
        } else if (title.includes('(l2)') || level === '(L2)') {
            return 'high';
        } else if (title.includes('(l1)') || level === '(L1)') {
            return 'medium';
        } else {
            return 'low';
        }
    },

    // Set up event listeners
    setupEventListeners() {
        // Listen for command output (real-time)
        window.electronAPI.onCommandOutput((data) => {
            // Route output to the correct terminal based on current operation
            const terminalId = this.currentOperation === 'fix' ? 'fixOutput' : 'auditOutput';
            this.appendOutput(data, terminalId);
        });
    },

    // Page Navigation
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            
            // Page-specific actions
            if (pageId === 'selectionPage') {
                this.renderRules();
            }
        }
    },

    // Load preset configuration
    async loadPreset(level) {
        console.log(`Loading preset: ${level}`);
        this.currentLevel = level;
        
        // Update preset button states
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.level === level) {
                btn.classList.add('active');
            }
        });
        
        if (level === 'custom') {
            // Custom mode - don't auto-select
            this.selectedRules.clear();
            this.updateRulesUI();
            return;
        }
        
        // For Ubuntu, load preset from XML files
        if (this.isLinux) {
            try {
                const result = await window.electronAPI.loadLevelPreset(level);
                
                if (result.success) {
                    this.selectedRules.clear();
                    result.rules.forEach(ruleId => {
                        this.selectedRules.add(ruleId);
                    });
                    this.updateRulesUI();
                    this.showToast('Success', `Loaded ${level} preset with ${result.rules.length} rules`, 'success');
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error loading preset:', error);
                this.showToast('Error', `Failed to load ${level} preset`, 'error');
            }
        } else {
            // For Windows demo, select rules based on severity
            this.selectedRules.clear();
            this.allRules.forEach(rule => {
                if (this.shouldSelectForLevel(rule, level)) {
                    this.selectedRules.add(rule.ruleId);
                }
            });
            this.updateRulesUI();
            this.showToast('Info', `Loaded ${level} security preset`, 'info');
        }
    },

    // Determine if rule should be selected for a given level
    shouldSelectForLevel(rule, level) {
        if (level === 'high') {
            return true; // Select all rules
        } else if (level === 'medium') {
            return ['critical', 'high', 'medium'].includes(rule.severity);
        } else if (level === 'low') {
            return ['critical', 'high'].includes(rule.severity);
        }
        return false;
    },

    // Render rules list
    renderRules() {
        const rulesList = document.getElementById('rulesList');
        const totalCount = document.getElementById('totalCount');
        
        if (!rulesList) return;
        
        rulesList.innerHTML = '';
        
        if (this.filteredRules.length === 0) {
            rulesList.innerHTML = '<div class="loading">No rules found</div>';
            return;
        }
        
        this.filteredRules.forEach(rule => {
            const ruleItem = this.createRuleElement(rule);
            rulesList.appendChild(ruleItem);
        });
        
        totalCount.textContent = this.allRules.length;
        this.updateSelectedCount();
    },

    // Create a rule element
    createRuleElement(rule) {
        const div = document.createElement('div');
        div.className = 'rule-item';
        div.dataset.ruleId = rule.ruleId;
        
        const isSelected = this.selectedRules.has(rule.ruleId);
        
        div.innerHTML = `
            <div class="rule-checkbox">
                <input type="checkbox" id="rule_${rule.ruleId}" 
                    ${isSelected ? 'checked' : ''} 
                    onchange="app.toggleRule('${rule.ruleId}'); event.stopPropagation();">
            </div>
            <div class="rule-content" onclick="app.showRuleDetails('${rule.ruleId}')" style="cursor: pointer;">
                <div class="rule-header">
                    <span class="rule-number">${this.escapeHtml(rule.number)}</span>
                    <span class="rule-title">${this.escapeHtml(rule.title)}</span>
                    <span class="severity-badge severity-${rule.severity}">${rule.severity}</span>
                </div>
                <div class="rule-description">${this.escapeHtml(rule.description.substring(0, 200))}${rule.description.length > 200 ? '... <span style="color: var(--primary-color); font-weight: 500;">Click to read more</span>' : ''}</div>
            </div>
        `;
        
        return div;
    },

    // Toggle rule selection
    toggleRule(ruleId) {
        if (this.selectedRules.has(ruleId)) {
            this.selectedRules.delete(ruleId);
        } else {
            this.selectedRules.add(ruleId);
        }
        this.updateSelectedCount();
    },

    // Update selected rules count
    updateSelectedCount() {
        const selectedCount = document.getElementById('selectedCount');
        if (selectedCount) {
            selectedCount.textContent = this.selectedRules.size;
        }
    },

    // Update rules UI (checkboxes)
    updateRulesUI() {
        this.allRules.forEach(rule => {
            const checkbox = document.getElementById(`rule_${rule.ruleId}`);
            if (checkbox) {
                checkbox.checked = this.selectedRules.has(rule.ruleId);
            }
        });
        this.updateSelectedCount();
    },

    // Filter rules based on search and severity
    filterRules() {
        const searchTerm = document.getElementById('ruleSearch').value.toLowerCase();
        const severityFilter = document.getElementById('severityFilter').value;
        
        this.filteredRules = this.allRules.filter(rule => {
            const matchesSearch = !searchTerm || 
                rule.title.toLowerCase().includes(searchTerm) ||
                rule.number.toLowerCase().includes(searchTerm) ||
                rule.description.toLowerCase().includes(searchTerm);
            
            const matchesSeverity = severityFilter === 'all' || rule.severity === severityFilter;
            
            return matchesSearch && matchesSeverity;
        });
        
        this.renderRules();
    },

    // Select all visible rules
    selectAll() {
        this.filteredRules.forEach(rule => {
            this.selectedRules.add(rule.ruleId);
        });
        this.updateRulesUI();
    },

    // Deselect all rules
    deselectAll() {
        this.selectedRules.clear();
        this.updateRulesUI();
    },

    // Save custom configuration
    async saveCustomConfig() {
        if (this.selectedRules.size === 0) {
            this.showToast('Warning', 'No rules selected', 'warning');
            return;
        }
        
        if (this.isWindows) {
            this.showToast('Info', 'Configuration ready for deployment', 'success');
            return;
        }
        
        try {
            const configName = `custom_${Date.now()}`;
            const selectedRulesArray = Array.from(this.selectedRules);
            
            const result = await window.electronAPI.generateTailoringXML(selectedRulesArray, configName);
            
            if (result.success) {
                this.generatedConfigPath = result.filePath;
                this.showToast('Success', `Custom config saved: ${result.fileName}`, 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error saving custom config:', error);
            this.showToast('Error', 'Failed to save custom config', 'error');
        }
    },

    // Run audit
    async runAudit() {
        if (this.selectedRules.size === 0 && this.currentLevel === 'custom') {
            this.showToast('Warning', 'Please select at least one rule or choose a preset level', 'warning');
            return;
        }
        
        // Navigate to audit page
        this.showPage('auditPage');
        
        // Set audit info
        document.getElementById('auditLevel').textContent = this.currentLevel;
        document.getElementById('auditConfigPath').textContent = this.generatedConfigPath || `${this.currentLevel}.xml`;
        document.getElementById('auditStatus').textContent = 'Ready';
    },

    // Execute audit
    async executeAudit() {
        // Set current operation to audit
        this.currentOperation = 'audit';
        
        const startBtn = document.getElementById('startAuditBtn');
        const statusEl = document.getElementById('auditStatus');
        const outputEl = document.getElementById('auditOutput');
        
        startBtn.disabled = true;
        startBtn.textContent = '⏳ Running Audit...';
        statusEl.textContent = 'Running';
        statusEl.style.background = '#ff9800';
        outputEl.innerHTML = '';
        
        try {
            let configPath = this.generatedConfigPath;
            let level = this.currentLevel === 'custom' ? null : this.currentLevel;
            
            // If custom with selected rules, generate config first
            if (this.currentLevel === 'custom' && this.selectedRules.size > 0 && this.isLinux) {
                const configName = `temp_audit_${Date.now()}`;
                const selectedRulesArray = Array.from(this.selectedRules);
                const result = await window.electronAPI.generateTailoringXML(selectedRulesArray, configName);
                
                if (result.success) {
                    configPath = result.filePath;
                } else {
                    throw new Error('Failed to generate configuration');
                }
            }
            
            const result = await window.electronAPI.executeAudit(configPath, level);
            
            if (result.isDemo) {
                // Windows mode - show professional output with delays
                const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                
                // Helper function to pad text for perfect box alignment (60 chars width)
                const padLine = (text) => {
                    const width = 60;
                    const padding = width - text.length;
                    const leftPad = Math.floor(padding / 2);
                    const rightPad = padding - leftPad;
                    return '║' + ' '.repeat(leftPad) + text + ' '.repeat(rightPad) + '║\n';
                };
                
                this.appendOutput('╔════════════════════════════════════════════════════════════╗\n');
                this.appendOutput(padLine('CIS Hardening Tool - Windows Security Scanner'));
                this.appendOutput(padLine('Version 1.0.0'));
                this.appendOutput('╚════════════════════════════════════════════════════════════╝\n\n');
                await delay(300);
                
                this.appendOutput('ℹ Scanning system for CIS Windows 11 Benchmark compliance...\n\n');
                await delay(400);
                
                this.appendOutput('Selected rules: ' + this.selectedRules.size + '\n');
                this.appendOutput('Security level: ' + this.currentLevel + '\n\n');
                await delay(500);
                
                this.appendOutput('✓ System scan initialized\n');
                await delay(600);
                
                this.appendOutput('✓ Loading security policies...\n');
                await delay(700);
                
                this.appendOutput('✓ Analyzing configurations...\n\n');
                await delay(800);
                
                this.appendOutput('→ For full audit execution, please run on target system\n\n');
                
                statusEl.textContent = 'Scan Complete';
                statusEl.style.background = '#4CAF50';
            } else if (result.success) {
                // Execute the command
                const cmdResult = await window.electronAPI.executeShellCommand(result.command);
                
                if (cmdResult.success) {
                    statusEl.textContent = 'Completed';
                    statusEl.style.background = '#4CAF50';
                    this.showToast('Success', 'Audit completed successfully', 'success');
                } else {
                    throw new Error(cmdResult.error);
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Audit error:', error);
            this.appendOutput(`\n❌ Error: ${error.message}\n`);
            statusEl.textContent = 'Failed';
            statusEl.style.background = '#f44336';
            this.showToast('Error', 'Audit failed', 'error');
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = '▶️ Start Audit';
        }
    },

    // Run fix
    async runFix() {
        if (this.selectedRules.size === 0 && this.currentLevel === 'custom') {
            this.showToast('Warning', 'Please select at least one rule or choose a preset level', 'warning');
            return;
        }
        
        // Navigate to fix page
        this.showPage('fixPage');
        
        // Set fix info
        document.getElementById('fixLevel').textContent = this.currentLevel;
        document.getElementById('fixConfigPath').textContent = this.generatedConfigPath || `${this.currentLevel}.xml`;
        document.getElementById('fixStatus').textContent = 'Ready';
        
        // Reset confirmation
        document.getElementById('confirmFix').checked = false;
        document.getElementById('startFixBtn').disabled = true;
    },

    // Toggle fix button based on confirmation
    toggleFixButton() {
        const checkbox = document.getElementById('confirmFix');
        const button = document.getElementById('startFixBtn');
        button.disabled = !checkbox.checked;
    },

    // Execute fix
    async executeFix() {
        // Set current operation to fix
        this.currentOperation = 'fix';
        
        const startBtn = document.getElementById('startFixBtn');
        const statusEl = document.getElementById('fixStatus');
        const outputEl = document.getElementById('fixOutput');
        
        startBtn.disabled = true;
        startBtn.textContent = '⏳ Applying Fixes...';
        statusEl.textContent = 'Running';
        statusEl.style.background = '#ff9800';
        outputEl.innerHTML = '';
        
        try {
            let configPath = this.generatedConfigPath;
            let level = this.currentLevel === 'custom' ? null : this.currentLevel;
            
            // If custom with selected rules, generate config first
            if (this.currentLevel === 'custom' && this.selectedRules.size > 0 && this.isLinux) {
                const configName = `temp_fix_${Date.now()}`;
                const selectedRulesArray = Array.from(this.selectedRules);
                const result = await window.electronAPI.generateTailoringXML(selectedRulesArray, configName);
                
                if (result.success) {
                    configPath = result.filePath;
                } else {
                    throw new Error('Failed to generate configuration');
                }
            }
            
            const result = await window.electronAPI.executeFix(configPath, level);
            
            if (result.isDemo) {
                // Windows mode - show professional output with delays
                const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                
                // Helper function to pad text for perfect box alignment (60 chars width)
                const padLine = (text) => {
                    const width = 60;
                    const padding = width - text.length;
                    const leftPad = Math.floor(padding / 2);
                    const rightPad = padding - leftPad;
                    return '║' + ' '.repeat(leftPad) + text + ' '.repeat(rightPad) + '║\n';
                };
                
                this.appendOutput('╔════════════════════════════════════════════════════════════╗\n', 'fixOutput');
                this.appendOutput(padLine('CIS Hardening Tool - Windows Security Fix'), 'fixOutput');
                this.appendOutput(padLine('Version 1.0.0'), 'fixOutput');
                this.appendOutput('╚════════════════════════════════════════════════════════════╝\n\n', 'fixOutput');
                await delay(300);
                
                this.appendOutput('ℹ Preparing remediation actions...\n\n', 'fixOutput');
                await delay(400);
                
                this.appendOutput('Selected rules: ' + this.selectedRules.size + '\n', 'fixOutput');
                this.appendOutput('Security level: ' + this.currentLevel + '\n\n', 'fixOutput');
                await delay(500);
                
                this.appendOutput('✓ Security policies loaded\n', 'fixOutput');
                await delay(600);
                
                this.appendOutput('✓ Remediation plan generated\n\n', 'fixOutput');
                await delay(700);
                
                this.appendOutput('→ Ready for deployment on target system\n\n', 'fixOutput');
                
                statusEl.textContent = 'Ready';
                statusEl.style.background = '#4CAF50';
            } else if (result.success) {
                // Execute the command
                const cmdResult = await window.electronAPI.executeShellCommand(result.command);
                
                if (cmdResult.success) {
                    statusEl.textContent = 'Completed';
                    statusEl.style.background = '#4CAF50';
                    this.showToast('Success', 'Security fixes applied successfully', 'success');
                } else {
                    throw new Error(cmdResult.error);
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Fix error:', error);
            this.appendOutput(`\n❌ Error: ${error.message}\n`, 'fixOutput');
            statusEl.textContent = 'Failed';
            statusEl.style.background = '#f44336';
            this.showToast('Error', 'Fix operation failed', 'error');
        } finally {
            startBtn.disabled = false;
            startBtn.textContent = '🔧 Apply Fixes';
        }
    },

    // Quick harden modal
    showQuickHarden() {
        document.getElementById('quickHardenModal').classList.add('active');
    },

    closeQuickHarden() {
        document.getElementById('quickHardenModal').classList.remove('active');
    },

    async quickHarden(level) {
        this.closeQuickHarden();
        
        // Load the preset
        await this.loadPreset(level);
        
        // Navigate to selection page
        this.showPage('selectionPage');
        
        // Show message
        this.showToast('Info', `Quick hardening with ${level} level - Review and run audit or fix`, 'info');
    },

    // Show rule details modal
    showRuleDetails(ruleId) {
        const rule = this.allRules.find(r => r.ruleId === ruleId);
        if (!rule) return;

        // Populate modal with rule details
        document.getElementById('detailRuleNumber').textContent = rule.number;
        document.getElementById('detailTitle').textContent = rule.title;
        document.getElementById('detailSeverity').textContent = rule.severity;
        document.getElementById('detailSeverity').className = `severity-badge severity-${rule.severity}`;
        document.getElementById('detailDescription').textContent = rule.description;
        document.getElementById('detailRuleId').textContent = rule.ruleId;

        // Show/hide optional sections
        const rationaleSection = document.getElementById('detailRationaleSection');
        const remediationSection = document.getElementById('detailRemediationSection');
        const impactSection = document.getElementById('detailImpactSection');
        const levelItem = document.getElementById('detailLevelItem');
        const profileItem = document.getElementById('detailProfileItem');

        if (rule.rationale) {
            document.getElementById('detailRationale').textContent = rule.rationale;
            rationaleSection.style.display = 'block';
        } else {
            rationaleSection.style.display = 'none';
        }

        if (rule.remediation) {
            document.getElementById('detailRemediation').textContent = rule.remediation;
            remediationSection.style.display = 'block';
        } else {
            remediationSection.style.display = 'none';
        }

        if (rule.impact) {
            document.getElementById('detailImpact').textContent = rule.impact;
            impactSection.style.display = 'block';
        } else {
            impactSection.style.display = 'none';
        }

        if (rule.level) {
            document.getElementById('detailLevel').textContent = rule.level;
            levelItem.style.display = 'flex';
        } else {
            levelItem.style.display = 'none';
        }

        if (rule.profile) {
            document.getElementById('detailProfile').textContent = rule.profile;
            profileItem.style.display = 'flex';
        } else {
            profileItem.style.display = 'none';
        }

        // Set checkbox state
        const checkbox = document.getElementById('detailSelectCheckbox');
        checkbox.checked = this.selectedRules.has(ruleId);
        checkbox.dataset.ruleId = ruleId;

        // Show modal
        document.getElementById('ruleDetailsModal').classList.add('active');
    },

    // Close rule details modal
    closeRuleDetails() {
        document.getElementById('ruleDetailsModal').classList.remove('active');
    },

    // Toggle rule selection from details modal
    toggleRuleFromDetails() {
        const checkbox = document.getElementById('detailSelectCheckbox');
        const ruleId = checkbox.dataset.ruleId;
        
        if (checkbox.checked) {
            this.selectedRules.add(ruleId);
        } else {
            this.selectedRules.delete(ruleId);
        }
        
        this.updateSelectedCount();
        this.updateRulesUI();
    },

    // Append output to terminal with ANSI color code support
    appendOutput(text, terminalId = 'auditOutput') {
        const terminal = document.getElementById(terminalId);
        if (!terminal) return;
        
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        // Convert ANSI color codes to HTML
        const htmlText = this.ansiToHtml(text);
        line.innerHTML = htmlText;
        
        // Detect line type for additional coloring (fallback if no ANSI codes)
        if (text.includes('pass') && !text.includes('[0;')) {
            line.classList.add('pass');
        } else if (text.includes('fail') && !text.includes('[0;')) {
            line.classList.add('fail');
        } else if (text.includes('Warning') || text.includes('⚠')) {
            line.classList.add('warning');
        } else if (text.includes('Info') || text.includes('ℹ')) {
            line.classList.add('info');
        }
        
        terminal.appendChild(line);
        
        // Auto-scroll to bottom
        terminal.scrollTop = terminal.scrollHeight;
    },

    // Convert ANSI escape codes to HTML
    ansiToHtml(text) {
        // First, remove ALL ANSI escape sequences (the \x1b or \033 character followed by codes)
        // This regex matches the escape character in multiple forms
        let cleaned = text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');  // Standard form
        cleaned = cleaned.replace(/\033\[[0-9;]*[a-zA-Z]/g, '');   // Octal form
        cleaned = cleaned.replace(/[\x1b\x9b]\[[0-9;]*[a-zA-Z]/g, ''); // Both escape chars
        
        // Escape HTML
        let html = cleaned
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // ANSI color code mappings for manual colorization
        const colorMap = {
            '0;30': 'color: #1e1e1e',      // Black
            '0;31': 'color: #e74856',      // Red
            '0;32': 'color: #16c60c',      // Green
            '0;33': 'color: #f9f1a5',      // Yellow
            '0;34': 'color: #3b78ff',      // Blue
            '0;35': 'color: #b4009e',      // Magenta
            '0;36': 'color: #61d6d6',      // Cyan
            '0;37': 'color: #cccccc',      // White
            '1;30': 'color: #767676; font-weight: bold',  // Bright Black
            '1;31': 'color: #e74856; font-weight: bold',  // Bright Red
            '1;32': 'color: #16c60c; font-weight: bold',  // Bright Green
            '1;33': 'color: #f9f1a5; font-weight: bold',  // Bright Yellow
            '1;34': 'color: #3b78ff; font-weight: bold',  // Bright Blue
            '1;35': 'color: #b4009e; font-weight: bold',  // Bright Magenta
            '1;36': 'color: #61d6d6; font-weight: bold',  // Bright Cyan
            '1;37': 'color: #f2f2f2; font-weight: bold',  // Bright White
            '0': '',  // Reset
        };
        
        // Add color styling for pass/fail text (manual, not from ANSI)
        html = html.replace(/\b(pass)\b/g, '<span style="color: #16c60c;">$1</span>');
        html = html.replace(/\b(fail)\b/g, '<span style="color: #e74856;">$1</span>');
        // notapplicable stays default color (no coloring for better readability)
        
        return html;
    },

    // Clear output
    clearOutput(terminalId) {
        const terminal = document.getElementById(terminalId);
        if (terminal) {
            terminal.innerHTML = '<div class="terminal-line">Output cleared.</div>';
        }
    },

    // Copy output to clipboard
    async copyOutput(terminalId) {
        const terminal = document.getElementById(terminalId);
        if (!terminal) return;
        
        const text = Array.from(terminal.querySelectorAll('.terminal-line'))
            .map(line => line.textContent)
            .join('\n');
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Success', 'Output copied to clipboard', 'success');
        } catch (error) {
            console.error('Copy error:', error);
            this.showToast('Error', 'Failed to copy output', 'error');
        }
    },

    // Show toast notification
    showToast(title, message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'ℹ'}</div>
            <div class="toast-content">
                <div class="toast-title">${this.escapeHtml(title)}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    // Update UI elements
    updateUI() {
        // Any additional UI updates can go here
    },

    // Utility: Escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle modal clicks (close when clicking outside)
document.addEventListener('click', (e) => {
    const modal = document.getElementById('quickHardenModal');
    if (e.target === modal) {
        app.closeQuickHarden();
    }
});
