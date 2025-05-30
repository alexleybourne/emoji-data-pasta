// Emoji Data Pasta - Bulk Field Manager
class EmojiDataPasta {
    constructor() {
        this.originalData = [];
        this.fieldSchema = {};
        this.selectedFields = new Set();
        this.settings = {
            includeEmptyFields: true,
            prettifyJson: true,
            includeStats: true,
            filename: 'emoji-edited.json',
            arrayName: ''
        };
        
        this.initializeEventListeners();
        this.loadDefaultData();
    }

    initializeEventListeners() {
        // File operations
        document.getElementById('loadFile').addEventListener('click', () => this.loadFile());
        document.getElementById('saveFile').addEventListener('click', () => this.showSettingsPanel());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileLoad(e));

        // Field management
        document.getElementById('selectAll').addEventListener('click', () => this.selectAllFields());
        document.getElementById('selectNone').addEventListener('click', () => this.selectNoFields());
        document.getElementById('applyChanges').addEventListener('click', () => this.applyChanges());

        // Settings panel
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettingsPanel());
        document.getElementById('includeEmptyFields').addEventListener('change', (e) => {
            this.settings.includeEmptyFields = e.target.checked;
        });
        document.getElementById('prettifyJson').addEventListener('change', (e) => {
            this.settings.prettifyJson = e.target.checked;
        });
        document.getElementById('includeStats').addEventListener('change', (e) => {
            this.settings.includeStats = e.target.checked;
        });
        document.getElementById('customFilename').addEventListener('input', (e) => {
            this.settings.filename = e.target.value;
        });
        document.getElementById('arrayName').addEventListener('input', (e) => {
            this.settings.arrayName = e.target.value;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    async loadDefaultData() {
        try {
            const response = await fetch('emoji.json');
            if (response.ok) {
                const data = await response.json();
                this.loadData(data);
                this.showMessage('Loaded default emoji.json file', 'success');
            }
        } catch (error) {
            console.log('No default emoji.json file found');
        }
    }

    loadFile() {
        document.getElementById('fileInput').click();
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            this.showMessage('Please select a valid JSON file.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadData(data);
                this.showMessage(`Loaded ${Array.isArray(data) ? data.length : 'N/A'} entries from ${file.name}`, 'success');
            } catch (error) {
                this.showMessage('Error parsing JSON file. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    loadData(data) {
        // Handle both array and object with emoji_data_pasta_settings
        if (data.emoji_data_pasta_settings) {
            this.settings = { ...this.settings, ...data.emoji_data_pasta_settings };
            // Remove settings and extract the actual array
            delete data.emoji_data_pasta_settings;
            this.originalData = Object.values(data).filter(item => typeof item === 'object' && item.name);
        } else if (Array.isArray(data)) {
            this.originalData = data;
        } else {
            this.showMessage('Invalid data format. Expected an array of emoji objects.', 'error');
            return;
        }

        this.analyzeFieldStructure();
        this.updateDisplay();
    }

    analyzeFieldStructure() {
        this.fieldSchema = {};
        
        if (this.originalData.length === 0) return;

        // Analyze all fields across all emojis
        this.originalData.forEach(emoji => {
            Object.keys(emoji).forEach(field => {
                if (!this.fieldSchema[field]) {
                    this.fieldSchema[field] = {
                        type: this.getFieldType(emoji[field]),
                        usage: 0,
                        examples: [],
                        hasNullValues: false,
                        hasEmptyValues: false
                    };
                }
                
                this.fieldSchema[field].usage++;
                
                if (emoji[field] === null) {
                    this.fieldSchema[field].hasNullValues = true;
                } else if (emoji[field] === '') {
                    this.fieldSchema[field].hasEmptyValues = true;
                } else if (this.fieldSchema[field].examples.length < 3) {
                    this.fieldSchema[field].examples.push(emoji[field]);
                }
            });
        });

        // Initially select all fields
        this.selectedFields = new Set(Object.keys(this.fieldSchema));
    }

    getFieldType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    updateDisplay() {
        this.updateCounters();
        this.renderOriginalStructure();
        this.renderFieldManager();
        this.renderOutputPreview();
    }

    updateCounters() {
        const totalCount = this.originalData.length;
        document.getElementById('totalCount').textContent = `${totalCount} emojis loaded`;
        
        const fieldCount = Object.keys(this.fieldSchema).length;
        document.getElementById('fieldCounter').textContent = `${fieldCount} fields`;
    }

    renderOriginalStructure() {
        const container = document.getElementById('originalStructure');
        
        if (this.originalData.length === 0) {
            container.innerHTML = '<div class="loading">Load a JSON file to see the emoji structure</div>';
            return;
        }

        // Show a sample emoji with syntax highlighting
        const sampleEmoji = this.originalData[0];
        const jsonString = JSON.stringify(sampleEmoji, null, 2);
        const highlightedJson = this.highlightJson(jsonString);
        
        container.innerHTML = `
            <div class="json-code">${highlightedJson}</div>
        `;
    }

    renderFieldManager() {
        const container = document.getElementById('fieldManager');
        
        if (Object.keys(this.fieldSchema).length === 0) {
            container.innerHTML = '<div class="no-data">Load emoji data to manage fields</div>';
            return;
        }

        const fields = Object.keys(this.fieldSchema).sort();
        const totalEmojis = this.originalData.length;

        container.innerHTML = `
            <div class="field-group">
                <div class="field-group-header">
                    <div class="field-group-title">Available Fields</div>
                    <div class="field-group-count">${fields.length} fields</div>
                </div>
                <div class="field-list">
                    ${fields.map(field => {
                        const fieldInfo = this.fieldSchema[field];
                        const usagePercent = Math.round((fieldInfo.usage / totalEmojis) * 100);
                        const isSelected = this.selectedFields.has(field);
                        
                        return `
                            <div class="field-item">
                                <input type="checkbox" 
                                       class="field-checkbox" 
                                       id="field-${field}"
                                       ${isSelected ? 'checked' : ''}
                                       onchange="emojiPasta.toggleField('${field}')">
                                <div class="field-name">${field}</div>
                                <div class="field-type">${fieldInfo.type}</div>
                                <div class="field-usage">${usagePercent}%</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderOutputPreview() {
        const container = document.getElementById('outputStructure');
        
        if (this.originalData.length === 0) {
            container.innerHTML = '<div class="loading">Make field changes to see output preview</div>';
            return;
        }

        // Create a sample output based on selected fields
        const sampleOutput = this.createFilteredEmoji(this.originalData[0]);
        const jsonString = JSON.stringify(sampleOutput, null, 2);
        const highlightedJson = this.highlightJson(jsonString);
        
        container.innerHTML = `
            <div class="json-code">${highlightedJson}</div>
        `;
    }

    createFilteredEmoji(originalEmoji) {
        const filtered = {};
        
        this.selectedFields.forEach(field => {
            if (originalEmoji.hasOwnProperty(field)) {
                const value = originalEmoji[field];
                
                // Apply empty field filtering if enabled
                if (this.settings.includeEmptyFields || 
                    (value !== null && value !== '' && value !== undefined)) {
                    filtered[field] = value;
                }
            }
        });
        
        return filtered;
    }

    toggleField(fieldName) {
        if (this.selectedFields.has(fieldName)) {
            this.selectedFields.delete(fieldName);
        } else {
            this.selectedFields.add(fieldName);
        }
        
        this.renderOutputPreview();
    }

    selectAllFields() {
        this.selectedFields = new Set(Object.keys(this.fieldSchema));
        this.renderFieldManager();
        this.renderOutputPreview();
    }

    selectNoFields() {
        this.selectedFields = new Set();
        this.renderFieldManager();
        this.renderOutputPreview();
    }

    applyChanges() {
        if (this.originalData.length === 0) {
            this.showMessage('No data loaded to process', 'warning');
            return;
        }

        if (this.selectedFields.size === 0) {
            this.showMessage('Please select at least one field to include', 'warning');
            return;
        }

        this.showMessage(`Applied changes! Selected ${this.selectedFields.size} fields out of ${Object.keys(this.fieldSchema).length}`, 'success');
        this.renderOutputPreview();
    }

    showSettingsPanel() {
        if (this.originalData.length === 0) {
            this.showMessage('No data to save. Please load a file first.', 'warning');
            return;
        }

        document.getElementById('settingsPanel').classList.add('active');
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.closeSettingsOnClickOutside);
        }, 100);
    }

    hideSettingsPanel() {
        document.getElementById('settingsPanel').classList.remove('active');
        document.removeEventListener('click', this.closeSettingsOnClickOutside);
        this.processAndSaveData();
    }

    closeSettingsOnClickOutside = (e) => {
        const panel = document.getElementById('settingsPanel');
        if (!panel.contains(e.target)) {
            this.hideSettingsPanel();
        }
    }

    async processAndSaveData() {
        if (this.originalData.length === 0) {
            this.showMessage('No data to save', 'warning');
            return;
        }

        // Show progress modal
        this.showProgressModal();

        const processedData = [];
        const totalEmojis = this.originalData.length;
        
        // Process emojis in batches to avoid blocking UI
        const batchSize = 100;
        for (let i = 0; i < totalEmojis; i += batchSize) {
            const batch = this.originalData.slice(i, i + batchSize);
            
            batch.forEach(emoji => {
                const filtered = this.createFilteredEmoji(emoji);
                if (Object.keys(filtered).length > 0) {
                    processedData.push(filtered);
                }
            });

            // Update progress
            const progress = Math.min(((i + batchSize) / totalEmojis) * 100, 100);
            this.updateProgress(progress, i + batch.length, totalEmojis);
            
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.hideProgressModal();

        // Prepare final data structure
        let finalData;

        if (this.settings.arrayName && this.settings.arrayName.trim()) {
            finalData = {
                [this.settings.arrayName.trim()]: processedData
            };
        } else {
            finalData = processedData;
        }

        // Add statistics if enabled
        if (this.settings.includeStats) {
            const stats = {
                originalDataCount: this.originalData.length,
                finalDataCount: processedData.length,
                fieldsOriginal: Object.keys(this.fieldSchema).length,
                fieldsSelected: this.selectedFields.size,
                fieldsRemoved: Object.keys(this.fieldSchema).filter(f => !this.selectedFields.has(f)),
                fieldsKept: Array.from(this.selectedFields),
                processedAt: new Date().toISOString(),
                settings: { ...this.settings }
            };

            if (this.settings.arrayName && this.settings.arrayName.trim()) {
                finalData.emoji_data_pasta_settings = stats;
            } else {
                finalData = {
                    data: processedData,
                    emoji_data_pasta_settings: stats
                };
            }
        }

        // Convert to JSON
        const jsonString = this.settings.prettifyJson 
            ? JSON.stringify(finalData, null, 2)
            : JSON.stringify(finalData);

        // Create and download file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.settings.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const removedCount = Object.keys(this.fieldSchema).length - this.selectedFields.size;
        this.showMessage(`Saved ${processedData.length} emojis with ${this.selectedFields.size} fields (removed ${removedCount} fields)`, 'success');
    }

    showProgressModal() {
        document.getElementById('progressModal').classList.add('active');
    }

    hideProgressModal() {
        document.getElementById('progressModal').classList.remove('active');
    }

    updateProgress(percent, current, total) {
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = `${current} / ${total} emojis processed`;
    }

    highlightJson(jsonString) {
        return jsonString
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/:\s*null/g, ': <span class="json-null">null</span>');
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + O to open file
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            this.loadFile();
        }
        
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.showSettingsPanel();
        }

        // Escape to close settings panel
        if (e.key === 'Escape') {
            this.hideSettingsPanel();
        }

        // Ctrl/Cmd + A to select all fields
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.target.closest('.field-manager')) {
            e.preventDefault();
            this.selectAllFields();
        }
    }

    showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 3000;
            padding: 1rem 1.5rem; border-radius: 6px; color: white;
            font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease; max-width: 400px;
        `;

        const colors = {
            success: 'linear-gradient(45deg, #56cc9d, #6bb77b)',
            error: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
            warning: 'linear-gradient(45deg, #ffa726, #ff9800)',
            info: 'linear-gradient(45deg, #667eea, #764ba2)'
        };

        messageDiv.style.background = colors[type] || colors.info;
        messageDiv.textContent = text;

        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 300);
        }, 4000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application
const emojiPasta = new EmojiDataPasta(); 