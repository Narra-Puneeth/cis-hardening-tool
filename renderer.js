// Dynamic Security Checklist Application - JSON-Based Renderer

// DOM elements
const appEl = document.getElementById('app');
const loadingEl = document.getElementById('loading');
const osInfoEl = document.getElementById('os-info');
const dynamicChecklistEl = document.getElementById('dynamic-checklist');
const unsupportedOSEl = document.getElementById('unsupported-os');
const detectedOSEl = document.getElementById('detected-os');
const progressTextEl = document.getElementById('progress-text');
const progressFillEl = document.getElementById('progress-fill');
const completionPercentageEl = document.getElementById('completion-percentage');
const noResultsEl = document.getElementById('no-results');
const errorContainerEl = document.getElementById('error-container');
const errorMessageEl = document.getElementById('error-message');

// Toolbar elements
const searchInputEl = document.getElementById('search-input');
const clearSearchEl = document.getElementById('clear-search');
const filterSelectEl = document.getElementById('filter-select');
const bulkCompleteEl = document.getElementById('bulk-complete');
const bulkResetEl = document.getElementById('bulk-reset');
const exportBtnEl = document.getElementById('export-btn');
const themeToggleEl = document.getElementById('theme-toggle');

// State management
let currentOS = null;
let checklistConfig = null;
let totalItems = 0;
let completedItems = 0;
let allItems = [];
let filteredItems = [];
let currentFilter = 'all';
let currentSearch = '';

// Initialize the application with JSON-based configuration
async function initializeApp() {
    try {
        // Show loading animation
        showLoadingAnimation();
        
        // Get OS information from main process
        const osInfo = await window.electronAPI.getOSPlatform();
        currentOS = osInfo;
        
        // Update OS badge with animation
        await updateOSBadge(osInfo);
        
        // Initialize theme from localStorage
        initializeTheme();
        
        // Load checklist configuration based on OS
        await loadChecklistConfiguration(osInfo);
        
        // Hide loading and show appropriate checklist
        await hideLoadingAnimation();
        
        // Set up all event listeners
        setupEventListeners();
        
        // Add entrance animations
        addEntranceAnimations();
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to initialize security checklist application', error.message);
    }
}

// Load checklist configuration from JSON
async function loadChecklistConfiguration(osInfo) {
    try {
        let osType;
        
        if (osInfo.isWindows) {
            osType = 'windows';
        } else if (osInfo.isLinux) {
            osType = 'linux';
        } else {
            // Unsupported OS
            showUnsupportedOS(osInfo);
            return;
        }
        
        // Load configuration from main process
        const configResult = await window.electronAPI.loadChecklistConfig(osType);
        
        if (!configResult.success) {
            throw new Error(configResult.error || 'Failed to load configuration');
        }
        
        checklistConfig = configResult.config;
        console.log('Loaded checklist configuration:', checklistConfig);
        
        // Load saved state
        await loadSavedState(osType);
        
        // Generate dynamic checklist from configuration
        generateDynamicChecklist(checklistConfig);
        
        // Initialize checklist items
        initializeChecklistItems();
        
        // Set up search and filter functionality
        setupSearchAndFilter();
        
        // Update progress with animation
        updateProgress(true);
        
        showNotification(`Loaded ${checklistConfig.displayName} security checklist (${checklistConfig.metadata.totalItems} items)`, 'success');
        
    } catch (error) {
        console.error('Error loading checklist configuration:', error);
        showError('Failed to load security checklist configuration', error.message);
    }
}

// Generate dynamic checklist HTML from JSON configuration
function generateDynamicChecklist(config) {
    const checklistHTML = `
        <div class="checklist-header">
            <div class="os-icon">
                <i class="${config.icon}"></i>
            </div>
            <div class="checklist-title">
                <h2>${config.displayName} Security Configuration</h2>
                <p>${config.description}</p>
                <div class="config-metadata">
                    <span class="metadata-badge">
                        <i class="fas fa-info-circle"></i>
                        ${config.metadata.totalItems} items • Version ${config.metadata.version}
                    </span>
                </div>
            </div>
        </div>
        
        ${generateCategoriesHTML(config.categories)}
    `;
    
    dynamicChecklistEl.innerHTML = checklistHTML;
    dynamicChecklistEl.style.display = 'block';
}

// Generate categories HTML
function generateCategoriesHTML(categories) {
    return categories.map(category => `
        <div class="category-card">
            <div class="category-header" onclick="toggleCategory('${category.id}')">
                <div class="category-icon">
                    <i class="${category.icon}"></i>
                </div>
                <div class="category-info">
                    <h3>${category.title}</h3>
                    <p class="category-description">${category.description}</p>
                    <span class="category-progress" id="progress-${category.id}">0/${getTotalItemsInCategory(category)} completed</span>
                </div>
                <button class="category-toggle" data-category="${category.id}">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            
            <div class="category-content expanded" id="${category.id}">
                ${generateSubcategoriesHTML(category.subcategories)}
            </div>
        </div>
    `).join('');
}

// Generate subcategories HTML
function generateSubcategoriesHTML(subcategories) {
    return subcategories.map(subcategory => `
        <div class="subcategory-card">
            <div class="subcategory-header">
                <i class="${subcategory.icon}"></i>
                <h4>${subcategory.title}</h4>
                <p class="subcategory-description">${subcategory.description}</p>
            </div>
            
            <div class="checklist-items-modern">
                ${generateItemsHTML(subcategory.items)}
            </div>
        </div>
    `).join('');
}

