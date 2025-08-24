// === File Creator Plugin ===

const { Plugin, PluginSettingTab, App, Modal, Setting, Notice, TFile, normalizePath } = require('obsidian');

const DEFAULT_SETTINGS = {
    dateFormat: 'MMddYYYY',
    datePosition: 'none', // 'none', 'prefix', 'suffix'
    fileType: 'markdown', // 'markdown', 'pdf', 'kanban', 'base', 'excalidraw'
    pdfTemplatesPath: '/00-assets/01-pdfs/',
    defaultPdfTemplate: 'blank.pdf',
    mdTemplatesPath: '/00-assets/02-templates/',
    defaultMdTemplate: 'none',
    baseTemplatesPath: '/00-assets/03-base-templates/',
    defaultBaseTemplate: 'none',
    excalidrawTemplatesPath: '/00-assets/04-excalidraw-templates/',
    defaultExcalidrawTemplate: 'none',
    ignoreFileCreationFolders: '',
    // Kanban settings
    defaultKanbanHeaders: 'To Do,Doing,Done',
    kanbanCompletedHeaders: 'Done'
};

class FileCreatorSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'File Creator Settings' });

         // Support & Links Section
         this.createAccordionSection(containerEl, 'Support & Links', () => {
            const supportContainer = containerEl.createDiv();
            supportContainer.className = 'support-container';
            
            const buyMeACoffeeBtn = supportContainer.createEl('a', { 
                text: '☕ Buy Me a Coffee',
                href: 'https://buymeacoffee.com/erinskidds'
            });
            buyMeACoffeeBtn.className = 'support-link coffee-link';
            
            const githubBtn = supportContainer.createEl('a', { 
                text: '⭐ Star on GitHub',
                href: 'https://github.com/DudeThatsErin/FileCreator'
            });
            githubBtn.className = 'support-link github-link';
            
            const issuesBtn = supportContainer.createEl('a', { 
                text: '🐛 Report Issues',
                href: 'https://github.com/DudeThatsErin/FileCreator/issues'
            });
            issuesBtn.className = 'support-link issues-link';
            
            const discordBtn = supportContainer.createEl('a', { 
                text: '💬 Discord Support',
                href: 'https://discord.gg/XcJWhE3SEA'
            });
            discordBtn.className = 'support-link discord-link';
        });

        // Template Settings Section
        this.createAccordionSection(containerEl, 'Template Settings', () => {
            new Setting(containerEl)
                .setName('Templates path')
                .setDesc('Path to the folder containing markdown templates')
                .addText(text => text
                    .setPlaceholder('/00-assets/02-templates/')
                    .setValue(this.plugin.settings.templatesPath)
                    .onChange(async (value) => {
                        this.plugin.settings.templatesPath = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Default markdown template')
                .setDesc('Default markdown template to use when creating markdown files')
                .addText(text => text
                    .setPlaceholder('none')
                    .setValue(this.plugin.settings.defaultMdTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultMdTemplate = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Base templates path')
                .setDesc('Path to the folder containing base file templates')
                .addText(text => text
                    .setPlaceholder('/00-assets/03-base-templates/')
                    .setValue(this.plugin.settings.baseTemplatesPath)
                    .onChange(async (value) => {
                        this.plugin.settings.baseTemplatesPath = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Default base template')
                .setDesc('Default base template to use when creating base files')
                .addText(text => text
                    .setPlaceholder('none')
                    .setValue(this.plugin.settings.defaultBaseTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultBaseTemplate = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Excalidraw templates path')
                .setDesc('Path to the folder containing Excalidraw templates')
                .addText(text => text
                    .setPlaceholder('/00-assets/04-excalidraw-templates/')
                    .setValue(this.plugin.settings.excalidrawTemplatesPath)
                    .onChange(async (value) => {
                        this.plugin.settings.excalidrawTemplatesPath = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Default excalidraw template')
                .setDesc('Default excalidraw template to use when creating drawings')
                .addText(text => text
                    .setPlaceholder('none')
                    .setValue(this.plugin.settings.defaultExcalidrawTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultExcalidrawTemplate = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('PDF templates path')
                .setDesc('Path to the folder containing PDF templates')
                .addText(text => text
                    .setPlaceholder('/00-assets/01-pdfs/')
                    .setValue(this.plugin.settings.pdfTemplatesPath)
                    .onChange(async (value) => {
                        this.plugin.settings.pdfTemplatesPath = value.trim();
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Default PDF template')
                .setDesc('Default PDF template to use when creating PDF files')
                .addText(text => text
                    .setPlaceholder('blank.pdf')
                    .setValue(this.plugin.settings.defaultPdfTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultPdfTemplate = value.trim();
                        await this.plugin.saveSettings();
                    }));
        });

        // File Creation Settings Section
        this.createAccordionSection(containerEl, 'File Creation Settings', () => {
            new Setting(containerEl)
                .setName('Date format')
                .setDesc('Format for the date (default: MMddYYYY)')
                .addText(text => text.setValue(this.plugin.settings.dateFormat).onChange(async (value) => {
                    this.plugin.settings.dateFormat = value;
                    await this.plugin.saveSettings();
                }));

            new Setting(containerEl)
                .setName('Default date position')
                .setDesc('Choose where to add the date in the filename by default')
                .addDropdown(dropdown => dropdown
                    .addOption('none', 'No Date')
                    .addOption('prefix', 'Prefix (Date-Filename)')
                    .addOption('suffix', 'Suffix (Filename-Date)')
                    .setValue(this.plugin.settings.datePosition)
                    .onChange(async (value) => {
                        this.plugin.settings.datePosition = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Default file type')
                .setDesc('Choose the default type of file to create')
                .addDropdown(dropdown => dropdown
                    .addOption('markdown', 'Markdown (.md)')
                    .addOption('pdf', 'PDF from template')
                    .addOption('kanban', 'Kanban Board (.md)')
                    .addOption('base', 'Base File (.base)')
                    .addOption('excalidraw', 'Excalidraw Drawing (.excalidraw.md)')
                    .setValue(this.plugin.settings.fileType)
                    .onChange(async (value) => {
                        this.plugin.settings.fileType = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Ignore folders during file creation')
                .setDesc('Comma-separated list of folder names to ignore when creating files')
                .addText(text => text
                    .setPlaceholder('.obsidian, .git, node_modules')
                    .setValue(this.plugin.settings.ignoreFolders)
                    .onChange(async (value) => {
                        this.plugin.settings.ignoreFolders = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Embed newly created files')
                .setDesc('Automatically embed newly created files into the current note')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.embedNewFiles)
                    .onChange(async (value) => {
                        this.plugin.settings.embedNewFiles = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Open newly created files')
                .setDesc('Automatically open newly created files in a new tab')
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings.openNewFiles)
                    .onChange(async (value) => {
                        this.plugin.settings.openNewFiles = value;
                        await this.plugin.saveSettings();
                    }));
        });

        // Kanban Settings
        this.createAccordionSection(containerEl, 'Kanban board settings', () => {
            new Setting(containerEl)
                .setName('Default kanban headers')
                .setDesc('Comma-separated list of default headers for new kanban boards')
                .addText(text => text.setValue(this.plugin.settings.defaultKanbanHeaders).onChange(async (value) => {
                    this.plugin.settings.defaultKanbanHeaders = value;
                    await this.plugin.saveSettings();
            }));

            new Setting(containerEl)
                .setName('Completed headers')
                .setDesc('Headers where items should be marked as completed (comma-separated)')
                .addText(text => text.setValue(this.plugin.settings.kanbanCompletedHeaders).onChange(async (value) => {
                    this.plugin.settings.kanbanCompletedHeaders = value;
                    await this.plugin.saveSettings();
            }));
        });
    }

    createAccordionSection(containerEl, title, contentCallback) {
        const accordionContainer = containerEl.createDiv('accordion-section');
        
        const header = accordionContainer.createDiv('accordion-header');
        header.className = 'accordion-header';
        
        const headerText = header.createSpan();
        headerText.textContent = title;
        
        const arrow = header.createSpan('accordion-arrow');
        arrow.textContent = '▼';
        arrow.className = 'accordion-arrow';
        
        const content = accordionContainer.createDiv('accordion-content');
        content.className = 'accordion-content';
        
        let isExpanded = true; // Start expanded
        
        const toggleAccordion = () => {
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                content.classList.add('expanded');
                content.classList.remove('collapsed');
                arrow.classList.add('expanded');
                arrow.classList.remove('collapsed');
                header.classList.add('expanded');
                header.classList.remove('collapsed');
            } else {
                content.classList.add('collapsed');
                content.classList.remove('expanded');
                arrow.classList.add('collapsed');
                arrow.classList.remove('expanded');
                header.classList.add('collapsed');
                header.classList.remove('expanded');
            }
        };
        
        header.addEventListener('click', toggleAccordion);
        
        // Hover effects are now handled by CSS
        
        // Call the content callback to populate the accordion
        const tempContainer = containerEl.createDiv();
        const originalContainerEl = containerEl;
        
        // Temporarily redirect new Settings to our temp container
        const originalCreateEl = containerEl.createEl;
        containerEl.createEl = tempContainer.createEl.bind(tempContainer);
        
        contentCallback();
        
        // Restore original createEl
        containerEl.createEl = originalCreateEl;
        
        // Move the settings that were just added to the accordion content
        while (tempContainer.firstChild) {
            content.appendChild(tempContainer.firstChild);
        }
        
        // Remove the temp container
        tempContainer.remove();
    }
}

class FileCreatorPlugin extends Plugin {
    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addSettingTab(new FileCreatorSettingTab(this.app, this));
        this.addRibbonIcon('file-plus', 'Create New File', () => {
            // Placeholder for modal logic
            new FileCreatorModal(this.app, this).open();
        });
        this.addCommand({ id: 'create-new-file', name: 'Create New File', callback: () => {
            // Placeholder for command logic
            new FileCreatorModal(this.app, this).open();
        }});
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
}

module.exports = FileCreatorPlugin;

class FileCreatorModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.fileType = plugin.settings.fileType;
        this.datePosition = plugin.settings.datePosition;
        this.fileName = '';
        this.folderPath = '/';
        this.template = '';
        this.kanbanHeaders = [];
        this.kanbanCompletedHeaders = [];
        this.baseContent = '';
        this.baseTemplate = '';
        this.baseTemplates = [];
        this.excalidrawContent = '';
        this.excalidrawTemplate = '';
        this.excalidrawTemplates = [];
        this.embedTarget = '';
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Create New File' });

        // Folder selection
        const folderDropdown = new Setting(contentEl)
            .setName('Target Folder')
            .setDesc('Select where to save the file')
            .addDropdown(dropdown => {
                const folders = this.getAllFolders();
                dropdown.addOption('/', 'Root');
                folders.forEach(folder => {
                    dropdown.addOption(folder, folder);
                });
                dropdown.setValue('/');
                dropdown.onChange(value => this.folderPath = value);
            });

        // File name input
        new Setting(contentEl)
            .setName('File name')
            .addText(text => text.onChange(value => this.fileName = value));

        // Date position toggle
        new Setting(contentEl)
            .setName('Date position')
            .addDropdown(dropdown => dropdown
                .addOption('none', 'No Date')
                .addOption('prefix', 'Prefix')
                .addOption('suffix', 'Suffix')
                .setValue(this.datePosition)
                .onChange(value => this.datePosition = value));

        // File type toggle
        new Setting(contentEl)
            .setName('File type')
            .addDropdown(dropdown => dropdown
                .addOption('markdown', 'Markdown')
                .addOption('pdf', 'PDF')
                .addOption('kanban', 'Kanban Board')
                .addOption('base', 'Base File')
                .addOption('excalidraw', 'Excalidraw Drawing')
                .setValue(this.fileType)
                .onChange(value => {
                    this.fileType = value;
                    this.updateModalContent(contentEl);
                }));

        this.templateContainer = contentEl.createDiv();
        this.specialOptionsContainer = contentEl.createDiv();
        this.updateModalContent(contentEl);

        // Embed options
        this.embedContainer = contentEl.createDiv();
        this.showEmbedOptions();

        // Create button
        new Setting(contentEl)
            .addButton(button => button.setButtonText('Create').setCta().onClick(() => this.createFile()));
    }

    getAllFolders() {
        const folders = [];

        const traverse = (folder) => {
            if (!folder) return;

            if (folder.children) {
                for (const child of folder.children) {
                    if (!(child instanceof TFile)) {
                        const path = child.path;
                        const ignorePaths = this.plugin.settings.ignoreFileCreationFolders.split(',').map(p => normalizePath(p.trim()));
                        if (!ignorePaths.includes(normalizePath(path))) {
                            folders.push(path);
                        }
                        traverse(child); // Recurse into subfolder
                    }
                }
            }
        };

        traverse(this.app.vault.getRoot());
        return folders;
    }

    async updateModalContent(container) {
        this.templateContainer.empty();
        this.specialOptionsContainer.empty();
        
        if (this.fileType === 'kanban') {
            this.showKanbanOptions();
        } else if (this.fileType === 'base') {
            this.showBaseOptions();
            this.loadBaseTemplates();
        } else if (this.fileType === 'excalidraw') {
            this.showExcalidrawOptions();
            this.loadExcalidrawTemplates();
        } else {
            await this.loadTemplates(container);
        }
    }

    async loadTemplates(container) {
        const path = this.fileType === 'pdf' ? this.plugin.settings.pdfTemplatesPath : this.plugin.settings.mdTemplatesPath;
        try {
            const files = (await this.app.vault.adapter.list(path)).files.filter(f => f.endsWith(this.fileType === 'pdf' ? '.pdf' : '.md'));

            if (files.length) {
                new Setting(this.templateContainer)
                    .setName('Template')
                    .addDropdown(dropdown => {
                        dropdown.addOption('none', 'No Template');
                        files.forEach(file => {
                            const name = file.split('/').pop();
                            dropdown.addOption(name, name);
                        });
                        dropdown.setValue(this.template || 'none');
                        dropdown.onChange(value => this.template = value === 'none' ? '' : value);
                    });
            } else {
                this.templateContainer.createEl('p', { text: `No ${this.fileType} templates found in ${path}` });
            }
        } catch (error) {
            this.templateContainer.createEl('p', { text: `Template folder not found: ${path}` });
        }
    }

    showKanbanOptions() {
        const defaultHeaders = this.plugin.settings.defaultKanbanHeaders.split(',').map(h => h.trim());
        const completedHeaders = this.plugin.settings.kanbanCompletedHeaders.split(',').map(h => h.trim());
        
        this.kanbanHeaders = [...defaultHeaders];
        this.kanbanCompletedHeaders = [...completedHeaders];

        new Setting(this.specialOptionsContainer)
            .setName('Kanban Headers')
            .setDesc('Comma-separated list of column headers')
            .addTextArea(text => text
                .setValue(this.kanbanHeaders.join(', '))
                .onChange(value => {
                    this.kanbanHeaders = value.split(',').map(h => h.trim()).filter(h => h);
                }));

        new Setting(this.specialOptionsContainer)
            .setName('Completed Headers')
            .setDesc('Headers where items should be marked as completed (comma-separated)')
            .addText(text => text
                .setValue(this.kanbanCompletedHeaders.join(', '))
                .onChange(value => {
                    this.kanbanCompletedHeaders = value.split(',').map(h => h.trim()).filter(h => h);
                }));
    }

    showBaseOptions() {
        this.baseContainer = this.specialOptionsContainer.createDiv();
        
        // Base template dropdown
        new Setting(this.baseContainer)
            .setName('Base Template')
            .setDesc('Choose a base template')
            .addDropdown(dropdown => {
                dropdown.addOption('none', 'No Template');
                this.baseTemplates.forEach(template => {
                    dropdown.addOption(template, template);
                });
                dropdown.setValue(this.baseTemplate)
                    .onChange(async (value) => {
                        this.baseTemplate = value;
                        if (value !== 'none') {
                            await this.loadBaseTemplateContent(value);
                        } else {
                            this.baseContent = '';
                        }
                        this.showBaseOptions();
                    });
            });
        
        new Setting(this.baseContainer)
            .setName('Base Content')
            .setDesc('Content for the base file')
            .addTextArea(text => text
                .setValue(this.baseContent)
                .onChange(value => this.baseContent = value));
    }

    async loadBaseTemplates() {
        this.baseTemplates = [];
        
        if (!this.plugin.settings.baseTemplatesPath) {
            return;
        }
        
        const templateFolder = this.app.vault.getAbstractFileByPath(this.plugin.settings.baseTemplatesPath);
        if (!templateFolder) {
            return;
        }
        
        const files = this.app.vault.getFiles().filter(file => 
            file.path.startsWith(this.plugin.settings.baseTemplatesPath) && 
            file.extension === 'base'
        );
        
        this.baseTemplates = files.map(file => file.basename);
        
        // Set default template if specified
        if (this.plugin.settings.defaultBaseTemplate && this.plugin.settings.defaultBaseTemplate !== 'none') {
            this.baseTemplate = this.plugin.settings.defaultBaseTemplate;
            await this.loadBaseTemplateContent(this.baseTemplate);
        }
    }

    async loadBaseTemplateContent(templateName) {
        if (!templateName || templateName === 'none') {
            this.baseContent = '';
            return;
        }
        
        const templatePath = `${this.plugin.settings.baseTemplatesPath}/${templateName}.base`;
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        
        if (templateFile) {
            this.baseContent = await this.app.vault.read(templateFile);
        }
    }

    showExcalidrawOptions() {
        this.excalidrawContainer = this.specialOptionsContainer.createDiv();
        
        // Excalidraw template dropdown
        new Setting(this.excalidrawContainer)
            .setName('Excalidraw Template')
            .setDesc('Choose an Excalidraw template')
            .addDropdown(dropdown => {
                dropdown.addOption('none', 'Blank Drawing');
                this.excalidrawTemplates.forEach(template => {
                    dropdown.addOption(template, template);
                });
                dropdown.setValue(this.excalidrawTemplate)
                    .onChange(async (value) => {
                        this.excalidrawTemplate = value;
                        if (value !== 'none') {
                            await this.loadExcalidrawTemplateContent(value);
                        } else {
                            this.excalidrawContent = this.getDefaultExcalidrawContent();
                        }
                        this.showExcalidrawOptions();
                    });
            });
        
        // Show preview of template (optional)
        if (this.excalidrawContent) {
            const previewDiv = this.excalidrawContainer.createDiv();
            previewDiv.createEl('p', { text: 'Template loaded successfully' });
        }
    }

    async loadExcalidrawTemplates() {
        this.excalidrawTemplates = [];
        
        if (!this.plugin.settings.excalidrawTemplatesPath) {
            this.excalidrawContent = this.getDefaultExcalidrawContent();
            return;
        }
        
        const templateFolder = this.app.vault.getAbstractFileByPath(this.plugin.settings.excalidrawTemplatesPath);
        if (!templateFolder) {
            this.excalidrawContent = this.getDefaultExcalidrawContent();
            return;
        }
        
        const files = this.app.vault.getFiles().filter(file => 
            file.path.startsWith(this.plugin.settings.excalidrawTemplatesPath) && 
            file.name.endsWith('.excalidraw.md')
        );
        
        this.excalidrawTemplates = files.map(file => file.basename.replace('.excalidraw', ''));
        
        // Set default template if specified
        if (this.plugin.settings.defaultExcalidrawTemplate && this.plugin.settings.defaultExcalidrawTemplate !== 'none') {
            this.excalidrawTemplate = this.plugin.settings.defaultExcalidrawTemplate;
            await this.loadExcalidrawTemplateContent(this.excalidrawTemplate);
        } else {
            this.excalidrawContent = this.getDefaultExcalidrawContent();
        }
    }

    async loadExcalidrawTemplateContent(templateName) {
        if (!templateName || templateName === 'none') {
            this.excalidrawContent = this.getDefaultExcalidrawContent();
            return;
        }
        
        const templatePath = `${this.plugin.settings.excalidrawTemplatesPath}/${templateName}.excalidraw.md`;
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        
        if (templateFile) {
            this.excalidrawContent = await this.app.vault.read(templateFile);
        } else {
            this.excalidrawContent = this.getDefaultExcalidrawContent();
        }
    }

    getDefaultExcalidrawContent() {
        return `---

excalidraw-plugin: parsed
tags: [excalidraw]

---
==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠==


# Text Elements
# Embedded files
# Drawing
\`\`\`json
{
	"type": "excalidraw",
	"version": 2,
	"source": "https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/tag/2.0.25",
	"elements": [],
	"appState": {
		"gridSize": null,
		"viewBackgroundColor": "#ffffff"
	},
	"files": {}
}
\`\`\`
%%
# Drawing
\`\`\`json
{
	"type": "excalidraw",
	"version": 2,
	"source": "https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/tag/2.0.25",
	"elements": [],
	"appState": {
		"gridSize": null,
		"viewBackgroundColor": "#ffffff"
	},
	"files": {}
}
\`\`\`
%%`;
    }

    showEmbedOptions() {
        new Setting(this.embedContainer)
            .setName('Embed in Note')
            .setDesc('Optional: Enter note path to embed this file directly into it')
            .addText(text => text
                .setPlaceholder('path/to/note.md')
                .onChange(value => this.embedTarget = value));
    }

    async createFile() {
        if (!this.fileName || !this.folderPath) return new Notice('Missing name or folder');

        const date = this.formatDate(new Date(), this.plugin.settings.dateFormat);
        let fullName = this.fileName;
        if (this.datePosition === 'prefix') fullName = `${date}-${fullName}`;
        if (this.datePosition === 'suffix') fullName = `${fullName}-${date}`;
        
        let ext, path;
        switch (this.fileType) {
            case 'kanban':
                ext = '.md';
                break;
            case 'base':
                ext = '.base';
                break;
            case 'pdf':
                ext = '.pdf';
                break;
            case 'excalidraw':
                ext = '.excalidraw.md';
                break;
            default:
                ext = '.md';
        }
        
        path = `${this.folderPath}/${fullName}${ext}`;

        if (await this.app.vault.adapter.exists(path)) return new Notice('File already exists');
        if (!(await this.app.vault.adapter.exists(this.folderPath))) await this.app.vault.createFolder(this.folderPath);

        let content = '';
        
        if (this.fileType === 'kanban') {
            content = this.generateKanbanContent();
        } else if (this.fileType === 'base') {
            content = this.baseContent;
        } else if (this.fileType === 'excalidraw') {
            content = this.excalidrawContent;
        } else if (this.fileType === 'markdown') {
            if (this.template) {
                const tplPath = `${this.plugin.settings.mdTemplatesPath}/${this.template}`;
                try {
                    content = await this.app.vault.adapter.read(tplPath);
                } catch (error) {
                    new Notice('Template not found, creating empty file');
                }
            }
        } else if (this.fileType === 'pdf') {
            const tplPath = `${this.plugin.settings.pdfTemplatesPath}/${this.template}`;
            try {
                const data = await this.app.vault.adapter.readBinary(tplPath);
                await this.app.vault.adapter.writeBinary(path, data);
            } catch (error) {
                return new Notice('PDF template not found');
            }
        }

        if (this.fileType !== 'pdf') {
            await this.app.vault.create(path, content);
        }

        // Handle embedding if specified
        if (this.embedTarget && this.embedTarget.trim()) {
            await this.embedFileInNote(path, this.embedTarget.trim());
        }

        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) this.app.workspace.getLeaf().openFile(file);
        new Notice(`Created: ${path}`);
        this.close();
    }

    generateKanbanContent() {
        let content = '---\nkanban-plugin: basic\n---\n\n';
        
        this.kanbanHeaders.forEach(header => {
            const isCompleted = this.kanbanCompletedHeaders.includes(header);
            content += `## ${header}\n\n`;
            if (isCompleted) {
                content += `- [ ] Sample completed task\n\n`;
            } else {
                content += `- [ ] Sample task\n\n`;
            }
        });
        
        return content;
    }

    async embedFileInNote(filePath, targetNotePath) {
        try {
            // Normalize the target note path
            let notePath = targetNotePath;
            if (!notePath.endsWith('.md')) {
                notePath += '.md';
            }
            
            // Check if target note exists
            if (!(await this.app.vault.adapter.exists(notePath))) {
                new Notice(`Target note not found: ${notePath}`);
                return;
            }
            
            // Read current content
            const currentContent = await this.app.vault.adapter.read(notePath);
            
            // Generate embed syntax based on file type
            const fileName = filePath.split('/').pop();
            let embedSyntax;
            
            if (filePath.endsWith('.base')) {
                embedSyntax = `\n\n![[${fileName}]]\n`;
            } else if (filePath.endsWith('.pdf')) {
                embedSyntax = `\n\n![[${fileName}]]\n`;
            } else if (filePath.endsWith('.excalidraw.md')) {
                embedSyntax = `\n\n![[${fileName}]]\n`;
            } else {
                embedSyntax = `\n\n![[${fileName}]]\n`;
            }
            
            // Append embed to note
            const newContent = currentContent + embedSyntax;
            await this.app.vault.adapter.write(notePath, newContent);
            
            new Notice(`Embedded ${fileName} in ${notePath}`);
        } catch (error) {
            console.error('Failed to embed file:', error);
            new Notice('Failed to embed file in note');
        }
    }

    formatDate(date, format) {
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return format.replace('MM', mm).replace('dd', dd).replace('YYYY', yyyy);
    }

    onClose() {
        this.contentEl.empty();
    }
}
