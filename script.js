// Emoji Data Pasta - Bulk Field Manager
class EmojiDataPasta {
    constructor() {
        this.originalData = [];
        this.fieldSchema = {};
        this.selectedFields = new Set();
        this.filteredEmojis = [];
        this.currentEmojiIndex = 0;
        this.currentVariant = 'default';
        this.expandedFields = new Set();
        this.fieldDescriptions = this.getFieldDescriptions();
        this.presets = this.getFieldPresets();
        this.currentPreset = '';
        this.customPreset = this.loadCustomPreset();
        this.settings = {
            includeEmptyFields: true,
            prettifyJson: true,
            includeStats: true,
            saveSettings: true,
            filename: 'emoji-edited.json',
            arrayName: ''
        };
        this.emojiDisplayLimit = 100; // Initial display limit
        this.emojiDisplayIncrement = 50; // How many to add each time
        
        // Theme management (dark mode by default)
        this.theme = localStorage.getItem('emoji-pasta-theme') || 'dark';
        this.applyTheme();
        
        this.initializeEventListeners();
        
        // Load persisted state first, then default data
        this.loadPersistedState();
        this.loadDefaultData();
    }

    getFieldDescriptions() {
        return {
            'name': 'The descriptive name of the emoji (e.g., "Grinning Face")',
            'unified': 'Unicode codepoint(s) in unified format (e.g., "1F600")',
            'non_qualified': 'Non-qualified unicode representation',
            'docomo': 'DoCoMo carrier-specific encoding',
            'au': 'AU carrier-specific encoding',
            'softbank': 'SoftBank carrier-specific encoding',
            'google': 'Google-specific encoding',
            'image': 'Filename for the emoji image',
            'sheet_x': 'X coordinate on the sprite sheet',
            'sheet_y': 'Y coordinate on the sprite sheet',
            'short_name': 'Primary short name/code for the emoji (e.g., "grinning")',
            'short_names': 'Array of all possible short names/codes',
            'text': 'Text representation if available',
            'texts': 'Array of text representations',
            'category': 'Main category (e.g., "Smileys & Emotion")',
            'subcategory': 'Specific subcategory within the main category',
            'sort_order': 'Numerical order for sorting emojis',
            'added_in': 'Unicode version when this emoji was added (e.g., "6.0")',
            'has_img_apple': 'Whether Apple has an image for this emoji',
            'has_img_google': 'Whether Google has an image for this emoji',
            'has_img_twitter': 'Whether Twitter has an image for this emoji',
            'has_img_facebook': 'Whether Facebook has an image for this emoji',
            'skin_variations': 'Object containing skin tone variations',
            'obsoleted_by': 'Unicode that replaces this emoji if obsoleted',
            'obsoletes': 'Unicode that this emoji replaces',
            'unicode': 'The actual Unicode character(s)',
            // Unified sub-field descriptions for skin_variations
            'skin_variations.unified': 'Unicode for skin tone variants (applies to all variants)',
            'skin_variations.image': 'Image filename for skin tone variants (applies to all variants)',
            'skin_variations.sheet_x': 'X coordinate for skin tone variants (applies to all variants)',
            'skin_variations.sheet_y': 'Y coordinate for skin tone variants (applies to all variants)',
            'skin_variations.added_in': 'Unicode version when variants were added (applies to all variants)',
            'skin_variations.has_img_apple': 'Whether Apple has images for skin tone variants (applies to all variants)',
            'skin_variations.has_img_google': 'Whether Google has images for skin tone variants (applies to all variants)',
            'skin_variations.has_img_twitter': 'Whether Twitter has images for skin tone variants (applies to all variants)',
            'skin_variations.has_img_facebook': 'Whether Facebook has images for skin tone variants (applies to all variants)'
        };
    }

    getFieldPresets() {
        return {
            'minimal': {
                name: 'Minimal',
                description: 'Core essentials: name, category, codes, and sorting - perfect for basic emoji displays',
                fields: ['name', 'short_names', 'category', 'sort_order', 'unified']
            },
            'essential': {
                name: 'Essential',
                description: 'Everything from minimal plus image data and platform support - ideal for most apps',
                fields: ['unified', 'category', 'name', 'short_name', 'short_names', 'skin_variations', 'sort_order', 'subcategory', 'has_img_apple', 'has_img_google', 'has_img_twitter', 'has_img_facebook', 'image', 'sheet_x', 'sheet_y']
            },
            'complete': {
                name: 'Complete',
                description: 'All available fields including legacy codes and metadata - for comprehensive emoji databases',
                fields: [] // Will be populated with all available fields
            }
        };
    }

    initializeEventListeners() {
        // File operations
        document.getElementById('loadFile').addEventListener('click', () => this.loadFile());
        document.getElementById('saveFile').addEventListener('click', () => this.showSettingsPanel());
        document.getElementById('resetApp').addEventListener('click', () => this.resetApp());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileLoad(e));

        // Field management
        document.getElementById('selectAll').addEventListener('click', () => this.selectAllFields());
        document.getElementById('selectNone').addEventListener('click', () => this.selectNoFields());
        document.getElementById('applyChanges').addEventListener('click', () => this.applyChanges());
        document.getElementById('fieldPresets').addEventListener('change', (e) => this.applyPreset(e.target.value));
        document.getElementById('resetPresets').addEventListener('click', () => this.resetPresets());

        // Emoji navigation
        document.getElementById('emojiIcon').addEventListener('click', () => this.nextEmoji());
        document.getElementById('prevEmoji').addEventListener('click', () => this.prevEmoji());
        document.getElementById('nextEmoji').addEventListener('click', () => this.nextEmoji());
        document.getElementById('randomEmoji').addEventListener('click', () => this.randomEmoji());
        document.getElementById('quickBrowse').addEventListener('click', () => this.showEmojiBrowser());
        document.getElementById('variantSelect').addEventListener('change', (e) => this.selectVariant(e.target.value));
        document.getElementById('resetVariant').addEventListener('click', () => this.resetVariant());

