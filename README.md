# Best Novel Reader

[![GitHub stars](https://img.shields.io/github/stars/fengXCs/Best-Novel-Reader?style=for-the-badge&logo=github&label=Star)](https://github.com/fengXCs/Best-Novel-Reader/stargazers)

A discreet and comfortable novel reader for Visual Studio Code. Read local `.txt` novels directly in the bottom **Document Preview** panel, with continuous scrolling, chapter search, progress restoration, and customizable typography.

一个更隐蔽、更顺手的 VS Code 本地小说阅读器。可直接在底部的 **“文档预览”** 面板阅读 `.txt` 小说，并支持连续滚动、章节搜索、进度恢复和排版调节。

> **可能是目前 VS Code 插件市场中最好用的上班摸鱼看小说软件。**
>
> Best Novel Reader 将阅读功能完整集成在 VS Code 底部窗口中，与终端自然融为一体；无需额外打开独立窗口，并集成了日常小说阅读几乎所需的全部功能。阅读面板低调、切换迅速，也尽量不打断原本的工作界面和操作习惯。

> **Perhaps the most capable discreet novel reader currently available on the VS Code Marketplace.**
>
> Best Novel Reader lives naturally beside the terminal in VS Code's bottom panel and brings together nearly everything needed for everyday novel reading—without opening a separate application or disrupting the rest of your workspace.

如果你觉得 Best Novel Reader 好用，欢迎前往 [GitHub 项目仓库](https://github.com/fengXCs/Best-Novel-Reader) 点一个 **Star**，这会帮助插件继续改进。

If Best Novel Reader is useful to you, please consider giving the [GitHub repository](https://github.com/fengXCs/Best-Novel-Reader) a **Star**.

---

## Highlights / 重点新增功能

### ⭐ Continuous scrolling with nearby chapter preloading / 连续滚动与相邻章节预加载

Switch between **Chapter Paging** and **Continuous Scrolling** at any time. In scrolling mode, nearby chapters above and below are loaded automatically, so you can keep scrolling across chapter boundaries—including upward from the initially opened chapter.

阅读控件中可随时切换 **“章节翻页”** 和 **“连续滚动”**。连续滚动模式会自动加载当前章节上下相邻的内容，可以自然跨章节向下阅读，也可以从初始章节继续向上滚动。

To avoid unbounded memory growth, only a limited recent chapter window is retained and older content is reclaimed automatically.

为避免长期使用造成内存持续增长，插件只保留有限的近期章节窗口，并会自动回收较远的内容。

### ⭐ Read immediately after reopening / 自动恢复阅读现场

The reader restores the last opened novel, chapter, reading mode, and reading settings. Switching between the terminal and Document Preview no longer returns to the old welcome message or requires selecting the novel again.

插件会恢复上次打开的小说、章节、阅读模式和排版设置。切换终端后再回到“文档预览”，不会再回到欢迎页，也不需要重新点击小说。

### ⭐ Search and jump without leaving the reader / 阅读面板内查找与跳转

Open the **Chapters** panel to:

* Search imported documents.
* Search and jump to chapters.
* Switch novels without returning to the sidebar.
* Add another local `.txt` document directly from the reading panel.
* Scroll long document and chapter lists.

打开阅读面板中的 **“章节”** 控件，即可：

* 查找已导入的文档。
* 查找章节并直接跳转。
* 不离开阅读面板切换小说。
* 直接添加新的本地 `.txt` 文档。
* 滚动浏览较长的文档和章节列表。

### ⭐ Comfortable, customizable typography / 舒适且可自定义的排版

Use the **Controls** panel to adjust font size, line height, and paragraph spacing. Body paragraphs use a consistent two-character first-line indent, while chapter titles remain unindented. Settings are kept for the next reading session.

在 **“控件”** 中可调整字号、行距和段距。正文段落保持统一的两字符缩进，章节标题不缩进；设置会保留到下一次阅读。

### Quick switch to terminal / 快速切换到终端

Press `Esc` twice quickly while the reading panel is focused to jump directly to the terminal. This is intentionally one-way: return to Document Preview manually, preventing terminal shortcuts from being intercepted.

文档预览获得焦点时，快速连按两次 `Esc` 即可直接切换到终端。该快捷操作只负责单向切到终端；返回文档预览请手动点击，避免干扰终端自身快捷键。

### Discreet panel presentation / 更低调的面板展示

The bottom reading panel is displayed as **“文档预览”** instead of exposing a reader-specific name. Chapter and reading controls can be collapsed to leave more room for content.

底部阅读面板显示为更自然的 **“文档预览”**，不会直接暴露阅读器名称；章节与阅读控件均可收起，尽量减少对正文阅读的影响。

---

## Original Features / 原有功能

* **Reference-based import / 引用式导入**: Import local `.txt` files without copying their contents. Moving or deleting the source file will make it unavailable to the extension.
* **Novel sidebar / 小说侧边栏**: Browse imported novels and chapter trees from the Best Novel Reader activity-bar view.
* **Reading progress / 阅读进度**: Open a novel at its last recorded chapter from the sidebar.
* **Chapter navigation / 章节切换**: Use Previous/Next buttons or the left/right arrow keys while the reading panel is focused.
* **Safe removal / 安全移除**: Removing a novel from the sidebar only removes its reference; the source file is not deleted.
* **Local text compatibility / 本地文本兼容**: Reads local text files with common encodings and recognizes common Chinese chapter-title formats.

---

## How to Use / 使用说明

1. Click the book icon in the Activity Bar to open **Best Novel Reader**. / 点击活动栏中的书本图标，打开 **Best Novel Reader**。
2. Click the plus icon to import a local `.txt` novel. / 点击加号，导入本地 `.txt` 小说。
3. Select a chapter, or use the book button beside a novel to continue from the last position. / 点击章节开始阅读，或点击小说旁的书本按钮继续上次进度。
4. Read in the bottom **Document Preview / 文档预览** panel. / 在底部 **“文档预览”** 面板中阅读。
5. Use **Chapters / 章节** for document and chapter search; use **Controls / 控件** for reading mode and typography. / 使用 **“章节”** 查找文档或跳转章节，使用 **“控件”** 调整阅读模式与排版。

---

## Credits and Modification Notice / 来源与修改说明

Best Novel Reader is modified from [Le-dawn/novel-reader](https://github.com/Le-dawn/novel-reader) version `0.0.4`, originally released under the MIT License.

Best Novel Reader 基于 [Le-dawn/novel-reader](https://github.com/Le-dawn/novel-reader) `0.0.4` 版本修改，原项目采用 MIT License。

This version retains the original import, sidebar, and basic chapter-reading capabilities, and adds the Document Preview presentation, automatic context restoration, in-panel document/chapter browsing and search, paging/continuous reading modes, bidirectional nearby-chapter loading, bounded memory reclamation, typography controls, improved Chinese chapter matching, and the double-`Esc` terminal shortcut.

本版本保留原有的导入、侧边栏和基础章节阅读能力，并新增“文档预览”展示、阅读上下文自动恢复、面板内文档/章节浏览与搜索、翻页/连续滚动双模式、上下章节预加载、有限缓存与内存回收、排版调节、改进的中文章节识别，以及双击 `Esc` 切换终端等功能。

See `LICENSE.txt` in the extension package for license details.

---

**Enjoy reading! / 阅读愉快！**