// Generate checklist items HTML
function generateItemsHTML(items) {
    return items.map(item => `
        <div class="checklist-item-modern" data-search-text="${item.searchTerms.toLowerCase()}" data-severity="${item.severity}">
            <div class="checkbox-container">
                <input type="checkbox" id="${item.id}" class="checkbox-modern">
                <label for="${item.id}" class="checkbox-label">
                    <div class="checkmark">
                        <i class="fas fa-check"></i>
                    </div>
                </label>
            </div>
            <div class="item-content">
                <div class="item-header">
                    <span class="item-number">${item.number}.</span>
                    <span class="item-title">${item.title}</span>
                    <div class="item-badges">
                        <span class="severity-badge severity-${item.severity}">${item.severity.toUpperCase()}</span>
                        <div class="item-status">
                            <span class="status-badge pending">Pending</span>
                        </div>
                    </div>
                </div>
                <p class="item-description">${item.description}</p>
                <div class="item-references">
                    <details>
                        <summary><i class="fas fa-book"></i> References</summary>
                        <ul>
                            ${item.references.map(ref => `<li>${ref}</li>`).join('')}
                        </ul>
                    </details>
                </div>
            </div>
        </div>
    `).join('');
}

// Get total items in category
function getTotalItemsInCategory(category) {
    return category.subcategories.reduce((total, subcategory) => 
        total + subcategory.items.length, 0);
}

// Load saved state from main process
async function loadSavedState(osType) {
    try {
        const stateResult = await window.electronAPI.loadChecklistState(osType);
        
        if (stateResult.success && stateResult.state.completedItems) {
            console.log('Loaded saved state:', stateResult.state);
            // State will be applied after DOM generation
        }
    } catch (error) {
        console.error('Error loading saved state:', error);
        // Continue without saved state
    }
}

// Save current state to main process
async function saveCurrentState() {
    if (!checklistConfig || !currentOS) return;
    
    const osType = currentOS.isWindows ? 'windows' : 'linux';
    const completedIds = allItems.filter(item => item.completed).map(item => item.id);
    
    const state = {
        completedItems: completedIds,
        totalItems: totalItems,
        completedCount: completedItems,
        completionPercentage: Math.round((completedItems / totalItems) * 100),
        lastSession: Date.now()
    };
    
    try {
        await window.electronAPI.saveChecklistState(osType, state);
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

// Initialize checklist items from DOM
function initializeChecklistItems() {
    allItems = Array.from(document.querySelectorAll('.checkbox-modern')).map(checkbox => {
        const container = checkbox.closest('.checklist-item-modern');
        const item = {
            element: checkbox,
            id: checkbox.id,
            container: container,
            title: container.querySelector('.item-title').textContent,
            description: container.querySelector('.item-description').textContent,
            searchText: container.getAttribute('data-search-text') || '',
            severity: container.getAttribute('data-severity') || 'medium',
            completed: false
        };
        
        // Load saved state from localStorage (fallback)
        const savedState = localStorage.getItem(checkbox.id);
        if (savedState === 'true') {
            checkbox.checked = true;
            item.completed = true;
            updateItemState(item, true);
        }
        
        // Add enhanced event listener
        checkbox.addEventListener('change', async (e) => {
            const isChecked = e.target.checked;
            item.completed = isChecked;
            
            // Animate checkbox change
            animateCheckboxChange(item, isChecked);
            
            // Update item state
            updateItemState(item, isChecked);
            
            // Save state locally and remotely
            saveCheckboxState(checkbox.id, isChecked);
            await saveCurrentState();
            
            // Update progress with animation
            updateProgress(true);
            
            // Update category progress
            updateCategoryProgress();
        });
        
        return item;
    });
    
    totalItems = allItems.length;
    filteredItems = [...allItems];
    
    console.log(`Initialized ${totalItems} checklist items`);
}

// Toggle category expansion
function toggleCategory(categoryId) {
    const content = document.getElementById(categoryId);
    const toggle = document.querySelector(`[data-category="${categoryId}"]`);
    
    if (!content || !toggle) return;
    
    const isExpanded = content.classList.contains('expanded');
    
    // Animate toggle
    toggle.style.transition = 'transform 0.3s ease';
    
    if (isExpanded) {
        content.classList.remove('expanded');
        toggle.classList.remove('expanded');
        toggle.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('expanded');
        toggle.classList.add('expanded');
        toggle.style.transform = 'rotate(180deg)';
    }
}

// Show unsupported OS
function showUnsupportedOS(osInfo) {
    unsupportedOSEl.style.display = 'block';
    detectedOSEl.textContent = getOSDisplayName(osInfo);
    totalItems = 0;
}

// Enhanced loading animation
function showLoadingAnimation() {
    loadingEl.classList.add('fade-in');
    loadingEl.querySelector('p').textContent = 'Loading security checklist configuration...';
}

async function hideLoadingAnimation() {
    return new Promise((resolve) => {
        loadingEl.style.opacity = '0';
        loadingEl.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            loadingEl.style.display = 'none';
            resolve();
        }, 300);
    });
}

