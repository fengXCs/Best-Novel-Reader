"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NovelReaderViewProvider = void 0;
const fs = require("fs");
const vscode = require("vscode");
const chapterParser_1 = require("./chapterParser");
const globalStateEnum_1 = require("./enums/globalStateEnum");
const vscodeCommandEnum_1 = require("./enums/vscodeCommandEnum");
const utils_1 = require("./utils");

const READING_SETTINGS_KEY = 'documentPreview.readingSettings';
const CONTROLS_VISIBLE_KEY = 'documentPreview.controlsVisible';
const DEFAULT_READING_SETTINGS = Object.freeze({ mode: 'chapter', lineHeight: 1.65, paragraphSpacing: 0 });
const MAX_SCROLL_CHAPTERS = 12;
const MAX_SCROLL_CHARACTERS = 1500000;
const IS_CHINESE = /^zh(?:-|$)/i.test(vscode.env.language || '');

function localize(chinese, english) {
    return IS_CHINESE ? chinese : english;
}

const UI_TEXT = Object.freeze({
    documentPreview: localize('文档预览', 'Document Preview'),
    chapters: localize('章节', 'Chapters'),
    controls: localize('控件', 'Controls'),
    hideChapters: localize('隐藏章节', 'Hide Chapters'),
    hideControls: localize('隐藏控件', 'Hide Controls'),
    chapterPaging: localize('章节翻页', 'Chapter Paging'),
    continuousScrolling: localize('连续滚动', 'Continuous Scrolling'),
    addDocument: localize('添加文档', 'Add Document'),
    documents: localize('文档列表', 'Documents'),
    findDocuments: localize('查找文档…', 'Find documents…'),
    findChapters: localize('查找章节…', 'Find chapters…'),
    readingMode: localize('阅读形式', 'Reading Mode'),
    lineHeight: localize('行距', 'Line Height'),
    paragraphSpacing: localize('段距', 'Paragraph Spacing'),
    fontSize: localize('字号', 'Font Size'),
    reset: localize('恢复默认', 'Reset'),
    previousChapter: localize('上一章', 'Previous'),
    chapterJump: localize('章节跳转', 'Go to Chapter'),
    nextChapter: localize('下一章', 'Next'),
    closeReader: localize('关闭阅读', 'Close'),
    chooseDocument: localize('请选择一个文档', 'Choose a document'),
    welcomeHint: localize('可在上方查找、打开或添加文档。', 'Find, open, or add a document above.'),
    noMatchingDocuments: localize('没有匹配的文档', 'No matching documents'),
    noDocuments: localize('尚未添加文档', 'No documents added'),
    selectDocumentFirst: localize('先选择左侧文档', 'Select a document on the left'),
    noMatchingChapters: localize('没有匹配的章节', 'No matching chapters'),
    noChapters: localize('未识别到章节', 'No chapters recognized')
});

function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

class NovelReaderViewProvider {
    constructor(_context) {
        this._context = _context;
        this._chapters = [];
        this._currentChapterIndex = 0;
        this._chapterCache = new Map();
        this._chapterListSentPath = undefined;
        this._controlsVisible = this._context.globalState.get(CONTROLS_VISIBLE_KEY, true);
    }

    _getReadingSettings() {
        if (this._readingSettings) {
            return { ...this._readingSettings };
        }
        const saved = this._context.globalState.get(READING_SETTINGS_KEY, {});
        this._readingSettings = {
            mode: saved && saved.mode === 'scroll' ? 'scroll' : DEFAULT_READING_SETTINGS.mode,
            lineHeight: Math.round(clampNumber(saved && saved.lineHeight, 1.2, 2.5, DEFAULT_READING_SETTINGS.lineHeight) * 20) / 20,
            paragraphSpacing: Math.round(clampNumber(saved && saved.paragraphSpacing, 0, 32, DEFAULT_READING_SETTINGS.paragraphSpacing) / 2) * 2
        };
        return { ...this._readingSettings };
    }

    _saveReadingSettings(settings) {
        const current = this._getReadingSettings();
        const next = {
            mode: settings && settings.mode === 'scroll' ? 'scroll' : (settings && settings.mode === 'chapter' ? 'chapter' : current.mode),
            lineHeight: Math.round(clampNumber(settings && settings.lineHeight, 1.2, 2.5, current.lineHeight) * 20) / 20,
            paragraphSpacing: Math.round(clampNumber(settings && settings.paragraphSpacing, 0, 32, current.paragraphSpacing) / 2) * 2
        };
        this._readingSettings = next;
        this._context.globalState.update(READING_SETTINGS_KEY, next);
        return next;
    }

    _getNovels() {
        return this._context.globalState.get(globalStateEnum_1.GlobalStateEnum.NOVELS, []);
    }

