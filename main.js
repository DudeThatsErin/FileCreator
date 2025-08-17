// === File Creator Plugin ===

const { Plugin, PluginSettingTab, App, Modal, Setting, Notice, TFile, normalizePath } = require('obsidian');

const DEFAULT_SETTINGS = {
    dateFormat: 'MMddYYYY',
    datePosition: 'none', // 'none', 'prefix', 'suffix'
    fileType: 'markdown', // 'markdown', 'pdf', 'kanban', 'base'
    pdfTemplatesPath: '/00-assets/01-pdfs/',
    defaultPdfTemplate: 'blank.pdf',
    mdTemplatesPath: '/00-assets/02-templates/',
    defaultMdTemplate: 'none',
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

        new Setting(containerEl)
            .setName('Date Format')
            .setDesc('Format for the date (default: MMddYYYY)')
            .addText(text => text.setValue(this.plugin.settings.dateFormat).onChange(async (value) => {
                this.plugin.settings.dateFormat = value;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Default Date Position')
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
            .setName('Default File Type')
            .setDesc('Choose the default type of file to create')
            .addDropdown(dropdown => dropdown
                .addOption('markdown', 'Markdown (.md)')
                .addOption('pdf', 'PDF from template')
                .addOption('kanban', 'Kanban Board (.md)')
                .addOption('base', 'Base File (.base)')
                .setValue(this.plugin.settings.fileType)
                .onChange(async (value) => {
                    this.plugin.settings.fileType = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('PDF Templates Path')
            .setDesc('Path to the folder containing PDF templates')
            .addText(text => text.setValue(this.plugin.settings.pdfTemplatesPath).onChange(async (value) => {
                this.plugin.settings.pdfTemplatesPath = value;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Default PDF Template')
            .setDesc('Default PDF template to use when creating PDF files')
            .addText(text => text.setValue(this.plugin.settings.defaultPdfTemplate).onChange(async (value) => {
                this.plugin.settings.defaultPdfTemplate = value;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Markdown Templates Path')
            .setDesc('Path to the folder containing Markdown templates')
            .addText(text => text.setValue(this.plugin.settings.mdTemplatesPath).onChange(async (value) => {
                this.plugin.settings.mdTemplatesPath = value;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Default Markdown Template')
            .setDesc('Default markdown template to use when creating markdown files')
            .addText(text => text.setValue(this.plugin.settings.defaultMdTemplate).onChange(async (value) => {
                this.plugin.settings.defaultMdTemplate = value;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Ignore Folders During File Creation')
            .setDesc('Comma-separated list of folder paths to exclude from the target folder dropdown')
            .addTextArea(text => text.setValue(this.plugin.settings.ignoreFileCreationFolders).onChange(async (value) => {
                this.plugin.settings.ignoreFileCreationFolders = value;
                await this.plugin.saveSettings();
            }));

        // Kanban Settings
        containerEl.createEl('h3', { text: 'Kanban Board Settings' });
        
        new Setting(containerEl)
            .setName('Default Kanban Headers')
            .setDesc('Comma-separated list of default headers for new kanban boards')
            .addText(text => text.setValue(this.plugin.settings.defaultKanbanHeaders).onChange(async (value) => {
                this.plugin.settings.defaultKanbanHeaders = value;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Completed Headers')
            .setDesc('Comma-separated list of headers that should mark items as completed')
            .addText(text => text.setValue(this.plugin.settings.kanbanCompletedHeaders).onChange(async (value) => {
                this.plugin.settings.kanbanCompletedHeaders = value;
                await this.plugin.saveSettings();
            }));
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
            .setName('File Name')
            .addText(text => text.onChange(value => this.fileName = value));

        // Date position toggle
        new Setting(contentEl)
            .setName('Date Position')
            .addDropdown(dropdown => dropdown
                .addOption('none', 'No Date')
                .addOption('prefix', 'Prefix')
                .addOption('suffix', 'Suffix')
                .setValue(this.datePosition)
                .onChange(value => this.datePosition = value));

        // File type toggle
        new Setting(contentEl)
            .setName('File Type')
            .addDropdown(dropdown => dropdown
                .addOption('markdown', 'Markdown')
                .addOption('pdf', 'PDF')
                .addOption('kanban', 'Kanban Board')
                .addOption('base', 'Base File')
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
                        files.forEach(file => {
                            const name = file.split('/').pop();
                            dropdown.addOption(name, name);
                        });
                        dropdown.onChange(value => this.template = value);
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
        this.specialOptionsContainer.createEl('h3', { text: 'Base Content' });
        this.specialOptionsContainer.createEl('span', { 
            text: 'Enter the base file content (views, filters, etc.). See the ',
            cls: 'setting-item-description'
        });
        const link = this.specialOptionsContainer.createEl('a', {
            text: 'base syntax documentation for details.',
            href: 'https://help.obsidian.md/bases/syntax'
        });
        link.setAttr('target', '_blank');
        
        const textAreaContainer = this.specialOptionsContainer.createDiv();
        const textArea = textAreaContainer.createEl('textarea', {
            placeholder: 'views:\n  - type: table\n    name: My View\n    filters:\n      and:\n        - file.path.contains("folder")',
            cls: 'base-content-textarea'
        });
        textArea.style.width = '100%';
        textArea.style.height = '200px';
        textArea.style.fontFamily = 'monospace';
        textArea.style.fontSize = '12px';
        textArea.addEventListener('input', (e) => {
            this.baseContent = e.target.value;
        });
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
