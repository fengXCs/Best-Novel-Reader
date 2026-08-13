"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapterItem = exports.NovelItem = exports.NovelSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const chapterParser_1 = require("./chapterParser");
const globalStateEnum_1 = require("./enums/globalStateEnum");
const vscodeCommandEnum_1 = require("./enums/vscodeCommandEnum");
const utils_1 = require("./utils");
const chapterNumberParser_1 = require("./chapterNumberParser");
const IS_CHINESE = /^zh(?:-|$)/i.test(vscode.env.language || '');
const localize = (chinese, english) => IS_CHINESE ? chinese : english;
class NovelSidebarProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element instanceof NovelItem) {
            // If the element is a NovelItem, return its chapters
            try {
                const novelText = (0, utils_1.readTextFileWithAutoEncoding)(element.novel.path);
                const chapters = (0, chapterParser_1.parseChapters)(novelText, localize('全文', 'Full Text'));
                return Promise.resolve(chapters.map((chapter, index) => new ChapterItem(chapter.title, element.novel, index)));
            }
            catch (e) {
                vscode.window.showErrorMessage(localize("读取小说章节失败。", "Failed to read novel chapters."));
                return Promise.resolve([]);
            }
        }
        else {
            // Otherwise, return the list of novels (top-level)
            const novels = this.context.globalState.get(globalStateEnum_1.GlobalStateEnum.NOVELS, []);
            return Promise.resolve(novels.map(novel => new NovelItem(novel)));
        }
    }
    searchChapter(novel, chapterNumber) {
        try {
            const novelText = (0, utils_1.readTextFileWithAutoEncoding)(novel.path);
            const chapters = (0, chapterParser_1.parseChapters)(novelText, localize('全文', 'Full Text'));
            const index = (0, chapterNumberParser_1.findChapterIndexByNumber)(chapters, chapterNumber);
            return index >= 0 ? new ChapterItem(chapters[index].title, novel, index) : null;
        }
        catch (e) {
            vscode.window.showErrorMessage(localize('搜索章节时读取小说失败。', 'Failed to read the novel while searching chapters.'));
            return null;
        }
    }
}
exports.NovelSidebarProvider = NovelSidebarProvider;
class NovelItem extends vscode.TreeItem {
    constructor(novel) {
        super(novel.title, vscode.TreeItemCollapsibleState.Collapsed);
        this.novel = novel;
        this.tooltip = `${novel.path}`;
        this.description = `${localize('第', 'Chapter ')}${novel.currentChapter + 1}${localize('章', '')}`;
        this.contextValue = 'novelItem'; // Used for context menus in package.json
    }
}
exports.NovelItem = NovelItem;
class ChapterItem extends vscode.TreeItem {
    constructor(label, novel, chapterIndex) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.novel = novel;
        this.chapterIndex = chapterIndex;
        this.tooltip = `${localize('第', 'Chapter ')}${chapterIndex + 1}${localize('章', '')}`;
        // Command to execute when the chapter is clicked
        this.command = {
            command: vscodeCommandEnum_1.VscodeCommandEnum.OPEN_CHAPTER,
            title: localize('打开章节', 'Open Chapter'),
            arguments: [this],
        };
    }
}
exports.ChapterItem = ChapterItem;
