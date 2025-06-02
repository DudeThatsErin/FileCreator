const { Plugin, PluginSettingTab, App, Modal, Setting, Notice } = require('obsidian');

class FileCreatorPlugin extends Plugin {
    async onload() {
        // Add plugin settings
        this.settings = await this.loadData() || {
            dateFormat: 'MMddYYYY',
            datePosition: 'none', // 'none', 'prefix', 'suffix'
            fileType: 'markdown', // 'markdown', 'pdf'
            pdfTemplatesPath: '/00-assets/01-pdfs/',
            defaultPdfTemplate: 'blank.pdf'
        };

        // Add the ribbon icon
        this.addRibbonIcon('file-plus', 'Create New File', () => {
            new FileCreatorModal(this.app, this).open();
        });

        // Add the command to create a new file
        this.addCommand({
            id: 'create-new-file',
            name: 'Create New File',
            callback: () => {
                new FileCreatorModal(this.app, this).open();
            }
        });

        // Add settings tab
        this.addSettingTab(new FileCreatorSettingTab(this.app, this));
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class FileCreatorModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.folderPath = '/';
        this.fileName = '';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Create New File' });
        
        // File type toggle
        this.fileType = this.plugin.settings.fileType;
        this.pdfTemplate = this.plugin.settings.defaultPdfTemplate;

        // Folder selection dropdown
        new Setting(contentEl)
            .setName('Folder')
            .setDesc('Select the folder where the file will be created')
            .addDropdown(dropdown => {
                // Add root folder option with checkmark
                dropdown.addOption('/', '✓ Root');
                
                // Get all folders in the vault
                this.getFolders().forEach(folder => {
                    dropdown.addOption(folder.path, folder.displayPath);
                });
                
                dropdown.onChange(value => {
                    this.folderPath = value;
                });
            });

        // File name input
        new Setting(contentEl)
            .setName('File Name')
            .setDesc('Enter the name for the new file (without extension)')
            .addText(text => {
                text.onChange(value => {
                    this.fileName = value;
                });
            });

        // File type toggle
        new Setting(contentEl)
            .setName('File Type')
            .setDesc('Choose the type of file to create')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('markdown', 'Markdown (.md)')
                    .addOption('pdf', 'PDF from template')
                    .setValue(this.fileType)
                    .onChange(value => {
                        this.fileType = value;
                        // Update UI based on file type
                        this.updateFileTypeUI(contentEl);
                    });
            });
            
        // Container for PDF template selection (will be shown/hidden based on file type)
        this.pdfTemplateContainer = contentEl.createDiv('pdf-template-container');
        this.updateFileTypeUI(contentEl);
        
        // Date position toggle
        new Setting(contentEl)
            .setName('Date Position')
            .setDesc('Choose where to add the date in the filename')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('none', 'No Date')
                    .addOption('prefix', 'Prefix (Date-Filename)')
                    .addOption('suffix', 'Suffix (Filename-Date)')
                    .setValue(this.plugin.settings.datePosition)
                    .onChange(value => {
                        this.plugin.settings.datePosition = value;
                        this.plugin.saveSettings();
                    });
            });

        // Create button
        new Setting(contentEl)
            .addButton(button => {
                button
                    .setButtonText('Create')
                    .setCta()
                    .onClick(() => {
                        this.createFile();
                    });
            });
    }

    // Update UI based on selected file type
    updateFileTypeUI(contentEl) {
        // Clear the PDF template container
        this.pdfTemplateContainer.empty();
        
        // Show PDF template selection if PDF is selected
        if (this.fileType === 'pdf') {
            this.loadPdfTemplates();
        }
    }
    
    // Load PDF templates from the configured folder
    async loadPdfTemplates() {
        try {
            // Get the PDF templates path from settings
            const templatesPath = this.plugin.settings.pdfTemplatesPath;
            
            // Check if the folder exists
            if (!(await this.app.vault.adapter.exists(templatesPath))) {
                new Notice(`PDF templates folder not found: ${templatesPath}`);
                return;
            }
            
            // Get all files in the templates folder
            const files = await this.app.vault.adapter.list(templatesPath);
            const pdfFiles = files.files.filter(file => file.toLowerCase().endsWith('.pdf'));
            
            // Create dropdown for template selection
            if (pdfFiles.length > 0) {
                new Setting(this.pdfTemplateContainer)
                    .setName('PDF Template')
                    .setDesc('Select a PDF template')
                    .addDropdown(dropdown => {
                        // Add each PDF file as an option
                        pdfFiles.forEach(file => {
                            const fileName = file.split('/').pop();
                            dropdown.addOption(fileName, fileName);
                        });
                        
                        // Set default value
                        if (pdfFiles.includes(templatesPath + this.plugin.settings.defaultPdfTemplate)) {
                            dropdown.setValue(this.plugin.settings.defaultPdfTemplate);
                        } else if (pdfFiles.length > 0) {
                            dropdown.setValue(pdfFiles[0].split('/').pop());
                        }
                        
                        dropdown.onChange(value => {
                            this.pdfTemplate = value;
                            this.plugin.settings.defaultPdfTemplate = value;
                            this.plugin.saveSettings();
                        });
                    });
            } else {
                this.pdfTemplateContainer.createEl('p', {
                    text: `No PDF templates found in ${templatesPath}`,
                    cls: 'pdf-template-error'
                });
            }
        } catch (error) {
            console.error('Error loading PDF templates:', error);
            new Notice(`Error loading PDF templates: ${error.message}`);
        }
    }
    
    async createFile() {
        if (!this.folderPath) {
            new Notice('Please specify a folder path');
            return;
        }

        if (!this.fileName) {
            new Notice('Please specify a file name');
            return;
        }

        try {
            // Format the date if needed
            let finalFileName = this.fileName;
            
            if (this.plugin.settings.datePosition !== 'none') {
                const date = new Date();
                const formattedDate = this.formatDate(date, this.plugin.settings.dateFormat);
                
                if (this.plugin.settings.datePosition === 'prefix') {
                    finalFileName = `${formattedDate}-${finalFileName}`;
                } else if (this.plugin.settings.datePosition === 'suffix') {
                    finalFileName = `${finalFileName}-${formattedDate}`;
                }
            }

            // Ensure the folder path doesn't have a trailing slash
            const normalizedFolderPath = this.folderPath.endsWith('/')
                ? this.folderPath.slice(0, -1)
                : this.folderPath;

            // Determine file extension based on file type
            const fileExtension = this.fileType === 'markdown' ? '.md' : '.pdf';
            
            // Create the full file path
            const filePath = `${normalizedFolderPath}/${finalFileName}${fileExtension}`;

            // Check if file already exists
            const fileExists = await this.app.vault.adapter.exists(filePath);
            if (fileExists) {
                new Notice(`File already exists: ${filePath}`);
                return;
            }

            // Create the folder if it doesn't exist
            if (!(await this.app.vault.adapter.exists(normalizedFolderPath))) {
                await this.app.vault.createFolder(normalizedFolderPath);
            }

            // Create the file based on type
            if (this.fileType === 'markdown') {
                // Create empty markdown file
                await this.app.vault.create(filePath, '');
            } else if (this.fileType === 'pdf') {
                // Copy the selected PDF template
                const templatePath = `${this.plugin.settings.pdfTemplatesPath}${this.pdfTemplate}`;
                
                try {
                    // Check if template exists
                    if (!(await this.app.vault.adapter.exists(templatePath))) {
                        new Notice(`PDF template not found: ${templatePath}`);
                        return;
                    }
                    
                    // Read the template file
                    const templateData = await this.app.vault.adapter.readBinary(templatePath);
                    
                    // Write to the new file
                    await this.app.vault.adapter.writeBinary(filePath, templateData);
                } catch (error) {
                    new Notice(`Error creating PDF file: ${error.message}`);
                    console.error('Error creating PDF file:', error);
                    return;
                }
            }
            
            // Show success message
            new Notice(`File created: ${filePath}`);
            
            // Open the newly created file
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (file) {
                this.app.workspace.getLeaf().openFile(file);
            }
            
            // Close the modal
            this.close();
        } catch (error) {
            new Notice(`Error creating file: ${error.message}`);
            console.error('Error creating file:', error);
        }
    }

    formatDate(date, format) {
        // Simple date formatter for MMddYYYY format
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        
        return format.replace('MM', month)
                     .replace('dd', day)
                     .replace('YYYY', year);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    // Get all folders in the vault with proper indentation for display
    getFolders() {
        const folders = [];
        const rootFolder = this.app.vault.getRoot();
        
        // Get all folders in the vault
        const allFolders = this.getAllFoldersFlat();
        
        // Sort folders by path for consistent display
        allFolders.sort((a, b) => {
            // Sort by folder name with numeric prefixes handled properly
            const aName = a.path;
            const bName = b.path;
            return aName.localeCompare(bName, undefined, {numeric: true, sensitivity: 'base'});
        });
        
        // Process each folder for display
        allFolders.forEach(folder => {
            // Calculate depth based on path segments
            const pathParts = folder.path.split('/');
            const depth = pathParts.length - 1;
            
            // Create indentation
            const indent = '  '.repeat(depth);
            const displayName = pathParts[pathParts.length - 1];
            
            folders.push({
                path: folder.path,
                displayPath: `${indent}${displayName}`
            });
        });
        
        return folders;
    }
    
    // Get all folders as a flat list
    getAllFoldersFlat() {
        const folders = [];
        const rootFolder = this.app.vault.getRoot();
        
        // Add root folder
        folders.push({
            path: '/',
            folder: rootFolder
        });
        
        // Process all folders recursively
        const processFolder = (folder, path) => {
            if (!folder.children) return;
            
            folder.children.forEach(child => {
                if (child.children) { // It's a folder
                    const childPath = path === '/' ? `/${child.name}` : `${path}/${child.name}`;
                    folders.push({
                        path: childPath,
                        folder: child
                    });
                    processFolder(child, childPath);
                }
            });
        };
        
        processFolder(rootFolder, '/');
        return folders;
    }
}

class FileCreatorSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'File Creator Settings' });

        new Setting(containerEl)
            .setName('Date Format')
            .setDesc('Format for the date (default: MMddYYYY)')
            .addText(text => {
                text.setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Default Date Position')
            .setDesc('Choose where to add the date in the filename by default')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('none', 'No Date')
                    .addOption('prefix', 'Prefix (Date-Filename)')
                    .addOption('suffix', 'Suffix (Filename-Date)')
                    .setValue(this.plugin.settings.datePosition)
                    .onChange(async (value) => {
                        this.plugin.settings.datePosition = value;
                        await this.plugin.saveSettings();
                    });
            });
            
        new Setting(containerEl)
            .setName('Default File Type')
            .setDesc('Choose the default type of file to create')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('markdown', 'Markdown (.md)')
                    .addOption('pdf', 'PDF from template')
                    .setValue(this.plugin.settings.fileType)
                    .onChange(async (value) => {
                        this.plugin.settings.fileType = value;
                        await this.plugin.saveSettings();
                    });
            });
            
        new Setting(containerEl)
            .setName('PDF Templates Path')
            .setDesc('Path to the folder containing PDF templates')
            .addText(text => {
                text.setValue(this.plugin.settings.pdfTemplatesPath)
                    .onChange(async (value) => {
                        this.plugin.settings.pdfTemplatesPath = value;
                        await this.plugin.saveSettings();
                    });
            });
            
        new Setting(containerEl)
            .setName('Default PDF Template')
            .setDesc('Default PDF template to use when creating PDF files')
            .addText(text => {
                text.setValue(this.plugin.settings.defaultPdfTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultPdfTemplate = value;
                        await this.plugin.saveSettings();
                    });
            });
    }
}

module.exports = FileCreatorPlugin;