// OS Badge update with animation
async function updateOSBadge(osInfo) {
    const osDisplayName = getOSDisplayName(osInfo);
    const osSpan = osInfoEl.querySelector('span');
    
    // Add entrance animation
    osInfoEl.style.opacity = '0';
    osInfoEl.style.transform = 'translateX(20px)';
    
    setTimeout(() => {
        osSpan.textContent = osDisplayName;
        osInfoEl.style.opacity = '1';
        osInfoEl.style.transform = 'translateX(0)';
        osInfoEl.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 200);
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add transition effect
    document.documentElement.style.transition = 'all 0.3s ease';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Remove transition after animation
    setTimeout(() => {
        document.documentElement.style.transition = '';
    }, 300);
}

function updateThemeIcon(theme) {
    const icon = themeToggleEl.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Enhanced OS display
function getOSDisplayName(osInfo) {
    if (osInfo.isWindows) return 'Windows';
    if (osInfo.isLinux) return 'Linux';
    if (osInfo.isMac) return 'macOS';
    return osInfo.platform;
}

// Animate checkbox change
function animateCheckboxChange(item, isChecked) {
    const checkmark = item.container.querySelector('.checkmark');
    const container = item.container;
    
    if (isChecked) {
        // Success animation
        checkmark.style.transform = 'scale(1.2)';
        container.classList.add('bounce-in');
        
        setTimeout(() => {
            checkmark.style.transform = 'scale(1)';
            container.classList.remove('bounce-in');
        }, 300);
        
        // Add completion effect
        container.style.transition = 'all 0.5s ease';
        setTimeout(() => {
            container.classList.add('completed');
        }, 100);
        
    } else {
        // Remove completion state
        container.classList.remove('completed');
    }
}

// Update item visual state
function updateItemState(item, isCompleted) {
    const statusBadge = item.container.querySelector('.status-badge');
    
    if (isCompleted) {
        statusBadge.textContent = 'Completed';
        statusBadge.className = 'status-badge completed';
    } else {
        statusBadge.textContent = 'Pending';
        statusBadge.className = 'status-badge pending';
    }
}

// Enhanced event listeners setup
function setupEventListeners() {
    // Theme toggle
    themeToggleEl?.addEventListener('click', toggleTheme);
    
    // Search functionality
    searchInputEl?.addEventListener('input', debounce(handleSearch, 300));
    searchInputEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearSearch();
        }
    });
    
    // Clear search
    clearSearchEl?.addEventListener('click', clearSearch);
    
    // Filter functionality
    filterSelectEl?.addEventListener('change', handleFilter);
    
    // Bulk actions
    bulkCompleteEl?.addEventListener('click', handleBulkComplete);
    bulkResetEl?.addEventListener('click', handleBulkReset);
    
    // Export functionality
    exportBtnEl?.addEventListener('click', exportProgress);
    
    // Retry button
    document.getElementById('retry-btn')?.addEventListener('click', () => {
        location.reload();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Auto-save on window close
    window.addEventListener('beforeunload', saveCurrentState);
}

// Enhanced progress tracking
function updateProgress(animate = false) {
    const checkedBoxes = allItems.filter(item => item.completed);
    completedItems = checkedBoxes.length;
    
    // Update progress text
    if (progressTextEl) {
        progressTextEl.textContent = `Progress: ${completedItems}/${totalItems} items completed`;
    }
    
    // Update completion percentage
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    if (completionPercentageEl) {
        if (animate) {
            animateNumber(completionPercentageEl, progressPercentage, '%');
        } else {
            completionPercentageEl.textContent = `${progressPercentage}%`;
        }
    }
    
    // Update progress bar
    const progressFillEl = document.getElementById('progress-fill');
    if (progressFillEl) {
        const targetWidth = `${progressPercentage}%`;
        
        if (animate) {
            progressFillEl.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        progressFillEl.style.width = targetWidth;
        
        // Update progress bar color based on completion
        if (progressPercentage === 100) {
            progressFillEl.style.background = 'var(--gradient-success)';
        } else if (progressPercentage >= 50) {
            progressFillEl.style.background = 'linear-gradient(135deg, var(--warning-color), var(--success-color))';
        } else {
            progressFillEl.style.background = 'var(--gradient-secondary)';
        }
    }
    
    // Show completion celebration
    if (progressPercentage === 100 && animate) {
        showCompletionCelebration();
    }
}

// Update category progress
function updateCategoryProgress() {
    if (!checklistConfig) return;
    
    checklistConfig.categories.forEach(category => {
        const categoryItems = allItems.filter(item => 
            item.id.includes(category.id) || 
            category.subcategories.some(sub => 
                sub.items.some(configItem => configItem.id === item.id)
            )
        );
        
        const completed = categoryItems.filter(item => item.completed).length;
        const total = categoryItems.length;
        
        const progressEl = document.getElementById(`progress-${category.id}`);
        if (progressEl) {
            progressEl.textContent = `${completed}/${total} completed`;
        }
    });
}

// Search functionality
function handleSearch(e) {
    currentSearch = e.target.value.toLowerCase().trim();
    
    if (currentSearch) {
        clearSearchEl.style.display = 'block';
    } else {
        clearSearchEl.style.display = 'none';
    }
    
    filterItems();
}

function clearSearch() {
    searchInputEl.value = '';
    currentSearch = '';
    clearSearchEl.style.display = 'none';
    filterItems();
    searchInputEl.focus();
}

// Filter functionality
function handleFilter(e) {
    currentFilter = e.target.value;
    filterItems();
}

// Advanced filtering logic
function filterItems() {
    let visibleItems = [...allItems];
    
    // Apply search filter
    if (currentSearch) {
        visibleItems = visibleItems.filter(item => {
            const searchableText = (
                item.title + ' ' +
                item.description + ' ' +
                item.searchText
            ).toLowerCase();
            
            return searchableText.includes(currentSearch);
        });
    }
    
    // Apply status filter
    if (currentFilter !== 'all') {
        visibleItems = visibleItems.filter(item => {
            if (currentFilter === 'completed') return item.completed;
            if (currentFilter === 'pending') return !item.completed;
            return true;
        });
    }
    
    // Update UI
    updateItemVisibility(visibleItems);
    filteredItems = visibleItems;
    
    // Show/hide no results
    if (visibleItems.length === 0 && (currentSearch || currentFilter !== 'all')) {
        showNoResults();
    } else {
        hideNoResults();
    }
}

// Update item visibility with animations
function updateItemVisibility(visibleItems) {
    allItems.forEach((item, index) => {
        const isVisible = visibleItems.includes(item);
        const container = item.container;
        
        if (isVisible) {
            if (container.style.display === 'none') {
                container.style.display = 'flex';
                container.style.opacity = '0';
                container.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    container.style.transition = 'all 0.3s ease';
                    container.style.opacity = '1';
                    container.style.transform = 'translateY(0)';
                }, index * 50);
            }
        } else {
            container.style.transition = 'all 0.3s ease';
            container.style.opacity = '0';
            container.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                container.style.display = 'none';
            }, 300);
        }
    });
}