        // Emoji browser
        document.getElementById('toggleEmojiTable').addEventListener('click', () => this.showEmojiBrowser());
        document.getElementById('closeEmojiBrowser').addEventListener('click', () => this.hideEmojiBrowser());
        document.getElementById('emojiSearch').addEventListener('input', (e) => this.searchEmojis(e.target.value));

        // Settings panel
        document.getElementById('closeSettings').addEventListener('click', () => this.hideSettingsPanel());
        document.getElementById('downloadFile').addEventListener('click', () => this.downloadFile());
        document.getElementById('cancelExport').addEventListener('click', () => this.hideSettingsPanel());
        document.getElementById('saveSettings').addEventListener('change', (e) => {
            this.settings.saveSettings = e.target.checked;
            this.saveState();
        });
        document.getElementById('includeEmptyFields').addEventListener('change', (e) => {
            this.settings.includeEmptyFields = e.target.checked;
            this.updateFileSizePreview();
            this.saveState();
        });
        document.getElementById('prettifyJson').addEventListener('change', (e) => {
            this.settings.prettifyJson = e.target.checked;
            this.updateFileSizePreview();
            this.saveState();
        });
        document.getElementById('includeStats').addEventListener('change', (e) => {
            this.settings.includeStats = e.target.checked;
            this.updateFileSizePreview();
            this.saveState();
        });
        document.getElementById('customFilename').addEventListener('input', (e) => {
            this.settings.filename = e.target.value;
            this.saveState();
        });
        document.getElementById('arrayName').addEventListener('input', (e) => {
            this.settings.arrayName = e.target.value;
            this.updateFileSizePreview();
            this.saveState();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Tooltip functionality
        this.initializeTooltips();
    }

    initializeTooltips() {
        const tooltip = document.getElementById('tooltip');
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('field-info-icon')) {
                const fieldName = e.target.dataset.field;
                const description = this.fieldDescriptions[fieldName] || 'No description available';
                
                tooltip.textContent = description;
                tooltip.classList.add('visible');
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + rect.width + 10 + 'px';
                tooltip.style.top = rect.top - 10 + 'px';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('field-info-icon')) {
                tooltip.classList.remove('visible');
            }
        });
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
        let hasRestorableSettings = false;
        
        if (data.emoji_data_pasta_settings) {
            const savedSettings = data.emoji_data_pasta_settings;
            
            // Restore settings if they were saved
            if (savedSettings.fieldSelections && savedSettings.settings && savedSettings.settings.saveSettings) {
                hasRestorableSettings = true;
                
                // Restore export settings
                this.settings = { ...this.settings, ...savedSettings.settings };
                
                // Store the saved field selections and expanded state for later restoration
                this.savedFieldSelections = new Set(savedSettings.fieldSelections);
                this.savedExpandedFields = new Set(savedSettings.expandedFields || []);
                this.savedFieldSchema = savedSettings.originalFieldSchema || {};
            }
            
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
        this.filteredEmojis = [...this.originalData];
        
        // Restore navigation state from localStorage if available and no file-specific settings
        if (!hasRestorableSettings && this.persistedSelectedFields) {
            this.currentEmojiIndex = Math.min(this.currentEmojiIndex, this.originalData.length - 1);
            this.currentVariant = this.currentVariant || 'default';
        } else {
            this.currentEmojiIndex = 0;
            this.currentVariant = 'default';
        }
        
        // Restore field selections priority: file settings > localStorage > default
        if (hasRestorableSettings && this.savedFieldSelections) {
            // File-specific settings take priority
            this.selectedFields = new Set();
            this.savedFieldSelections.forEach(field => {
                if (this.fieldSchema[field]) {
                    this.selectedFields.add(field);
                }
            });
            
            this.expandedFields = new Set();
            this.savedExpandedFields.forEach(field => {
                if (this.fieldSchema[field]) {
                    this.expandedFields.add(field);
                }
            });
            
            this.showMessage(`Loaded data with restored file settings: ${this.selectedFields.size} fields selected`, 'info');
        } else if (this.persistedSelectedFields && this.persistedSelectedFields.length > 0) {
            // Use localStorage state if available
            this.selectedFields = new Set();
            this.persistedSelectedFields.forEach(field => {
                if (this.fieldSchema[field]) {
                    this.selectedFields.add(field);
                }
            });
            
            this.expandedFields = new Set();
            this.persistedExpandedFields.forEach(field => {
                if (this.fieldSchema[field]) {
                    this.expandedFields.add(field);
                }
            });
            
            this.showMessage(`Loaded data with restored session state: ${this.selectedFields.size} fields selected`, 'info');
        } else {
            // Default: select all fields for new data
            this.selectedFields = new Set(Object.keys(this.fieldSchema));
        }
        
        this.updateDisplay();
        this.saveState(); // Save state after loading data
    }

    analyzeFieldStructure() {
        this.fieldSchema = {};
        
        if (this.originalData.length === 0) return;

        // Analyze ALL fields across ALL emojis to get comprehensive field list
        this.originalData.forEach(emoji => {
            this.analyzeEmojiFields(emoji);
        });

        // Update complete preset with all available fields
        this.presets.complete.fields = Object.keys(this.fieldSchema).sort();

        // Initially select all fields
        this.selectedFields = new Set(Object.keys(this.fieldSchema));
        
        // Update preset dropdown after analyzing fields
        setTimeout(() => this.updatePresetDropdown(), 0);
    }

    analyzeEmojiFields(emoji) {
        // Analyze main emoji fields
        Object.keys(emoji).forEach(field => {
            if (field !== 'skin_variations') {
                this.recordField(field, emoji[field]);
            }
        });

        // For skin_variations, analyze the structure but treat variant fields as unified
        if (emoji.skin_variations && typeof emoji.skin_variations === 'object') {
            this.recordField('skin_variations', emoji.skin_variations);
            
            // Analyze what fields exist within skin variations
            Object.values(emoji.skin_variations).forEach(variant => {
                if (variant && typeof variant === 'object') {
                    Object.keys(variant).forEach(variantField => {
                        // Record this as a sub-field of skin_variations, but don't duplicate main fields
                        const fullFieldName = `skin_variations.${variantField}`;
                        this.recordField(fullFieldName, variant[variantField], true);
                    });
                }
            });
        }
    }

    recordField(fieldName, value, isSubField = false) {
        if (!this.fieldSchema[fieldName]) {
            this.fieldSchema[fieldName] = {
                type: this.getFieldType(value),
                usage: 0,
                examples: [],
                hasNullValues: false,
                hasEmptyValues: false,
                isSubField: isSubField,
                parentField: isSubField ? fieldName.substring(0, fieldName.lastIndexOf('.')) : null
            };
        }
        
        this.fieldSchema[fieldName].usage++;
        
        if (value === null) {
            this.fieldSchema[fieldName].hasNullValues = true;
        } else if (value === '') {
            this.fieldSchema[fieldName].hasEmptyValues = true;
        } else if (this.fieldSchema[fieldName].examples.length < 3 && value !== null && value !== '') {
            this.fieldSchema[fieldName].examples.push(value);
        }
    }

    getFieldType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    updateDisplay() {
        this.updateCounters();
        this.updateEmojiDisplay();
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

    updateEmojiDisplay() {
        const emojiIcon = document.getElementById('emojiIcon');
        const emojiName = document.getElementById('emojiDisplayName');
        const emojiIndex = document.getElementById('emojiIndex');
        const variantInfo = document.getElementById('variantInfo');
        const variantSelect = document.getElementById('variantSelect');
        
        if (this.originalData.length === 0) {
            emojiIcon.textContent = '🤔';
            emojiName.textContent = 'Load emoji data';
            emojiIndex.textContent = '0 / 0';
            variantInfo.style.display = 'none';
            return;
        }

        const currentEmoji = this.originalData[this.currentEmojiIndex];
        
        // Check if this emoji has variants
        const availableVariants = this.getAvailableVariants(currentEmoji);
        
        if (availableVariants.length > 1) {
            variantInfo.style.display = 'flex';
            
            // Update variant dropdown
            variantSelect.innerHTML = '';
            availableVariants.forEach(variant => {
                const option = document.createElement('option');
                option.value = variant;
                
                if (variant === 'default') {
                    option.textContent = 'Default';
                } else {
                    const variantNames = {
                        '1F3FB': 'Light Skin',
                        '1F3FC': 'Medium-Light Skin',
                        '1F3FD': 'Medium Skin',
                        '1F3FE': 'Medium-Dark Skin',
                        '1F3FF': 'Dark Skin'
                    };
                    option.textContent = variantNames[variant] || `Variant ${variant}`;
                }
                
                if (variant === this.currentVariant) {
                    option.selected = true;
                }
                
                variantSelect.appendChild(option);
            });
        } else {
            variantInfo.style.display = 'none';
            this.currentVariant = 'default';
        }
        
        // Get the current variant data
        const variantData = this.getCurrentVariantData(currentEmoji);
        
        // Try to show the actual emoji character
        let emojiChar = '📝'; // fallback
        if (variantData.unified) {
            try {
                // Convert unified format to emoji character
                const codePoints = variantData.unified.split('-').map(hex => parseInt(hex, 16));
                emojiChar = String.fromCodePoint(...codePoints);
            } catch (e) {
                emojiChar = '📝';
            }
        }
        
        emojiIcon.textContent = emojiChar;
        emojiName.textContent = currentEmoji.name || 'Unknown Emoji';
        emojiIndex.textContent = `${this.currentEmojiIndex + 1} / ${this.originalData.length}`;
    }

    getCurrentVariantData(emoji) {
        if (this.currentVariant === 'default') {
            return emoji;
        }
        
        if (emoji.skin_variations && emoji.skin_variations[this.currentVariant]) {
            return {
                ...emoji,
                ...emoji.skin_variations[this.currentVariant]
            };
        }
        
        return emoji;
    }

    getAvailableVariants(emoji) {
        const variants = ['default'];
        if (emoji.skin_variations) {
            variants.push(...Object.keys(emoji.skin_variations));
        }
        return variants;
    }

    selectEmojiFromBrowser(emojiIndex) {
        this.currentEmojiIndex = emojiIndex;
        this.currentVariant = 'default';
        this.hideEmojiBrowser();
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.showMessage(`Selected: ${this.originalData[emojiIndex].name}`, 'success');
        this.saveState();
    }

    prevEmoji() {
        if (this.originalData.length === 0) return;
        
        this.currentEmojiIndex = this.currentEmojiIndex > 0 
            ? this.currentEmojiIndex - 1 
            : this.originalData.length - 1;
        
        this.currentVariant = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.saveState();
    }

    nextEmoji() {
        if (this.originalData.length === 0) return;
        
        this.currentEmojiIndex = this.currentEmojiIndex < this.originalData.length - 1 
            ? this.currentEmojiIndex + 1 
            : 0;
        
        this.currentVariant = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.saveState();
    }

    randomEmoji() {
        if (this.originalData.length === 0) return;
        
        this.currentEmojiIndex = Math.floor(Math.random() * this.originalData.length);
        this.currentVariant = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.saveState();
    }

    renderOriginalStructure() {
        const container = document.getElementById('originalStructure');
        
        if (this.originalData.length === 0) {
            container.innerHTML = '<div class="loading">Load a JSON file to see the emoji structure</div>';
            return;
        }

        // Show the current selected emoji with current variant
        const currentEmoji = this.originalData[this.currentEmojiIndex];
        const variantData = this.getCurrentVariantData(currentEmoji);
        const jsonString = JSON.stringify(variantData, null, 2);
        const highlightedJson = this.highlightJsonWithRemovedFields(jsonString, variantData);
        
        container.innerHTML = `
            <div class="json-code">${highlightedJson}</div>
        `;
    }

    highlightJsonWithRemovedFields(jsonString, emojiData) {
        const allFields = this.getAllFieldsFromObject(emojiData, '');
        const removedFields = allFields.filter(field => !this.selectedFields.has(field));
        
        let highlighted = jsonString
            .replace(/"([^"]+)":/g, (match, fieldName) => {
                const isRemoved = removedFields.some(field => field.endsWith(fieldName) || field === fieldName);
                const className = isRemoved ? 'json-key removed' : 'json-key';
                return `<span class="${className}">"${fieldName}"</span>:`;
            });

        // Highlight values for removed fields
        removedFields.forEach(field => {
            const fieldParts = field.split('.');
            const finalKey = fieldParts[fieldParts.length - 1];
            
            const valueRegex = new RegExp(`("${finalKey}":\\s*)((?:"[^"]*"|\\d+\\.?\\d*|true|false|null|\\[.*?\\]|\\{.*?\\}))`, 'g');
            highlighted = highlighted.replace(valueRegex, (match, prefix, value) => {
                let className = 'removed';
                if (value.startsWith('"')) className = 'json-string removed';
                else if (!isNaN(value)) className = 'json-number removed';
                else if (value === 'true' || value === 'false') className = 'json-boolean removed';
                else if (value === 'null') className = 'json-null removed';
                
                return `${prefix}<span class="${className}">${value}</span>`;
            });
        });

        // Wrap removed field lines
        const lines = highlighted.split('\n');
        const processedLines = lines.map(line => {
            const hasRemovedField = removedFields.some(field => {
                const finalKey = field.split('.').pop();
                return line.includes(`"${finalKey}"`);
            });
            if (hasRemovedField) {
                return `<span class="json-removed-line">${line}</span>`;
            }
            return line;
        });

        return processedLines.join('\n');
    }

    getAllFieldsFromObject(obj, prefix) {
        let fields = [];
        Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            fields.push(fullKey);
            
            // Special handling for skin_variations
            if (key === 'skin_variations' && obj[key] && typeof obj[key] === 'object') {
                // Add sub-fields from skin_variations
                const firstVariant = Object.values(obj[key])[0];
                if (firstVariant && typeof firstVariant === 'object') {
                    Object.keys(firstVariant).forEach(variantField => {
                        fields.push(`skin_variations.${variantField}`);
                    });
                }
            }
        });
        return fields;
    }

    renderFieldManager() {
        const container = document.getElementById('fieldManager');
        
        if (Object.keys(this.fieldSchema).length === 0) {
            container.innerHTML = '<div class="no-data">Load emoji data to manage fields</div>';
            return;
        }

        // Group fields by parent
        const topLevelFields = Object.keys(this.fieldSchema).filter(field => !field.includes('.'));
        const groupedFields = {};
        
        topLevelFields.forEach(field => {
            groupedFields[field] = {
                field: field,
                subFields: Object.keys(this.fieldSchema).filter(f => f.startsWith(field + '.'))
            };
        });

        const totalEmojis = this.originalData.length;

        container.innerHTML = `
            <div class="field-group">
                <div class="field-group-header">
                    <div class="field-group-title">Available Fields</div>
                    <div class="field-group-count">${Object.keys(this.fieldSchema).length} fields</div>
                </div>
                <div class="field-list">
                    ${topLevelFields.map(field => {
                        const fieldInfo = this.fieldSchema[field];
                        const usagePercent = Math.round((fieldInfo.usage / totalEmojis) * 100);
                        const isSelected = this.selectedFields.has(field);
                        const hasSubFields = groupedFields[field].subFields.length > 0;
                        const isExpanded = this.expandedFields.has(field);
                        
                        let html = `
                            <div class="field-item">
                                <input type="checkbox" 
                                       class="field-checkbox" 
                                       id="field-${field}"
                                       ${isSelected ? 'checked' : ''}
                                       onchange="emojiPasta.toggleField('${field}')">
                                ${hasSubFields ? `<div class="field-expand-icon ${isExpanded ? 'expanded' : ''}" onclick="emojiPasta.toggleFieldExpansion('${field}')">${isExpanded ? '−' : '+'}</div>` : ''}
                                <div class="field-name">${field}</div>
                                <div class="field-info-icon" data-field="${field}">i</div>
                                <div class="field-type">${fieldInfo.type}</div>
                                <div class="field-usage">${usagePercent}%</div>
                            </div>
                        `;

                        // Add sub-fields if expanded
                        if (hasSubFields && isExpanded) {
                            groupedFields[field].subFields.forEach(subField => {
                                const subFieldInfo = this.fieldSchema[subField];
                                const subUsagePercent = Math.round((subFieldInfo.usage / totalEmojis) * 100);
                                const subIsSelected = this.selectedFields.has(subField);
                                const subFieldName = subField.split('.').pop();
                                
                                html += `
                                    <div class="field-item sub-field">
                                        <input type="checkbox" 
                                               class="field-checkbox" 
                                               id="field-${subField}"
                                               ${subIsSelected ? 'checked' : ''}
                                               onchange="emojiPasta.toggleField('${subField}')">
                                        <div class="field-name">${subFieldName}</div>
                                        <div class="field-info-icon" data-field="${subField}">i</div>
                                        <div class="field-type">${subFieldInfo.type}</div>
                                        <div class="field-usage">${subUsagePercent}%</div>
                                    </div>
                                `;
                            });
                        }

                        return html;
                    }).join('')}
                </div>
            </div>
        `;
    }

    toggleFieldExpansion(fieldName) {
        if (this.expandedFields.has(fieldName)) {
            this.expandedFields.delete(fieldName);
        } else {
            this.expandedFields.add(fieldName);
        }
        this.renderFieldManager();
        this.saveState();
    }

    renderOutputPreview() {
        const container = document.getElementById('outputStructure');
        
        if (this.originalData.length === 0) {
            container.innerHTML = '<div class="loading">Make field changes to see output preview</div>';
            return;
        }

        // Create a sample output based on selected fields from current emoji
        const currentEmoji = this.originalData[this.currentEmojiIndex];
        const variantData = this.getCurrentVariantData(currentEmoji);
        const sampleOutput = this.createFilteredEmoji(variantData);
        const jsonString = JSON.stringify(sampleOutput, null, 2);
        const highlightedJson = this.highlightJson(jsonString);
        
        container.innerHTML = `
            <div class="json-code">${highlightedJson}</div>
        `;
    }

    showEmojiBrowser() {
        document.getElementById('emojiBrowserModal').classList.add('active');
        this.emojiDisplayLimit = 100; // Reset display limit
        
        // Initialize with all emojis (clear any previous search)
        this.filteredEmojis = [...this.originalData];
        
        // Clear search input
        document.getElementById('emojiSearch').value = '';
        
        // Prepare filtered data for all emojis
        this.prepareFilteredEmojiData();
        this.renderEmojiTable();
        
        // Add scroll listener for infinite loading
        const tableContainer = document.getElementById('emojiTableContainer');
        tableContainer.addEventListener('scroll', this.handleEmojiTableScroll);
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.closeEmojiBrowserOnClickOutside);
        }, 100);
    }

    prepareFilteredEmojiData() {
        // Create filtered data for all emojis based on current field selections
        this.browserFilteredData = this.originalData.map(emoji => {
            return this.createFilteredEmoji(emoji);
        });
        
        // Don't reset filteredEmojis here - it may contain search results
        // this.filteredEmojis should be managed by search and showEmojiBrowser
    }

    hideEmojiBrowser() {
        document.getElementById('emojiBrowserModal').classList.remove('active');
        document.removeEventListener('click', this.closeEmojiBrowserOnClickOutside);
        
        // Remove scroll listener
        const tableContainer = document.getElementById('emojiTableContainer');
        tableContainer.removeEventListener('scroll', this.handleEmojiTableScroll);
    }

    handleEmojiTableScroll = (e) => {
        const container = e.target;
        const scrollPercentage = (container.scrollTop + container.clientHeight) / container.scrollHeight;
        
        // Load more when 80% scrolled
        if (scrollPercentage > 0.8 && this.emojiDisplayLimit < this.filteredEmojis.length) {
            this.emojiDisplayLimit = Math.min(
                this.emojiDisplayLimit + this.emojiDisplayIncrement,
                this.filteredEmojis.length
            );
            this.renderEmojiTable();
        }
    }

    closeEmojiBrowserOnClickOutside = (e) => {
        const modal = document.getElementById('emojiBrowserModal');
        const content = modal.querySelector('.emoji-browser-content');
        if (modal.classList.contains('active') && !content.contains(e.target)) {
            this.hideEmojiBrowser();
        }
    }

    searchEmojis(query) {
        if (!query.trim()) {
            this.filteredEmojis = [...this.originalData];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredEmojis = this.originalData.filter(emoji => 
                (emoji.name && emoji.name.toLowerCase().includes(searchTerm)) ||
                (emoji.short_name && emoji.short_name.toLowerCase().includes(searchTerm)) ||
                (emoji.category && emoji.category.toLowerCase().includes(searchTerm)) ||
                (emoji.subcategory && emoji.subcategory.toLowerCase().includes(searchTerm)) ||
                (emoji.unified && emoji.unified.toLowerCase().includes(searchTerm)) ||
                (emoji.short_names && emoji.short_names.some(name => name.toLowerCase().includes(searchTerm)))
            );
        }
        
        // Reset display limit when searching
        this.emojiDisplayLimit = 100;
        
        // Refresh filtered data for the browser (but don't reset search results)
        this.prepareFilteredEmojiData();
        this.renderEmojiTable();
    }

    renderEmojiTable() {
        const thead = document.getElementById('emojiTableHead');
        const tbody = document.getElementById('emojiTableBody');
        const resultsSpan = document.getElementById('searchResults');
        
        if (this.filteredEmojis.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No emojis found</td></tr>';
            resultsSpan.textContent = '0 results';
            return;
        }

        // Create dynamic table headers based on selected fields
        const selectedFieldsArray = Array.from(this.selectedFields).filter(field => {
            // Exclude complex nested fields from table display
            return !field.includes('skin_variations.') && field !== 'skin_variations';
        });
        
        // Always show emoji first, then other selected fields
        const displayFields = ['emoji', ...selectedFieldsArray.filter(field => field !== 'unified')];
        
        // Build table header
        thead.innerHTML = `
            <tr>
                ${displayFields.map(field => {
                    const fieldName = field === 'emoji' ? 'Emoji' : 
                                     field === 'short_names' ? 'Short Names' :
                                     field === 'sort_order' ? 'Sort Order' :
                                     field === 'added_in' ? 'Added In' :
                                     field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `<th>${fieldName}</th>`;
                }).join('')}
            </tr>
        `;

        // Display only up to the current limit
        const displayEmojis = this.filteredEmojis.slice(0, this.emojiDisplayLimit);
        
        tbody.innerHTML = displayEmojis.map((originalEmoji, index) => {
            // Get actual emoji index in original data
            const originalIndex = this.originalData.indexOf(originalEmoji);
            const filteredEmoji = this.browserFilteredData[originalIndex];
            
            // Try to render actual emoji
            let emojiChar = '📝';
            if (originalEmoji.unified) {
                try {
                    const codePoints = originalEmoji.unified.split('-').map(hex => parseInt(hex, 16));
                    emojiChar = String.fromCodePoint(...codePoints);
                } catch (e) {
                    emojiChar = '📝';
                }
            }
            
            // Highlight current emoji
            const isCurrentEmoji = originalIndex === this.currentEmojiIndex;
            const rowClass = isCurrentEmoji ? 'current-emoji' : '';
            
            // Build table cells
            const cells = displayFields.map(field => {
                if (field === 'emoji') {
                    return `<td style="font-size: 1.2em; text-align: center;">${emojiChar}</td>`;
                }
                
                const value = filteredEmoji[field];
                if (value === undefined || value === null) {
                    return '<td style="color: var(--text-tertiary); font-style: italic;">—</td>';
                }
                
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return '<td style="color: var(--text-tertiary); font-style: italic;">[]</td>';
                    }
                    const displayValue = value.length > 3 ? 
                        `[${value.slice(0, 3).join(', ')}... +${value.length - 3}]` :
                        `[${value.join(', ')}]`;
                    return `<td title="${value.join(', ')}">${displayValue}</td>`;
                }
                
                if (typeof value === 'object') {
                    const keys = Object.keys(value);
                    const displayValue = keys.length > 2 ? 
                        `{${keys.slice(0, 2).join(', ')}... +${keys.length - 2}}` :
                        `{${keys.join(', ')}}`;
                    return `<td title="${JSON.stringify(value)}">${displayValue}</td>`;
                }
                
                if (typeof value === 'string' && value.length > 30) {
                    return `<td title="${value}">${value.substring(0, 30)}...</td>`;
                }
                
                return `<td>${value}</td>`;
            });
            
            return `
                <tr class="${rowClass}" onclick="emojiPasta.selectEmojiFromBrowser(${originalIndex})" title="Click to select this emoji">
                    ${cells.join('')}
                </tr>
            `;
        }).join('');

        const totalResults = this.filteredEmojis.length;
        const displayCount = displayEmojis.length;
        
        if (displayCount < totalResults) {
            resultsSpan.textContent = `Showing ${displayCount} of ${totalResults} results (scroll for more)`;
        } else {
            resultsSpan.textContent = `${totalResults} results`;
        }
    }

    applyPreset(presetKey) {
        if (!presetKey) return;

        if (presetKey === 'custom') {
            // Apply saved custom preset
            const availableCustomFields = this.customPreset.filter(field => this.fieldSchema[field]);
            this.selectedFields = new Set(availableCustomFields);
            this.currentPreset = 'custom';
            
            this.renderFieldManager();
            this.renderOriginalStructure();
            this.renderOutputPreview();
            
            this.showMessage(`Applied custom preset: ${this.selectedFields.size} fields selected`, 'success');
            this.refreshBrowserIfOpen(); // Refresh browser if open
            this.saveState();
            return;
        }

        if (!this.presets[presetKey]) return;

        const preset = this.presets[presetKey];
        this.currentPreset = presetKey;
        
        if (presetKey === 'complete') {
            this.selectedFields = new Set(Object.keys(this.fieldSchema));
        } else {
            // Only select fields that exist in the current data
            const availableFields = preset.fields.filter(field => this.fieldSchema[field]);
            this.selectedFields = new Set(availableFields);
        }
        
        this.renderFieldManager();
        this.renderOriginalStructure(); // Update to show red highlighting
        this.renderOutputPreview();
        
        this.showMessage(`Applied "${preset.name}" preset: ${preset.description}`, 'success');
        this.refreshBrowserIfOpen(); // Refresh browser if open
        this.saveState();
    }

    createFilteredEmoji(originalEmoji) {
        const filtered = {};
        
        // Process each field in the original emoji
        Object.keys(originalEmoji).forEach(field => {
            if (field === 'skin_variations') {
                // Handle skin_variations specially
                if (this.selectedFields.has('skin_variations') && originalEmoji.skin_variations) {
                    const filteredVariations = {};
                    
                    Object.keys(originalEmoji.skin_variations).forEach(variantKey => {
                        const variant = originalEmoji.skin_variations[variantKey];
                        const filteredVariant = {};
                        
                        // For each field in the variant, check if the sub-field is selected
                        Object.keys(variant).forEach(variantField => {
                            const subFieldName = `skin_variations.${variantField}`;
                            if (this.selectedFields.has(subFieldName)) {
                                const value = variant[variantField];
                                if (this.settings.includeEmptyFields || 
                                    (value !== null && value !== '' && value !== undefined)) {
                                    filteredVariant[variantField] = value;
                                }
                            }
                        });
                        
                        // Only include this variant if it has any fields
                        if (Object.keys(filteredVariant).length > 0) {
                            filteredVariations[variantKey] = filteredVariant;
                        }
                    });
                    
                    // Only include skin_variations if there are any variants with content
                    if (Object.keys(filteredVariations).length > 0) {
                        filtered.skin_variations = filteredVariations;
                    }
                }
            } else {
                // Handle regular fields
                if (this.selectedFields.has(field)) {
                    const value = originalEmoji[field];
                    if (this.settings.includeEmptyFields || 
                        (value !== null && value !== '' && value !== undefined)) {
                        filtered[field] = value;
                    }
                }
            }
        });
        
        return filtered;
    }

    toggleField(fieldName) {
        if (this.selectedFields.has(fieldName)) {
            this.selectedFields.delete(fieldName);
            
            // If removing a parent field, also remove its sub-fields
            const subFields = Object.keys(this.fieldSchema).filter(f => f.startsWith(fieldName + '.'));
            subFields.forEach(subField => this.selectedFields.delete(subField));
        } else {
            this.selectedFields.add(fieldName);
            
            // When adding a sub-field, ensure parent is also selected
            if (fieldName.includes('.')) {
                const parentField = fieldName.substring(0, fieldName.lastIndexOf('.'));
                this.selectedFields.add(parentField);
            }
        }
        
        this.renderFieldManager();
        this.renderOriginalStructure(); // Update to show red highlighting
        this.renderOutputPreview();
        this.updatePresetDropdown(); // Update preset dropdown based on current selection
        this.refreshBrowserIfOpen(); // Refresh browser if open
        this.saveState();
    }

    selectAllFields() {
        this.selectedFields = new Set(Object.keys(this.fieldSchema));
        this.renderFieldManager();
        this.renderOriginalStructure(); // Update to show red highlighting
        this.renderOutputPreview();
        this.updatePresetDropdown(); // Update preset dropdown
        this.refreshBrowserIfOpen(); // Refresh browser if open
        this.saveState();
    }

    selectNoFields() {
        this.selectedFields = new Set();
        this.renderFieldManager();
        this.renderOriginalStructure(); // Update to show red highlighting
        this.renderOutputPreview();
        this.updatePresetDropdown(); // Update preset dropdown
        this.refreshBrowserIfOpen(); // Refresh browser if open
        this.saveState();
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
        this.renderOriginalStructure(); // Update to show red highlighting
        this.renderOutputPreview();
    }

    showSettingsPanel() {
        if (this.originalData.length === 0) {
            this.showMessage('No data to save. Please load a file first.', 'warning');
            return;
        }

        document.getElementById('settingsPanel').classList.add('active');
        
        // Update settings UI to reflect current values
        document.getElementById('saveSettings').checked = this.settings.saveSettings;
        document.getElementById('includeEmptyFields').checked = this.settings.includeEmptyFields;
        document.getElementById('prettifyJson').checked = this.settings.prettifyJson;
        document.getElementById('includeStats').checked = this.settings.includeStats;
        document.getElementById('customFilename').value = this.settings.filename;
        document.getElementById('arrayName').value = this.settings.arrayName;
        
        // Calculate and show file size comparison
        this.updateFileSizePreview();
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.closeSettingsOnClickOutside);
        }, 100);
    }

    hideSettingsPanel() {
        document.getElementById('settingsPanel').classList.remove('active');
        document.removeEventListener('click', this.closeSettingsOnClickOutside);
    }

    closeSettingsOnClickOutside = (e) => {
        const panel = document.getElementById('settingsPanel');
        if (!panel.contains(e.target)) {
            this.hideSettingsPanel();
        }
    }

    downloadFile() {
        this.hideSettingsPanel();
        this.processAndSaveData();
    }

    async processAndSaveData() {
        if (this.originalData.length === 0) {
            this.showMessage('No data to save', 'warning');
            return;
        }

        // Show progress modal for large datasets
        if (this.originalData.length > 1000) {
            this.showProgressModal();
        }

        try {
            // Prepare the data
            const { finalData, processedData } = this.prepareExportData();

            // Update progress for large datasets
            if (this.originalData.length > 1000) {
                this.updateProgress(50, Math.floor(this.originalData.length / 2), this.originalData.length);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Convert to JSON
            const jsonString = this.settings.prettifyJson 
                ? JSON.stringify(finalData, null, 2)
                : JSON.stringify(finalData);

            // Update progress
            if (this.originalData.length > 1000) {
                this.updateProgress(100, this.originalData.length, this.originalData.length);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

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
            const savedSize = this.formatFileSize(blob.size);
            this.showMessage(`Downloaded ${processedData.length} emojis with ${this.selectedFields.size} fields (${savedSize}, removed ${removedCount} fields)`, 'success');

        } catch (error) {
            this.showMessage('Error creating file: ' + error.message, 'error');
        } finally {
            this.hideProgressModal();
        }
    }

    prepareExportData() {
        const processedData = [];
        
        // Process emojis
        this.originalData.forEach(emoji => {
            const filtered = this.createFilteredEmoji(emoji);
            if (Object.keys(filtered).length > 0) {
                processedData.push(filtered);
            }
        });

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
        if (this.settings.includeStats || this.settings.saveSettings) {
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

            // Add settings preservation data if enabled
            if (this.settings.saveSettings) {
                stats.fieldSelections = Array.from(this.selectedFields);
                stats.expandedFields = Array.from(this.expandedFields);
                stats.originalFieldSchema = this.fieldSchema;
            }

            if (this.settings.arrayName && this.settings.arrayName.trim()) {
                finalData.emoji_data_pasta_settings = stats;
            } else {
                finalData = {
                    data: processedData,
                    emoji_data_pasta_settings: stats
                };
            }
        }

        return { finalData, processedData };
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

        // Escape to close modals
        if (e.key === 'Escape') {
            this.hideSettingsPanel();
            this.hideEmojiBrowser();
        }

        // Ctrl/Cmd + A to select all fields
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.target.closest('.field-manager')) {
            e.preventDefault();
            this.selectAllFields();
        }

        // Arrow keys for emoji navigation
        if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            this.prevEmoji();
        }
        if (e.key === 'ArrowRight' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            this.nextEmoji();
        }

        // R to reset variant
        if (e.key === 'r' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            this.resetVariant();
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

    selectVariant(variant) {
        this.currentVariant = variant;
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.saveState();
    }

    resetVariant() {
        this.currentVariant = 'default';
        document.getElementById('variantSelect').value = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.saveState();
    }

    updateFileSizePreview() {
        // Calculate original file size
        const originalJson = JSON.stringify(this.originalData);
        const originalSize = new Blob([originalJson]).size;
        
        // Calculate new file size with current settings
        const { finalData } = this.prepareExportData();
        const newJson = this.settings.prettifyJson 
            ? JSON.stringify(finalData, null, 2)
            : JSON.stringify(finalData);
        const newSize = new Blob([newJson]).size;
        
        // Calculate savings
        const savings = originalSize - newSize;
        const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
        
        // Update UI
        document.getElementById('originalSize').textContent = this.formatFileSize(originalSize);
        document.getElementById('newSize').textContent = this.formatFileSize(newSize);
        document.getElementById('spaceSaved').textContent = `${this.formatFileSize(savings)} (${savingsPercent}%)`;
        document.getElementById('fileSizeComparison').style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Theme management
    applyTheme() {
        const root = document.documentElement;
        const themeIcon = document.querySelector('.theme-icon');
        
        if (this.theme === 'light') {
            root.classList.add('light');
            themeIcon.textContent = '☀️';
        } else {
            root.classList.remove('light');
            themeIcon.textContent = '🌙';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        localStorage.setItem('emoji-pasta-theme', this.theme);
    }

    resetPresets() {
        this.selectedFields = new Set();
        this.currentPreset = '';
        document.getElementById('fieldPresets').value = '';
        this.renderFieldManager();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.showMessage('Reset to default state - no fields selected', 'info');
    }

    loadCustomPreset() {
        try {
            const saved = localStorage.getItem('emoji-pasta-custom-preset');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load custom preset from localStorage:', error);
            return [];
        }
    }

    saveCustomPreset() {
        try {
            const customFields = Array.from(this.selectedFields);
            localStorage.setItem('emoji-pasta-custom-preset', JSON.stringify(customFields));
            this.customPreset = customFields;
        } catch (error) {
            console.warn('Failed to save custom preset to localStorage:', error);
        }
    }

    updatePresetDropdown() {
        const dropdown = document.getElementById('fieldPresets');
        
        // Check if current selection matches any preset
        const currentFields = Array.from(this.selectedFields).sort();
        
        // Check built-in presets
        for (const [key, preset] of Object.entries(this.presets)) {
            if (key === 'complete') {
                const allFields = Object.keys(this.fieldSchema).sort();
                if (JSON.stringify(currentFields) === JSON.stringify(allFields)) {
                    this.currentPreset = key;
                    dropdown.value = key;
                    return;
                }
            } else {
                const presetFields = preset.fields.filter(field => this.fieldSchema[field]).sort();
                if (JSON.stringify(currentFields) === JSON.stringify(presetFields)) {
                    this.currentPreset = key;
                    dropdown.value = key;
                    return;
                }
            }
        }
        
        // Check if it matches saved custom preset
        const customFields = this.customPreset.filter(field => this.fieldSchema[field]).sort();
        if (JSON.stringify(currentFields) === JSON.stringify(customFields)) {
            this.currentPreset = 'custom';
            dropdown.value = 'custom';
            return;
        }
        
        // If no match, it's a new custom selection
        if (this.selectedFields.size > 0) {
            this.currentPreset = 'custom';
            dropdown.value = 'custom';
            this.saveCustomPreset();
        } else {
            this.currentPreset = '';
            dropdown.value = '';
        }
    }

    loadPersistedState() {
        try {
            const savedState = localStorage.getItem('emoji-pasta-state');
            if (!savedState) return;
            
            const state = JSON.parse(savedState);
            
            // Restore basic app state
            this.currentEmojiIndex = state.currentEmojiIndex || 0;
            this.currentVariant = state.currentVariant || 'default';
            this.currentPreset = state.currentPreset || '';
            
            // Restore settings
            if (state.settings) {
                this.settings = { ...this.settings, ...state.settings };
            }
            
            // Store field selections and schema for restoration after data loads
            this.persistedSelectedFields = state.selectedFields || [];
            this.persistedExpandedFields = state.expandedFields || [];
            this.persistedFieldSchema = state.fieldSchema || {};
            
            console.log('Loaded persisted state');
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    saveState() {
        try {
            const state = {
                currentEmojiIndex: this.currentEmojiIndex,
                currentVariant: this.currentVariant,
                currentPreset: this.currentPreset,
                selectedFields: Array.from(this.selectedFields),
                expandedFields: Array.from(this.expandedFields),
                fieldSchema: this.fieldSchema,
                settings: this.settings,
                timestamp: Date.now()
            };
            
            localStorage.setItem('emoji-pasta-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save state:', error);
        }
    }

    resetApp() {
        if (confirm('Are you sure you want to reset all data and clear saved state? This action cannot be undone.')) {
            // Clear all localStorage
            localStorage.removeItem('emoji-pasta-state');
            localStorage.removeItem('emoji-pasta-custom-preset');
            localStorage.removeItem('emoji-pasta-theme');
            
            // Reset all application state
            this.originalData = [];
            this.fieldSchema = {};
            this.selectedFields = new Set();
            this.filteredEmojis = [];
            this.currentEmojiIndex = 0;
            this.currentVariant = 'default';
            this.expandedFields = new Set();
            this.currentPreset = '';
            this.customPreset = [];
            
            // Reset settings to defaults
            this.settings = {
                includeEmptyFields: true,
                prettifyJson: true,
                includeStats: true,
                saveSettings: true,
                filename: 'emoji-edited.json',
                arrayName: ''
            };
            
            // Reset theme to default (dark)
            this.theme = 'dark';
            this.applyTheme();
            
            // Reset UI
            this.updateDisplay();
            
            // Reset preset dropdown
            document.getElementById('fieldPresets').value = '';
            
            this.showMessage('Application reset successfully - all data and settings cleared', 'success');
        }
    }

    refreshBrowserIfOpen() {
        // If the emoji browser is open, refresh the data to show updated field selections
        const modal = document.getElementById('emojiBrowserModal');
        if (modal.classList.contains('active')) {
            this.prepareFilteredEmojiData();
            this.renderEmojiTable();
        }
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