# File Creator

A comprehensive Obsidian plugin for creating files with advanced options including Kanban boards, base files, PDF templates, and embedding capabilities.

<img width="1640" height="1716" alt="image" src="https://github.com/user-attachments/assets/341d1bc7-6c9e-48bb-bb40-3b86fd6d882d" />

<img width="1578" height="1490" alt="image" src="https://github.com/user-attachments/assets/6c53f7ec-b02c-4c07-952a-474dbd3adfb8" />


## Features

### 📝 File Creation
- **Quick File Creation**: Create new files in any folder in your vault with just a few clicks
- **Multiple File Types**: Markdown, PDF from templates, Kanban boards, Base files (.base), and Excalidraw drawings
- **Folder Selection**: Browse your vault's folder structure with proper indentation
- **Ignore Folders**: Configure folders to exclude from the dropdown
- **Date Integration**: Optionally add the current date to your filenames (prefix/suffix/none)
- **File Embedding**: Embed newly created files directly into existing notes

### 📑 Templates
- **PDF Templates**: Create new PDF files from templates stored in your vault
- **Markdown Templates**: Select from your own vault markdown templates on file creation
- **Base Templates**: Create base files from customizable templates
- **Excalidraw Templates**: Create drawings from pre-made Excalidraw templates
- **Kanban Boards**: Generate Kanban boards with configurable headers and completion states

### 🗂️ Kanban Board Creation
- **Custom Headers**: Configure default column headers (To Do, Doing, Done)
- **Completion Tracking**: Mark specific headers as "completed" states
- **Sample Tasks**: Auto-generate sample tasks in each column
- **Kanban Plugin Compatible**: Works with the Kanban plugin format

### 📄 Base File Support
- **Base File Creation**: Create .base files for custom data storage
- **Template System**: Use base templates for consistent file structure
- **Content Customization**: Add custom content to base files during creation

### 🎨 Excalidraw Integration
- **Drawing Creation**: Create new Excalidraw drawings (.excalidraw.md files)
- **Template Support**: Use pre-made drawing templates for consistency
- **Blank Drawings**: Start with empty canvas or choose from templates
- **Excalidraw Plugin Compatible**: Works seamlessly with the Excalidraw plugin

### ⚙️ Customization
- **Custom Default Settings**: Preconfigure default file type, date position, and templates
- **Configurable Date Format**: Control how dates are inserted into filenames
- **Template Paths**: Separate paths for different template types

## Usage

### Basic File Creation
1. Click the "File Creator" ribbon icon or run the command from the palette
2. Choose a target folder
3. Enter your desired file name
4. Choose file type (Markdown, PDF, Kanban, Base, or Excalidraw)
5. Select a template (if available)
6. Choose date prefix/suffix (optional)
7. Optionally specify a note to embed the file into
8. Click "Create"

### Kanban Board Creation
1. Select "Kanban Board" as file type
2. Configure column headers (comma-separated)
3. Set completion headers for task tracking
4. File will be created with Kanban plugin format

### Base File Creation
1. Select "Base File" as file type
2. Choose from available base templates
3. Customize content as needed
4. File will be created with .base extension

### Excalidraw Drawing Creation
1. Select "Excalidraw Drawing" as file type
2. Choose "Blank Drawing" or select from available templates
3. File will be created with .excalidraw.md extension
4. Open in Excalidraw view to start drawing

### File Embedding
- Enter a note path in "Embed in Note" field
- Newly created file will be automatically embedded
- Supports all file types (markdown, PDF, base, kanban, excalidraw)

## Settings

### General Settings
- **Date Format**: Format string for dates in filenames (default: MMddYYYY)
- **Default Date Position**: Choose to prefix/suffix or skip date insertion
- **Default File Type**: Markdown, PDF, Kanban, Base, or Excalidraw
- **Ignore Folders During File Creation**: Comma-separated list of folders to hide in folder picker

### Template Settings
- **PDF Templates Path**: Folder containing PDF templates
- **Default PDF Template**: File to use as a base for PDFs
- **Markdown Templates Path**: Folder containing Markdown templates
- **Default Markdown Template**: Markdown template to use by default
- **Base Templates Path**: Folder containing base file templates
- **Default Base Template**: Base template to use by default
- **Excalidraw Templates Path**: Folder containing Excalidraw templates
- **Default Excalidraw Template**: Excalidraw template to use by default

### Kanban Board Settings
- **Default Kanban Headers**: Comma-separated list of default headers for new kanban boards
- **Completed Headers**: Headers where items should be marked as completed

## Installation

### 📦 Obsidian Plugin Store (Pending Approval)

You’ll soon be able to find it directly in the Community Plugins browser.

### 🧪 Using BRAT (Beta Reviewer's Auto-update Tool)

1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Open BRAT settings
3. Click **Add Beta Plugin**
4. Enter: `DudeThatsErin/FileCreator`
5. Click **Add Plugin**
6. Enable "File Creator" in Community Plugins settings

## Support

- 💬 [Discord Support](https://discord.gg/your-discord-server) - Fastest support
- 🐛 [Report Issues](https://github.com/DudeThatsErin/FileCreator/issues)
- ⭐ [Star on GitHub](https://github.com/DudeThatsErin/FileCreator)
- ☕ [Buy Me a Coffee](https://buymeacoffee.com/erinskidds)

## Changelog

### v1.3.0
- Added Excalidraw drawing creation with template support
- Enhanced template system for all file types
- Improved file type selection and organization

### v1.2.0
- Added Kanban board creation with configurable headers
- Added Base file support with template system
- Added file embedding functionality
- Added base template configuration
- Enhanced settings with support links

### v1.1.0
- Added PDF template support
- Enhanced folder selection
- Improved error handling

### v1.0.0
- Initial release
- Basic file creation with date options
- Markdown template support

## License

This plugin is licensed under the GNU General Public License v3.0.
