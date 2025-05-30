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
            // Sub-field descriptions
            'skin_variations.unified': 'Unicode for this skin tone variant',
            'skin_variations.image': 'Image filename for this skin tone variant',
            'skin_variations.sheet_x': 'X coordinate for this skin tone variant',
            'skin_variations.sheet_y': 'Y coordinate for this skin tone variant',
            'skin_variations.added_in': 'Unicode version when this variant was added',
            'skin_variations.has_img_apple': 'Whether Apple has image for this variant',
            'skin_variations.has_img_google': 'Whether Google has image for this variant',
            'skin_variations.has_img_twitter': 'Whether Twitter has image for this variant',
            'skin_variations.has_img_facebook': 'Whether Facebook has image for this variant'
        };
    }

    getFieldPresets() {
        return {
            'minimal': {
                name: 'Minimal',
                description: 'Essential fields for basic emoji data',
                fields: ['unified', 'category', 'name', 'short_name', 'short_names', 'skin_variations', 'sort_order', 'subcategory']
            },
            'essential': {
                name: 'Essential',
                description: 'Core fields including image and platform support',
                fields: ['unified', 'category', 'name', 'short_name', 'short_names', 'skin_variations', 'sort_order', 'subcategory', 'has_img_apple', 'has_img_google', 'has_img_twitter', 'has_img_facebook', 'image', 'sheet_x', 'sheet_y']
            },
            'complete': {
                name: 'Complete',
                description: 'All available fields',
                fields: [] // Will be populated with all available fields
            }
        };
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
        document.getElementById('fieldPresets').addEventListener('change', (e) => this.applyPreset(e.target.value));

        // Emoji navigation
        document.getElementById('emojiIcon').addEventListener('click', () => this.nextEmoji());
        document.getElementById('prevEmoji').addEventListener('click', () => this.prevEmoji());
        document.getElementById('nextEmoji').addEventListener('click', () => this.nextEmoji());
        document.getElementById('randomEmoji').addEventListener('click', () => this.randomEmoji());
        document.getElementById('cycleVariant').addEventListener('click', () => this.cycleVariant());

        // Emoji browser
        document.getElementById('toggleEmojiTable').addEventListener('click', () => this.showEmojiBrowser());
        document.getElementById('closeEmojiBrowser').addEventListener('click', () => this.hideEmojiBrowser());
        document.getElementById('emojiSearch').addEventListener('input', (e) => this.searchEmojis(e.target.value));

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
        this.filteredEmojis = [...this.originalData];
        this.currentEmojiIndex = 0;
        this.currentVariant = 'default';
        this.updateDisplay();
    }

    analyzeFieldStructure() {
        this.fieldSchema = {};
        
        if (this.originalData.length === 0) return;

        // Analyze ALL fields across ALL emojis to get comprehensive field list
        this.originalData.forEach(emoji => {
            this.analyzeObjectFields(emoji, '');
        });

        // Update complete preset with all available fields
        this.presets.complete.fields = Object.keys(this.fieldSchema).sort();

        // Initially select all fields
        this.selectedFields = new Set(Object.keys(this.fieldSchema));
    }

    analyzeObjectFields(obj, prefix) {
        Object.keys(obj).forEach(field => {
            const fullFieldName = prefix ? `${prefix}.${field}` : field;
            
            if (!this.fieldSchema[fullFieldName]) {
                this.fieldSchema[fullFieldName] = {
                    type: this.getFieldType(obj[field]),
                    usage: 0,
                    examples: [],
                    hasNullValues: false,
                    hasEmptyValues: false,
                    isSubField: !!prefix,
                    parentField: prefix
                };
            }
            
            this.fieldSchema[fullFieldName].usage++;
            
            if (obj[field] === null) {
                this.fieldSchema[fullFieldName].hasNullValues = true;
            } else if (obj[field] === '') {
                this.fieldSchema[fullFieldName].hasEmptyValues = true;
            } else if (this.fieldSchema[fullFieldName].examples.length < 3) {
                this.fieldSchema[fullFieldName].examples.push(obj[field]);
            }

            // Recursively analyze nested objects
            if (obj[field] && typeof obj[field] === 'object' && !Array.isArray(obj[field])) {
                this.analyzeObjectFields(obj[field], fullFieldName);
            }
        });
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
        const variantLabel = document.getElementById('variantLabel');
        
        if (this.originalData.length === 0) {
            emojiIcon.textContent = '🤔';
            emojiName.textContent = 'Load emoji data';
            emojiIndex.textContent = '0 / 0';
            variantLabel.textContent = 'Default';
            return;
        }

        const currentEmoji = this.originalData[this.currentEmojiIndex];
        
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
        
        // Update variant label
        if (this.currentVariant === 'default') {
            variantLabel.textContent = 'Default';
        } else {
            const variantNames = {
                '1F3FB': 'Light Skin',
                '1F3FC': 'Medium-Light Skin',
                '1F3FD': 'Medium Skin',
                '1F3FE': 'Medium-Dark Skin',
                '1F3FF': 'Dark Skin'
            };
            variantLabel.textContent = variantNames[this.currentVariant] || `Variant ${this.currentVariant}`;
        }
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

    cycleVariant() {
        if (this.originalData.length === 0) return;
        
        const currentEmoji = this.originalData[this.currentEmojiIndex];
        const availableVariants = this.getAvailableVariants(currentEmoji);
        
        const currentIndex = availableVariants.indexOf(this.currentVariant);
        const nextIndex = (currentIndex + 1) % availableVariants.length;
        this.currentVariant = availableVariants[nextIndex];
        
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
    }

    selectEmojiFromBrowser(emojiIndex) {
        this.currentEmojiIndex = emojiIndex;
        this.currentVariant = 'default';
        this.hideEmojiBrowser();
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.showMessage(`Selected: ${this.originalData[emojiIndex].name}`, 'success');
    }

    prevEmoji() {
        if (this.originalData.length === 0) return;
        
        this.currentEmojiIndex = this.currentEmojiIndex > 0 
            ? this.currentEmojiIndex - 1 
            : this.originalData.length - 1;
        
        this.currentVariant = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
    }

    nextEmoji() {
        if (this.originalData.length === 0) return;
        
        this.currentEmojiIndex = this.currentEmojiIndex < this.originalData.length - 1 
            ? this.currentEmojiIndex + 1 
            : 0;
        
        this.currentVariant = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
    }

    randomEmoji() {
        if (this.originalData.length === 0) return;
        
        this.currentEmojiIndex = Math.floor(Math.random() * this.originalData.length);
        this.currentVariant = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
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
                return `<div class="json-removed-line">${line}</div>`;
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
            
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                fields = fields.concat(this.getAllFieldsFromObject(obj[key], fullKey));
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
        this.renderEmojiTable();
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.closeEmojiBrowserOnClickOutside);
        }, 100);
    }

    hideEmojiBrowser() {
        document.getElementById('emojiBrowserModal').classList.remove('active');
        document.removeEventListener('click', this.closeEmojiBrowserOnClickOutside);
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
        
        this.renderEmojiTable();
    }

    renderEmojiTable() {
        const tbody = document.getElementById('emojiTableBody');
        const resultsSpan = document.getElementById('searchResults');
        
        if (this.filteredEmojis.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #8892b0;">No emojis found</td></tr>';
            resultsSpan.textContent = '0 results';
            return;
        }

        // Limit to first 500 results for performance
        const displayEmojis = this.filteredEmojis.slice(0, 500);
        
        tbody.innerHTML = displayEmojis.map((emoji, index) => {
            // Get actual emoji index in original data
            const originalIndex = this.originalData.indexOf(emoji);
            
            // Try to render actual emoji
            let emojiChar = '📝';
            if (emoji.unified) {
                try {
                    const codePoints = emoji.unified.split('-').map(hex => parseInt(hex, 16));
                    emojiChar = String.fromCodePoint(...codePoints);
                } catch (e) {
                    emojiChar = '📝';
                }
            }
            
            return `
                <tr onclick="emojiPasta.selectEmojiFromBrowser(${originalIndex})" title="Click to select this emoji">
                    <td>${emojiChar}</td>
                    <td>${emoji.name || 'N/A'}</td>
                    <td>:${emoji.short_name || 'unknown'}:</td>
                    <td>${emoji.category || 'N/A'}</td>
                    <td>${emoji.subcategory || 'N/A'}</td>
                    <td>${emoji.unified || 'N/A'}</td>
                    <td>${emoji.added_in || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        const totalResults = this.filteredEmojis.length;
        const displayCount = Math.min(totalResults, 500);
        resultsSpan.textContent = totalResults > 500 
            ? `${displayCount} of ${totalResults} results (showing first 500)`
            : `${totalResults} results`;
    }

    applyPreset(presetKey) {
        if (!presetKey || !this.presets[presetKey]) return;

        const preset = this.presets[presetKey];
        
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
        
        this.showMessage(`Applied "${preset.name}" preset: ${this.selectedFields.size} fields selected`, 'success');
    }

    createFilteredEmoji(originalEmoji) {
        const filtered = {};
        
        this.selectedFields.forEach(field => {
            if (field.includes('.')) {
                // Handle nested fields
                const parts = field.split('.');
                this.setNestedValue(filtered, parts, this.getNestedValue(originalEmoji, parts));
            } else if (originalEmoji.hasOwnProperty(field)) {
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

    getNestedValue(obj, parts) {
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && current.hasOwnProperty(part)) {
                current = current[part];
            } else {
                return undefined;
            }
        }
        return current;
    }

    setNestedValue(obj, parts, value) {
        if (value === undefined) return;
        
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }
        
        const finalKey = parts[parts.length - 1];
        if (this.settings.includeEmptyFields || 
            (value !== null && value !== '' && value !== undefined)) {
            current[finalKey] = value;
        }
    }

    toggleField(fieldName) {
        if (this.selectedFields.has(fieldName)) {
            this.selectedFields.delete(fieldName);
            
            // If removing a parent field, also remove its sub-fields
            const subFields = Object.keys(this.fieldSchema).filter(f => f.startsWith(fieldName + '.'));
            subFields.forEach(subField => this.selectedFields.delete(subField));
        } else {
            this.selectedFields.add(fieldName);
            
            // If adding a parent field that has sub-fields, add them too
            const subFields = Object.keys(this.fieldSchema).filter(f => f.startsWith(fieldName + '.'));
            subFields.forEach(subField => this.selectedFields.add(subField));
        }
        
        this.renderFieldManager();
        this.renderOriginalStructure(); // Update to show red highlighting
        this.renderOutputPreview();
    }

    selectAllFields() {
        this.selectedFields = new Set(Object.keys(this.fieldSchema));
        this.renderFieldManager();
        this.renderOriginalStructure(); // Update to show red highlighting
        this.renderOutputPreview();
    }

    selectNoFields() {
        this.selectedFields = new Set();
        this.renderFieldManager();
        this.renderOriginalStructure(); // Update to show red highlighting
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
        this.renderOriginalStructure(); // Update to show red highlighting
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
        if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            this.prevEmoji();
        }
        if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            this.nextEmoji();
        }

        // Space to cycle variants
        if (e.key === ' ' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            this.cycleVariant();
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