// Show/hide no results
function showNoResults() {
    if (noResultsEl) {
        noResultsEl.style.display = 'flex';
        noResultsEl.classList.add('fade-in');
    }
}

function hideNoResults() {
    if (noResultsEl) {
        noResultsEl.style.display = 'none';
        noResultsEl.classList.remove('fade-in');
    }
}

// Error handling
function showError(title, message = '') {
    errorContainerEl.style.display = 'flex';
    errorMessageEl.textContent = message || title;
    
    // Hide other containers
    dynamicChecklistEl.style.display = 'none';
    unsupportedOSEl.style.display = 'none';
    loadingEl.style.display = 'none';
}

// Bulk actions (simplified for JSON version)
function handleBulkComplete() {
    const pendingItems = filteredItems.filter(item => !item.completed);
    
    if (pendingItems.length === 0) {
        showNotification('All visible items are already completed!', 'info');
        return;
    }
    
    // Mark items as completed
    pendingItems.forEach((item, index) => {
        setTimeout(() => {
            item.element.click(); // Trigger change event
        }, index * 100);
    });
    
    setTimeout(() => {
        showNotification(`${pendingItems.length} items marked as completed!`, 'success');
    }, pendingItems.length * 100);
}

function handleBulkReset() {
    const completedItems = filteredItems.filter(item => item.completed);
    
    if (completedItems.length === 0) {
        showNotification('No completed items to reset!', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to reset ${completedItems.length} completed items?`)) {
        completedItems.forEach((item, index) => {
            setTimeout(() => {
                item.element.click(); // Trigger change event
            }, index * 50);
        });
        
        setTimeout(() => {
            showNotification(`${completedItems.length} items have been reset!`, 'info');
        }, completedItems.length * 50);
    }
}

// Enhanced export functionality
function exportProgress() {
    if (!checklistConfig) {
        showNotification('No configuration loaded to export!', 'error');
        return;
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const osName = checklistConfig.displayName.toLowerCase();
    
    let report = generateReportHeader();
    report += generateProgressSummary();
    report += generateDetailedReport();
    report += generateReportFooter();
    
    downloadFile(report, `security-checklist-${osName}-${timestamp}.md`, 'text/markdown');
    
    showNotification('Report exported successfully!', 'success');
}

// Generate report sections
function generateReportHeader() {
    return `# Security Checklist Report - ${checklistConfig.displayName}\n\n` +
           `**Generated on:** ${new Date().toLocaleString()}\n` +
           `**Application:** SecureCheck v1.0\n` +
           `**Operating System:** ${checklistConfig.displayName}\n` +
           `**Configuration Version:** ${checklistConfig.metadata.version}\n` +
           `**Source:** ${checklistConfig.metadata.source}\n\n` +
           `---\n\n`;
}

function generateProgressSummary() {
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    return `## 📊 Progress Summary\n\n` +
           `- **Total Items:** ${totalItems}\n` +
           `- **Completed:** ${completedItems}\n` +
           `- **Remaining:** ${totalItems - completedItems}\n` +
           `- **Completion Rate:** ${progressPercentage}%\n\n` +
           `${generateProgressBar(progressPercentage)}\n\n`;
}

function generateProgressBar(percentage) {
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    
    return `\`\`\`\n[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%\n\`\`\``;
}

function generateDetailedReport() {
    let report = `## 📋 Detailed Checklist\n\n`;
    
    allItems.forEach((item, index) => {
        const status = item.completed ? '✅' : '❌';
        const statusText = item.completed ? 'COMPLETED' : 'PENDING';
        
        report += `### ${index + 1}. ${item.title}\n\n`;
        report += `**Status:** ${status} ${statusText}\n\n`;
        report += `**Severity:** ${item.severity.toUpperCase()}\n\n`;
        report += `**Description:** ${item.description}\n\n`;
        report += `---\n\n`;
    });
    
    return report;
}

function generateReportFooter() {
    return `## 📝 Configuration Details\n\n` +
           `- **Configuration File:** ${checklistConfig.os}.json\n` +
           `- **Last Updated:** ${checklistConfig.metadata.lastUpdated}\n` +
           `- **Categories:** ${checklistConfig.metadata.categories}\n` +
           `- **Subcategories:** ${checklistConfig.metadata.subcategories}\n\n` +
           `---\n\n` +
           `**Report ID:** ${Date.now()}\n` +
           `**Export Time:** ${new Date().toISOString()}\n`;
}

// Utility functions
function saveCheckboxState(checkboxId, state) {
    localStorage.setItem(checkboxId, state.toString());
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function animateNumber(element, targetNumber, suffix = '') {
    const startNumber = parseInt(element.textContent) || 0;
    const duration = 800;
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startNumber + (targetNumber - startNumber) * eased);
        
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    update();
}

function showCompletionCelebration() {
    showNotification('🎉 Congratulations! All items completed!', 'success');
    
    // Add celebration animation to progress bar
    const progressBar = document.querySelector('.progress-fill-modern');
    if (progressBar) {
        progressBar.style.animation = 'celebrate 1s ease-in-out';
        
        setTimeout(() => {
            progressBar.style.animation = '';
        }, 1000);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element (simplified version)
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `<span>${message}</span>`;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + E: Export
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyE') {
        e.preventDefault();
        exportProgress();
    }
    
    // Ctrl/Cmd + R: Reset (with confirmation)
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyR') {
        e.preventDefault();
        handleBulkReset();
    }
    
    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
        e.preventDefault();
        searchInputEl?.focus();
        searchInputEl?.select();
    }
    
    // Ctrl/Cmd + D: Toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
        e.preventDefault();
        toggleTheme();
    }
}

