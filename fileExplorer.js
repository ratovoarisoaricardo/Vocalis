/**
 * Copyright (c) 2026 Ricardo Ratovoarisoa. Tous droits réservés.
 * Ce projet et son code source sont protégés sous licence propriétaire.
 *
 * Vocalis AI - File Explorer
 * Utilise l'API File System Access pour parcourir et ouvrir des fichiers locaux.
 */

const FileExplorer = (() => {
    let directoryHandle = null;
    let fileIndex = []; // Cache de tous les fichiers trouvés
    
    // Extensions supportées par type
    const fileTypes = {
        image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'],
        audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'],
        video: ['.mp4', '.webm', '.mkv', '.avi', '.mov'],
        text: ['.txt', '.md', '.json', '.csv', '.xml', '.html', '.css', '.js', '.py', '.java', '.log', '.ini', '.cfg'],
        pdf: ['.pdf'],
        document: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    };
    
    function getFileType(fileName) {
        const ext = '.' + fileName.split('.').pop().toLowerCase();
        for (const [type, exts] of Object.entries(fileTypes)) {
            if (exts.includes(ext)) return type;
        }
        return 'unknown';
    }
    
    function getFileIcon(type) {
        switch (type) {
            case 'image': return 'fa-image';
            case 'audio': return 'fa-file-audio';
            case 'video': return 'fa-file-video';
            case 'text': return 'fa-file-code';
            case 'pdf': return 'fa-file-pdf';
            case 'document': return 'fa-file-word';
            default: return 'fa-file';
        }
    }
    
    // Parcourir récursivement un dossier
    async function indexDirectory(dirHandle, path = '') {
        const entries = [];
        for await (const entry of dirHandle.values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
                entries.push({
                    name: entry.name,
                    path: entryPath,
                    handle: entry,
                    kind: 'file',
                    type: getFileType(entry.name)
                });
            } else if (entry.kind === 'directory') {
                entries.push({
                    name: entry.name,
                    path: entryPath,
                    handle: entry,
                    kind: 'directory',
                    type: 'folder'
                });
                // Récursion (limiter la profondeur à 3 niveaux pour la performance)
                const depth = entryPath.split('/').length;
                if (depth < 4) {
                    try {
                        const subEntries = await indexDirectory(entry, entryPath);
                        entries.push(...subEntries);
                    } catch (e) {
                        // Accès refusé à certains sous-dossiers
                    }
                }
            }
        }
        return entries;
    }
    
    // Demander l'accès au système de fichiers
    async function requestAccess() {
        if (!('showDirectoryPicker' in window)) {
            createFileErrorWidget("Votre navigateur ne supporte pas l'accès aux fichiers. Utilisez Chrome ou Edge.");
            return;
        }
        
        try {
            directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
            
            // Indexer le dossier
            createFileLoadingWidget();
            fileIndex = await indexDirectory(directoryHandle);
            
            // Afficher l'explorateur
            createFileExplorerWidget(directoryHandle.name, fileIndex);
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error("Erreur d'accès aux fichiers :", e);
                createFileErrorWidget("Erreur d'accès au dossier. Veuillez réessayer.");
            }
        }
    }
    
    // Chercher un fichier et l'ouvrir
    async function searchAndOpen(query) {
        if (!directoryHandle) {
            // Pas de dossier ouvert, demander l'accès d'abord
            await requestAccess();
        }
        
        if (fileIndex.length === 0) return;
        
        const q = query.toLowerCase();
        const results = fileIndex.filter(f => 
            f.kind === 'file' && f.name.toLowerCase().includes(q)
        );
        
        if (results.length === 0) {
            createFileErrorWidget(`Aucun fichier trouvé pour "${query}".`);
            return;
        }
        
        if (results.length === 1) {
            await openFile(results[0]);
        } else {
            createFileSearchResultsWidget(query, results.slice(0, 10));
        }
    }
    
    // Ouvrir un fichier selon son type
    async function openFile(fileEntry) {
        try {
            const file = await fileEntry.handle.getFile();
            const type = fileEntry.type;
            
            switch (type) {
                case 'image':
                    openImageFile(file, fileEntry.name);
                    break;
                case 'audio':
                    openAudioFile(file, fileEntry.name);
                    break;
                case 'video':
                    openVideoFile(file, fileEntry.name);
                    break;
                case 'text':
                    openTextFile(file, fileEntry.name);
                    break;
                case 'pdf':
                    openPDFFile(file, fileEntry.name);
                    break;
                default:
                    // Proposer le téléchargement
                    openDownloadFile(file, fileEntry.name);
                    break;
            }
        } catch (e) {
            console.error("Erreur d'ouverture du fichier :", e);
        }
    }
    
    // --- Fonctions d'ouverture par type ---
    
    function openImageFile(file, name) {
        const url = URL.createObjectURL(file);
        createFilePreviewWidget('image', name, `<img src="${url}" alt="${name}" class="file-preview-img" />`);
    }
    
    function openAudioFile(file, name) {
        const url = URL.createObjectURL(file);
        createFilePreviewWidget('audio', name, `
            <div class="file-audio-player">
                <div class="audio-icon"><i class="fa-solid fa-headphones"></i></div>
                <audio controls autoplay src="${url}" style="width:100%;"></audio>
            </div>
        `);
    }
    
    function openVideoFile(file, name) {
        const url = URL.createObjectURL(file);
        createFilePreviewWidget('video', name, `<video controls autoplay src="${url}" class="file-preview-video"></video>`);
    }
    
    async function openTextFile(file, name) {
        const text = await file.text();
        const escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        createFilePreviewWidget('text', name, `<pre class="file-preview-code">${escaped}</pre>`);
    }
    
    function openPDFFile(file, name) {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        createFilePreviewWidget('pdf', name, `<div class="file-pdf-msg"><i class="fa-solid fa-up-right-from-square"></i> PDF ouvert dans un nouvel onglet</div>`);
    }
    
    function openDownloadFile(file, name) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // --- Widgets d'interface ---
    
    function createFileExplorerWidget(dirName, entries) {
        const container = document.getElementById('widgetsContainer');
        // Supprimer le widget loading
        const loading = container.querySelector('.widget-file-loading');
        if (loading) loading.remove();
        
        const widgetId = `files-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'widget-card widget-files';
        card.id = widgetId;
        
        // Grouper les fichiers par type et ne garder que les top-level
        const topLevel = entries.filter(e => !e.path.includes('/'));
        const fileCount = entries.filter(e => e.kind === 'file').length;
        const folderCount = entries.filter(e => e.kind === 'directory').length;
        
        let listHTML = '';
        topLevel.slice(0, 20).forEach(entry => {
            const icon = entry.kind === 'directory' ? 'fa-folder' : getFileIcon(entry.type);
            const iconColor = entry.kind === 'directory' ? 'style="color: #fbbf24;"' : '';
            const clickAction = entry.kind === 'file' 
                ? `onclick="FileExplorer.openByPath('${entry.path.replace(/'/g, "\\'")}')"` 
                : '';
            listHTML += `<div class="file-entry" ${clickAction}>
                <i class="fa-solid ${icon}" ${iconColor}></i>
                <span class="file-entry-name">${entry.name}</span>
            </div>`;
        });
        
        if (topLevel.length > 20) {
            listHTML += `<div class="file-entry-more">... et ${topLevel.length - 20} autres éléments</div>`;
        }
        
        card.innerHTML = `
            <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
            <div class="widget-title"><i class="fa-solid fa-folder-open"></i> ${dirName}</div>
            <div class="file-stats">${fileCount} fichiers · ${folderCount} dossiers</div>
            <div class="file-list">${listHTML}</div>
        `;
        
        container.insertBefore(card, container.firstChild);
    }
    
    function createFileSearchResultsWidget(query, results) {
        const container = document.getElementById('widgetsContainer');
        const widgetId = `search-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'widget-card widget-files';
        card.id = widgetId;
        
        let listHTML = '';
        results.forEach(entry => {
            const icon = getFileIcon(entry.type);
            listHTML += `<div class="file-entry" onclick="FileExplorer.openByPath('${entry.path.replace(/'/g, "\\'")}')">
                <i class="fa-solid ${icon}"></i>
                <span class="file-entry-name">${entry.name}</span>
                <span class="file-entry-path">${entry.path}</span>
            </div>`;
        });
        
        card.innerHTML = `
            <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
            <div class="widget-title"><i class="fa-solid fa-magnifying-glass"></i> Résultats : "${query}"</div>
            <div class="file-list">${listHTML}</div>
        `;
        
        container.insertBefore(card, container.firstChild);
    }
    
    function createFilePreviewWidget(type, name, contentHTML) {
        const container = document.getElementById('widgetsContainer');
        removeEmptyState();
        
        const widgetId = `preview-${Date.now()}`;
        const card = document.createElement('div');
        card.className = `widget-card widget-file-preview widget-preview-${type}`;
        card.id = widgetId;
        
        card.innerHTML = `
            <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
            <div class="widget-title"><i class="fa-solid ${getFileIcon(type)}"></i> ${name}</div>
            <div class="file-preview-content">${contentHTML}</div>
        `;
        
        container.insertBefore(card, container.firstChild);
    }
    
    function createFileLoadingWidget() {
        const container = document.getElementById('widgetsContainer');
        removeEmptyState();
        
        const card = document.createElement('div');
        card.className = 'widget-card widget-file-loading';
        card.innerHTML = `
            <div class="widget-title"><i class="fa-solid fa-spinner fa-spin"></i> Indexation des fichiers...</div>
            <div class="file-loading-bar"><div class="file-loading-fill"></div></div>
        `;
        container.insertBefore(card, container.firstChild);
    }
    
    function createFileErrorWidget(message) {
        const container = document.getElementById('widgetsContainer');
        removeEmptyState();
        
        const widgetId = `file-err-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'widget-card widget-file-error';
        card.id = widgetId;
        card.innerHTML = `
            <button class="widget-card-close" onclick="closeWidget('${widgetId}')"><i class="fa-solid fa-xmark"></i></button>
            <div class="widget-title"><i class="fa-solid fa-triangle-exclamation"></i> Fichiers</div>
            <div class="file-error-msg">${message}</div>
        `;
        container.insertBefore(card, container.firstChild);
    }
    
    // Ouvrir un fichier par son chemin (appelé depuis le HTML)
    function openByPath(path) {
        const entry = fileIndex.find(f => f.path === path && f.kind === 'file');
        if (entry) openFile(entry);
    }
    
    return {
        requestAccess,
        searchAndOpen,
        openFile,
        openByPath
    };
})();
