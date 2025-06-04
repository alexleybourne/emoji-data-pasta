// Emoji Data Pasta - Bulk Field Manager
class EmojiDataPasta {
    constructor() {
        // Initialize all data structures
        this.originalData = [];
        this.fieldSchema = {};
        this.selectedFields = new Set();
        this.filteredEmojis = [];
        this.removedEmojis = new Set();
        this.currentEmojiIndex = 0;
        this.currentVariant = 'default';
        this.expandedFields = new Set();
        this.categoryMappings = new Map();
        this.excludedCategories = new Set();
        this.originalCategories = new Map();
        this.selectedCategories = new Set();
        this.customSearchTerms = new Map();
        this.fieldRenames = new Map(); // Store original->renamed field mappings
        this.currentSearchQuery = ''; // Store current search query for highlighting
        
        // Initialize presets
        this.presets = this.getFieldPresets();
        
        // Initialize field descriptions
        this.fieldDescriptions = this.getFieldDescriptions();
        
        // Settings and preferences
        this.settings = {
            saveSettings: true,
            includeEmptyFields: true,
            prettifyJson: true,
            includeStats: true,
            applyFieldRenames: true,
            filename: 'emoji-edited.json'
        };
        
        // Theme
        this.theme = localStorage.getItem('emoji-pasta-theme') || 'dark';
        
        // Initialize event listeners and load data
        this.initializeEventListeners();
        this.initializeTooltips();
        
        this.loadDefaultData();
        this.loadPersistedState();
        this.applyTheme();
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

        // Removed emojis management
        document.getElementById('addRemovedEmoji').addEventListener('click', () => this.addCurrentEmojiToRemoved());
        document.getElementById('bulkRemoveEmojis').addEventListener('click', () => this.showBulkRemoveModal());
        document.getElementById('clearRemovedEmojis').addEventListener('click', () => this.clearRemovedEmojis());

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
            this.updateFileSizePreview();
        });
        document.getElementById('includeEmptyFields').addEventListener('change', (e) => {
            this.settings.includeEmptyFields = e.target.checked;
            this.updateFileSizePreview();
        });
        document.getElementById('prettifyJson').addEventListener('change', (e) => {
            this.settings.prettifyJson = e.target.checked;
            this.updateFileSizePreview();
        });
        document.getElementById('includeStats').addEventListener('change', (e) => {
            this.settings.includeStats = e.target.checked;
            this.updateFileSizePreview();
        });
        document.getElementById('applyFieldRenames').addEventListener('change', (e) => {
            this.settings.applyFieldRenames = e.target.checked;
            this.updateFileSizePreview();
        });
        document.getElementById('filename').addEventListener('input', (e) => {
            this.settings.filename = e.target.value;
            this.updateFileSizePreview();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Tooltip functionality
        this.initializeTooltips();

        // Bulk remove modal
        document.getElementById('closeBulkRemove').addEventListener('click', () => this.hideBulkRemoveModal());
        document.getElementById('cancelBulkRemove').addEventListener('click', () => this.hideBulkRemoveModal());
        document.getElementById('analyzeEmojis').addEventListener('click', () => this.analyzeInputEmojis());
        document.getElementById('executeBulkRemove').addEventListener('click', () => this.executeBulkRemove());
        document.getElementById('bulkEmojiInput').addEventListener('input', () => this.updateInputStats());

        // Category customization
        document.getElementById('mergeCategoriesBtn').addEventListener('click', () => this.mergeSelectedCategories());
        document.getElementById('deleteSelectedBtn').addEventListener('click', () => this.deleteSelectedCategories());
        document.getElementById('clearSelectionBtn').addEventListener('click', () => this.clearCategorySelection());
        document.getElementById('resetCategories').addEventListener('click', () => this.resetCategoryMappings());

        // Custom search terms
        document.getElementById('addSearchTerm').addEventListener('click', () => this.addCustomSearchTerm());
        document.getElementById('clearCustomTerms').addEventListener('click', () => this.clearCustomTermsForCurrentEmoji());
        document.getElementById('resetAllCustomTerms').addEventListener('click', () => this.resetAllCustomSearchTerms());

        // Tab switching
        document.querySelectorAll('.tool-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Bulk add search terms
        document.getElementById('bulkAddTerms').addEventListener('click', () => this.showBulkAddTermsModal());
        document.getElementById('closeBulkAddTerms').addEventListener('click', () => this.hideBulkAddTermsModal());
        document.getElementById('cancelBulkAddTerms').addEventListener('click', () => this.hideBulkAddTermsModal());
        document.getElementById('analyzeTerms').addEventListener('click', () => this.analyzeInputTerms());
        document.getElementById('executeBulkAddTerms').addEventListener('click', () => this.executeBulkAddTerms());
        document.getElementById('bulkTermsInput').addEventListener('input', () => this.updateInputTermsStats());

        // Changes summary modal
        document.getElementById('closeChangesSummary').addEventListener('click', () => this.hideChangesSummaryModal());
        document.getElementById('confirmChanges').addEventListener('click', () => this.hideChangesSummaryModal());
        
        // Reset confirmation modal  
        document.getElementById('closeResetConfirm').addEventListener('click', () => this.hideResetConfirmModal());
        document.getElementById('cancelReset').addEventListener('click', () => this.hideResetConfirmModal());
        document.getElementById('saveFirst').addEventListener('click', () => this.saveBeforeReset());
        document.getElementById('confirmReset').addEventListener('click', () => this.executeReset());
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
            console.log('Loading default emoji data from emoji.json...');
            const response = await fetch('emoji.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log('Fetch successful, parsing JSON...');
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format: expected an array');
            }
            
            console.log(`Parsed ${data.length} emojis, loading data...`);
            await this.loadData(data);
            
            console.log('Default emoji data loaded successfully');
            this.showMessage('Default emoji data loaded successfully', 'success');
        } catch (error) {
            console.error('Failed to load default data:', error);
            this.showMessage('Failed to load default data: ' + error.message, 'error');
            
            // Show helpful guidance in the display
            this.updateDisplay(); // This will show the "Load emoji data" state
        }
    }

    async detectCustomSearchTerms() {
        // This function compares current data with original emoji.json to detect custom search terms
        try {
            console.log('🔍 STARTING CUSTOM SEARCH TERMS DETECTION...');
            console.log('🔍 Current originalData state:', {
                length: this.originalData.length,
                firstEmoji: this.originalData[0] ? this.originalData[0].name : 'none',
                hasSkull: !!this.originalData.find(e => e.unified === '1F480')
            });
            
            const response = await fetch('emoji.json');
            let originalData = await response.json();
            
            console.log('📥 Fetched original emoji.json:', {
                isArray: Array.isArray(originalData),
                length: Array.isArray(originalData) ? originalData.length : 'N/A',
                hasDataProp: !!originalData.data,
                topLevelKeys: Array.isArray(originalData) ? 'Array' : Object.keys(originalData).slice(0, 5)
            });
            
            // Handle different data structures - original emoji.json is a direct array
            if (!Array.isArray(originalData)) {
                if (originalData.data && Array.isArray(originalData.data)) {
                    console.log('🔧 Original has data wrapper, extracting array');
                    originalData = originalData.data;
                } else {
                    console.error('❌ Original emoji.json has unexpected structure');
                    return;
                }
            }
            
            console.log(`📊 COMPARISON SETUP:
  Current data: ${this.originalData.length} emojis
  Original data: ${originalData.length} emojis`);
            
            // Look for skull in original data
            const originalSkull = originalData.find(emoji => emoji.unified === '1F480');
            console.log('💀 Original SKULL emoji:', originalSkull ? {
                name: originalSkull.name,
                unified: originalSkull.unified,
                short_names: originalSkull.short_names
            } : 'NOT FOUND');
            
            // Create a map of original emoji data keyed by unified code for quick lookup
            const originalEmojiMap = new Map();
            originalData.forEach(emoji => {
                if (emoji.unified) {
                    originalEmojiMap.set(emoji.unified, emoji);
                }
            });
            
            console.log(`🗂️ Created lookup map with ${originalEmojiMap.size} original emojis`);
            
            // Compare current data with original to find custom search terms
            this.customSearchTerms.clear();
            let totalCustomTerms = 0;
            let comparedCount = 0;
            let foundSkull = false;
            
            this.originalData.forEach((currentEmoji, index) => {
                if (!currentEmoji.unified) {
                    console.log(`⚠️ Emoji at index ${index} has no unified code:`, currentEmoji.name);
                    return;
                }
                
                const originalEmoji = originalEmojiMap.get(currentEmoji.unified);
                if (!originalEmoji) {
                    console.log(`⚠️ No original emoji found for unified code: ${currentEmoji.unified} (${currentEmoji.name})`);
                    return;
                }
                
                comparedCount++;
                
                // Compare short_names arrays to find additions
                const originalTerms = new Set(originalEmoji.short_names || []);
                const currentTerms = currentEmoji.short_names || [];
                
                // Check for skull specifically
                if (currentEmoji.unified === '1F480') {
                    foundSkull = true;
                    console.log(`💀 SKULL COMPARISON DETAILED:
  Current emoji: ${currentEmoji.name}
  Current short_names: [${currentTerms.join(', ')}] (length: ${currentTerms.length})
  Original short_names: [${Array.from(originalTerms).join(', ')}] (length: ${originalTerms.size})
  Differences: [${currentTerms.filter(term => !originalTerms.has(term)).join(', ')}]`);
                }
                
                // Debug first few comparisons and any with differences
                const differences = currentTerms.filter(term => !originalTerms.has(term));
                if (currentEmoji.unified === '1F480' || currentEmoji.unified === '1FAA6' || comparedCount <= 3 || differences.length > 0) {
                    console.log(`🔍 Comparison ${comparedCount} - ${currentEmoji.name} (${currentEmoji.unified}):`, {
                        originalTerms: Array.from(originalTerms),
                        currentTerms: currentTerms,
                        originalLength: originalTerms.size,
                        currentLength: currentTerms.length,
                        differences: differences,
                        hasDifferences: differences.length > 0
                    });
                }
                
                const customTerms = currentTerms.filter(term => !originalTerms.has(term));
                
                if (customTerms.length > 0) {
                    this.customSearchTerms.set(index, customTerms);
                    totalCustomTerms += customTerms.length;
                    
                    // Try to get emoji character for logging
                    let emojiChar = '📝';
                    try {
                        const codePoints = currentEmoji.unified.split('-').map(hex => parseInt(hex, 16));
                        emojiChar = String.fromCodePoint(...codePoints);
                    } catch (e) {
                        // fallback already set
                    }
                    
                    console.log(`🏷️ FOUND CUSTOM TERMS: ${customTerms.length} for ${emojiChar} (${currentEmoji.name}): [${customTerms.join(', ')}]`);
                }
            });
            
            console.log(`📋 DETECTION SUMMARY:
  Total emojis compared: ${comparedCount}
  Found skull during comparison: ${foundSkull}
  Custom search terms found: ${this.customSearchTerms.size}
  Total custom terms: ${totalCustomTerms}`);
            
            if (this.customSearchTerms.size > 0) {
                console.log(`✅ Detection complete: ${this.customSearchTerms.size} emojis with ${totalCustomTerms} total custom search terms`);
                console.log('🏷️ All custom terms:', Array.from(this.customSearchTerms.entries()));
            } else {
                console.log('ℹ️ No custom search terms detected');
            }
            
        } catch (error) {
            console.error('❌ Failed to detect custom search terms:', error);
        }
    }

    // Debug method to test custom search terms detection
    debugCustomTermsDetection() {
        console.log('🧪 DEBUG: Current custom search terms state:');
        console.log('customSearchTerms.size:', this.customSearchTerms.size);
        console.log('customSearchTerms entries:', Array.from(this.customSearchTerms.entries()));
        
        // Show a few examples of current emoji data
        console.log('🧪 DEBUG: First 3 emojis in current data:');
        this.originalData.slice(0, 3).forEach((emoji, index) => {
            console.log(`  ${index}: ${emoji.name} - short_names:`, emoji.short_names);
        });
        
        return this.customSearchTerms;
    }

    loadFile() {
        document.getElementById('fileInput').click();
    }

    async handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            this.showMessage('Please select a valid JSON file.', 'error');
            return;
        }

        console.log('🚀 STARTING FILE LOAD PROCESS for:', file.name);

        // Show loading modal
        this.showLoadingModal('Loading file...');

        try {
            // Read the uploaded file
            console.log('📖 Reading file content...');
            const fileContent = await this.readFileAsync(file);
            console.log('📝 File content length:', fileContent.length);
            
            const uploadedData = JSON.parse(fileContent);
            console.log('📊 Parsed JSON structure:', {
                isArray: Array.isArray(uploadedData),
                hasDataProperty: !!uploadedData.data,
                hasSettings: !!uploadedData.emoji_data_pasta_settings,
                topLevelKeys: Object.keys(uploadedData),
                dataLength: uploadedData.data ? uploadedData.data.length : 'N/A'
            });

            // Check if this is a settings file (has emoji_data_pasta_settings)
            if (uploadedData.emoji_data_pasta_settings) {
                console.log('🔧 Detected settings file, using settings flow');
                await this.loadSettingsFromFile(uploadedData, file.name);
            } else if (Array.isArray(uploadedData)) {
                console.log('📋 Detected direct array, loading as emoji data');
                // Legacy: direct emoji array - load data and detect custom search terms
                this.showLoadingModal('Loading emoji data...');
                await this.loadData(uploadedData);
                
                this.showLoadingModal('Detecting custom search terms...');
                await this.detectCustomSearchTerms();
                
                const customTermsCount = this.customSearchTerms.size;
                let message = `Loaded ${uploadedData.length} emojis from ${file.name}`;
                if (customTermsCount > 0) {
                    message += `\n🏷️ Detected ${customTermsCount} emojis with custom search terms`;
                }
                
                this.showMessage(message, 'success');
            } else if (uploadedData.data && Array.isArray(uploadedData.data)) {
                console.log('📦 Detected data wrapper object, extracting array');
                // Object with data property containing array
                this.showLoadingModal('Loading emoji data...');
                await this.loadData(uploadedData.data);
                
                this.showLoadingModal('Detecting custom search terms...');
                await this.detectCustomSearchTerms();
                
                const customTermsCount = this.customSearchTerms.size;
                let message = `Loaded ${uploadedData.data.length} emojis from ${file.name}`;
                if (customTermsCount > 0) {
                    message += `\n🏷️ Detected ${customTermsCount} emojis with custom search terms`;
                }
                
                this.showMessage(message, 'success');
            } else {
                this.showMessage('Invalid file format. Expected emoji data or settings file.', 'error');
            }
        } catch (error) {
            console.error('❌ Error in handleFileLoad:', error);
            this.showMessage('Error parsing JSON file: ' + error.message, 'error');
        } finally {
            this.hideLoadingModal();
        }
    }

    readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async loadSettingsFromFile(settingsFile, filename) {
        try {
            this.showLoadingModal('Loading base emoji data...');
            
            // Always load the current base emoji.json as foundation
            const response = await fetch('emoji.json');
            const baseEmojiData = await response.json();
            
            this.showLoadingModal('Applying your customizations...');
            
            // Extract settings
            const settings = settingsFile.emoji_data_pasta_settings;
            
            // Store the uploaded data for comparison if it exists
            this.uploadedEmojiData = settingsFile.data || null;
            
            // Load base data first
            await this.loadData(baseEmojiData);
            
            // Apply the saved settings and custom data changes
            await this.applySettingsFromFile(settings);
            
            // Show overview of what was applied
            // this.showSettingsOverview(settings, filename); // Using changes summary modal instead
            
        } catch (error) {
            this.showMessage('Error loading settings: ' + error.message, 'error');
        }
    }

    async applySettingsFromFile(settings) {
        // Track changes for summary
        this.appliedChanges = {
            fieldsRemoved: 0,
            emojisRemoved: 0,
            categoryMappings: 0,
            excludedCategories: 0,
            customSearchTerms: 0,
            details: []
        };
        
        // Apply field selections
        if (settings.fieldsRemoved) {
            const allFields = new Set(Object.keys(this.fieldSchema));
            const removedFields = new Set(settings.fieldsRemoved);
            const keptFields = Array.from(allFields).filter(field => !removedFields.has(field));
            
            this.selectedFields = new Set();
            keptFields.forEach(field => {
                if (this.fieldSchema[field]) {
                    this.selectedFields.add(field);
                }
            });
            
            this.appliedChanges.fieldsRemoved = settings.fieldsRemoved.length;
            this.appliedChanges.details.push(`🔧 Removed ${settings.fieldsRemoved.length} fields`);
        }

        // Apply removed emojis by emoji characters
        if (settings.removedEmojis && settings.removedEmojis.length > 0) {
            const removedEmojiChars = new Set(settings.removedEmojis);
            this.removedEmojis = new Set();
            
            this.originalData.forEach((emoji, index) => {
                try {
                    const codePoints = emoji.unified.split('-').map(hex => parseInt(hex, 16));
                    const emojiChar = String.fromCodePoint(...codePoints);
                    if (removedEmojiChars.has(emojiChar)) {
                        this.removedEmojis.add(index);
                    }
                } catch (e) {
                    const fallback = emoji.name || `Index_${emoji.unified || 'unknown'}`;
                    if (removedEmojiChars.has(fallback)) {
                        this.removedEmojis.add(index);
                    }
                }
            });
            
            this.appliedChanges.emojisRemoved = settings.removedEmojis.length;
            this.appliedChanges.details.push(`❌ Removed ${settings.removedEmojis.length} emojis: ${settings.removedEmojis.join(' ')}`);
        }

        // Apply category modifications
        if (settings.categoryMappings) {
            this.categoryMappings = new Map(settings.categoryMappings);
            this.appliedChanges.categoryMappings = settings.categoryMappings.length;
            this.appliedChanges.details.push(`📁 Applied ${settings.categoryMappings.length} category mappings`);
        }
        if (settings.excludedCategories) {
            this.excludedCategories = new Set(settings.excludedCategories);
            this.appliedChanges.excludedCategories = settings.excludedCategories.length;
            this.appliedChanges.details.push(`🚫 Excluded ${settings.excludedCategories.length} categories`);
        }

        // Detect and apply custom search terms from uploaded data
        if (this.uploadedEmojiData) {
            console.log('🔍 Detecting custom search terms from uploaded data...');
            await this.detectCustomSearchTermsFromData(this.uploadedEmojiData);
        } else {
            // Fallback to original detection method
            await this.detectCustomSearchTerms();
        }
        
        if (this.customSearchTerms.size > 0) {
            this.appliedChanges.customSearchTerms = this.customSearchTerms.size;
            const totalTerms = Array.from(this.customSearchTerms.values()).reduce((sum, terms) => sum + terms.length, 0);
            this.appliedChanges.details.push(`🏷️ Found ${this.customSearchTerms.size} emojis with ${totalTerms} custom search terms`);
        }
        
        // Update display
        this.updateDisplay();
        
        // Show changes summary modal
        this.showChangeSummaryModal();
    }

    showSettingsOverview(settings, filename) {
        const fieldsRemoved = settings.fieldsRemoved ? settings.fieldsRemoved.length : 0;
        const emojisRemoved = settings.removedEmojis ? settings.removedEmojis.length : 0;
        const categoryMappings = settings.categoryMappings ? settings.categoryMappings.length : 0;
        const excludedCategories = settings.excludedCategories ? settings.excludedCategories.length : 0;
        
        let overview = `✅ Settings loaded from "${filename}":\n\n`;
        overview += `📋 Applied to ${this.originalData.length} emojis from current emoji.json\n\n`;
        
        if (fieldsRemoved > 0) {
            overview += `🔧 ${fieldsRemoved} fields removed\n`;
        }
        if (emojisRemoved > 0) {
            overview += `❌ ${emojisRemoved} emojis removed: ${settings.removedEmojis.join(' ')}\n`;
        }
        if (categoryMappings > 0) {
            overview += `📁 ${categoryMappings} category mappings applied\n`;
        }
        if (excludedCategories > 0) {
            overview += `🚫 ${excludedCategories} categories excluded\n`;
        }
        
        const customTerms = this.customSearchTerms.size;
        if (customTerms > 0) {
            overview += `🏷️ ${customTerms} emojis with custom search terms detected\n`;
        }
        
        overview += `\n✨ Your customizations have been applied to the current emoji dataset!`;
        
        this.showMessage(overview, 'success');
    }

    showLoadingModal(message = 'Loading...') {
        // Create loading modal if it doesn't exist
        let modal = document.getElementById('loadingModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'loadingModal';
            modal.className = 'loading-modal';
            modal.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text" id="loadingText">Loading...</div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        document.getElementById('loadingText').textContent = message;
        modal.classList.add('active');
    }

    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async loadData(data) {
        console.log('🔄 LOADING DATA - Input type:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('🔄 LOADING DATA - Input length/keys:', Array.isArray(data) ? data.length : Object.keys(data));
        
        // Handle both array and object with emoji_data_pasta_settings
        let hasRestorableSettings = false;
        
        if (data.emoji_data_pasta_settings) {
            console.log('🔧 Found emoji_data_pasta_settings in data');
            const savedSettings = data.emoji_data_pasta_settings;
            hasRestorableSettings = true;
            
            // Store the minimal settings for restoration
            this.savedMinimalState = savedSettings;
            
            // Remove settings and extract the actual array
            delete data.emoji_data_pasta_settings;
            this.originalData = Object.values(data).filter(item => typeof item === 'object' && item.name);
            console.log('🔧 Extracted emoji data length:', this.originalData.length);
        } else if (Array.isArray(data)) {
            console.log('📋 Loading direct array of emojis');
            this.originalData = data;
        } else {
            console.error('❌ Invalid data format in loadData');
            this.showMessage('Invalid data format. Expected an array of emoji objects.', 'error');
            return;
        }

        console.log('✅ LOADED DATA - originalData length:', this.originalData.length);
        
        // Log first few emojis to verify structure
        console.log('🔍 First 3 emojis in loaded data:');
        this.originalData.slice(0, 3).forEach((emoji, index) => {
            console.log(`  ${index}: ${emoji.name} (${emoji.unified}) - short_names:`, emoji.short_names);
        });
        
        // Look for skull emoji specifically
        const skullEmoji = this.originalData.find(emoji => emoji.unified === '1F480');
        if (skullEmoji) {
            console.log('💀 Found SKULL emoji in loaded data:', {
                name: skullEmoji.name,
                unified: skullEmoji.unified,
                short_names: skullEmoji.short_names,
                index: this.originalData.indexOf(skullEmoji)
            });
        } else {
            console.log('❌ SKULL emoji not found in loaded data');
        }

        this.analyzeFieldStructure();
        this.analyzeCategoryStructure();
        this.filteredEmojis = [...this.originalData];
        this.updateDisplay();
        
        // Reset to defaults
        this.currentEmojiIndex = 0;
        this.currentVariant = 'default';
        
        // Restore from minimal settings if available, otherwise use localStorage or defaults
        if (hasRestorableSettings && this.savedMinimalState) {
            console.log('🔧 Restoring from minimal settings');
            // Handle minimal format
            const state = this.savedMinimalState;
            
            // Calculate kept fields from removed fields
            const allFields = new Set(Object.keys(this.fieldSchema));
            const removedFields = new Set(state.fieldsRemoved || []);
            const keptFields = Array.from(allFields).filter(field => !removedFields.has(field));
            
            this.selectedFields = new Set();
            keptFields.forEach(field => {
                if (this.fieldSchema[field]) {
                    this.selectedFields.add(field);
                }
            });
            
            // Restore removed emojis using emoji characters
            if (state.removedEmojis && state.removedEmojis.length > 0) {
                const removedEmojiChars = new Set(state.removedEmojis);
                this.removedEmojis = new Set();
                
                this.originalData.forEach((emoji, index) => {
                    try {
                        const codePoints = emoji.unified.split('-').map(hex => parseInt(hex, 16));
                        const emojiChar = String.fromCodePoint(...codePoints);
                        if (removedEmojiChars.has(emojiChar)) {
                            this.removedEmojis.add(index);
                        }
                    } catch (e) {
                        const fallback = emoji.name || `Index_${emoji.unified || 'unknown'}`;
                        if (removedEmojiChars.has(fallback)) {
                            this.removedEmojis.add(index);
                        }
                    }
                });
            }
            
            // Restore category modifications
            if (state.categoryMappings) {
                this.categoryMappings = new Map(state.categoryMappings);
            }
            if (state.excludedCategories) {
                this.excludedCategories = new Set(state.excludedCategories);
            }
            
            this.showMessage(`Loaded data with file settings: ${this.selectedFields.size} fields selected`, 'info');
            
        } else if (this.persistedSelectedFields && this.persistedSelectedFields.length > 0) {
            console.log('💾 Restoring from localStorage');
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
            
            // Restore removed emojis from localStorage
            if (this.persistedRemovedEmojis) {
                this.removedEmojis = new Set(this.persistedRemovedEmojis.filter(index => index < this.originalData.length));
            }
            
            this.showMessage(`Loaded data with restored session state: ${this.selectedFields.size} fields selected`, 'info');
        } else {
            console.log('🆕 Using default field selection');
            // Default: select all fields for new data
            this.selectedFields = new Set(Object.keys(this.fieldSchema));
        }
        
        // Ensure current emoji index is valid and not removed
        this.currentEmojiIndex = Math.min(this.currentEmojiIndex, this.originalData.length - 1);
        this.findNextAvailableEmoji();
        
        this.updateDisplay();
        this.saveState(); // Save state after loading data
        
        // Clean up temporary state
        this.savedMinimalState = null;
        
        console.log('🏁 LOADDATA COMPLETE - calling detectCustomSearchTerms will happen next');
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
        this.renderCategoryManager();
        this.renderSearchTermsManager();
        this.renderRemovedManager();
        this.renderOutputPreview();
    }

    updateCounters() {
        const totalCount = this.originalData.length;
        const availableCount = totalCount - this.removedEmojis.size;
        const removedCount = this.removedEmojis.size;
        
        let countText = `${availableCount} emojis`;
        if (removedCount > 0) {
            countText += ` (${removedCount} removed)`;
        }
        
        document.getElementById('totalCount').textContent = countText;
        
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
        
        // Add safety check for undefined currentEmoji
        if (!currentEmoji) {
            emojiIcon.textContent = '❌';
            emojiName.textContent = 'Emoji data undefined';
            emojiIndex.textContent = `${this.currentEmojiIndex + 1} / ${this.originalData.length}`;
            variantInfo.style.display = 'none';
            return;
        }
        
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
        if (variantData && variantData.unified) {
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
        // Add safety check for undefined emoji
        if (!emoji) {
            return null;
        }
        
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
        // Add safety check for undefined emoji
        if (!emoji) {
            return ['default'];
        }
        
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
        // Try tab-specific element first, then fall back to original
        let container = document.getElementById('tabOriginalStructure');
        if (!container) {
            container = document.getElementById('originalStructure');
        }
        
        if (!container) {
            // Element not found, retry after delay
            setTimeout(() => this.renderOriginalStructure(), 100);
            return;
        }
        
        if (this.originalData.length === 0) {
            container.innerHTML = '<div class="loading">Load a JSON file to see the emoji structure</div>';
            return;
        }

        // Show the current selected emoji with current variant
        const currentEmoji = this.originalData[this.currentEmojiIndex];
        
        // Add safety check for undefined currentEmoji
        if (!currentEmoji) {
            container.innerHTML = '<div class="loading">Invalid emoji index - please navigate to a valid emoji</div>';
            return;
        }
        
        const variantData = this.getCurrentVariantData(currentEmoji);
        const jsonString = JSON.stringify(variantData, null, 2);
        const highlightedJson = this.highlightJsonWithRemovedFields(jsonString, variantData);
        
        container.innerHTML = `
            <div class="json-code">${highlightedJson}</div>
        `;
        
        // Also update both containers if both exist
        const allContainers = document.querySelectorAll('#originalStructure, #tabOriginalStructure');
        allContainers.forEach(c => {
            if (c) {
                c.innerHTML = `<div class="json-code">${highlightedJson}</div>`;
            }
        });
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
        
        // Add safety check for undefined/null obj
        if (!obj || typeof obj !== 'object') {
            return fields;
        }
        
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
                    <div class="field-group-count">
                        ${Object.keys(this.fieldSchema).length} fields
                        ${this.fieldRenames.size > 0 ? ` • ${this.fieldRenames.size} renamed` : ''}
                    </div>
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
                                <div class="field-name">
                                    <span class="field-original-name">${field}</span>
                                    ${this.fieldRenames.has(field) ? `<span class="field-arrow">→</span><span class="field-renamed">${this.fieldRenames.get(field)}</span>` : ''}
                                </div>
                                <button class="field-rename-btn" onclick="event.stopPropagation(); emojiPasta.showFieldRenameModal('${field}')" title="Rename field">✏️</button>
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
                                        <div class="field-name">
                                            <span class="field-original-name">${subFieldName}</span>
                                            ${this.fieldRenames.has(subField) ? `<span class="field-arrow">→</span><span class="field-renamed">${this.fieldRenames.get(subField)}</span>` : ''}
                                        </div>
                                        <button class="field-rename-btn" onclick="event.stopPropagation(); emojiPasta.showFieldRenameModal('${subField}')" title="Rename field">✏️</button>
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
                ${this.fieldRenames.size > 0 ? `
                <div class="field-management-actions" style="margin-top: 1rem; text-align: center;">
                    <button class="btn btn-secondary btn-small" onclick="app.clearAllFieldRenames()">
                        Clear All Renames (${this.fieldRenames.size})
                    </button>
                </div>
                ` : ''}
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
        // Try tab-specific element first, then fall back to original
        let container = document.getElementById('tabOutputStructure');
        if (!container) {
            container = document.getElementById('outputStructure');
        }
        
        if (!container) {
            // Element not found, retry after delay
            setTimeout(() => this.renderOutputPreview(), 100);
            return;
        }
        
        if (this.originalData.length === 0) {
            container.innerHTML = '<div class="loading">Make field changes to see output preview</div>';
            return;
        }

        // Create a sample output based on selected fields from current emoji
        const currentEmoji = this.originalData[this.currentEmojiIndex];
        
        // Add safety check for undefined currentEmoji
        if (!currentEmoji) {
            container.innerHTML = '<div class="loading">Invalid emoji index - please navigate to a valid emoji</div>';
            return;
        }
        
        const variantData = this.getCurrentVariantData(currentEmoji);
        const sampleOutput = this.createFilteredEmoji(variantData);
        const jsonString = JSON.stringify(sampleOutput, null, 2);
        const highlightedJson = this.highlightJson(jsonString);
        
        container.innerHTML = `
            <div class="json-code">${highlightedJson}</div>
        `;
        
        // Also update both containers if both exist
        const allContainers = document.querySelectorAll('#outputStructure, #tabOutputStructure');
        allContainers.forEach(c => {
            if (c) {
                c.innerHTML = `<div class="json-code">${highlightedJson}</div>`;
            }
        });
    }

    showEmojiBrowser() {
        document.getElementById('emojiBrowserModal').classList.add('active');
        this.emojiDisplayLimit = 100; // Reset display limit
        
        // Initialize with available emojis (excluding removed ones)
        this.filteredEmojis = this.originalData.filter((emoji, index) => !this.removedEmojis.has(index));
        
        // Clear search input and query
        document.getElementById('emojiSearch').value = '';
        this.currentSearchQuery = '';
        
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
        // Create filtered data for available emojis (excluding removed ones)
        this.browserFilteredData = this.originalData.map((emoji, index) => {
            if (this.removedEmojis.has(index)) {
                return null; // Mark removed emojis as null
            }
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
        const availableEmojis = this.originalData.filter((emoji, index) => !this.removedEmojis.has(index));
        
        // Store the current search query for highlighting
        this.currentSearchQuery = query.trim();
        
        if (!query.trim()) {
            this.filteredEmojis = [...availableEmojis];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredEmojis = availableEmojis.filter((emoji, originalIndex) => {
                const emojiIndex = this.originalData.indexOf(emoji);
                const customTerms = this.customSearchTerms.get(emojiIndex) || [];
                
                return (emoji.name && emoji.name.toLowerCase().includes(searchTerm)) ||
                       (emoji.short_name && emoji.short_name.toLowerCase().includes(searchTerm)) ||
                       (emoji.category && emoji.category.toLowerCase().includes(searchTerm)) ||
                       (emoji.subcategory && emoji.subcategory.toLowerCase().includes(searchTerm)) ||
                       (emoji.unified && emoji.unified.toLowerCase().includes(searchTerm)) ||
                       (emoji.short_names && emoji.short_names.some(name => name.toLowerCase().includes(searchTerm))) ||
                       (customTerms.some(term => term.toLowerCase().includes(searchTerm)));
            });
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
                    if (field === 'emoji') {
                        return '<th>Emoji</th>';
                    }
                    
                    // Get the display name for the header
                    const outputFieldName = this.getOutputFieldName(field);
                    const isRenamed = this.settings.applyFieldRenames && this.fieldRenames.has(field);
                    
                    // Create display name
                    let displayName;
                    if (isRenamed) {
                        // Show renamed field name with original in tooltip
                        displayName = outputFieldName;
                    } else {
                        // Use prettified original name
                        displayName = field === 'short_names' ? 'Short Names' :
                                     field === 'sort_order' ? 'Sort Order' :
                                     field === 'added_in' ? 'Added In' :
                                     field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                    
                    const tooltip = isRenamed ? `Renamed from: ${field}` : '';
                    return `<th title="${tooltip}">${displayName}${isRenamed ? ' ✏️' : ''}</th>`;
                }).join('')}
            </tr>
        `;

        // Display only up to the current limit
        const displayEmojis = this.filteredEmojis.slice(0, this.emojiDisplayLimit);
        
        tbody.innerHTML = displayEmojis.map((originalEmoji, index) => {
            // Get actual emoji index in original data
            const originalIndex = this.originalData.indexOf(originalEmoji);
            const filteredEmoji = this.browserFilteredData[originalIndex];
            
            // Skip if this emoji was filtered out (e.g., removed or excluded by category)
            if (!filteredEmoji) {
                return ''; // Return empty string to skip this row
            }
            
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
                
                // Get the correct field name to look up in the filtered data
                const outputFieldName = this.getOutputFieldName(field);
                const value = filteredEmoji[outputFieldName];
                
                if (value === undefined || value === null) {
                    return '<td class="emoji-cell" style="color: var(--text-tertiary); font-style: italic;">—</td>';
                }
                
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return '<td class="emoji-cell" style="color: var(--text-tertiary); font-style: italic;">[]</td>';
                    }
                    // Show all array items in a scrollable cell
                    const arrayDisplay = value.map(item => this.highlightSearchMatch(item, this.currentSearchQuery)).join(', ');
                    return `<td class="emoji-cell emoji-cell-array">[${arrayDisplay}]</td>`;
                }
                
                if (typeof value === 'object') {
                    // Show full object in scrollable cell
                    const jsonString = JSON.stringify(value, null, 1);
                    const highlightedJson = this.highlightSearchMatch(jsonString, this.currentSearchQuery);
                    return `<td class="emoji-cell emoji-cell-object">${highlightedJson}</td>`;
                }
                
                // For strings, show full content with highlighting
                const highlightedValue = this.highlightSearchMatch(value, this.currentSearchQuery);
                return `<td class="emoji-cell">${highlightedValue}</td>`;
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
        
        // Get the index of this emoji in the original data
        const emojiIndex = this.originalData.indexOf(originalEmoji);
        
        // First, apply category mappings if any exist
        let newCategory = originalEmoji.category;
        if (this.categoryMappings.size > 0) {
            // Find which mapping this emoji's category belongs to
            for (const [mappingName, originalCategories] of this.categoryMappings) {
                if (originalCategories.includes(originalEmoji.category)) {
                    // Check if this mapping is excluded
                    if (this.excludedCategories.has(mappingName)) {
                        // Skip this emoji entirely if its category mapping is excluded
                        return null;
                    }
                    newCategory = mappingName;
                    break;
                }
            }
            
            // If category is not in any mapping but we have mappings, check if original category is excluded
            if (newCategory === originalEmoji.category && this.excludedCategories.has(originalEmoji.category)) {
                return null;
            }
        }
        
        // Apply field selections
        for (const fieldName of this.selectedFields) {
            // Get the field name to use in output (renamed or original)
            const outputFieldName = (this.settings.applyFieldRenames && this.fieldRenames.get(fieldName)) || fieldName;
            
            if (fieldName === 'category' && newCategory !== originalEmoji.category) {
                // Use the mapped category instead of original
                filtered[outputFieldName] = newCategory;
            } else if (fieldName === 'short_names' && originalEmoji.hasOwnProperty(fieldName)) {
                // Merge original short_names with custom search terms
                const originalShortNames = originalEmoji[fieldName] || [];
                const customTerms = this.customSearchTerms.get(emojiIndex) || [];
                const mergedTerms = [...originalShortNames, ...customTerms];
                
                if (!this.settings.includeEmptyFields && mergedTerms.length === 0) {
                    continue;
                }
                filtered[outputFieldName] = mergedTerms;
            } else if (originalEmoji.hasOwnProperty(fieldName)) {
                const value = originalEmoji[fieldName];
                
                // Handle skin variations
                if (fieldName === 'skin_variations' && value && typeof value === 'object') {
                    const filteredVariations = {};
                    for (const [skinTone, skinData] of Object.entries(value)) {
                        const filteredSkinData = {};
                        for (const subField of this.selectedFields) {
                            if (subField.startsWith('skin_variations.') && skinData.hasOwnProperty(subField.split('.')[1])) {
                                const subFieldName = subField.split('.')[1];
                                // Apply renames to sub-fields as well
                                const outputSubFieldName = (this.settings.applyFieldRenames && this.fieldRenames.get(subField)) || subFieldName;
                                filteredSkinData[outputSubFieldName] = skinData[subFieldName];
                            }
                        }
                        if (Object.keys(filteredSkinData).length > 0) {
                            filteredVariations[skinTone] = filteredSkinData;
                        }
                    }
                    if (Object.keys(filteredVariations).length > 0) {
                        filtered[outputFieldName] = filteredVariations;
                    }
                } else if (!this.settings.includeEmptyFields && (value === null || value === undefined || value === '')) {
                    // Skip empty fields if setting is disabled
                    continue;
                } else {
                    filtered[outputFieldName] = value;
                }
            }
        }

        return Object.keys(filtered).length > 0 ? filtered : null;
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
        console.log('showSettingsPanel called');
        
        if (this.originalData.length === 0) {
            console.warn('No data loaded');
            this.showMessage('No data to save. Please load a file first.', 'warning');
            return;
        }

        console.log('Data is available, showing settings panel');
        const settingsPanel = document.getElementById('settingsPanel');
        if (!settingsPanel) {
            console.error('Settings panel element not found');
            return;
        }
        
        settingsPanel.classList.add('active');
        
        // Update settings UI to reflect current values
        console.log('Updating settings UI elements...');
        document.getElementById('saveSettings').checked = this.settings.saveSettings;
        document.getElementById('includeEmptyFields').checked = this.settings.includeEmptyFields;
        document.getElementById('prettifyJson').checked = this.settings.prettifyJson;
        document.getElementById('includeStats').checked = this.settings.includeStats;
        document.getElementById('applyFieldRenames').checked = this.settings.applyFieldRenames;
        document.getElementById('filename').value = this.settings.filename;
        
        // Update field renames count display
        const fieldRenamesCount = document.getElementById('fieldRenamesCount');
        if (this.fieldRenames.size > 0) {
            fieldRenamesCount.textContent = `${this.fieldRenames.size} field(s) will be renamed`;
            fieldRenamesCount.style.display = 'block';
        } else {
            fieldRenamesCount.style.display = 'none';
        }
        
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
        
        // Process emojis, excluding removed ones
        this.originalData.forEach((emoji, index) => {
            // Skip removed emojis
            if (this.removedEmojis.has(index)) {
                return;
            }
            
            const filtered = this.createFilteredEmoji(emoji);
            if (filtered && Object.keys(filtered).length > 0) {
                processedData.push(filtered);
            }
        });

        // Always return as simple array, no object wrapping option
        let finalData = processedData;

        // Add minimal settings if enabled
        if (this.settings.saveSettings) {
            // Helper function to convert emoji to character
            const getEmojiChar = (emoji) => {
                try {
                    const codePoints = emoji.unified.split('-').map(hex => parseInt(hex, 16));
                    return String.fromCodePoint(...codePoints);
                } catch (e) {
                    return emoji.name || `Index_${emoji.unified || 'unknown'}`;
                }
            };
            
            // Minimal settings - only what's needed for restoration
            const minimalSettings = {};
            
            // Only include data if it exists/differs from defaults
            const removedFields = Object.keys(this.fieldSchema).filter(f => !this.selectedFields.has(f));
            if (removedFields.length > 0) {
                minimalSettings.fieldsRemoved = removedFields;
            }
            
            if (this.removedEmojis.size > 0) {
                minimalSettings.removedEmojis = Array.from(this.removedEmojis)
                    .map(index => getEmojiChar(this.originalData[index]))
                    .filter(emoji => emoji);
            }
            
            if (this.categoryMappings.size > 0) {
                minimalSettings.categoryMappings = Array.from(this.categoryMappings.entries());
            }
            
            if (this.excludedCategories.size > 0) {
                minimalSettings.excludedCategories = Array.from(this.excludedCategories);
            }

            // Only add settings if there's actually something to save
            if (Object.keys(minimalSettings).length > 0) {
                finalData = {
                    data: processedData,
                    emoji_data_pasta_settings: minimalSettings
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
        try {
            console.log('Starting updateFileSizePreview...');
            
            // Check if we have data
            if (!this.originalData || this.originalData.length === 0) {
                console.warn('No original data available for file size preview');
                document.getElementById('fileSizeComparison').style.display = 'none';
                return;
            }
            
            console.log('Original data length:', this.originalData.length);
            
            // Calculate original file size
            const originalJson = JSON.stringify(this.originalData);
            const originalSize = new Blob([originalJson]).size;
            console.log('Original size:', originalSize);
            
            // Calculate new file size with current settings
            const { finalData } = this.prepareExportData();
            console.log('Final data prepared:', !!finalData);
            
            const newJson = this.settings.prettifyJson 
                ? JSON.stringify(finalData, null, 2)
                : JSON.stringify(finalData);
            const newSize = new Blob([newJson]).size;
            console.log('New size:', newSize);
            
            // Calculate savings
            const savings = originalSize - newSize;
            const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
            console.log('Savings:', savings, 'Percent:', savingsPercent);
            
            // Update UI elements
            const originalSizeEl = document.getElementById('originalSize');
            const newSizeEl = document.getElementById('newSize');
            const spaceSavedEl = document.getElementById('spaceSaved');
            const fileSizeComparisonEl = document.getElementById('fileSizeComparison');
            
            if (!originalSizeEl || !newSizeEl || !spaceSavedEl || !fileSizeComparisonEl) {
                console.error('One or more file size elements not found in DOM');
                return;
            }
            
            originalSizeEl.textContent = this.formatFileSize(originalSize);
            newSizeEl.textContent = this.formatFileSize(newSize);
            spaceSavedEl.textContent = `${this.formatFileSize(savings)} (${savingsPercent}%)`;
            fileSizeComparisonEl.style.display = 'block';
            
            console.log('File size preview updated successfully');
        } catch (error) {
            console.error('Error in updateFileSizePreview:', error);
            document.getElementById('fileSizeComparison').style.display = 'none';
        }
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
            console.log('Loading persisted state:', state);
            
            // Determine if we should skip field restoration (if file has its own settings)
            const skipFieldRestore = this.savedFieldSelections && this.savedFieldSelections.size > 0;
            
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
            this.persistedRemovedEmojis = state.removedEmojis || [];
            this.persistedFieldSchema = state.fieldSchema || {};
            
            // Also restore immediately if data is already loaded
            if (this.originalData.length > 0) {
                // Restore field selections from state (if no file-specific settings)
                if (!skipFieldRestore && state.selectedFields) {
                    const fieldsToRestore = Array.isArray(state.selectedFields) ? state.selectedFields : [];
                    fieldsToRestore.forEach(field => this.selectedFields.add(field));
                }
                
                // Restore removed emojis
                if (state.removedEmojis) {
                    const removedToRestore = Array.isArray(state.removedEmojis) ? state.removedEmojis : [];
                    removedToRestore.forEach(index => this.removedEmojis.add(index));
                }
                
                // Restore expanded fields
                if (state.expandedFields) {
                    const expandedToRestore = Array.isArray(state.expandedFields) ? state.expandedFields : [];
                    expandedToRestore.forEach(field => this.expandedFields.add(field));
                }
            }
            
            // Restore category mappings
            if (state.categoryMappings) {
                this.categoryMappings = new Map(state.categoryMappings);
            }
            
            // Restore excluded categories
            if (state.excludedCategories) {
                this.excludedCategories = new Set(state.excludedCategories);
            }
            
            // Restore custom search terms
            if (state.customSearchTerms) {
                this.customSearchTerms = new Map(state.customSearchTerms);
            }
            
            // Restore field renames
            if (state.fieldRenames) {
                this.fieldRenames = new Map(state.fieldRenames);
            }
            
            // Note: selectedCategories is not persisted as it's a UI state that should reset
            
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
                removedEmojis: Array.from(this.removedEmojis),
                categoryMappings: Array.from(this.categoryMappings.entries()),
                excludedCategories: Array.from(this.excludedCategories),
                customSearchTerms: Array.from(this.customSearchTerms.entries()),
                fieldRenames: Array.from(this.fieldRenames.entries()),
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
        // Show confirmation modal instead of direct reset
        this.showResetConfirmModal();
    }

    showResetConfirmModal() {
        document.getElementById('resetConfirmModal').classList.add('active');
    }

    hideResetConfirmModal() {
        document.getElementById('resetConfirmModal').classList.remove('active');
    }

    saveBeforeReset() {
        // Hide reset modal and show settings panel for saving
        this.hideResetConfirmModal();
        this.showSettingsPanel();
        
        // Show message about saving before reset
        this.showMessage('Save your data, then use the reset button again to continue with reset', 'info');
    }

    executeReset() {
        // Hide the modal
        this.hideResetConfirmModal();
        
        // Clear all localStorage
        localStorage.removeItem('emoji-pasta-state');
        localStorage.removeItem('emoji-pasta-custom-preset');
        localStorage.removeItem('emoji-pasta-theme');
        
        // Reset all application state
        this.originalData = [];
        this.fieldSchema = {};
        this.selectedFields = new Set();
        this.filteredEmojis = [];
        this.removedEmojis = new Set();
        this.currentEmojiIndex = 0;
        this.currentVariant = 'default';
        this.expandedFields = new Set();
        this.categoryMappings = new Map();
        this.excludedCategories = new Set();
        this.originalCategories = new Map();
        this.selectedCategories = new Set();
        this.customSearchTerms = new Map();
        this.currentPreset = '';
        this.customPreset = [];
        
        // Reset settings to defaults
        this.settings = {
            includeEmptyFields: true,
            prettifyJson: true,
            includeStats: true,
            saveSettings: true,
            filename: 'emoji-edited.json'
        };
        
        // Reset theme to default (dark)
        this.theme = 'dark';
        this.applyTheme();
        
        // Reset UI
        this.updateDisplay();
        
        // Reset preset dropdown
        document.getElementById('fieldPresets').value = '';
        
        // Reload default data after reset
        this.loadDefaultData();
        
        this.showMessage('Application reset successfully - reloading default emoji data', 'success');
    }

    refreshBrowserIfOpen() {
        // If the emoji browser is open, refresh the data to show updated field selections
        const modal = document.getElementById('emojiBrowserModal');
        if (modal.classList.contains('active')) {
            this.prepareFilteredEmojiData();
            this.renderEmojiTable();
        }
    }

    addCurrentEmojiToRemoved() {
        if (this.originalData.length === 0) {
            this.showMessage('No emoji data loaded', 'warning');
            return;
        }

        if (this.removedEmojis.has(this.currentEmojiIndex)) {
            this.showMessage('This emoji is already removed', 'info');
            return;
        }

        this.removedEmojis.add(this.currentEmojiIndex);
        
        // Move to next available emoji if current one is removed
        this.findNextAvailableEmoji();
        
        this.updateDisplay();
        this.renderRemovedManager();
        this.refreshBrowserIfOpen();
        this.saveState();
        
        const emojiName = this.originalData[Array.from(this.removedEmojis).pop()]?.name || 'Unknown';
        this.showMessage(`Removed "${emojiName}" from dataset`, 'success');
    }

    clearRemovedEmojis() {
        if (this.removedEmojis.size === 0) {
            this.showMessage('No emojis to restore', 'info');
            return;
        }

        const count = this.removedEmojis.size;
        this.removedEmojis.clear();
        
        this.updateDisplay();
        this.renderRemovedManager();
        this.refreshBrowserIfOpen();
        this.saveState();
        
        this.showMessage(`Restored ${count} emojis to dataset`, 'success');
    }

    restoreEmoji(emojiIndex) {
        this.removedEmojis.delete(emojiIndex);
        
        this.updateDisplay();
        this.renderRemovedManager();
        this.refreshBrowserIfOpen();
        this.saveState();
        
        const emojiName = this.originalData[emojiIndex]?.name || 'Unknown';
        this.showMessage(`Restored "${emojiName}" to dataset`, 'success');
    }

    findNextAvailableEmoji() {
        // If current emoji is removed, find the next available one
        if (this.removedEmojis.has(this.currentEmojiIndex)) {
            let nextIndex = this.currentEmojiIndex;
            let attempts = 0;
            
            // Look for next available emoji (with safety limit)
            while (this.removedEmojis.has(nextIndex) && attempts < this.originalData.length) {
                nextIndex = (nextIndex + 1) % this.originalData.length;
                attempts++;
            }
            
            // If all emojis are removed, stay at current (but it will be filtered out)
            if (attempts < this.originalData.length) {
                this.currentEmojiIndex = nextIndex;
            }
        }
    }

    getAvailableEmojis() {
        // Return emojis that haven't been removed
        return this.originalData.filter((emoji, index) => !this.removedEmojis.has(index));
    }

    renderRemovedManager() {
        const container = document.getElementById('removedManager');
        const counter = document.getElementById('removedCounter');
        
        counter.textContent = `${this.removedEmojis.size} removed`;
        
        if (this.removedEmojis.size === 0) {
            container.innerHTML = '<div class="no-data">No emojis removed</div>';
            return;
        }

        const removedIndices = Array.from(this.removedEmojis).sort((a, b) => a - b);
        
        container.innerHTML = removedIndices.map(index => {
            const emoji = this.originalData[index];
            if (!emoji) return '';
            
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
                <div class="removed-emoji-item">
                    <div class="removed-emoji-icon">${emojiChar}</div>
                    <div class="removed-emoji-info">
                        <div class="removed-emoji-name">${emoji.name || 'Unknown'}</div>
                        <div class="removed-emoji-details">
                            <span class="removed-emoji-detail">Index: ${index}</span>
                            <span class="removed-emoji-detail">Category: ${emoji.category || 'N/A'}</span>
                            ${emoji.short_name ? `<span class="removed-emoji-detail">:${emoji.short_name}:</span>` : ''}
                        </div>
                    </div>
                    <div class="removed-emoji-actions">
                        <button class="btn btn-small btn-restore" onclick="emojiPasta.restoreEmoji(${index})" title="Restore this emoji">
                            ↩️ Restore
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showBulkRemoveModal() {
        document.getElementById('bulkRemoveModal').classList.add('active');
        
        // Reset modal state
        document.getElementById('bulkEmojiInput').value = '';
        document.getElementById('bulkRemovePreview').style.display = 'none';
        document.getElementById('executeBulkRemove').disabled = true;
        this.bulkRemoveMatches = [];
        
        this.updateInputStats();
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.closeBulkRemoveOnClickOutside);
        }, 100);
    }

    hideBulkRemoveModal() {
        document.getElementById('bulkRemoveModal').classList.remove('active');
        document.removeEventListener('click', this.closeBulkRemoveOnClickOutside);
    }

    closeBulkRemoveOnClickOutside = (e) => {
        const modal = document.getElementById('bulkRemoveModal');
        const content = modal.querySelector('.bulk-remove-content');
        if (modal.classList.contains('active') && !content.contains(e.target)) {
            this.hideBulkRemoveModal();
        }
    }

    updateInputStats() {
        const input = document.getElementById('bulkEmojiInput').value;
        const emojis = this.extractEmojisFromText(input);
        const count = emojis.length;
        
        document.getElementById('inputEmojiCount').textContent = `${count} emoji${count !== 1 ? 's' : ''} detected`;
        
        // Hide preview when input changes
        document.getElementById('bulkRemovePreview').style.display = 'none';
        document.getElementById('executeBulkRemove').disabled = true;
    }

    extractEmojisFromText(text) {
        // Enhanced regex to capture emoji characters including compound emojis and skin tones
        // Added \u{1FA00}-\u{1FAFF} range for newer emojis like tombstone 🪦
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE00}-\u{FE0F}]|[\u{1F200}-\u{1F2FF}]|[\u{E000}-\u{F8FF}]|(?:[\u{1F1E6}-\u{1F1FF}][\u{1F1E6}-\u{1F1FF}])|(?:[\u{1F3FB}-\u{1F3FF}])|(?:\u{200D})|(?:[\u{2640}\u{2642}]\u{FE0F}?)|(?:\u{FE0F})/gu;
        
        const matches = text.match(emojiRegex) || [];
        return [...new Set(matches)]; // Remove duplicates
    }

    analyzeInputEmojis() {
        const input = document.getElementById('bulkEmojiInput').value;
        if (!input.trim()) {
            this.showMessage('Please enter some emojis first', 'warning');
            return;
        }

        const inputEmojis = this.extractEmojisFromText(input);
        if (inputEmojis.length === 0) {
            this.showMessage('No valid emojis detected in the input', 'warning');
            return;
        }

        // Convert input emojis to unicode codepoints and find matches
        this.bulkRemoveMatches = [];
        const notFound = [];

        inputEmojis.forEach(emojiChar => {
            const unicode = this.emojiToUnicode(emojiChar);
            const matches = this.findEmojisByUnicode(unicode);
            
            if (matches.length > 0) {
                matches.forEach(match => {
                    // Avoid duplicates and already removed emojis
                    if (!this.bulkRemoveMatches.some(m => m.index === match.index) && 
                        !this.removedEmojis.has(match.index)) {
                        this.bulkRemoveMatches.push({
                            index: match.index,
                            emoji: match.emoji,
                            inputChar: emojiChar,
                            unicode: unicode
                        });
                    }
                });
            } else {
                notFound.push(emojiChar);
            }
        });

        this.displayBulkRemovePreview(this.bulkRemoveMatches, notFound);
    }

    emojiToUnicode(emoji) {
        // Convert emoji character to unicode representation
        const codePoints = [];
        let i = 0;
        while (i < emoji.length) {
            const codePoint = emoji.codePointAt(i);
            if (codePoint) {
                codePoints.push(codePoint.toString(16).toUpperCase().padStart(4, '0'));
                i += codePoint > 0xFFFF ? 2 : 1;
            } else {
                i++;
            }
        }
        return codePoints.join('-');
    }

    findEmojisByUnicode(unicode) {
        const matches = [];
        
        this.originalData.forEach((emoji, index) => {
            // Check main unified field
            if (emoji.unified && this.normalizeUnicode(emoji.unified) === this.normalizeUnicode(unicode)) {
                matches.push({ index, emoji, matchType: 'unified' });
            }
            
            // Check skin variations
            if (emoji.skin_variations) {
                Object.values(emoji.skin_variations).forEach(variant => {
                    if (variant.unified && this.normalizeUnicode(variant.unified) === this.normalizeUnicode(unicode)) {
                        matches.push({ index, emoji, matchType: 'variant' });
                    }
                });
            }
        });
        
        return matches;
    }

    normalizeUnicode(unicode) {
        // Normalize unicode string for comparison
        return unicode.replace(/^0+/gm, '').toUpperCase();
    }

    displayBulkRemovePreview(matches, notFound) {
        const previewContainer = document.getElementById('bulkRemovePreview');
        const previewList = document.getElementById('previewList');
        const previewStats = document.getElementById('previewStats');
        
        if (matches.length === 0) {
            previewContainer.style.display = 'none';
            document.getElementById('executeBulkRemove').disabled = true;
            
            if (notFound.length > 0) {
                this.showMessage(`No matches found for: ${notFound.join(' ')}`, 'info');
            }
            return;
        }

        // Display found matches
        previewList.innerHTML = matches.map(match => {
            const emoji = match.emoji;
            return `
                <div class="preview-emoji-item">
                    <div class="preview-emoji-icon">${match.inputChar}</div>
                    <div class="preview-emoji-name">${emoji.name || 'Unknown'}</div>
                </div>
            `;
        }).join('');

        let statsText = `${matches.length} emoji${matches.length !== 1 ? 's' : ''} will be removed`;
        if (notFound.length > 0) {
            statsText += ` • ${notFound.length} not found: ${notFound.join(' ')}`;
        }
        
        previewStats.textContent = statsText;
        previewContainer.style.display = 'block';
        document.getElementById('executeBulkRemove').disabled = false;
    }

    executeBulkRemove() {
        if (!this.bulkRemoveMatches || this.bulkRemoveMatches.length === 0) {
            this.showMessage('No emojis to remove', 'warning');
            return;
        }

        const count = this.bulkRemoveMatches.length;
        
        // Add all matched emojis to removed set
        this.bulkRemoveMatches.forEach(match => {
            this.removedEmojis.add(match.index);
        });

        // Update current emoji if it was removed
        this.findNextAvailableEmoji();

        // Update displays
        this.updateDisplay();
        this.renderRemovedManager();
        this.refreshBrowserIfOpen();
        this.saveState();

        // Close modal and show success message
        this.hideBulkRemoveModal();
        this.showMessage(`Bulk removed ${count} emoji${count !== 1 ? 's' : ''} from dataset`, 'success');
    }

    addNewCategoryMapping() {
        const newMappingName = `Custom Category ${this.categoryMappings.size + 1}`;
        this.categoryMappings.set(newMappingName, []);
        this.renderCategoryManager();
        this.saveState();
        this.showMessage(`Created new category mapping: "${newMappingName}"`, 'success');
    }

    resetCategoryMappings() {
        if (confirm('Are you sure you want to reset all category mappings and exclusions? This will restore original categories.')) {
            this.categoryMappings.clear();
            this.excludedCategories.clear();
            this.selectedCategories.clear();
            this.renderCategoryManager();
            this.renderOutputPreview();
            this.saveState();
            this.showMessage('Reset all category customizations', 'success');
        }
    }

    updateCategoryMapping(oldName, newName) {
        if (oldName === newName) return;
        
        // Check if new name already exists
        if (this.categoryMappings.has(newName)) {
            this.showMessage(`Category mapping "${newName}" already exists`, 'error');
            this.renderCategoryManager(); // Reset the input
            return;
        }

        // Move the mapping to the new name
        const originalCategories = this.categoryMappings.get(oldName);
        this.categoryMappings.delete(oldName);
        this.categoryMappings.set(newName, originalCategories);
        
        // Update exclusion if it was excluded
        if (this.excludedCategories.has(oldName)) {
            this.excludedCategories.delete(oldName);
            this.excludedCategories.add(newName);
        }

        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Renamed category mapping to "${newName}"`, 'success');
    }

    excludeCategoryMapping(mappingName) {
        this.excludedCategories.add(mappingName);
        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Excluded category mapping "${mappingName}"`, 'warning');
    }

    includeCategoryMapping(mappingName) {
        this.excludedCategories.delete(mappingName);
        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Included category mapping "${mappingName}"`, 'success');
    }

    deleteCategoryMapping(mappingName) {
        if (confirm(`Are you sure you want to delete the "${mappingName}" mapping?`)) {
            this.categoryMappings.delete(mappingName);
            this.excludedCategories.delete(mappingName);
            this.renderCategoryManager();
            this.renderOutputPreview();
            this.saveState();
            this.showMessage(`Deleted category mapping "${mappingName}"`, 'success');
        }
    }

    removeCategoryFromMapping(mappingName, categoryToRemove) {
        const originalCategories = this.categoryMappings.get(mappingName);
        if (originalCategories) {
            const index = originalCategories.indexOf(categoryToRemove);
            if (index !== -1) {
                originalCategories.splice(index, 1);
                
                // If no categories left, delete the mapping
                if (originalCategories.length === 0) {
                    this.categoryMappings.delete(mappingName);
                    this.excludedCategories.delete(mappingName);
                }
                
                this.renderCategoryManager();
                this.renderOutputPreview();
                this.saveState();
                this.showMessage(`Removed "${categoryToRemove}" from "${mappingName}"`, 'success');
            }
        }
    }

    selectCategoryForMapping(categoryName) {
        // Find if there are any existing mappings to add this to, or create a new one
        const mappingNames = Array.from(this.categoryMappings.keys());
        
        if (mappingNames.length === 0) {
            // Create first mapping
            const newMappingName = categoryName;
            this.categoryMappings.set(newMappingName, [categoryName]);
        } else {
            // Ask user which mapping to add to, or create new one
            let choice = prompt(`Add "${categoryName}" to which mapping?\n\nExisting mappings:\n${mappingNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nEnter number (1-${mappingNames.length}) or type new mapping name:`);
            
            if (choice === null) return; // User cancelled
            
            const choiceNum = parseInt(choice);
            if (choiceNum >= 1 && choiceNum <= mappingNames.length) {
                // Add to existing mapping
                const mappingName = mappingNames[choiceNum - 1];
                const originalCategories = this.categoryMappings.get(mappingName);
                if (!originalCategories.includes(categoryName)) {
                    originalCategories.push(categoryName);
                    this.showMessage(`Added "${categoryName}" to "${mappingName}"`, 'success');
                }
            } else if (choice.trim()) {
                // Create new mapping
                const newMappingName = choice.trim();
                if (this.categoryMappings.has(newMappingName)) {
                    // Add to existing mapping with this name
                    const originalCategories = this.categoryMappings.get(newMappingName);
                    if (!originalCategories.includes(categoryName)) {
                        originalCategories.push(categoryName);
                        this.showMessage(`Added "${categoryName}" to existing "${newMappingName}"`, 'success');
                    }
                } else {
                    // Create new mapping
                    this.categoryMappings.set(newMappingName, [categoryName]);
                    this.showMessage(`Created new mapping "${newMappingName}" with "${categoryName}"`, 'success');
                }
            }
        }
        
        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
    }

    // Category Customization Methods
    analyzeCategoryStructure() {
        this.originalCategories.clear();
        
        // Count emojis in each category
        this.originalData.forEach(emoji => {
            const category = emoji.category || 'Unknown';
            const currentCount = this.originalCategories.get(category) || 0;
            this.originalCategories.set(category, currentCount + 1);
        });

        console.log('Analyzed categories:', this.originalCategories);
    }

    renderCategoryManager() {
        const categoryManager = document.getElementById('categoryManager');
        const categoryCounter = document.getElementById('categoryCounter');
        
        if (this.originalData.length === 0) {
            categoryManager.innerHTML = '<div class="no-data">Load emoji data to customize categories</div>';
            categoryCounter.textContent = '0 categories';
            this.updateCategoryActionButtons();
            return;
        }

        // Build list of all categories (original + custom mappings)
        const allCategories = new Map();
        
        // Add original categories that aren't mapped to anything
        const mappedOriginalCategories = new Set();
        for (const originalCategories of this.categoryMappings.values()) {
            originalCategories.forEach(cat => mappedOriginalCategories.add(cat));
        }
        
        for (const [category, count] of this.originalCategories) {
            if (!mappedOriginalCategories.has(category)) {
                allCategories.set(category, {
                    name: category,
                    count: count,
                    type: 'original',
                    isExcluded: this.excludedCategories.has(category),
                    originalSources: [category]
                });
            }
        }
        
        // Add custom mappings
        for (const [mappingName, originalCategories] of this.categoryMappings) {
            const totalCount = originalCategories.reduce((sum, cat) => sum + (this.originalCategories.get(cat) || 0), 0);
            allCategories.set(mappingName, {
                name: mappingName,
                count: totalCount,
                type: 'mapping',
                isExcluded: this.excludedCategories.has(mappingName),
                originalSources: originalCategories
            });
        }

        // Update counter
        const totalOriginal = this.originalCategories.size;
        const totalMappings = this.categoryMappings.size;
        const totalExcluded = this.excludedCategories.size;
        const selectedCount = this.selectedCategories.size;
        
        categoryCounter.textContent = `${totalOriginal} original, ${totalMappings} custom, ${totalExcluded} excluded${selectedCount > 0 ? ` • ${selectedCount} selected` : ''}`;

        // Build HTML
        let html = '';
        
        // Show selection info if categories are selected
        if (selectedCount > 0) {
            const selectedNames = Array.from(this.selectedCategories).slice(0, 3).join(', ');
            const moreText = selectedCount > 3 ? ` and ${selectedCount - 3} more` : '';
            html += `<div class="category-selection-info">
                ${selectedCount} categor${selectedCount === 1 ? 'y' : 'ies'} selected: ${selectedNames}${moreText}
            </div>`;
        }
        
        // Category grid
        if (allCategories.size > 0) {
            html += '<div class="category-grid">';
            
            for (const [categoryKey, categoryData] of allCategories) {
                const isSelected = this.selectedCategories.has(categoryKey);
                const cssClasses = [
                    'category-card',
                    isSelected ? 'selected' : '',
                    categoryData.isExcluded ? 'excluded' : '',
                    categoryData.type === 'mapping' ? 'custom-mapping' : ''
                ].filter(Boolean).join(' ');
                
                html += `<div class="${cssClasses}" data-category="${categoryKey}" onclick="app.toggleCategorySelection('${categoryKey}')">
                    <div class="category-card-header">
                        <div class="category-name">${categoryData.name}</div>
                        <div class="category-emoji-count">${categoryData.count}</div>
                    </div>
                    
                    <div class="category-card-actions">
                        <button class="category-action-btn view-emojis" onclick="event.stopPropagation(); app.showCategoryEmojis('${categoryKey}')" title="View Emojis">👁️</button>
                        <button class="category-action-btn rename" onclick="event.stopPropagation(); app.renameCategoryInline('${categoryKey}')" title="Rename">✏️</button>
                        <button class="category-action-btn delete" onclick="event.stopPropagation(); app.deleteSingleCategory('${categoryKey}')" title="Delete">🗑️</button>
                    </div>
                    
                    ${categoryData.originalSources.length > 1 ? 
                        `<div class="category-original-sources">Merged from: ${categoryData.originalSources.join(', ')}</div>` : 
                        ''}
                </div>`;
            }
            
            html += '</div>';
        } else {
            html = '<div class="no-data">No categories available</div>';
        }

        categoryManager.innerHTML = html;
        this.updateCategoryActionButtons();
    }

    mergeSelectedCategories() {
        if (this.selectedCategories.size < 2) {
            this.showMessage('Select at least 2 categories to merge', 'warning');
            return;
        }
        
        const selectedNames = Array.from(this.selectedCategories);
        const newName = prompt(`Enter name for merged category:\n\nMerging: ${selectedNames.join(', ')}`, selectedNames[0]);
        
        if (!newName || !newName.trim()) return;
        
        const finalName = newName.trim();
        
        // Collect all original categories from selected items
        const allOriginalCategories = [];
        
        for (const selectedCategory of selectedNames) {
            if (this.categoryMappings.has(selectedCategory)) {
                // It's a custom mapping - add its original categories
                const originals = this.categoryMappings.get(selectedCategory);
                allOriginalCategories.push(...originals);
                // Remove the old mapping
                this.categoryMappings.delete(selectedCategory);
                this.excludedCategories.delete(selectedCategory);
            } else {
                // It's an original category
                allOriginalCategories.push(selectedCategory);
                this.excludedCategories.delete(selectedCategory);
            }
        }
        
        // Create new mapping with all collected original categories
        this.categoryMappings.set(finalName, allOriginalCategories);
        
        // Clear selection
        this.selectedCategories.clear();
        
        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Merged ${selectedNames.length} categories into "${finalName}"`, 'success');
    }

    deleteSelectedCategories() {
        if (this.selectedCategories.size === 0) {
            this.showMessage('No categories selected', 'warning');
            return;
        }
        
        const selectedNames = Array.from(this.selectedCategories);
        const count = selectedNames.length;
        
        if (!confirm(`Are you sure you want to exclude ${count} categor${count === 1 ? 'y' : 'ies'}?\n\n${selectedNames.join(', ')}\n\nThey will be removed from the output.`)) {
            return;
        }
        
        // Add all selected categories to excluded set
        selectedNames.forEach(category => {
            this.excludedCategories.add(category);
        });
        
        // Clear selection
        this.selectedCategories.clear();
        
        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Excluded ${count} categor${count === 1 ? 'y' : 'ies'} from output`, 'success');
    }

    clearCategorySelection() {
        this.selectedCategories.clear();
        this.renderCategoryManager();
    }

    toggleCategorySelection(categoryName) {
        if (this.selectedCategories.has(categoryName)) {
            this.selectedCategories.delete(categoryName);
        } else {
            this.selectedCategories.add(categoryName);
        }
        this.renderCategoryManager();
    }

    updateCategoryActionButtons() {
        const mergeBtn = document.getElementById('mergeCategoriesBtn');
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        const clearBtn = document.getElementById('clearSelectionBtn');
        
        const hasSelection = this.selectedCategories.size > 0;
        const canMerge = this.selectedCategories.size >= 2;
        
        if (mergeBtn) {
            mergeBtn.disabled = !canMerge;
            mergeBtn.title = canMerge ? 'Merge selected categories' : 'Select 2+ categories to merge';
        }
        
        if (deleteBtn) {
            deleteBtn.disabled = !hasSelection;
            deleteBtn.title = hasSelection ? 'Exclude selected categories' : 'Select categories to exclude';
        }
        
        if (clearBtn) {
            clearBtn.disabled = !hasSelection;
            clearBtn.title = hasSelection ? 'Clear selection' : 'No categories selected';
        }
    }

    renameCategoryInline(categoryName) {
        const newName = prompt(`Rename category:`, categoryName);
        if (!newName || !newName.trim() || newName.trim() === categoryName) return;
        
        const finalName = newName.trim();
        
        // Check if new name already exists
        if (this.categoryMappings.has(finalName) || this.originalCategories.has(finalName)) {
            this.showMessage(`Category "${finalName}" already exists`, 'error');
            return;
        }
        
        if (this.categoryMappings.has(categoryName)) {
            // Rename a custom mapping
            const originalCategories = this.categoryMappings.get(categoryName);
            this.categoryMappings.delete(categoryName);
            this.categoryMappings.set(finalName, originalCategories);
            
            // Update exclusion status
            if (this.excludedCategories.has(categoryName)) {
                this.excludedCategories.delete(categoryName);
                this.excludedCategories.add(finalName);
            }
            
            // Update selection if it was selected
            if (this.selectedCategories.has(categoryName)) {
                this.selectedCategories.delete(categoryName);
                this.selectedCategories.add(finalName);
            }
        } else {
            // Rename an original category by creating a mapping
            this.categoryMappings.set(finalName, [categoryName]);
            
            // Update exclusion status
            if (this.excludedCategories.has(categoryName)) {
                this.excludedCategories.delete(categoryName);
                this.excludedCategories.add(finalName);
            }
            
            // Update selection if it was selected
            if (this.selectedCategories.has(categoryName)) {
                this.selectedCategories.delete(categoryName);
                this.selectedCategories.add(finalName);
            }
        }
        
        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Renamed "${categoryName}" to "${finalName}"`, 'success');
    }

    deleteSingleCategory(categoryName) {
        if (!confirm(`Are you sure you want to exclude "${categoryName}"?\n\nIt will be removed from the output.`)) {
            return;
        }
        
        this.excludedCategories.add(categoryName);
        this.selectedCategories.delete(categoryName);
        
        this.renderCategoryManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Excluded "${categoryName}" from output`, 'success');
    }

    addCustomSearchTerm() {
        if (this.originalData.length === 0) {
            this.showMessage('No emoji data loaded', 'warning');
            return;
        }

        this.showSearchTermModal(this.currentEmojiIndex);
    }

    addTermToSpecificEmoji(emojiIndex) {
        this.showSearchTermModal(emojiIndex);
    }

    showSearchTermModal(emojiIndex) {
        const emoji = this.originalData[emojiIndex];
        
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

        // Update modal content
        document.getElementById('searchTermEmojiInfo').innerHTML = `
            <div class="search-term-emoji-icon">${emojiChar}</div>
            <div class="search-term-emoji-name">${emoji.name || 'Unknown Emoji'}</div>
        `;
        
        // Store the emoji index for later use
        this.currentModalEmojiIndex = emojiIndex;
        
        // Clear and focus input
        const input = document.getElementById('searchTermInput');
        input.value = '';
        
        // Show modal
        document.getElementById('searchTermModal').classList.add('active');
        
        // Focus input after a short delay
        setTimeout(() => input.focus(), 100);
        
        // Add Enter key listener
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmAddSearchTerm();
            }
        };
    }

    hideSearchTermModal() {
        document.getElementById('searchTermModal').classList.remove('active');
        delete this.currentModalEmojiIndex;
    }

    confirmAddSearchTerm() {
        const input = document.getElementById('searchTermInput');
        const term = input.value.trim().toLowerCase();
        
        if (!term) {
            this.showMessage('Please enter a search term', 'warning');
            input.focus();
            return;
        }

        const emojiIndex = this.currentModalEmojiIndex;
        const emoji = this.originalData[emojiIndex];
        
        // Get existing custom terms for this emoji
        const currentTerms = this.customSearchTerms.get(emojiIndex) || [];
        
        // Check if term already exists
        const existingTerms = [...(emoji.short_names || []), ...currentTerms];
        
        if (existingTerms.includes(term)) {
            this.showMessage(`"${term}" already exists for this emoji`, 'warning');
            input.focus();
            return;
        }

        // Add the new term
        currentTerms.push(term);
        this.customSearchTerms.set(emojiIndex, currentTerms);
        
        this.hideSearchTermModal();
        this.renderSearchTermsManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Added custom search term: "${term}" to ${emoji.name}`, 'success');
    }

    clearCustomTermsForCurrentEmoji() {
        if (this.originalData.length === 0) {
            this.showMessage('No emoji data loaded', 'warning');
            return;
        }

        const currentTerms = this.customSearchTerms.get(this.currentEmojiIndex);
        if (!currentTerms || currentTerms.length === 0) {
            this.showMessage('No custom terms to clear for this emoji', 'info');
            return;
        }

        this.showConfirmModal(
            'Clear Custom Terms',
            `Clear ${currentTerms.length} custom search term${currentTerms.length === 1 ? '' : 's'} for "${emoji.name || 'Unknown Emoji'}"?`,
            () => {
                this.customSearchTerms.delete(this.currentEmojiIndex);
                this.renderSearchTermsManager();
                this.renderOutputPreview();
                this.saveState();
                this.showMessage('Cleared custom search terms for current emoji', 'success');
            }
        );
    }

    clearCustomTermsForEmoji(emojiIndex) {
        const emoji = this.originalData[emojiIndex];
        const currentTerms = this.customSearchTerms.get(emojiIndex);
        if (!currentTerms || currentTerms.length === 0) {
            this.showMessage('No custom terms to clear for this emoji', 'info');
            return;
        }

        this.showConfirmModal(
            'Clear Custom Terms',
            `Clear ${currentTerms.length} custom search term${currentTerms.length === 1 ? '' : 's'} for "${emoji.name || 'Unknown Emoji'}"?`,
            () => {
                this.customSearchTerms.delete(emojiIndex);
                this.renderSearchTermsManager();
                this.renderOutputPreview();
                this.saveState();
                this.showMessage(`Cleared custom search terms for ${emoji.name}`, 'success');
            }
        );
    }

    resetAllCustomSearchTerms() {
        if (this.customSearchTerms.size === 0) {
            this.showMessage('No custom search terms to reset', 'info');
            return;
        }

        this.showConfirmModal(
            'Reset All Custom Terms',
            `Reset all custom search terms for ${this.customSearchTerms.size} emojis? This cannot be undone.`,
            () => {
                this.customSearchTerms.clear();
                this.renderSearchTermsManager();
                this.renderOutputPreview();
                this.saveState();
                this.showMessage('Reset all custom search terms', 'success');
            }
        );
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        // Store the callback
        this.confirmCallback = onConfirm;
        
        // Show modal
        document.getElementById('confirmModal').classList.add('active');
    }

    hideConfirmModal() {
        document.getElementById('confirmModal').classList.remove('active');
        delete this.confirmCallback;
    }

    confirmAction() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hideConfirmModal();
    }

    removeCustomSearchTerm(emojiIndex, termToRemove) {
        const currentTerms = this.customSearchTerms.get(emojiIndex) || [];
        const updatedTerms = currentTerms.filter(term => term !== termToRemove);
        
        if (updatedTerms.length === 0) {
            this.customSearchTerms.delete(emojiIndex);
        } else {
            this.customSearchTerms.set(emojiIndex, updatedTerms);
        }

        this.renderSearchTermsManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Removed custom term: "${termToRemove}"`, 'success');
    }

    renderSearchTermsManager() {
        const container = document.getElementById('searchTermsManager');
        const counter = document.getElementById('searchTermsCounter');
        
        if (this.originalData.length === 0) {
            container.innerHTML = '<div class="no-data">Load emoji data to add custom search terms</div>';
            counter.textContent = '0 custom terms';
            return;
        }

        // Calculate total custom terms across all emojis
        const totalCustomTerms = Array.from(this.customSearchTerms.values()).reduce((sum, terms) => sum + terms.length, 0);
        const emojisWithCustomTerms = this.customSearchTerms.size;
        
        counter.textContent = `${totalCustomTerms} custom term${totalCustomTerms === 1 ? '' : 's'} across ${emojisWithCustomTerms} emoji${emojisWithCustomTerms === 1 ? '' : 's'}`;

        if (this.customSearchTerms.size === 0) {
            container.innerHTML = `
                <div class="search-terms-empty-state">
                    <div class="empty-state-icon">🏷️</div>
                    <div class="empty-state-title">No Custom Search Terms</div>
                    <div class="empty-state-message">
                        Navigate through emojis and use the "Add Search Term" button to create custom search terms.
                        <br><br>
                        Custom search terms will be merged with original short_names in the output.
                    </div>
                    <div class="empty-state-actions">
                        <button class="btn btn-primary" onclick="emojiPasta.addCustomSearchTerm()">
                            Add Term to Current Emoji
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Build HTML for all emojis with custom terms
        const sortedIndices = Array.from(this.customSearchTerms.keys()).sort((a, b) => a - b);
        
        const emojisHtml = sortedIndices.map(emojiIndex => {
            const emoji = this.originalData[emojiIndex];
            const customTerms = this.customSearchTerms.get(emojiIndex) || [];
            const originalTerms = emoji.short_names || [];
            
            if (customTerms.length === 0) return ''; // Skip if no custom terms

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

            const isCurrentEmoji = emojiIndex === this.currentEmojiIndex;
            const isRemovedEmoji = this.removedEmojis.has(emojiIndex);
            
            return `
                <div class="search-terms-emoji-item ${isCurrentEmoji ? 'current-emoji' : ''} ${isRemovedEmoji ? 'removed-emoji' : ''}" 
                     data-emoji-index="${emojiIndex}" 
                     onclick="emojiPasta.selectEmojiFromTermsView(${emojiIndex})">
                    
                    <div class="search-terms-emoji-layout">
                        <!-- Left Side: Original Emoji Data -->
                        <div class="search-terms-left-panel">
                            <div class="search-terms-emoji-header">
                                <div class="search-terms-emoji-icon">${emojiChar}</div>
                                <div class="search-terms-emoji-info">
                                    <div class="search-terms-emoji-name">${emoji.name || 'Unknown Emoji'}</div>
                                    <div class="search-terms-emoji-meta">
                                        <span class="emoji-meta-badge">Index: ${emojiIndex}</span>
                                        ${emoji.category ? `<span class="emoji-meta-badge">${emoji.category}</span>` : ''}
                                        ${isCurrentEmoji ? '<span class="emoji-meta-badge current-badge">Current</span>' : ''}
                                        ${isRemovedEmoji ? '<span class="emoji-meta-badge removed-badge">Removed</span>' : ''}
                                    </div>
                                </div>
                            </div>
                            ${originalTerms.length > 0 ? `
                                <div class="search-terms-original">
                                    <div class="original-terms-label">Original Terms (${originalTerms.length}):</div>
                                    <div class="original-terms-list">
                                        ${originalTerms.map(term => `<span class="original-term-inline">${term}</span>`).join('')}
                                    </div>
                                </div>
                            ` : '<div class="no-original-terms">No original terms</div>'}
                        </div>
                        
                        <!-- Right Side: Custom Terms -->
                        <div class="search-terms-right-panel">
                            <div class="search-terms-custom-header">
                                <div class="custom-terms-label">Custom Terms (${customTerms.length})</div>
                                <div class="search-terms-actions">
                                    <button class="search-terms-action-btn add-btn" onclick="event.stopPropagation(); emojiPasta.addTermToSpecificEmoji(${emojiIndex})" title="Add term">
                                        +
                                    </button>
                                    <button class="search-terms-action-btn clear-btn" onclick="event.stopPropagation(); emojiPasta.clearCustomTermsForEmoji(${emojiIndex})" title="Clear custom terms">
                                        ×
                                    </button>
                                </div>
                            </div>
                            <div class="custom-terms-list">
                                ${customTerms.length > 0 ? customTerms.map(term => `
                                    <span class="custom-term-tag">
                                        ${term}
                                        <button class="custom-term-remove" onclick="event.stopPropagation(); emojiPasta.removeCustomSearchTerm(${emojiIndex}, '${term}')" title="Remove">×</button>
                                    </span>
                                `).join('') : '<span class="no-custom-terms">No custom terms yet</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).filter(html => html).join('');

        container.innerHTML = `
            <div class="search-terms-container">
                <div class="search-terms-header">
                    <div class="search-terms-summary">
                        <div class="summary-stats">
                            <span class="stat-item">
                                <span class="stat-value">${emojisWithCustomTerms}</span>
                                <span class="stat-label">emoji${emojisWithCustomTerms === 1 ? '' : 's'} with custom terms</span>
                            </span>
                            <span class="stat-item">
                                <span class="stat-value">${totalCustomTerms}</span>
                                <span class="stat-label">total custom terms</span>
                            </span>
                        </div>
                    </div>
                    <div class="search-terms-actions">
                        <button class="btn btn-small btn-primary" onclick="emojiPasta.addCustomSearchTerm()" title="Add term to current emoji">
                            Add to Current
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="emojiPasta.showBulkAddTermsModal()" title="Bulk add terms to current emoji">
                            Bulk Add
                        </button>
                        <button class="btn btn-small btn-danger" onclick="emojiPasta.resetAllCustomSearchTerms()" title="Remove all custom search terms">
                            Reset All
                        </button>
                    </div>
                </div>
                
                <div class="all-custom-terms-list">
                    ${emojisHtml}
                </div>
            </div>
        `;
    }

    addSearchTermFromInput() {
        const input = document.getElementById('newSearchTermInput');
        if (!input) return;

        const newTerm = input.value.trim().toLowerCase();
        if (!newTerm) {
            this.showMessage('Please enter a search term', 'warning');
            return;
        }

        // Get existing terms for current emoji
        const currentTerms = this.customSearchTerms.get(this.currentEmojiIndex) || [];
        const emoji = this.originalData[this.currentEmojiIndex];
        const existingTerms = [...(emoji.short_names || []), ...currentTerms];
        
        if (existingTerms.includes(newTerm)) {
            this.showMessage(`"${newTerm}" already exists for this emoji`, 'warning');
            input.focus();
            return;
        }

        // Add the new term
        currentTerms.push(newTerm);
        this.customSearchTerms.set(this.currentEmojiIndex, currentTerms);
        
        // Clear input and re-render
        input.value = '';
        this.renderSearchTermsManager();
        this.renderOutputPreview();
        this.saveState();
        this.showMessage(`Added custom search term: "${newTerm}"`, 'success');
        
        // Focus input for easy addition of more terms
        setTimeout(() => input.focus(), 100);
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panels
        document.querySelectorAll('.tool-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tool-panel').forEach(panel => panel.classList.remove('active'));
        
        // Add active class to selected tab and panel
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Force update JSON views when switching to field manager tab
        if (tabName === 'field-manager' && this.originalData.length > 0) {
            setTimeout(() => {
                this.renderOriginalStructure();
                this.renderOutputPreview();
            }, 10);
        }
        
        // Update search terms when switching to that tab
        if (tabName === 'search-terms' && this.originalData.length > 0) {
            setTimeout(() => {
                this.renderSearchTermsManager();
            }, 10);
        }
    }

    showBulkAddTermsModal() {
        if (this.originalData.length === 0) {
            this.showMessage('No emoji data loaded', 'warning');
            return;
        }

        document.getElementById('bulkAddTermsModal').classList.add('active');
        
        // Reset modal state
        document.getElementById('bulkTermsInput').value = '';
        document.getElementById('bulkAddPreview').style.display = 'none';
        document.getElementById('executeBulkAddTerms').disabled = true;
        this.bulkAddMatches = [];
        
        // Update current emoji display in modal
        this.updateBulkAddCurrentEmoji();
        this.updateInputTermsStats();
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.closeBulkAddTermsOnClickOutside);
        }, 100);
    }

    hideBulkAddTermsModal() {
        document.getElementById('bulkAddTermsModal').classList.remove('active');
        document.removeEventListener('click', this.closeBulkAddTermsOnClickOutside);
    }

    closeBulkAddTermsOnClickOutside = (e) => {
        const modal = document.getElementById('bulkAddTermsModal');
        const content = modal.querySelector('.bulk-add-terms-content');
        if (modal.classList.contains('active') && !content.contains(e.target)) {
            this.hideBulkAddTermsModal();
        }
    }

    updateBulkAddCurrentEmoji() {
        const currentEmoji = this.originalData[this.currentEmojiIndex];
        
        // Try to render actual emoji
        let emojiChar = '📝';
        if (currentEmoji.unified) {
            try {
                const codePoints = currentEmoji.unified.split('-').map(hex => parseInt(hex, 16));
                emojiChar = String.fromCodePoint(...codePoints);
            } catch (e) {
                emojiChar = '📝';
            }
        }

        document.getElementById('bulkAddCurrentEmoji').innerHTML = `
            <div class="current-emoji-icon">${emojiChar}</div>
            <div class="current-emoji-info">
                <div class="current-emoji-name">${currentEmoji.name || 'Unknown Emoji'}</div>
                <div class="current-emoji-details">
                    <span class="emoji-detail-badge">Index: ${this.currentEmojiIndex}</span>
                    <span class="emoji-detail-badge">Category: ${currentEmoji.category || 'N/A'}</span>
                    ${currentEmoji.short_name ? `<span class="emoji-detail-badge">:${currentEmoji.short_name}:</span>` : ''}
                </div>
            </div>
        `;
    }

    updateInputTermsStats() {
        const input = document.getElementById('bulkTermsInput').value;
        const lines = input.split('\n').filter(line => line.trim().length > 0);
        const terms = input.split(/[\n,]/).map(term => term.trim()).filter(term => term.length > 0);
        
        document.getElementById('inputTermsCount').textContent = `${terms.length} terms detected`;
        
        // Hide preview when input changes
        document.getElementById('bulkAddPreview').style.display = 'none';
        document.getElementById('executeBulkAddTerms').disabled = true;
    }

    analyzeInputTerms() {
        const input = document.getElementById('bulkTermsInput').value;
        if (!input.trim()) {
            this.showMessage('Please enter some search terms first', 'warning');
            return;
        }

        // Parse the enhanced format that supports emoji-specific terms
        const parsedData = this.parseEmojiSpecificTerms(input);
        
        if (parsedData.length === 0) {
            this.showMessage('No valid terms or emojis detected in the input', 'warning');
            return;
        }

        this.bulkAddMatches = parsedData;
        this.displayBulkAddPreview(parsedData);
    }

    parseEmojiSpecificTerms(input) {
        const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const results = [];
        const debugInfo = []; // For debugging

        debugInfo.push(`=== BULK ADD PARSING START ===`);
        debugInfo.push(`Input lines: ${lines.length}`);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            debugInfo.push(`\n--- LINE ${i + 1}: "${line}" ---`);
            
            // Check if line contains identifier: terms format
            if (line.includes(':')) {
                const [identifierPart, ...termsParts] = line.split(':');
                const identifier = identifierPart.trim();
                const termsText = termsParts.join(':').trim(); // Join back in case terms contain ":"
                
                debugInfo.push(`  Has colon - parsing as identifier:terms format`);
                debugInfo.push(`  Identifier: "${identifier}"`);
                debugInfo.push(`  Terms: "${termsText}"`);
                
                if (!identifier || !termsText) {
                    debugInfo.push(`  ❌ Malformed line - missing identifier or terms`);
                    continue;
                }
                
                // Parse terms
                const terms = termsText
                    .split(',')
                    .map(term => term.trim().toLowerCase())
                    .filter(term => term.length > 0);
                
                debugInfo.push(`  Parsed ${terms.length} terms: [${terms.join(', ')}]`);
                
                if (terms.length === 0) {
                    debugInfo.push(`  ❌ No valid terms found after parsing`);
                    continue;
                }
                
                // Find emoji by identifier
                debugInfo.push(`  🔍 Searching for emoji with identifier: "${identifier}"`);
                const foundEmoji = this.findEmojiBySimpleIdentifier(identifier, debugInfo);
                
                if (foundEmoji) {
                    debugInfo.push(`  ✅ FOUND EMOJI: ${foundEmoji.emoji.name} (index: ${foundEmoji.index})`);
                    
                    // Filter out existing terms
                    const existingTerms = [...(foundEmoji.emoji.short_names || []), ...(this.customSearchTerms.get(foundEmoji.index) || [])];
                    const newTerms = terms.filter(term => !existingTerms.includes(term));
                    const duplicateTerms = terms.filter(term => existingTerms.includes(term));
                    
                    debugInfo.push(`  📋 Existing terms: [${existingTerms.join(', ')}]`);
                    debugInfo.push(`  🆕 New terms: [${newTerms.join(', ')}]`);
                    debugInfo.push(`  🔄 Duplicates: [${duplicateTerms.join(', ')}]`);
                    
                    if (newTerms.length > 0) {
                        results.push({
                            emojiIndex: foundEmoji.index,
                            emoji: foundEmoji.emoji,
                            emojiChar: foundEmoji.char,
                            newTerms: newTerms,
                            duplicateTerms: duplicateTerms,
                            identifierUsed: identifier,
                            matchMethod: foundEmoji.method
                        });
                        debugInfo.push(`  ✅ ADDED TO RESULTS - ${newTerms.length} new terms`);
                    } else {
                        debugInfo.push(`  ⚠️ No new terms to add (all duplicates)`);
                    }
                } else {
                    debugInfo.push(`  ❌ NO EMOJI FOUND for identifier: "${identifier}"`);
                }
            } else {
                debugInfo.push(`  No colon - treating as terms for current emoji`);
                // No colon - treat as terms for current emoji
                const terms = line
                    .split(',')
                    .map(term => term.trim().toLowerCase())
                    .filter(term => term.length > 0);
                
                if (terms.length > 0) {
                    const currentEmoji = this.originalData[this.currentEmojiIndex];
                    const existingTerms = [...(currentEmoji.short_names || []), ...(this.customSearchTerms.get(this.currentEmojiIndex) || [])];
                    const newTerms = terms.filter(term => !existingTerms.includes(term));
                    const duplicateTerms = terms.filter(term => existingTerms.includes(term));
                    
                    if (newTerms.length > 0) {
                        // Try to render actual emoji for current emoji
                        let emojiChar = '📝';
                        if (currentEmoji.unified) {
                            try {
                                const codePoints = currentEmoji.unified.split('-').map(hex => parseInt(hex, 16));
                                emojiChar = String.fromCodePoint(...codePoints);
                            } catch (e) {
                                emojiChar = '📝';
                            }
                        }
                        
                        debugInfo.push(`  ✅ Adding ${newTerms.length} terms to current emoji: ${currentEmoji.name}`);
                        
                        results.push({
                            emojiIndex: this.currentEmojiIndex,
                            emoji: currentEmoji,
                            emojiChar: emojiChar,
                            newTerms: newTerms,
                            duplicateTerms: duplicateTerms,
                            identifierUsed: 'current emoji',
                            matchMethod: 'current'
                        });
                    }
                }
            }
        }

        debugInfo.push(`\n=== PARSING COMPLETE ===`);
        debugInfo.push(`Total results: ${results.length}`);
        results.forEach((result, i) => {
            debugInfo.push(`Result ${i + 1}: ${result.emojiChar} ${result.emoji.name} - ${result.newTerms.length} terms`);
        });

        // Log debug info to console
        console.log('🔍 DETAILED BULK ADD DEBUG:');
        debugInfo.forEach(info => console.log(info));
        
        return results;
    }

    findEmojiBySimpleIdentifier(identifier, debugInfo) {
        debugInfo.push(`    🔍 SEARCHING: "${identifier}"`);
        
        // Method 1: Try as emoji character
        debugInfo.push(`    Method 1: Checking if "${identifier}" contains emoji characters...`);
        const emojiChars = this.extractEmojisFromText(identifier);
        debugInfo.push(`    Extracted ${emojiChars.length} emoji chars: [${emojiChars.join(', ')}]`);
        
        if (emojiChars.length > 0) {
            const emojiChar = emojiChars[0]; // Just take the first one
            debugInfo.push(`    Using first emoji char: "${emojiChar}"`);
            
            const unicode = this.emojiToUnicode(emojiChar);
            debugInfo.push(`    Converted to unicode: "${unicode}"`);
            
            const matches = this.findEmojisByUnicode(unicode);
            debugInfo.push(`    Found ${matches.length} matches in dataset`);
            
            if (matches.length > 0) {
                const match = matches[0];
                debugInfo.push(`    ✅ METHOD 1 SUCCESS: Found "${match.emoji.name}" at index ${match.index}`);
                return {
                    index: match.index,
                    emoji: match.emoji,
                    char: emojiChar,
                    method: 'emoji-char'
                };
            } else {
                debugInfo.push(`    ❌ Method 1 failed - no matches found for unicode "${unicode}"`);
            }
        } else {
            debugInfo.push(`    ❌ Method 1 failed - no emoji characters found in "${identifier}"`);
        }
        
        // Method 2: Try as index number
        debugInfo.push(`    Method 2: Checking if "${identifier}" is a valid index number...`);
        const indexNumber = parseInt(identifier);
        if (!isNaN(indexNumber) && indexNumber >= 0 && indexNumber < this.originalData.length) {
            debugInfo.push(`    ✅ METHOD 2 SUCCESS: Valid index ${indexNumber}`);
            const emoji = this.originalData[indexNumber];
            let emojiChar = '📝';
            if (emoji.unified) {
                try {
                    const codePoints = emoji.unified.split('-').map(hex => parseInt(hex, 16));
                    emojiChar = String.fromCodePoint(...codePoints);
                } catch (e) {
                    emojiChar = '📝';
                }
            }
            return {
                index: indexNumber,
                emoji: emoji,
                char: emojiChar,
                method: 'index'
            };
        } else {
            debugInfo.push(`    ❌ Method 2 failed - "${identifier}" is not a valid index (parsed as ${indexNumber})`);
        }
        
        // Method 3: Try as short name
        debugInfo.push(`    Method 3: Checking if "${identifier}" matches any short names...`);
        const shortNameMatch = this.originalData.find((emoji, index) => {
            const matchesShortName = emoji.short_name === identifier;
            const matchesShortNames = emoji.short_names && emoji.short_names.includes(identifier);
            if (matchesShortName || matchesShortNames) {
                debugInfo.push(`    Found match: "${emoji.name}" (short_name: "${emoji.short_name}", short_names: [${(emoji.short_names || []).join(', ')}])`);
                return true;
            }
            return false;
        });
        
        if (shortNameMatch) {
            debugInfo.push(`    ✅ METHOD 3 SUCCESS: Found "${shortNameMatch.name}"`);
            const index = this.originalData.indexOf(shortNameMatch);
            let emojiChar = '📝';
            if (shortNameMatch.unified) {
                try {
                    const codePoints = shortNameMatch.unified.split('-').map(hex => parseInt(hex, 16));
                    emojiChar = String.fromCodePoint(...codePoints);
                } catch (e) {
                    emojiChar = '📝';
                }
            }
            return {
                index: index,
                emoji: shortNameMatch,
                char: emojiChar,
                method: 'short-name'
            };
        } else {
            debugInfo.push(`    ❌ Method 3 failed - no emoji found with short_name or short_names matching "${identifier}"`);
        }
        
        debugInfo.push(`    ❌ ALL METHODS FAILED for identifier: "${identifier}"`);
        return null;
    }

    displayBulkAddPreview(parsedData) {
        const previewContainer = document.getElementById('bulkAddPreview');
        const previewList = document.getElementById('termsPreviewList');
        const previewStats = document.getElementById('termsPreviewStats');
        
        if (parsedData.length === 0) {
            previewContainer.style.display = 'none';
            document.getElementById('executeBulkAddTerms').disabled = true;
            return;
        }

        // Group by emoji for display
        const emojiGroups = new Map();
        let totalNewTerms = 0;
        let totalDuplicates = 0;

        for (const data of parsedData) {
            const key = data.emojiIndex;
            if (!emojiGroups.has(key)) {
                emojiGroups.set(key, {
                    emoji: data.emoji,
                    emojiChar: data.emojiChar,
                    allNewTerms: [],
                    allDuplicates: [],
                    methods: []
                });
            }
            const group = emojiGroups.get(key);
            group.allNewTerms.push(...data.newTerms);
            group.allDuplicates.push(...data.duplicateTerms);
            group.methods.push(data.matchMethod);
            totalNewTerms += data.newTerms.length;
            totalDuplicates += data.duplicateTerms.length;
        }

        // Improved preview HTML with better layout
        const html = Array.from(emojiGroups.values()).map(group => {
            const uniqueNewTerms = [...new Set(group.allNewTerms)];
            const uniqueDuplicates = [...new Set(group.allDuplicates)];
            
            return `
                <div class="bulk-add-emoji-preview">
                    <div class="bulk-add-emoji-header">
                        <div class="bulk-add-emoji-info">
                            <span class="bulk-add-emoji-icon">${group.emojiChar}</span>
                            <div class="bulk-add-emoji-details">
                                <div class="bulk-add-emoji-name">${group.emoji.name}</div>
                                <div class="bulk-add-emoji-meta">
                                    ${uniqueNewTerms.length} new term${uniqueNewTerms.length !== 1 ? 's' : ''}
                                    ${uniqueDuplicates.length > 0 ? ` • ${uniqueDuplicates.length} duplicate${uniqueDuplicates.length !== 1 ? 's' : ''} skipped` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${uniqueNewTerms.length > 0 ? `
                        <div class="bulk-add-terms-section">
                            <div class="bulk-add-section-title">✅ New Terms to Add:</div>
                            <div class="bulk-add-terms-grid">
                                ${uniqueNewTerms.map(term => `
                                    <span class="bulk-add-term-tag new-term">${term}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${uniqueDuplicates.length > 0 ? `
                        <div class="bulk-add-terms-section">
                            <div class="bulk-add-section-title">⚠️ Duplicates Skipped:</div>
                            <div class="bulk-add-terms-grid">
                                ${uniqueDuplicates.map(term => `
                                    <span class="bulk-add-term-tag duplicate-term">${term}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        previewList.innerHTML = html;
        
        // Update stats
        const actualNewTerms = Array.from(emojiGroups.values()).reduce((sum, group) => sum + [...new Set(group.allNewTerms)].length, 0);
        let statsText = `${actualNewTerms} term${actualNewTerms !== 1 ? 's' : ''} will be added to ${emojiGroups.size} emoji${emojiGroups.size !== 1 ? 's' : ''}`;
        if (totalDuplicates > 0) {
            statsText += ` • ${totalDuplicates} duplicate${totalDuplicates !== 1 ? 's' : ''} skipped`;
        }
        
        previewStats.textContent = statsText;
        previewContainer.style.display = 'block';
        document.getElementById('executeBulkAddTerms').disabled = false;
    }

    executeBulkAddTerms() {
        if (!this.bulkAddMatches || this.bulkAddMatches.length === 0) {
            this.showMessage('No terms to add', 'warning');
            return;
        }

        let totalTermsAdded = 0;
        const affectedEmojis = new Set();
        
        // Add terms to each emoji
        for (const data of this.bulkAddMatches) {
            const emojiIndex = data.emojiIndex;
            const newTerms = data.newTerms;
            
            if (newTerms.length > 0) {
                const currentTerms = this.customSearchTerms.get(emojiIndex) || [];
                currentTerms.push(...newTerms);
                this.customSearchTerms.set(emojiIndex, currentTerms);
                totalTermsAdded += newTerms.length;
                affectedEmojis.add(emojiIndex);
            }
        }

        // Update displays
        this.renderSearchTermsManager();
        this.renderOutputPreview();
        this.saveState();

        // Close modal and show success message
        this.hideBulkAddTermsModal();
        this.showMessage(`Bulk added ${totalTermsAdded} search term${totalTermsAdded !== 1 ? 's' : ''} to ${affectedEmojis.size} emoji${affectedEmojis.size !== 1 ? 's' : ''}`, 'success');
    }

    selectEmojiFromTermsView(emojiIndex) {
        this.currentEmojiIndex = emojiIndex;
        this.currentVariant = 'default';
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.saveState();
        
        const emoji = this.originalData[emojiIndex];
        this.showMessage(`Selected: ${emoji.name || 'Unknown Emoji'}`, 'success');
        
        // Update the search terms view to highlight current emoji
        this.renderSearchTermsManager();
    }

    async detectCustomSearchTermsFromData(uploadedData) {
        try {
            console.log('🔍 Comparing uploaded data with base data for custom search terms...');
            
            // Create a map of uploaded emoji data keyed by unified code
            const uploadedEmojiMap = new Map();
            uploadedData.forEach(emoji => {
                if (emoji.unified) {
                    uploadedEmojiMap.set(emoji.unified, emoji);
                }
            });
            
            console.log(`📊 Uploaded data map created with ${uploadedEmojiMap.size} emojis`);
            
            // Clear existing custom search terms
            this.customSearchTerms.clear();
            let totalCustomTerms = 0;
            
            // Compare base data with uploaded data
            this.originalData.forEach((baseEmoji, index) => {
                if (!baseEmoji.unified) return;
                
                const uploadedEmoji = uploadedEmojiMap.get(baseEmoji.unified);
                if (!uploadedEmoji) return;
                
                // Compare short_names arrays
                const baseTerms = new Set(baseEmoji.short_names || []);
                const uploadedTerms = uploadedEmoji.short_names || [];
                
                const customTerms = uploadedTerms.filter(term => !baseTerms.has(term));
                
                if (customTerms.length > 0) {
                    this.customSearchTerms.set(index, customTerms);
                    totalCustomTerms += customTerms.length;
                    
                    // Get emoji character for logging
                    let emojiChar = '📝';
                    try {
                        const codePoints = baseEmoji.unified.split('-').map(hex => parseInt(hex, 16));
                        emojiChar = String.fromCodePoint(...codePoints);
                    } catch (e) {
                        // fallback already set
                    }
                    
                    console.log(`🏷️ Found ${customTerms.length} custom terms for ${emojiChar} (${baseEmoji.name}): [${customTerms.join(', ')}]`);
                }
            });
            
            console.log(`✅ Custom search terms detection complete: ${this.customSearchTerms.size} emojis with ${totalCustomTerms} total custom terms`);
            
        } catch (error) {
            console.error('❌ Failed to detect custom search terms from uploaded data:', error);
        }
    }

    showChangeSummaryModal() {
        if (!this.appliedChanges) return;
        
        const changes = this.appliedChanges;
        const statsContainer = document.getElementById('changesStats');
        const detailsContainer = document.getElementById('changesDetails');
        
        // Build stats cards
        const stats = [
            { number: this.originalData.length, label: 'Base Emojis Loaded' },
            { number: changes.fieldsRemoved, label: 'Fields Removed' },
            { number: changes.emojisRemoved, label: 'Emojis Removed' },
            { number: changes.customSearchTerms, label: 'Custom Terms Applied' }
        ];
        
        statsContainer.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <span class="stat-number">${stat.number}</span>
                <span class="stat-label">${stat.label}</span>
            </div>
        `).join('');
        
        // Build details list
        if (changes.details.length > 0) {
            detailsContainer.innerHTML = `
                <h4>Applied Changes:</h4>
                <ul>
                    ${changes.details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
            `;
        } else {
            detailsContainer.innerHTML = '<p>No changes were applied from the loaded file.</p>';
        }
        
        // Show modal
        document.getElementById('changesSummaryModal').classList.add('active');
    }

    hideChangesSummaryModal() {
        document.getElementById('changesSummaryModal').classList.remove('active');
        
        // Clean up applied changes data
        delete this.appliedChanges;
        delete this.uploadedEmojiData;
    }

    showCategoryEmojis(categoryKey) {
        console.log(`🔍 Showing emojis for category: ${categoryKey}`);
        
        // Build list of all categories (same logic as renderCategoryManager)
        const allCategories = new Map();
        
        // Add original categories that aren't mapped to anything
        const mappedOriginalCategories = new Set();
        for (const originalCategories of this.categoryMappings.values()) {
            originalCategories.forEach(cat => mappedOriginalCategories.add(cat));
        }
        
        for (const [category, count] of this.originalCategories) {
            if (!mappedOriginalCategories.has(category)) {
                allCategories.set(category, {
                    name: category,
                    count: count,
                    type: 'original',
                    isExcluded: this.excludedCategories.has(category),
                    originalSources: [category]
                });
            }
        }
        
        // Add custom mappings
        for (const [mappingName, originalCategories] of this.categoryMappings) {
            const totalCount = originalCategories.reduce((sum, cat) => sum + (this.originalCategories.get(cat) || 0), 0);
            allCategories.set(mappingName, {
                name: mappingName,
                count: totalCount,
                type: 'mapping',
                isExcluded: this.excludedCategories.has(mappingName),
                originalSources: originalCategories
            });
        }
        
        // Find the category data
        const categoryData = allCategories.get(categoryKey);
        
        if (!categoryData) {
            this.showMessage('Category not found', 'error');
            return;
        }
        
        // Get all emojis for this category
        const categoryEmojis = [];
        const originalCategories = categoryData.originalSources || [categoryKey];
        
        this.originalData.forEach((emoji, index) => {
            // Skip removed emojis
            if (this.removedEmojis.has(index)) return;
            
            const emojiCategory = emoji.category;
            if (originalCategories.includes(emojiCategory)) {
                categoryEmojis.push({ emoji, index });
            }
        });
        
        // Update modal title and count
        const title = document.getElementById('categoryEmojisTitle');
        const grid = document.getElementById('categoryEmojisGrid');
        const footer = document.getElementById('categoryEmojisFooter');
        
        title.innerHTML = `📁 ${categoryData.name} <span class="category-emojis-count">${categoryEmojis.length}</span>`;
        footer.textContent = `${categoryEmojis.length} emojis in this category • Click any emoji to select it`;
        
        // Render emoji grid
        let html = '';
        categoryEmojis.forEach(({ emoji, index }) => {
            const isCurrentEmoji = index === this.currentEmojiIndex;
            
            // Get emoji character
            let emojiChar = '📝';
            try {
                if (emoji.unified) {
                    const codePoints = emoji.unified.split('-').map(hex => parseInt(hex, 16));
                    emojiChar = String.fromCodePoint(...codePoints);
                }
            } catch (e) {
                // fallback already set
            }
            
            // Create metadata badges
            const badges = [];
            if (emoji.subcategory) badges.push(emoji.subcategory);
            if (emoji.added_in) badges.push(`v${emoji.added_in}`);
            if (emoji.has_img_apple) badges.push('Apple');
            if (emoji.has_img_google) badges.push('Google');
            
            const badgesHtml = badges.map(badge => 
                `<span class="category-emoji-badge">${badge}</span>`
            ).join('');
            
            html += `
                <div class="category-emoji-item ${isCurrentEmoji ? 'current-emoji' : ''}" 
                     onclick="app.selectEmojiFromCategory(${index})">
                    <div class="category-emoji-header">
                        <div class="category-emoji-icon">${emojiChar}</div>
                        <div class="category-emoji-info">
                            <div class="category-emoji-name">${emoji.name || 'Unnamed Emoji'}</div>
                            <div class="category-emoji-meta">
                                ${badgesHtml}
                            </div>
                        </div>
                    </div>
                    <div class="category-emoji-actions">
                        <button class="category-emoji-copy-btn" onclick="event.stopPropagation(); app.copyEmojiName('${(emoji.name || 'Unnamed Emoji').replace(/'/g, "\\'")}', this)" title="Copy name to clipboard">
                            📋 Copy Name
                        </button>
                    </div>
                </div>
            `;
        });
        
        if (categoryEmojis.length === 0) {
            html = '<div class="no-data">No emojis found in this category</div>';
        }
        
        grid.innerHTML = html;
        
        // Show modal
        const modal = document.getElementById('categoryEmojisModal');
        modal.classList.add('active');
        
        // Add close event listeners
        this.setupCategoryEmojisModalListeners();
    }

    setupCategoryEmojisModalListeners() {
        const modal = document.getElementById('categoryEmojisModal');
        const closeBtn = document.getElementById('closeCategoryEmojis');
        
        // Close button
        closeBtn.onclick = () => this.hideCategoryEmojis();
        
        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.hideCategoryEmojis();
            }
        };
        
        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideCategoryEmojis();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    hideCategoryEmojis() {
        const modal = document.getElementById('categoryEmojisModal');
        modal.classList.remove('active');
    }

    selectEmojiFromCategory(emojiIndex) {
        // Update current emoji
        this.currentEmojiIndex = emojiIndex;
        this.currentVariant = 'default';
        
        // Update displays
        this.updateEmojiDisplay();
        this.renderOriginalStructure();
        this.renderOutputPreview();
        this.renderSearchTermsManager(); // Update search terms view
        this.saveState();
        
        // Close modal
        this.hideCategoryEmojis();
        
        // Show success message
        const emoji = this.originalData[emojiIndex];
        this.showMessage(`Selected: ${emoji.name || 'Unknown Emoji'}`, 'success');
        
        // Scroll to top of main content if needed
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    copyEmojiName(emojiName, button) {
        // Use modern Clipboard API if available
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(emojiName).then(() => {
                this.showCopySuccess(button, emojiName);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                this.fallbackCopyTextToClipboard(emojiName, button);
            });
        } else {
            // Fallback for older browsers
            this.fallbackCopyTextToClipboard(emojiName, button);
        }
    }

    fallbackCopyTextToClipboard(text, button) {
        // Create a temporary input element
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        
        // Select the text inside the input
        tempInput.select();
        tempInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            // Copy the text to the clipboard
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess(button, text);
            } else {
                this.showCopyError(button);
            }
        } catch (err) {
            console.error('Fallback: Copying text command was unsuccessful', err);
            this.showCopyError(button);
        }
        
        // Remove the temporary input element
        document.body.removeChild(tempInput);
    }

    showCopySuccess(button, text) {
        // Change the button text to indicate success
        button.innerHTML = '✅ Copied!';
        button.style.background = 'var(--success)';
        button.style.borderColor = 'var(--success)';
        button.style.color = '#ffffff';
        
        // Show success message
        this.showMessage(`Copied "${text}" to clipboard`, 'success');
        
        // Reset the button after a short delay
        setTimeout(() => {
            button.innerHTML = '📋 Copy Name';
            button.style.background = '';
            button.style.borderColor = '';
            button.style.color = '';
        }, 2000);
    }

    showCopyError(button) {
        // Change the button text to indicate error
        button.innerHTML = '❌ Failed';
        button.style.background = 'var(--danger)';
        button.style.borderColor = 'var(--danger)';
        button.style.color = '#ffffff';
        
        // Show error message
        this.showMessage('Failed to copy to clipboard', 'error');
        
        // Reset the button after a short delay
        setTimeout(() => {
            button.innerHTML = '📋 Copy Name';
            button.style.background = '';
            button.style.borderColor = '';
            button.style.color = '';
        }, 2000);
    }

    showFieldRenameModal(fieldName) {
        this.currentFieldBeingRenamed = fieldName;
        
        // Populate modal with field info
        document.getElementById('currentFieldName').textContent = fieldName;
        
        // Check if field already has a rename
        const existingRename = this.fieldRenames.get(fieldName);
        const existingInfo = document.getElementById('fieldRenameExistingInfo');
        const removeBtn = document.getElementById('removeRenameBtn');
        
        if (existingRename) {
            document.getElementById('currentRenamedValue').textContent = existingRename;
            document.getElementById('newFieldName').value = existingRename;
            existingInfo.style.display = 'block';
            removeBtn.style.display = 'inline-flex';
        } else {
            document.getElementById('newFieldName').value = '';
            existingInfo.style.display = 'none';
            removeBtn.style.display = 'none';
        }
        
        // Generate suggestions
        this.generateFieldSuggestions(fieldName);
        
        // Show modal
        document.getElementById('fieldRenameModal').classList.add('active');
        
        // Focus input
        setTimeout(() => {
            document.getElementById('newFieldName').focus();
        }, 100);
        
        // Setup event listeners
        this.setupFieldRenameModalListeners();
    }
    
    generateFieldSuggestions(fieldName) {
        const suggestionsContainer = document.getElementById('fieldSuggestions');
        
        // Common field mappings
        const commonMappings = {
            'name': ['n', 'nm'],
            'category': ['c', 'cat'],
            'unified': ['u', 'uni'],
            'non_qualified': ['nq', 'non_qual'],
            'docomo': ['d', 'dcm'],
            'au': ['a'],
            'softbank': ['s', 'sb'],
            'google': ['g', 'ggl'],
            'image': ['i', 'img'],
            'sheet_x': ['x', 'sx'],
            'sheet_y': ['y', 'sy'],
            'short_name': ['sn', 'short'],
            'short_names': ['sns', 'shorts'],
            'text': ['t', 'txt'],
            'texts': ['ts', 'txts'],
            'has_img_apple': ['apple', 'apl'],
            'has_img_google': ['google', 'ggl'],
            'has_img_twitter': ['twitter', 'twt'],
            'has_img_facebook': ['facebook', 'fb'],
            'obsoletes': ['obs', 'obsolete'],
            'obsoleted_by': ['obs_by', 'replaced']
        };
        
        // Get base field name (without dots)
        const baseField = fieldName.split('.').pop();
        
        // Generate suggestions
        let suggestions = [];
        
        // Add common mappings if available
        if (commonMappings[baseField]) {
            suggestions.push(...commonMappings[baseField]);
        }
        
        // Add single letter suggestion
        if (baseField.length > 1) {
            suggestions.push(baseField.charAt(0));
        }
        
        // Add abbreviated forms
        if (baseField.includes('_')) {
            const parts = baseField.split('_');
            suggestions.push(parts.map(p => p.charAt(0)).join(''));
            suggestions.push(parts.map(p => p.substring(0, 2)).join(''));
        }
        
        // Add vowel-less version for longer names
        if (baseField.length > 3) {
            const consonants = baseField.replace(/[aeiou]/gi, '');
            if (consonants.length > 0 && consonants.length < baseField.length) {
                suggestions.push(consonants.toLowerCase());
            }
        }
        
        // Remove duplicates and filter out existing renames
        suggestions = [...new Set(suggestions)].filter(s => 
            s && s !== fieldName && s !== baseField && 
            !Array.from(this.fieldRenames.values()).includes(s)
        );
        
        // Create suggestion tags
        suggestionsContainer.innerHTML = suggestions.slice(0, 8).map(suggestion => 
            `<div class="suggestion-tag" onclick="app.applySuggestion('${suggestion}')">${suggestion}</div>`
        ).join('');
    }
    
    applySuggestion(suggestion) {
        document.getElementById('newFieldName').value = suggestion;
    }
    
    setupFieldRenameModalListeners() {
        // Close button
        document.getElementById('closeFieldRename').onclick = () => this.hideFieldRenameModal();
        
        // Enter key to confirm
        const input = document.getElementById('newFieldName');
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.confirmFieldRename();
            } else if (e.key === 'Escape') {
                this.hideFieldRenameModal();
            }
        };
        
        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', this.closeFieldRenameOnClickOutside);
        }, 100);
    }
    
    closeFieldRenameOnClickOutside = (e) => {
        const modal = document.getElementById('fieldRenameModal');
        if (e.target === modal) {
            this.hideFieldRenameModal();
        }
    }
    
    hideFieldRenameModal() {
        document.getElementById('fieldRenameModal').classList.remove('active');
        document.removeEventListener('click', this.closeFieldRenameOnClickOutside);
        this.currentFieldBeingRenamed = null;
    }
    
    confirmFieldRename() {
        const newName = document.getElementById('newFieldName').value.trim();
        const originalField = this.currentFieldBeingRenamed;
        
        if (!newName) {
            this.showMessage('Please enter a new field name', 'error');
            return;
        }
        
        // Validate field name (basic validation)
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) {
            this.showMessage('Field name must start with a letter or underscore and contain only letters, numbers, and underscores', 'error');
            return;
        }
        
        // Check if new name conflicts with existing field names
        if (Object.keys(this.fieldSchema).includes(newName)) {
            this.showMessage(`Field name "${newName}" already exists in the original data`, 'error');
            return;
        }
        
        // Check if new name conflicts with other renames
        const existingRenames = Array.from(this.fieldRenames.values());
        if (existingRenames.includes(newName) && this.fieldRenames.get(originalField) !== newName) {
            this.showMessage(`Field name "${newName}" is already used by another renamed field`, 'error');
            return;
        }
        
        // Apply the rename
        this.fieldRenames.set(originalField, newName);
        
        this.showMessage(`Field "${originalField}" renamed to "${newName}"`, 'success');
        this.hideFieldRenameModal();
        this.renderFieldManager();
        this.renderOutputPreview();
        this.saveState();
    }
    
    removeFieldRename() {
        const originalField = this.currentFieldBeingRenamed;
        
        if (this.fieldRenames.has(originalField)) {
            this.fieldRenames.delete(originalField);
            this.showMessage(`Removed rename for field "${originalField}"`, 'success');
            this.hideFieldRenameModal();
            this.renderFieldManager();
            this.renderOutputPreview();
            this.saveState();
        }
    }

    clearAllFieldRenames() {
        if (this.fieldRenames.size === 0) {
            this.showMessage('No field renames to clear', 'info');
            return;
        }
        
        const count = this.fieldRenames.size;
        this.fieldRenames.clear();
        
        this.showMessage(`Cleared ${count} field rename(s)`, 'success');
        this.renderFieldManager();
        this.renderOutputPreview();
        this.saveState();
    }

    getOutputFieldName(originalFieldName) {
        // Return the renamed field name if renaming is enabled and a rename exists, otherwise return original
        return (this.settings.applyFieldRenames && this.fieldRenames.get(originalFieldName)) || originalFieldName;
    }

    highlightSearchMatch(text, searchQuery) {
        if (!searchQuery || !text) return text;
        
        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.toString().replace(regex, '<mark class="search-highlight">$1</mark>');
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

// Initialize the application when DOM is ready
let emojiPasta;

function initializeApp() {
    console.log('Initializing Emoji Data Pasta application...');
    emojiPasta = new EmojiDataPasta();
    // Make it globally accessible for onclick handlers
    window.app = emojiPasta;
    
    // Make debug functions available in console
    window.debugCustomTerms = () => emojiPasta.debugCustomTermsDetection();
    window.redetectCustomTerms = () => emojiPasta.detectCustomSearchTerms();
    
    console.log('Application initialized successfully');
    console.log('🛠️ Debug functions available: debugCustomTerms(), redetectCustomTerms()');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    initializeApp();
}

// Force render JSON views when DOM is ready and if there's data (legacy fallback)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (emojiPasta && emojiPasta.originalData.length > 0) {
            emojiPasta.renderOriginalStructure();
            emojiPasta.renderOutputPreview();
        }
    }, 100);
});