function addEntranceAnimations() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-up');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Observe elements after a small delay to allow DOM to settle
    setTimeout(() => {
        const elementsToAnimate = document.querySelectorAll('.category-card, .checklist-item-modern');
        elementsToAnimate.forEach(el => observer.observe(el));
    }, 500);
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('Application Error', 'An unexpected error occurred. Please refresh the page.');
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Enhanced loading animation
function showLoadingAnimation() {
    loadingEl.classList.add('fade-in');
}

async function hideLoadingAnimation() {
    return new Promise((resolve) => {
        loadingEl.style.opacity = '0';
        loadingEl.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            loadingEl.style.display = 'none';
            resolve();
        }, 300);
    });
}

// OS Badge update with animation
async function updateOSBadge(osInfo) {
    const osDisplayName = getOSDisplayName(osInfo);
    const osSpan = osInfoEl.querySelector('span');
    
    // Add entrance animation
    osInfoEl.style.opacity = '0';
    osInfoEl.style.transform = 'translateX(20px)';
    
    setTimeout(() => {
        osSpan.textContent = `${osDisplayName}`;
        osInfoEl.style.opacity = '1';
        osInfoEl.style.transform = 'translateX(0)';
        osInfoEl.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 200);
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add transition effect
    document.documentElement.style.transition = 'all 0.3s ease';
    document.documentElement.setAttribute('data-theme', newTheme);
    
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Remove transition after animation
    setTimeout(() => {
        document.documentElement.style.transition = '';
    }, 300);
}

function updateThemeIcon(theme) {
    const icon = themeToggleEl.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Enhanced OS display
function getOSDisplayName(osInfo) {
    if (osInfo.isWindows) return 'Windows';
    if (osInfo.isLinux) return 'Linux';
    if (osInfo.isMac) return 'macOS';
    return osInfo.platform;
}

// Show checklist with animations
function showChecklistForOS(osInfo) {
    let checklistElement;
    
    if (osInfo.isWindows) {
        checklistElement = windowsChecklistEl;
        totalItems = document.querySelectorAll('#windows-checklist .checkbox-modern').length;
    } else if (osInfo.isLinux) {
        checklistElement = linuxChecklistEl;
        totalItems = document.querySelectorAll('#linux-checklist .checkbox-modern').length;
    } else {
        unsupportedOSEl.style.display = 'block';
        detectedOSEl.textContent = getOSDisplayName(osInfo);
        totalItems = 0;
        return;
    }
    
    // Show checklist with slide-in animation
    checklistElement.style.display = 'block';
    checklistElement.classList.add('slide-in');
    
    // Animate category cards
    const categoryCards = checklistElement.querySelectorAll('.category-card');
    categoryCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('bounce-in');
        }, index * 100);
    });
}

// Initialize checklist items
function initializeChecklistItems() {
    allItems = Array.from(document.querySelectorAll('.checkbox-modern'));
    filteredItems = [...allItems];
    
    allItems.forEach((checkbox, index) => {
        // Create item object with metadata
        const item = {
            element: checkbox,
            id: checkbox.id,
            container: checkbox.closest('.checklist-item-modern'),
            title: checkbox.closest('.checklist-item-modern').querySelector('.item-title').textContent,
            description: checkbox.closest('.checklist-item-modern').querySelector('.item-description').textContent,
            searchText: checkbox.closest('.checklist-item-modern').getAttribute('data-search-text') || '',
            completed: false
        };
        
        // Load saved state
        const savedState = localStorage.getItem(checkbox.id);
        if (savedState === 'true') {
            checkbox.checked = true;
            item.completed = true;
            updateItemState(item, true);
        }
        
        // Add enhanced event listener
        checkbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            item.completed = isChecked;
            
            // Animate checkbox change
            animateCheckboxChange(item, isChecked);
            
            // Update item state
            updateItemState(item, isChecked);
            
            // Save state
            saveCheckboxState(checkbox.id, isChecked);
            
            // Update progress with animation
            updateProgress(true);
            
            // Update category progress
            updateCategoryProgress();
        });
        
        // Add to items array
        allItems[index] = item;
    });
}

// Animate checkbox change
function animateCheckboxChange(item, isChecked) {
    const checkmark = item.container.querySelector('.checkmark');
    const container = item.container;
    
    if (isChecked) {
        // Success animation
        checkmark.style.transform = 'scale(1.2)';
        container.classList.add('bounce-in');
        
        setTimeout(() => {
            checkmark.style.transform = 'scale(1)';
            container.classList.remove('bounce-in');
        }, 300);
        
        // Add completion effect
        container.style.transition = 'all 0.5s ease';
        setTimeout(() => {
            container.classList.add('completed');
        }, 100);
        
    } else {
        // Remove completion state
        container.classList.remove('completed');
    }
}

// Update item visual state
function updateItemState(item, isCompleted) {
    const statusBadge = item.container.querySelector('.status-badge');
    
    if (isCompleted) {
        statusBadge.textContent = 'Completed';
        statusBadge.className = 'status-badge completed';
    } else {
        statusBadge.textContent = 'Pending';
        statusBadge.className = 'status-badge pending';
    }
}