    _getCachedChapters(novel) {
        const stat = fs.statSync(novel.path);
        const fingerprint = `${stat.size}:${stat.mtimeMs}`;
        const cached = this._chapterCache.get(novel.path);
        if (cached && cached.fingerprint === fingerprint) {
            this._chapterCache.delete(novel.path);
            this._chapterCache.set(novel.path, cached);
            return cached.chapters;
        }
        if (cached && this._chapterListSentPath === novel.path) {
            this._chapterListSentPath = undefined;
        }
        const novelText = (0, utils_1.readTextFileWithAutoEncoding)(novel.path);
        const chapters = (0, chapterParser_1.parseChapters)(novelText, localize('全文', 'Full Text'));
        this._chapterCache.delete(novel.path);
        this._chapterCache.set(novel.path, { fingerprint, chapters });
        while (this._chapterCache.size > 2) {
            const oldestPath = this._chapterCache.keys().next().value;
            this._chapterCache.delete(oldestPath);
        }
        return chapters;
    }

    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.title = UI_TEXT.documentPreview;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'nextChapter':
                    this.navigateChapter('next');
                    return;
                case 'previousChapter':
                    this.navigateChapter('previous');
                    return;
                case 'importDocument':
                    Promise.resolve(vscode.commands.executeCommand(vscodeCommandEnum_1.VscodeCommandEnum.IMPORT_NOVEL))
                        .finally(() => this._sendLibrary());
                    return;
                case 'requestChapters':
                    this._sendChapters(message.payload && message.payload.path);
                    return;
                case 'openDocument':
                    this._openDocument(message.payload && message.payload.path);
                    return;
                case 'openChapter':
                    this._openChapter(message.payload && message.payload.path, Number(message.payload && message.payload.index));
                    return;
                case 'requestChapterContent':
                    this._requestChapterContent(message.payload && message.payload.path, Number(message.payload && message.payload.index), Boolean(message.payload && message.payload.append), message.payload && message.payload.direction, message.payload && message.payload.requestId);
                    return;
                case 'chapterChanged':
                    this._recordChapterProgress(message.payload && message.payload.path, Number(message.payload && message.payload.index));
                    return;
                case 'ctrl+delete':
                    if (!this._currentNovel) {
                        vscode.commands.executeCommand(vscodeCommandEnum_1.VscodeCommandEnum.SHOW_CURRENT_NOVEL);
                    }
                    else {
                        this.clearView();
                    }
                    return;
                case 'closeReader':
                    this.clearView();
                    return;
                case 'updateFontSize':
                    this._context.globalState.update(globalStateEnum_1.GlobalStateEnum.FONT_SIZE, message.payload);
                    return;
                case 'updateReadingSettings':
                    this._saveReadingSettings(message.payload || {});
                    return;
                case 'setControlsVisible':
                    this._controlsVisible = Boolean(message.payload);
                    this._context.globalState.update(CONTROLS_VISIBLE_KEY, this._controlsVisible);
                    return;
                case 'focusTerminal':
                    this.focusTerminal();
                    return;
                case 'webviewReady':
                    this._chapterListSentPath = undefined;
                    this._sendLibrary();
                    if (this._pendingChapter) {
                        const pending = this._pendingChapter;
                        this._pendingChapter = undefined;
                        this._sendChapterContent(pending.novel, pending.chapterIndex, Boolean(pending.append), pending.direction, pending.requestId);
                    }
                    else if (this._currentNovel) {
                        this.loadChapter(this._currentNovel, this._currentChapterIndex);
                    }
                    else {
                        this._restoreLastDocument();
                    }
                    return;
            }
        });
        webviewView.onDidDispose(() => {
            this._view = undefined;
            this._chapterCache.clear();
        });
    }

    _sendLibrary() {
        if (!this._view) {
            return;
        }
        const novels = this._getNovels().map(novel => ({
            id: novel.id,
            title: novel.title || novel.name || String(novel.path || '').split(/[\\/]/).pop(),
            path: novel.path,
            currentChapter: Number.isInteger(novel.currentChapter) ? novel.currentChapter : 0
        }));
        this._view.webview.postMessage({
            command: 'updateLibrary',
            payload: {
                novels,
                currentPath: this._currentNovel && this._currentNovel.path,
                readingSettings: this._getReadingSettings()
            }
        });
    }

    _findNovel(path) {
        if (!path) {
            return undefined;
        }
        return this._getNovels().find(item => item.path === path) ||
            (this._currentNovel && this._currentNovel.path === path ? this._currentNovel : undefined);
    }

    _sendChapters(path) {
        if (!this._view || !path) {
            return;
        }
        const novel = this._findNovel(path);
        if (!novel) {
            return;
        }
        try {
            const chapters = this._getCachedChapters(novel);
            if (this._currentNovel && this._currentNovel.path === novel.path) {
                this._chapters = chapters;
            }
            this._chapterListSentPath = novel.path;
            this._view.webview.postMessage({
                command: 'updateChapters',
                payload: {
                    path: novel.path,
                    title: novel.title || novel.name || String(novel.path).split(/[\\/]/).pop(),
                    currentChapter: this._currentNovel && this._currentNovel.path === novel.path
                        ? this._currentChapterIndex
                        : (Number.isInteger(novel.currentChapter) ? novel.currentChapter : 0),
                    chapters: chapters.map(chapter => chapter.title)
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`${localize('读取文档失败', 'Failed to read document')}: ${error}`);
        }
    }

    _openDocument(path) {
        const novel = this._findNovel(path);
        if (novel) {
            this.loadChapter(novel, Number.isInteger(novel.currentChapter) ? novel.currentChapter : 0);
        }
    }

    _recordChapterProgress(path, index) {
        const novel = this._findNovel(path);
        if (!novel || !Number.isInteger(index) || index < 0) {
            return;
        }
        if (this._currentNovel && this._currentNovel.path === path) {
            this._currentChapterIndex = index;
        }
        const novels = this._getNovels();
        const storedNovel = novels.find(item => item.path === path);
        if (!storedNovel || storedNovel.currentChapter === index) {
            return;
        }
        storedNovel.currentChapter = index;
        this._context.globalState.update(globalStateEnum_1.GlobalStateEnum.NOVELS, novels).then(() => {
            vscode.commands.executeCommand(vscodeCommandEnum_1.VscodeCommandEnum.REFRESH_SIDEBAR);
        });
    }

    _openChapter(path, index) {
        if (!Number.isInteger(index) || index < 0) {
            return;
        }
        const novel = this._findNovel(path);
        if (!novel) {
            return;
        }
        this._recordChapterProgress(path, index);
        this.loadChapter(novel, index);
    }

    _requestChapterContent(path, index, append, direction, requestId) {
        if (!Number.isInteger(index) || index < 0) {
            return;
        }
        const novel = this._findNovel(path);
        if (novel) {
            this._sendChapterContent(novel, index, append, direction, requestId);
        }
    }

    _sendChapterContent(novel, chapterIndex, append, direction, requestId) {
        if (!this._view) {
            this._pendingChapter = { novel, chapterIndex, append, direction, requestId };
            vscode.commands.executeCommand('documentPreviewView.focus');
            return;
        }
        if (append && (!this._currentNovel || this._currentNovel.path !== novel.path)) {
            return;
        }
        try {
            const chapters = this._getCachedChapters(novel);
            this._chapters = chapters;
            if (!chapters.length) {
                vscode.window.showInformationMessage(localize('没有找到可阅读的章节。', 'No readable chapters were found.'));
                return;
            }
            const safeIndex = Math.max(0, Math.min(chapterIndex, chapters.length - 1));
            const chapter = chapters[safeIndex];
            if (!append) {
                this._currentNovel = novel;
                this._currentChapterIndex = safeIndex;
            }
            if (!append) {
                this._view.show(true);
            }
            if (this._chapterListSentPath !== novel.path) {
                this._sendChapters(novel.path);
            }
            this._view.webview.postMessage({
                command: 'updateContent',
                payload: {
                    append: Boolean(append),
                    direction: append && direction === 'before' ? 'before' : 'after',
                    requestId,
                    novelPath: novel.path,
                    chapterIndex: safeIndex,
                    title: chapter.title,
                    content: chapter.content,
                    isFirst: safeIndex === 0,
                    isLast: safeIndex === chapters.length - 1,
                    chapterCount: chapters.length,
                    fontSize: this._context.globalState.get(globalStateEnum_1.GlobalStateEnum.FONT_SIZE, 16),
                    readingSettings: this._getReadingSettings()
                }
            });
            if (!append) {
                this._recordChapterProgress(novel.path, safeIndex);
            }
            if (!append && novel.id) {
                this._context.globalState.update(globalStateEnum_1.GlobalStateEnum.LAST_VIEWED_NOVEL_ID, novel.id);
            }
            this._sendLibrary();
        }
        catch (error) {
            if (append && this._view) {
                this._view.webview.postMessage({
                    command: 'chapterContentError',
                    payload: { direction: direction === 'before' ? 'before' : 'after', requestId }
                });
            }
            vscode.window.showErrorMessage(`${localize('读取章节失败', 'Failed to read chapter')}: ${error}`);
        }
    }

    _restoreLastDocument() {
        const novels = this._getNovels();
        const lastId = this._context.globalState.get(globalStateEnum_1.GlobalStateEnum.LAST_VIEWED_NOVEL_ID);
        const novel = novels.find(item => item.id === lastId);
        if (novel) {
            this.loadChapter(novel, Number.isInteger(novel.currentChapter) ? novel.currentChapter : 0);
        }
    }

    clearView() {
        this._currentNovel = undefined;
        this._currentChapterIndex = 0;
        this._chapters = [];
        this._chapterListSentPath = undefined;
        this._chapterCache.clear();
        if (this._view) {
            this._view.webview.postMessage({ command: 'resetView' });
            this._sendLibrary();
        }
    }

    loadChapter(novel, chapterIndex) {
        if (!this._view) {
            this._pendingChapter = { novel, chapterIndex };
            vscode.commands.executeCommand('documentPreviewView.focus');
            return;
        }
        this._sendChapterContent(novel, chapterIndex, false);
    }

    navigateChapter(direction) {
        if (!this._currentNovel) {
            vscode.window.showInformationMessage(localize('请先打开一个文档。', 'Open a document first.'));
            return;
        }
        const newIndex = this._currentChapterIndex + (direction === 'next' ? 1 : -1);
        if (newIndex >= 0 && newIndex < this._chapters.length) {
            this._openChapter(this._currentNovel.path, newIndex);
        }
    }

    focusTerminal() {
        Promise.resolve(vscode.commands.executeCommand('workbench.action.terminal.focus')).catch(error => {
            vscode.window.showErrorMessage(`${localize('切换到终端失败', 'Failed to focus the terminal')}: ${error}`);
        });
    }

    _getHtmlForWebview(_webview) {
        const nonce = getNonce();
        const controlsVisible = this._controlsVisible ? 'true' : 'false';
        const lastViewedId = this._context.globalState.get(globalStateEnum_1.GlobalStateEnum.LAST_VIEWED_NOVEL_ID);
        const hasRestorableDocument = Boolean(this._currentNovel || this._pendingChapter || this._getNovels().some(novel => novel.id === lastViewedId));
        const navigationVisible = hasRestorableDocument ? 'false' : 'true';
        return `<!DOCTYPE html>
<html lang="${IS_CHINESE ? 'zh-CN' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${UI_TEXT.documentPreview}</title>
    <style>
        * { box-sizing: border-box; }
        :root { --reader-line-height: 1.65; --reader-paragraph-spacing: 0px; }
        body { margin: 0; padding: 10px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); overflow-y: auto; }
        button, input, select { font: inherit; }
        button { padding: 4px 9px; border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-background); color: var(--vscode-button-foreground); cursor: pointer; }
        button:hover { background: var(--vscode-button-hoverBackground); }
        button:disabled { cursor: not-allowed; opacity: .45; }
        input, select { padding: 5px 7px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border, transparent); }
        input { width: 100%; }
        select { min-width: 120px; }
        .hidden { display: none !important; }
        .reader-toolbar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 6px; min-height: 34px; padding: 4px 0; background: var(--vscode-editor-background); }
        .toolbar-spacer { flex: 1; }
        .mode-indicator { color: var(--vscode-descriptionForeground); font-size: .85em; }
        .overlay-panel { position: fixed; top: 52px; left: 10px; right: 10px; z-index: 25; max-height: min(64vh, 560px); overflow-y: auto; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; background: var(--vscode-sideBar-background); box-shadow: 0 8px 24px rgba(0,0,0,.28); }
        .browser-grid { display: grid; grid-template-columns: minmax(150px, 1fr) minmax(210px, 1.6fr); gap: 10px; }
        .browser-column { min-width: 0; }
        .column-title { margin: 0 0 6px; font-weight: 600; }
        .list-scroll { margin-top: 6px; max-height: 245px; overflow-y: auto; border: 1px solid var(--vscode-panel-border); }
        .list-item { display: block; width: 100%; padding: 6px 8px; border: 0; border-bottom: 1px solid var(--vscode-panel-border); text-align: left; color: var(--vscode-foreground); background: transparent; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .list-item:hover { background: var(--vscode-list-hoverBackground); }
        .list-item.active { color: var(--vscode-list-activeSelectionForeground); background: var(--vscode-list-activeSelectionBackground); }
        .empty-tip { padding: 10px; color: var(--vscode-descriptionForeground); text-align: center; }
        .control-grid { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)); gap: 9px; align-items: end; }
        .control-field { display: flex; flex-direction: column; gap: 4px; color: var(--vscode-descriptionForeground); font-size: .88em; }
        .control-field input[type="range"] { width: 100%; padding: 0; }
        .control-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 10px; }
        .grow { flex: 1; }
        .font-size-display, .range-value { min-width: 38px; text-align: center; color: var(--vscode-descriptionForeground); }
        #welcome-message { min-height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; color: var(--vscode-descriptionForeground); text-align: center; }
        #title, #content, .chapter-text { white-space: pre-wrap; line-height: var(--reader-line-height); }
        #title { margin: 8px 0 14px; }
        .chapter-block { margin: 0 0 24px; scroll-margin-top: 48px; }
        .chapter-block h2 { margin: 8px 0 14px; }
        .chapter-paragraph { margin: 0 0 var(--reader-paragraph-spacing); padding-left: 2em; text-indent: 0; }
        .chapter-paragraph:last-child { margin-bottom: 0; }
        .page-bottom-controls { display: flex; justify-content: center; gap: 7px; margin-top: 22px; padding-top: 10px; border-top: 1px solid var(--vscode-panel-border); }
        @media (max-width: 560px) { .browser-grid, .control-grid { grid-template-columns: 1fr; } .list-scroll { max-height: 190px; } }
    </style>
</head>
<body data-initial-controls="${controlsVisible}" data-initial-navigation="${navigationVisible}">
    <div id="reader-toolbar" class="reader-toolbar">
        <button id="toggle-navigation">${UI_TEXT.chapters}</button>
        <button id="toggle-controls">${UI_TEXT.controls}</button>
        <span id="mode-indicator" class="mode-indicator">${UI_TEXT.chapterPaging}</span>
        <span class="toolbar-spacer"></span>
        <button id="import-document">${UI_TEXT.addDocument}</button>
    </div>
    <section id="navigation-panel" class="overlay-panel">
        <div class="browser-grid">
            <div class="browser-column">
                <div class="column-title">${UI_TEXT.documents}</div>
                <input id="document-search" type="search" placeholder="${UI_TEXT.findDocuments}" aria-label="${UI_TEXT.findDocuments}">
                <div id="document-list" class="list-scroll"></div>
            </div>
            <div class="browser-column">
                <div id="chapter-heading" class="column-title">${UI_TEXT.chapters}</div>
                <input id="chapter-search" type="search" placeholder="${UI_TEXT.findChapters}" aria-label="${UI_TEXT.findChapters}">
                <div id="chapter-list" class="list-scroll"></div>
            </div>
        </div>
    </section>
    <section id="controls-panel" class="overlay-panel hidden">
        <div class="control-grid">
            <label class="control-field">${UI_TEXT.readingMode}
                <select id="reading-mode"><option value="chapter">${UI_TEXT.chapterPaging}</option><option value="scroll">${UI_TEXT.continuousScrolling}</option></select>
            </label>
            <label class="control-field">${UI_TEXT.lineHeight} <span id="line-height-value" class="range-value">1.65</span>
                <input id="line-height" type="range" min="1.2" max="2.5" step="0.05" value="1.65">
            </label>
            <label class="control-field">${UI_TEXT.paragraphSpacing} <span id="paragraph-spacing-value" class="range-value">0px</span>
                <input id="paragraph-spacing" type="range" min="0" max="32" step="2" value="0">
            </label>
        </div>
        <div class="control-row">
            <button data-action="font-down">${UI_TEXT.fontSize}−</button><span class="font-size-display">16px</span><button data-action="font-up">${UI_TEXT.fontSize}+</button>
            <span class="grow"></span>
            <button id="reset-reading-settings">${UI_TEXT.reset}</button>
            <button data-action="previous">${UI_TEXT.previousChapter}</button><button data-action="chapters">${UI_TEXT.chapterJump}</button><button data-action="next">${UI_TEXT.nextChapter}</button><button data-action="close">${UI_TEXT.closeReader}</button>
        </div>
    </section>
    <div id="reader-container" class="hidden">
        <div id="chapter-page">
            <h2 id="title"></h2>
            <div id="content" class="chapter-text"></div>
            <div class="page-bottom-controls"><button data-action="previous">${UI_TEXT.previousChapter}</button><button data-action="chapters">${UI_TEXT.chapterJump}</button><button data-action="next">${UI_TEXT.nextChapter}</button></div>
        </div>
        <div id="scroll-page" class="hidden"><div id="scroll-content"></div></div>
    </div>
    <div id="welcome-message"><strong>${UI_TEXT.chooseDocument}</strong><span>${UI_TEXT.welcomeHint}</span></div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const ui = ${JSON.stringify(UI_TEXT)};
        const MAX_SCROLL_CHAPTERS = ${MAX_SCROLL_CHAPTERS};
        const MAX_SCROLL_CHARACTERS = ${MAX_SCROLL_CHARACTERS};
        const initialControlsVisible = document.body.dataset.initialControls === 'true';
        const initialNavigationVisible = document.body.dataset.initialNavigation === 'true';
        const state = {
            novels: [], chapters: [], currentPath: null, currentChapter: 0,
            chapterCount: 0, mode: 'chapter', lineHeight: 1.65, paragraphSpacing: 0,
            currentTitle: '', currentContent: '', currentIsFirst: true, currentIsLast: false,
            contentByIndex: new Map(), scrollLoaded: new Set(), scrollPreviousIndex: -1, scrollNextIndex: 0,
            scrollLoadingBefore: false, scrollLoadingAfter: false, scrollSession: 0, lastProgressIndex: -1
        };
        const reader = document.getElementById('reader-container');
        const welcome = document.getElementById('welcome-message');
        const navigation = document.getElementById('navigation-panel');
        const controls = document.getElementById('controls-panel');
        const documentList = document.getElementById('document-list');
        const chapterList = document.getElementById('chapter-list');
        const documentSearch = document.getElementById('document-search');
        const chapterSearch = document.getElementById('chapter-search');
        const chapterHeading = document.getElementById('chapter-heading');
        const titleEl = document.getElementById('title');
        const contentEl = document.getElementById('content');
        const chapterPage = document.getElementById('chapter-page');
        const scrollPage = document.getElementById('scroll-page');
        const scrollContent = document.getElementById('scroll-content');
        const modeIndicator = document.getElementById('mode-indicator');
        const modeSelect = document.getElementById('reading-mode');
        const lineHeightInput = document.getElementById('line-height');
        const lineHeightValue = document.getElementById('line-height-value');
        const paragraphSpacingInput = document.getElementById('paragraph-spacing');
        const paragraphSpacingValue = document.getElementById('paragraph-spacing-value');
        const FONT_STEP = 1, MIN_FONT_SIZE = 10, MAX_FONT_SIZE = 35;
        const ESCAPE_DOUBLE_PRESS_MS = 400;
        let currentFontSize = 16;
        let scrollCheckQueued = false;
        let lastEscapeAt = 0;
        let escapeResetTimer = 0;

        function normalized(value) { return String(value || '').toLocaleLowerCase(); }
        function showEmpty(container, text) {
            container.replaceChildren();
            const item = document.createElement('div'); item.className = 'empty-tip'; item.textContent = text; container.appendChild(item);
        }
        function setPanelVisible(panel, visible) {
            if (visible && panel === navigation && !controls.classList.contains('hidden')) setPanelVisible(controls, false);
            if (visible && panel === controls && !navigation.classList.contains('hidden')) setPanelVisible(navigation, false);
            panel.classList.toggle('hidden', !visible);
            if (panel === navigation) document.getElementById('toggle-navigation').textContent = visible ? ui.hideChapters : ui.chapters;
            if (panel === controls) {
                document.getElementById('toggle-controls').textContent = visible ? ui.hideControls : ui.controls;
                vscode.postMessage({ command: 'setControlsVisible', payload: visible });
            }
        }
        function renderDocuments() {
            const query = normalized(documentSearch.value);
            const novels = state.novels.filter(item => normalized(item.title).includes(query));
            documentList.replaceChildren();
            if (!novels.length) { showEmpty(documentList, state.novels.length ? ui.noMatchingDocuments : ui.noDocuments); return; }
            novels.forEach(novel => {
                const button = document.createElement('button'); button.className = 'list-item' + (novel.path === state.currentPath ? ' active' : ''); button.textContent = novel.title; button.title = novel.title;
                button.addEventListener('click', () => { state.currentPath = novel.path; state.currentChapter = novel.currentChapter || 0; renderDocuments(); vscode.postMessage({ command: 'requestChapters', payload: { path: novel.path } }); });
                button.addEventListener('dblclick', () => { setPanelVisible(navigation, false); vscode.postMessage({ command: 'openDocument', payload: { path: novel.path } }); });
                documentList.appendChild(button);
            });
        }
        function renderChapters() {
            const query = normalized(chapterSearch.value);
            const matches = state.chapters.map((chapter, index) => ({ title: chapter, index })).filter(item => normalized(item.title).includes(query));
            chapterList.replaceChildren();
            if (!state.currentPath) { showEmpty(chapterList, ui.selectDocumentFirst); return; }
            if (!matches.length) { showEmpty(chapterList, state.chapters.length ? ui.noMatchingChapters : ui.noChapters); return; }
            matches.forEach(item => {
                const button = document.createElement('button'); button.className = 'list-item' + (item.index === state.currentChapter ? ' active' : ''); button.textContent = item.title; button.title = item.title;
                button.addEventListener('click', () => { setPanelVisible(navigation, false); vscode.postMessage({ command: 'openChapter', payload: { path: state.currentPath, index: item.index } }); });
                chapterList.appendChild(button);
            });
            const active = chapterList.querySelector('.active'); if (active && !query) active.scrollIntoView({ block: 'nearest' });
        }
        function applyTypography() {
            document.documentElement.style.setProperty('--reader-line-height', String(state.lineHeight));
            document.documentElement.style.setProperty('--reader-paragraph-spacing', state.paragraphSpacing + 'px');
            lineHeightInput.value = String(state.lineHeight); lineHeightValue.textContent = Number(state.lineHeight).toFixed(2).replace(/0$/, '').replace(/\\.$/, '');
            paragraphSpacingInput.value = String(state.paragraphSpacing); paragraphSpacingValue.textContent = state.paragraphSpacing + 'px';
        }
        function saveReadingSettings() {
            vscode.postMessage({ command: 'updateReadingSettings', payload: { mode: state.mode, lineHeight: state.lineHeight, paragraphSpacing: state.paragraphSpacing } });
        }
        function applySettings(settings) {
            if (!settings) return;
            state.mode = settings.mode === 'scroll' ? 'scroll' : 'chapter';
            state.lineHeight = Math.max(1.2, Math.min(2.5, Number(settings.lineHeight) || 1.65));
            state.paragraphSpacing = Math.max(0, Math.min(32, Number(settings.paragraphSpacing) || 0));
            modeSelect.value = state.mode; modeIndicator.textContent = state.mode === 'scroll' ? ui.continuousScrolling : ui.chapterPaging; applyTypography();
        }
        function updateFontSize(direction, persist = true) {
            if (direction === 'increase' && currentFontSize < MAX_FONT_SIZE) currentFontSize += FONT_STEP;
            if (direction === 'decrease' && currentFontSize > MIN_FONT_SIZE) currentFontSize -= FONT_STEP;
            titleEl.style.fontSize = currentFontSize + 'px'; contentEl.style.fontSize = currentFontSize + 'px';
            document.querySelectorAll('.chapter-block h2').forEach(el => el.style.fontSize = currentFontSize + 'px');
            document.querySelectorAll('.chapter-text').forEach(el => el.style.fontSize = currentFontSize + 'px');
            document.querySelectorAll('.font-size-display').forEach(el => el.textContent = currentFontSize + 'px');
            if (persist) vscode.postMessage({ command: 'updateFontSize', payload: currentFontSize });
        }
        function splitParagraphs(text) {
            return String(text || '').split(/\\n\\s*\\n/).filter(block => block.length > 0);
        }
        function normalizeParagraph(block) {
            return String(block || '').split(/\\n/).map(line => line.replace(/^[\\t \\u00a0\\u3000]+/, '')).join('\\n').trim();
        }
        function fillText(container, text) {
            container.replaceChildren();
            splitParagraphs(text).forEach(block => { const paragraph = document.createElement('div'); paragraph.className = 'chapter-paragraph'; paragraph.textContent = normalizeParagraph(block); container.appendChild(paragraph); });
        }
        function showReader() { reader.classList.remove('hidden'); welcome.classList.add('hidden'); }
        function showWelcome() { reader.classList.add('hidden'); welcome.classList.remove('hidden'); setPanelVisible(navigation, true); }
        function updatePageButtons() {
            document.querySelectorAll('[data-action="previous"]').forEach(el => el.disabled = state.currentIsFirst);
            document.querySelectorAll('[data-action="next"]').forEach(el => el.disabled = state.currentIsLast);
        }
        function renderChapterPage() {
            titleEl.textContent = state.currentTitle; fillText(contentEl, state.currentContent); updateFontSize(undefined, false); updatePageButtons();
        }
        function makeChapterBlock(index, item) {
            const article = document.createElement('article'); article.className = 'chapter-block'; article.dataset.index = String(index);
            const heading = document.createElement('h2'); heading.textContent = item.title; article.appendChild(heading);
            const text = document.createElement('div'); text.className = 'chapter-text'; fillText(text, item.content); article.appendChild(text); return article;
        }
        function renderScrollContent(reset, insertionDirection) {
            const anchor = !reset && insertionDirection === 'before' ? scrollContent.querySelector('.chapter-block[data-index="' + state.currentChapter + '"]') : null;
            const anchorTop = anchor ? anchor.getBoundingClientRect().top : 0;
            if (reset) { scrollContent.replaceChildren(); state.scrollLoaded.clear(); }
            Array.from(state.contentByIndex.keys()).sort((a, b) => a - b).forEach(index => {
                if (!state.scrollLoaded.has(index)) {
                    const block = makeChapterBlock(index, state.contentByIndex.get(index));
                    const reference = Array.from(scrollContent.querySelectorAll('.chapter-block')).find(item => Number(item.dataset.index) > index);
                    if (reference) scrollContent.insertBefore(block, reference); else scrollContent.appendChild(block);
                    state.scrollLoaded.add(index);
                }
            });
            updateFontSize(undefined, false);
            if (anchor) {
                const nextAnchor = scrollContent.querySelector('.chapter-block[data-index="' + state.currentChapter + '"]');
                if (nextAnchor) window.scrollBy(0, nextAnchor.getBoundingClientRect().top - anchorTop);
            }
            syncScrollChapter(); reclaimScrollMemory(); checkScrollLoad();
        }
        function updateScrollLoadPointers() {
            const loaded = Array.from(state.contentByIndex.keys()).sort((a, b) => a - b);
            state.scrollPreviousIndex = loaded.length ? loaded[0] - 1 : state.currentChapter - 1;
            state.scrollNextIndex = loaded.length ? loaded[loaded.length - 1] + 1 : state.currentChapter + 1;
        }
        function removeScrollBlock(block) {
            const index = Number(block.dataset.index);
            const height = block.getBoundingClientRect().height;
            block.remove();
            state.scrollLoaded.delete(index);
            state.contentByIndex.delete(index);
            return index < state.currentChapter ? height : 0;
        }
        function reclaimScrollMemory() {
            if (state.mode !== 'scroll') return;
            const keepBefore = Math.floor((MAX_SCROLL_CHAPTERS - 1) / 2);
            let minimum = Math.max(0, state.currentChapter - keepBefore);
            let maximum = Math.min(state.chapterCount - 1, minimum + MAX_SCROLL_CHAPTERS - 1);
            minimum = Math.max(0, maximum - MAX_SCROLL_CHAPTERS + 1);
            let removedHeight = 0;
            let blocks = Array.from(scrollContent.querySelectorAll('.chapter-block'));
            blocks.filter(block => {
                const index = Number(block.dataset.index);
                return index < minimum || index > maximum;
            }).sort((a, b) => Math.abs(Number(b.dataset.index) - state.currentChapter) - Math.abs(Number(a.dataset.index) - state.currentChapter)).forEach(block => {
                removedHeight += removeScrollBlock(block);
            });
            blocks = Array.from(scrollContent.querySelectorAll('.chapter-block'));
            let totalCharacters = blocks.reduce((sum, block) => sum + (block.textContent || '').length, 0);
            while (totalCharacters > MAX_SCROLL_CHARACTERS && blocks.length > 1) {
                const candidates = blocks.filter(block => Number(block.dataset.index) !== state.currentChapter).sort((a, b) => Math.abs(Number(b.dataset.index) - state.currentChapter) - Math.abs(Number(a.dataset.index) - state.currentChapter));
                if (!candidates.length) break;
                const removed = candidates[0];
                totalCharacters -= (removed.textContent || '').length;
                removedHeight += removeScrollBlock(removed);
                blocks = Array.from(scrollContent.querySelectorAll('.chapter-block'));
            }
            updateScrollLoadPointers();
            if (removedHeight > 0) window.scrollBy(0, -removedHeight);
        }
        function enterScrollMode() {
            chapterPage.classList.add('hidden'); scrollPage.classList.remove('hidden');
            state.scrollLoadingBefore = false; state.scrollLoadingAfter = false;
            state.scrollPreviousIndex = state.currentChapter - 1; state.scrollNextIndex = state.currentChapter + 1;
            renderScrollContent(true); checkScrollLoad(true);
        }
        function enterChapterMode() {
            scrollPage.classList.add('hidden'); chapterPage.classList.remove('hidden'); scrollContent.replaceChildren(); state.scrollLoaded.clear(); state.contentByIndex.clear();
            state.scrollLoadingBefore = false; state.scrollLoadingAfter = false; state.scrollPreviousIndex = -1; state.scrollNextIndex = 0;
            renderChapterPage();
        }
        function switchMode(mode) {
            const nextMode = mode === 'scroll' ? 'scroll' : 'chapter'; if (state.mode === nextMode) return; if (nextMode === 'chapter') syncScrollChapter(); state.mode = nextMode; modeIndicator.textContent = nextMode === 'scroll' ? ui.continuousScrolling : ui.chapterPaging; saveReadingSettings();
            if (nextMode === 'scroll') enterScrollMode(); else enterChapterMode();
        }
        function requestPreviousScrollChapter() {
            if (state.scrollLoadingBefore || !state.currentPath || state.scrollPreviousIndex < 0) return;
            const index = state.scrollPreviousIndex;
            state.scrollLoadingBefore = true;
            vscode.postMessage({ command: 'requestChapterContent', payload: { path: state.currentPath, index, append: true, direction: 'before', requestId: state.scrollSession } });
        }
        function requestNextScrollChapter() {
            if (state.scrollLoadingAfter || !state.currentPath || state.scrollNextIndex >= state.chapterCount) return;
            const index = state.scrollNextIndex;
            state.scrollLoadingAfter = true;
            vscode.postMessage({ command: 'requestChapterContent', payload: { path: state.currentPath, index, append: true, direction: 'after', requestId: state.scrollSession } });
        }
        function checkScrollLoad(force = false) {
            if (state.mode !== 'scroll') return;
            const edgeThreshold = Math.max(720, window.innerHeight * .8);
            const nearTop = window.scrollY <= edgeThreshold;
            const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - edgeThreshold;
            if (force || nearTop) requestPreviousScrollChapter();
            if (force || nearBottom) requestNextScrollChapter();
        }
        function syncScrollChapter() {
            if (state.mode !== 'scroll') return;
            const blocks = Array.from(scrollContent.querySelectorAll('.chapter-block')); if (!blocks.length) return;
            const marker = Math.max(80, window.innerHeight * .28); let selected = Number(blocks[0].dataset.index);
            blocks.forEach(block => { if (block.getBoundingClientRect().top <= marker) selected = Number(block.dataset.index); });
            if (selected !== state.currentChapter) {
                state.currentChapter = selected;
                const selectedItem = state.contentByIndex.get(selected);
                if (selectedItem) { state.currentTitle = selectedItem.title; state.currentContent = selectedItem.content; state.currentIsFirst = selected === 0; state.currentIsLast = selected >= state.chapterCount - 1; }
                renderChapters();
                if (state.currentPath && state.lastProgressIndex !== selected) { state.lastProgressIndex = selected; vscode.postMessage({ command: 'chapterChanged', payload: { path: state.currentPath, index: selected } }); }
            }
        }
        function handleContent(payload) {
            applySettings(payload.readingSettings);
            state.chapterCount = payload.chapterCount || state.chapterCount; state.currentPath = payload.novelPath || state.currentPath; currentFontSize = Number(payload.fontSize) || currentFontSize;
            if (payload.append) {
                if (state.mode !== 'scroll' || payload.novelPath !== state.currentPath || payload.requestId !== state.scrollSession) return;
                const appendedIndex = Number(payload.chapterIndex) || 0;
                const direction = payload.direction === 'before' ? 'before' : 'after';
                state.contentByIndex.set(appendedIndex, { title: payload.title || '', content: payload.content || '' });
                if (direction === 'before') { state.scrollLoadingBefore = false; state.scrollPreviousIndex = appendedIndex - 1; }
                else { state.scrollLoadingAfter = false; state.scrollNextIndex = appendedIndex + 1; }
                renderScrollContent(false, direction);
                renderDocuments(); renderChapters();
                return;
            }
            state.scrollSession += 1;
            state.currentChapter = Number(payload.chapterIndex) || 0; state.currentTitle = payload.title || ''; state.currentContent = payload.content || ''; state.currentIsFirst = Boolean(payload.isFirst); state.currentIsLast = Boolean(payload.isLast); state.lastProgressIndex = state.currentChapter; state.scrollLoadingBefore = false; state.scrollLoadingAfter = false; state.scrollPreviousIndex = state.currentChapter - 1; state.scrollNextIndex = state.currentChapter + 1;
            state.contentByIndex.clear(); state.scrollLoaded.clear(); state.contentByIndex.set(state.currentChapter, { title: state.currentTitle, content: state.currentContent });
            setPanelVisible(navigation, false);
            if (state.mode === 'scroll') { showReader(); enterScrollMode(); } else { enterChapterMode(); showReader(); }
            renderDocuments(); renderChapters(); showReader(); window.scrollTo(0, 0);
        }
        document.getElementById('toggle-navigation').addEventListener('click', () => setPanelVisible(navigation, navigation.classList.contains('hidden')));
        document.getElementById('toggle-controls').addEventListener('click', () => setPanelVisible(controls, controls.classList.contains('hidden')));
        document.getElementById('import-document').addEventListener('click', () => vscode.postMessage({ command: 'importDocument' }));
        documentSearch.addEventListener('input', renderDocuments); chapterSearch.addEventListener('input', renderChapters);
        modeSelect.addEventListener('change', () => switchMode(modeSelect.value));
        lineHeightInput.addEventListener('input', () => { state.lineHeight = Number(lineHeightInput.value); applyTypography(); saveReadingSettings(); });
        paragraphSpacingInput.addEventListener('input', () => { state.paragraphSpacing = Number(paragraphSpacingInput.value); applyTypography(); saveReadingSettings(); });
        document.getElementById('reset-reading-settings').addEventListener('click', () => { state.mode = 'chapter'; state.lineHeight = 1.65; state.paragraphSpacing = 0; applySettings(state); saveReadingSettings(); enterChapterMode(); });
        document.addEventListener('click', event => { const action = event.target && event.target.dataset && event.target.dataset.action; if (action === 'previous') { setPanelVisible(controls, false); vscode.postMessage({ command: 'previousChapter' }); } if (action === 'next') { setPanelVisible(controls, false); vscode.postMessage({ command: 'nextChapter' }); } if (action === 'close') vscode.postMessage({ command: 'closeReader' }); if (action === 'font-up') updateFontSize('increase'); if (action === 'font-down') updateFontSize('decrease'); if (action === 'chapters') { setPanelVisible(navigation, true); chapterSearch.focus(); } });
        window.addEventListener('scroll', () => { if (!scrollCheckQueued) { scrollCheckQueued = true; requestAnimationFrame(() => { scrollCheckQueued = false; syncScrollChapter(); checkScrollLoad(); }); } });
        window.addEventListener('keydown', event => { if (event.key === 'Escape' && !event.repeat) { const now = Date.now(); event.preventDefault(); event.stopPropagation(); if (now - lastEscapeAt <= ESCAPE_DOUBLE_PRESS_MS) { lastEscapeAt = 0; if (escapeResetTimer) window.clearTimeout(escapeResetTimer); escapeResetTimer = 0; vscode.postMessage({ command: 'focusTerminal' }); } else { lastEscapeAt = now; if (escapeResetTimer) window.clearTimeout(escapeResetTimer); escapeResetTimer = window.setTimeout(() => { lastEscapeAt = 0; escapeResetTimer = 0; }, ESCAPE_DOUBLE_PRESS_MS); } return; } if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return; if (event.key === 'ArrowLeft') { event.preventDefault(); vscode.postMessage({ command: 'previousChapter' }); } else if (event.key === 'ArrowRight') { event.preventDefault(); vscode.postMessage({ command: 'nextChapter' }); } else if (event.ctrlKey && event.key === 'Delete') { event.preventDefault(); vscode.postMessage({ command: 'ctrl+delete' }); } });
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateLibrary') { state.novels = message.payload.novels || []; if (message.payload.currentPath) state.currentPath = message.payload.currentPath; applySettings(message.payload.readingSettings); renderDocuments(); if (!state.currentPath) renderChapters(); }
            else if (message.command === 'updateChapters') { state.currentPath = message.payload.path; state.currentChapter = Number(message.payload.currentChapter) || 0; state.chapters = message.payload.chapters || []; state.chapterCount = state.chapters.length; chapterHeading.textContent = ui.chapters + ' · ' + message.payload.title; renderDocuments(); renderChapters(); }
            else if (message.command === 'updateContent') handleContent(message.payload);
            else if (message.command === 'chapterChanged') { state.currentChapter = Number(message.payload.index) || 0; renderChapters(); }
            else if (message.command === 'resetView') { state.novels = state.novels || []; state.chapters = []; state.currentPath = null; state.currentChapter = 0; state.chapterCount = 0; state.currentTitle = ''; state.currentContent = ''; state.scrollLoadingBefore = false; state.scrollLoadingAfter = false; state.scrollPreviousIndex = -1; state.scrollNextIndex = 0; state.scrollSession += 1; state.lastProgressIndex = -1; state.contentByIndex.clear(); state.scrollLoaded.clear(); chapterHeading.textContent = ui.chapters; renderDocuments(); renderChapters(); showWelcome(); }
            else if (message.command === 'chapterContentError') {
                if (!message.payload || message.payload.requestId !== state.scrollSession) return;
                if (message.payload.direction === 'before') state.scrollLoadingBefore = false; else state.scrollLoadingAfter = false;
                checkScrollLoad();
            }
            else if (message.command === 'updateReadingSettings') applySettings(message.payload);
        });
        setPanelVisible(navigation, initialNavigationVisible); setPanelVisible(controls, initialControlsVisible); applyTypography(); renderDocuments(); renderChapters(); vscode.postMessage({ command: 'webviewReady' });
    </script>
</body>
</html>`;
    }
}

exports.NovelReaderViewProvider = NovelReaderViewProvider;
NovelReaderViewProvider.viewType = 'documentPreviewView';

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
