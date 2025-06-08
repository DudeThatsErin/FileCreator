// === File Creator Plugin ===

const { Plugin, PluginSettingTab, App, Modal, Setting, Notice, TFile, normalizePath } = require('obsidian');

const DEFAULT_SETTINGS = {
    dateFormat: 'MMddYYYY',
    datePosition: 'none', // 'none', 'prefix', 'suffix'
    fileType: 'markdown', // 'markdown', 'pdf'
    pdfTemplatesPath: '/00-assets/01-pdfs/',
    defaultPdfTemplate: 'blank.pdf',
    mdTemplatesPath: '/00-assets/02-templates/',
    defaultMdTemplate: 'none',
    ignoreFileCreationFolders: ''
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
                .setValue(this.fileType)
                .onChange(value => {
                    this.fileType = value;
                    this.loadTemplates(contentEl);
                }));

        this.templateContainer = contentEl.createDiv();
        this.loadTemplates(contentEl);

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

    async loadTemplates(container) {
        this.templateContainer.empty();
        const path = this.fileType === 'pdf' ? this.plugin.settings.pdfTemplatesPath : this.plugin.settings.mdTemplatesPath;
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
    }

    async createFile() {
        if (!this.fileName || !this.folderPath) return new Notice('Missing name or folder');

        const date = this.formatDate(new Date(), this.plugin.settings.dateFormat);
        let fullName = this.fileName;
        if (this.datePosition === 'prefix') fullName = `${date}-${fullName}`;
        if (this.datePosition === 'suffix') fullName = `${fullName}-${date}`;
        const ext = this.fileType === 'markdown' ? '.md' : '.pdf';
        const path = `${this.folderPath}/${fullName}${ext}`;

        if (await this.app.vault.adapter.exists(path)) return new Notice('File already exists');
        if (!(await this.app.vault.adapter.exists(this.folderPath))) await this.app.vault.createFolder(this.folderPath);

        if (this.fileType === 'markdown') {
            let content = '';
            if (this.template) {
                const tplPath = `${this.plugin.settings.mdTemplatesPath}/${this.template}`;
                content = await this.app.vault.adapter.read(tplPath);
            }
            await this.app.vault.create(path, content);
        } else {
            const tplPath = `${this.plugin.settings.pdfTemplatesPath}/${this.template}`;
            const data = await this.app.vault.adapter.readBinary(tplPath);
            await this.app.vault.adapter.writeBinary(path, data);
        }

        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) this.app.workspace.getLeaf().openFile(file);
        new Notice(`Created: ${path}`);
        this.close();
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