// Enhanced event listeners setup
function setupEventListeners() {
    // Theme toggle
    themeToggleEl.addEventListener('click', toggleTheme);
    
    // Search functionality
    searchInputEl.addEventListener('input', debounce(handleSearch, 300));
    searchInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearSearch();
        }
    });
    
    // Clear search
    clearSearchEl.addEventListener('click', clearSearch);
    
    // Filter functionality
    filterSelectEl.addEventListener('change', handleFilter);
    
    // Bulk actions
    bulkCompleteEl.addEventListener('click', handleBulkComplete);
    bulkResetEl.addEventListener('click', handleBulkReset);
    
    // Export functionality
    exportBtnEl.addEventListener('click', exportProgress);
    
    // Category toggles
    document.querySelectorAll('.category-toggle').forEach(toggle => {
        toggle.addEventListener('click', handleCategoryToggle);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Smooth scrolling for focus
    document.addEventListener('focusin', handleFocusScroll);
}

// Search functionality
function handleSearch(e) {
    currentSearch = e.target.value.toLowerCase().trim();
    
    if (currentSearch) {
        clearSearchEl.style.display = 'block';
    } else {
        clearSearchEl.style.display = 'none';
    }
    
    filterItems();
}

function clearSearch() {
    searchInputEl.value = '';
    currentSearch = '';
    clearSearchEl.style.display = 'none';
    filterItems();
    searchInputEl.focus();
}

// Filter functionality
function handleFilter(e) {
    currentFilter = e.target.value;
    filterItems();
}

// Advanced filtering logic
function filterItems() {
    let visibleItems = [...allItems];
    
    // Apply search filter
    if (currentSearch) {
        visibleItems = visibleItems.filter(item => {
            const searchableText = (
                item.title + ' ' +
                item.description + ' ' +
                item.searchText
            ).toLowerCase();
            
            return searchableText.includes(currentSearch);
        });
    }
    
    // Apply status filter
    if (currentFilter !== 'all') {
        visibleItems = visibleItems.filter(item => {
            if (currentFilter === 'completed') return item.completed;
            if (currentFilter === 'pending') return !item.completed;
            return true;
        });
    }
    
    // Update UI
    updateItemVisibility(visibleItems);
    filteredItems = visibleItems;
    
    // Show/hide no results
    if (visibleItems.length === 0 && (currentSearch || currentFilter !== 'all')) {
        showNoResults();
    } else {
        hideNoResults();
    }
}

// Update item visibility with animations
function updateItemVisibility(visibleItems) {
    allItems.forEach((item, index) => {
        const isVisible = visibleItems.includes(item);
        const container = item.container;
        
        if (isVisible) {
            if (container.style.display === 'none') {
                container.style.display = 'flex';
                container.style.opacity = '0';
                container.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    container.style.transition = 'all 0.3s ease';
                    container.style.opacity = '1';
                    container.style.transform = 'translateY(0)';
                }, index * 50);
            }
        } else {
            container.style.transition = 'all 0.3s ease';
            container.style.opacity = '0';
            container.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                container.style.display = 'none';
            }, 300);
        }
    });
}

// Show/hide no results
function showNoResults() {
    noResultsEl.style.display = 'flex';
    noResultsEl.classList.add('fade-in');
}

function hideNoResults() {
    noResultsEl.style.display = 'none';
    noResultsEl.classList.remove('fade-in');
}

// Bulk actions
function handleBulkComplete() {
    const pendingItems = filteredItems.filter(item => !item.completed);
    
    if (pendingItems.length === 0) {
        showNotification('All visible items are already completed!', 'info');
        return;
    }
    
    // Animate bulk completion
    pendingItems.forEach((item, index) => {
        setTimeout(() => {
            item.element.checked = true;
            item.completed = true;
            animateCheckboxChange(item, true);
            updateItemState(item, true);
            saveCheckboxState(item.id, true);
        }, index * 100);
    });
    
    setTimeout(() => {
        updateProgress(true);
        updateCategoryProgress();
        showNotification(`${pendingItems.length} items marked as completed!`, 'success');
    }, pendingItems.length * 100);
}

function handleBulkReset() {
    const completedItems = filteredItems.filter(item => item.completed);
    
    if (completedItems.length === 0) {
        showNotification('No completed items to reset!', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to reset ${completedItems.length} completed items? This action cannot be undone.`)) {
        completedItems.forEach((item, index) => {
            setTimeout(() => {
                item.element.checked = false;
                item.completed = false;
                item.container.classList.remove('completed');
                updateItemState(item, false);
                saveCheckboxState(item.id, false);
            }, index * 50);
        });
        
        setTimeout(() => {
            updateProgress(true);
            updateCategoryProgress();
            showNotification(`${completedItems.length} items have been reset!`, 'info');
        }, completedItems.length * 50);
    }
}

// Category toggle functionality
function handleCategoryToggle(e) {
    const button = e.target.closest('.category-toggle');
    const categoryId = button.getAttribute('data-category');
    const content = document.getElementById(categoryId);
    
    const isExpanded = content.classList.contains('expanded');
    
    // Animate toggle
    button.style.transition = 'transform 0.3s ease';
    
    if (isExpanded) {
        content.classList.remove('expanded');
        button.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        button.classList.add('expanded');
    }
}

// Enhanced progress tracking
function updateProgress(animate = false) {
    const checkedBoxes = allItems.filter(item => item.completed);
    completedItems = checkedBoxes.length;
    
    // Update progress text
    progressTextEl.textContent = `Progress: ${completedItems}/${totalItems} items completed`;
    
    // Update completion percentage
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    if (animate) {
        animateNumber(completionPercentageEl, progressPercentage, '%');
    } else {
        completionPercentageEl.textContent = `${progressPercentage}%`;
    }
    
    // Update progress bar with animation
    const progressFillEl = document.getElementById('progress-fill');
    if (progressFillEl) {
        const targetWidth = `${progressPercentage}%`;
        
        if (animate) {
            progressFillEl.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        progressFillEl.style.width = targetWidth;
        
        // Update progress bar color based on completion
        if (progressPercentage === 100) {
            progressFillEl.style.background = 'var(--gradient-success)';
        } else if (progressPercentage >= 50) {
            progressFillEl.style.background = 'linear-gradient(135deg, var(--warning-color), var(--success-color))';
        } else {
            progressFillEl.style.background = 'var(--gradient-secondary)';
        }
    }
    
    // Show completion celebration
    if (progressPercentage === 100 && animate) {
        showCompletionCelebration();
    }
}

// Update category progress
function updateCategoryProgress() {
    document.querySelectorAll('.category-card').forEach(card => {
        const checkboxes = card.querySelectorAll('.checkbox-modern');
        const completed = Array.from(checkboxes).filter(cb => cb.checked).length;
        const total = checkboxes.length;
        
        const progressEl = card.querySelector('.category-progress');
        if (progressEl) {
            progressEl.textContent = `${completed}/${total} completed`;
        }
    });
}

// Animate number counting
function animateNumber(element, targetNumber, suffix = '') {
    const startNumber = parseInt(element.textContent) || 0;
    const duration = 800;
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startNumber + (targetNumber - startNumber) * eased);
        
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    update();
}

// Completion celebration
function showCompletionCelebration() {
    showNotification('🎉 Congratulations! All items completed!', 'success');
    
    // Add celebration animation to progress bar
    const progressBar = document.querySelector('.progress-fill-modern');
    if (progressBar) {
        progressBar.style.animation = 'celebrate 1s ease-in-out';
        
        setTimeout(() => {
            progressBar.style.animation = '';
        }, 1000);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        padding: 1rem;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Type-specific styling
    if (type === 'success') {
        notification.style.borderLeftColor = 'var(--success-color)';
        notification.style.borderLeftWidth = '4px';
    } else if (type === 'error') {
        notification.style.borderLeftColor = 'var(--error-color)';
        notification.style.borderLeftWidth = '4px';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Enhanced keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + E: Export
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyE') {
        e.preventDefault();
        exportProgress();
    }
    
    // Ctrl/Cmd + R: Reset (with confirmation)
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyR') {
        e.preventDefault();
        handleBulkReset();
    }
    
    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
        e.preventDefault();
        searchInputEl.focus();
        searchInputEl.select();
    }
    
    // Ctrl/Cmd + D: Toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
        e.preventDefault();
        toggleTheme();
    }
    
    // Arrow key navigation for checkboxes
    if (['ArrowDown', 'ArrowUp'].includes(e.code)) {
        const visibleCheckboxes = filteredItems.map(item => item.element);
        const currentIndex = visibleCheckboxes.indexOf(document.activeElement);
        
        if (currentIndex !== -1) {
            e.preventDefault();
            let nextIndex;
            
            if (e.code === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % visibleCheckboxes.length;
            } else {
                nextIndex = currentIndex === 0 ? visibleCheckboxes.length - 1 : currentIndex - 1;
            }
            
            visibleCheckboxes[nextIndex].focus();
        }
    }
    
    // Spacebar to toggle focused checkbox
    if (e.code === 'Space' && document.activeElement.classList.contains('checkbox-modern')) {
        e.preventDefault();
        document.activeElement.click();
    }
}

// Smooth scroll to focused element
function handleFocusScroll(e) {
    if (e.target.classList.contains('checkbox-modern')) {
        e.target.closest('.checklist-item-modern').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Enhanced export functionality
function exportProgress() {
    const timestamp = new Date().toISOString().split('T')[0];
    const osName = getOSDisplayName(currentOS).toLowerCase();
    
    let report = generateReportHeader();
    report += generateProgressSummary();
    report += generateDetailedReport();
    report += generateReportFooter();
    
    downloadFile(report, `security-checklist-${osName}-${timestamp}.md`, 'text/markdown');
    
    showNotification('Report exported successfully!', 'success');
}

// Generate report sections
function generateReportHeader() {
    return `# Security Checklist Report - ${getOSDisplayName(currentOS)}\n\n` +
           `**Generated on:** ${new Date().toLocaleString()}\n` +
           `**Application:** SecureCheck v1.0\n` +
           `**Operating System:** ${getOSDisplayName(currentOS)}\n\n` +
           `---\n\n`;
}

function generateProgressSummary() {
    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    return `## 📊 Progress Summary\n\n` +
           `- **Total Items:** ${totalItems}\n` +
           `- **Completed:** ${completedItems}\n` +
           `- **Remaining:** ${totalItems - completedItems}\n` +
           `- **Completion Rate:** ${progressPercentage}%\n\n` +
           `${generateProgressBar(progressPercentage)}\n\n`;
}

function generateProgressBar(percentage) {
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    
    return `\`\`\`\n[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%\n\`\`\``;
}

function generateDetailedReport() {
    let report = `## 📋 Detailed Checklist\n\n`;
    
    allItems.forEach((item, index) => {
        const status = item.completed ? '✅' : '❌';
        const statusText = item.completed ? 'COMPLETED' : 'PENDING';
        
        report += `### ${index + 1}. ${item.title}\n\n`;
        report += `**Status:** ${status} ${statusText}\n\n`;
        report += `**Description:** ${item.description}\n\n`;
        report += `---\n\n`;
    });
    
    return report;
}

function generateReportFooter() {
    return `## 📝 Notes\n\n` +
           `This report was generated automatically by SecureCheck.\n` +
           `Please review each item and ensure proper implementation.\n\n` +
           `**Report ID:** ${Date.now()}\n` +
           `**Export Time:** ${new Date().toISOString()}\n`;
}

// File download utility
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Utility functions
function saveCheckboxState(checkboxId, state) {
    localStorage.setItem(checkboxId, state.toString());
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add entrance animations
function addEntranceAnimations() {
    const elementsToAnimate = document.querySelectorAll('.category-card, .checklist-item-modern');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-up');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    elementsToAnimate.forEach(el => observer.observe(el));
}

// Error handling
function showError(message) {
    loadingEl.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    
    // Add error styling
    loadingEl.style.color = 'var(--error-color)';
    loadingEl.style.textAlign = 'center';
}

// Add CSS animations keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes celebrate {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.2); }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.2s ease;
    }
    
    .notification-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    
    .error-container {
        padding: 2rem;
        text-align: center;
    }
    
    .error-icon {
        font-size: 3rem;
        color: var(--error-color);
        margin-bottom: 1rem;
    }
    
    .retry-btn {
        margin-top: 1rem;
        padding: 0.75rem 1.5rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .retry-btn:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Future enhancement: register service worker for offline support
    });
}

// Get display name for OS
function getOSDisplayName(osInfo) {
    if (osInfo.isWindows) return 'Windows';
    if (osInfo.isLinux) return 'Linux';
    if (osInfo.isMac) return 'macOS';
    return osInfo.platform;
}

// Show appropriate checklist based on OS
function showChecklistForOS(osInfo) {
    if (osInfo.isWindows) {
        windowsChecklistEl.style.display = 'block';
        totalItems = document.querySelectorAll('#windows-checklist .checkbox').length;
    } else if (osInfo.isLinux) {
        linuxChecklistEl.style.display = 'block';
        totalItems = document.querySelectorAll('#linux-checklist .checkbox').length;
    } else {
        unsupportedOSEl.style.display = 'block';
        detectedOSEl.textContent = getOSDisplayName(osInfo);
        totalItems = 0;
    }
}

// Set up checkbox event listeners
function setupCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.checkbox');
    
    checkboxes.forEach(checkbox => {
        // Load saved state
        const savedState = localStorage.getItem(checkbox.id);
        if (savedState === 'true') {
            checkbox.checked = true;
            updateCheckboxState(checkbox, true);
        }
        
        // Add event listener
        checkbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            updateCheckboxState(checkbox, isChecked);
            saveCheckboxState(checkbox.id, isChecked);
            updateProgress();
        });
    });
}

// Update checkbox visual state
function updateCheckboxState(checkbox, isChecked) {
    const checklistItem = checkbox.closest('.checklist-item');
    if (isChecked) {
        checklistItem.classList.add('completed');
    } else {
        checklistItem.classList.remove('completed');
    }
}

// Save checkbox state to localStorage
function saveCheckboxState(checkboxId, state) {
    localStorage.setItem(checkboxId, state.toString());
}

// Update progress display
function updateProgress() {
    const checkedBoxes = document.querySelectorAll('.checkbox:checked');
    completedItems = checkedBoxes.length;
    
    // Update progress text
    progressTextEl.textContent = `Progress: ${completedItems}/${totalItems} items completed`;
    
    // Update progress bar
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    progressFillEl.style.width = `${progressPercentage}%`;
    
    // Update progress bar color based on completion
    if (progressPercentage === 100) {
        progressFillEl.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
    } else if (progressPercentage >= 50) {
        progressFillEl.style.background = 'linear-gradient(90deg, #ffc107, #28a745)';
    } else {
        progressFillEl.style.background = 'linear-gradient(90deg, #3498db, #2ecc71)';
    }
}

// Show error message
function showError(message) {
    loadingEl.innerHTML = `
        <div style="color: #e74c3c; text-align: center;">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    // Space bar to toggle focused checkbox
    if (e.code === 'Space' && document.activeElement.classList.contains('checkbox')) {
        e.preventDefault();
        document.activeElement.checked = !document.activeElement.checked;
        document.activeElement.dispatchEvent(new Event('change'));
    }
    
    // Arrow keys for navigation
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        const checkboxes = Array.from(document.querySelectorAll('.checkbox'));
        const currentIndex = checkboxes.indexOf(document.activeElement);
        
        if (currentIndex !== -1) {
            e.preventDefault();
            let nextIndex;
            
            if (e.code === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % checkboxes.length;
            } else {
                nextIndex = currentIndex === 0 ? checkboxes.length - 1 : currentIndex - 1;
            }
            
            checkboxes[nextIndex].focus();
        }
    }
});

// Add reset functionality (Ctrl+R)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyR') {
        e.preventDefault();
        if (confirm('Are you sure you want to reset all checkboxes? This action cannot be undone.')) {
            resetAllCheckboxes();
        }
    }
});

// Reset all checkboxes
function resetAllCheckboxes() {
    const checkboxes = document.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        updateCheckboxState(checkbox, false);
        localStorage.removeItem(checkbox.id);
    });
    updateProgress();
}

// Export functionality (Ctrl+E)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyE') {
        e.preventDefault();
        exportProgress();
    }
});

// Export progress to text file
function exportProgress() {
    const checkboxes = document.querySelectorAll('.checkbox');
    let report = `Security Checklist Report - ${getOSDisplayName(currentOS)}\n`;
    report += `Generated on: ${new Date().toLocaleString()}\n`;
    report += `Progress: ${completedItems}/${totalItems} items completed\n\n`;
    
    checkboxes.forEach(checkbox => {
        const label = checkbox.nextElementSibling;
        const text = label.textContent.trim();
        const status = checkbox.checked ? '✓' : '✗';
        report += `${status} ${text}\n`;
    });
    
    // Create and download file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-checklist-${getOSDisplayName(currentOS).toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);