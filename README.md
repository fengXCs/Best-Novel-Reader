# Best Novel Reader

[![GitHub stars](https://img.shields.io/github/stars/fengXCs/Best-Novel-Reader?style=for-the-badge&logo=github&label=Star)](https://github.com/fengXCs/Best-Novel-Reader/stargazers)

一个更隐蔽、更顺手的 VS Code 本地小说阅读器。小说内容显示在底部的“文档预览”面板中，和终端放在一起，不需要额外打开窗口。

A discreet and convenient local novel reader for VS Code. It keeps your book in the bottom Document Preview panel beside the terminal, without opening a separate window.

> **可能是目前 VS Code 插件市场中最好用的上班摸鱼看小说软件。**
>
> **Possibly the best VS Code extension for discreet novel reading at work.**

翻页、连续滚动、章节搜索、进度恢复和排版调节都已经集成在底部面板里，平时阅读基本不需要再离开这个界面。章节和控件可以随时收起，尽量不占正文空间。

Paging, continuous scrolling, chapter search, progress restoration, and typography settings are all built into the bottom panel. Chapter and control panels can be collapsed whenever you want more room for the text.

如果觉得好用，欢迎给 [GitHub 仓库](https://github.com/fengXCs/Best-Novel-Reader) 点个 Star。

If you find it useful, please consider giving the [GitHub repository](https://github.com/fengXCs/Best-Novel-Reader) a Star.

---

## 重点功能 / Highlights

### 跟随 VS Code 切换语言 / Follows the VS Code display language

插件界面会自动读取 VS Code 的显示语言。中文环境显示中文，英文及其他非中文环境显示英文，活动栏命令、侧边栏、文档预览面板、阅读控件和提示消息都会一起切换。

The extension follows the VS Code display language automatically. Chinese locales use the Chinese interface, while English and other non-Chinese locales use English across commands, the sidebar, Document Preview, reading controls, and messages.

### 更完整的章节识别 / Better chapter recognition

优化了原插件的章节读取规则，能识别市面上近乎全部的常见小说章节标题：

The original chapter parser has been improved to recognize nearly every chapter-title format commonly found in novels:

- 支持阿拉伯数字、中文数字和中文大写数字。<br>
  Supports Arabic numerals, Chinese numerals, and financial Chinese numerals.
- 支持标题中的不规则空格。<br>
  Handles irregular spacing in chapter titles.
- 支持“章、节、卷、集”等格式。<br>
  Recognizes chapter, section, volume, and collection markers.
- 支持“序章、楔子、正文、终章、后记、尾声、番外”等特殊标题。<br>
  Recognizes prologues, introductions, main text, final chapters, afterwords, epilogues, and extras.
- 对“课程”“集合”等容易误判的文字做了排除。<br>
  Avoids common false matches such as course and collection-related text.

### 翻页和连续滚动 / Paging and continuous scrolling

阅读控件中可以随时选择“章节翻页”或“连续滚动”。

Switch between chapter paging and continuous scrolling at any time.

连续滚动会预先加载当前章节附近的内容，既可以一路向下看，也可以从刚打开的章节继续向上翻。加载上方章节时会保持当前位置，不会把正文顶到章节中间。

Continuous mode preloads nearby chapters in both directions. You can keep reading downward or scroll above the chapter you initially opened, while the reader keeps your current position steady as earlier chapters are inserted.

缓存有数量和大小限制，较远的章节会自动清理，长时间使用不会一直堆积内存。

The cache has chapter-count and size limits. Distant chapters are reclaimed automatically instead of accumulating in memory.

### 自动恢复阅读进度 / Automatic reading restoration

插件会记住上次打开的小说、章节、阅读模式和排版设置。从终端切回“文档预览”后可以接着看，不会重新显示欢迎页，也不需要再去侧边栏点一次小说。

The extension remembers the last novel, chapter, reading mode, and typography settings. After returning from the terminal, Document Preview continues where you left off instead of showing the welcome page again.

### 面板内搜索和跳转 / Search and navigation inside the reader

点击阅读面板中的“章节”，可以直接查找小说、搜索并跳转章节、切换小说、添加新的 `.txt` 文件，也可以滚动浏览较长的小说和章节列表。

Open Chapters in the reading panel to find novels, search and jump to chapters, switch books, add another `.txt` file, or scroll through long document and chapter lists.

### 自定义排版 / Typography settings

点击“控件”可以调整字号、行距和段距，也可以切换阅读形式。正文统一使用两字符缩进，章节标题不缩进，设置会自动保存。

Open Controls to adjust font size, line height, paragraph spacing, and reading mode. Body paragraphs use a consistent two-character indent, chapter titles remain unindented, and your settings are saved automatically.

### 快速切到终端 / Quick switch to terminal

文档预览获得焦点时，快速按两次 `Esc` 可以直接切换到终端。这个快捷操作只负责切到终端，返回文档预览时手动点击即可，不会占用终端里的 `Esc`。

Press `Esc` twice quickly while Document Preview is focused to jump to the terminal. The shortcut is intentionally one-way, so it does not take over `Esc` inside the terminal.

### 更低调的显示 / Discreet presentation

底部面板显示为“文档预览”，不会直接出现小说阅读器名称。章节列表和阅读控件都能隐藏，收起后只保留正文。

The bottom panel is named Document Preview rather than exposing a reader-specific title. Both the chapter list and reading controls can be hidden, leaving only the text on screen.

---

## 原有功能 / Original features

- 从本地导入 `.txt` 小说，插件只保存文件引用，不会复制或删除源文件。<br>
  Import local `.txt` novels by reference without copying or deleting the source files.
- 在侧边栏查看已经导入的小说和章节。<br>
  Browse imported novels and chapters from the sidebar.
- 从侧边栏直接回到某本小说的上次阅读位置。<br>
  Continue a novel from its last saved chapter.
- 使用上一章、下一章按钮或左右方向键翻页。<br>
  Navigate with Previous/Next buttons or the left and right arrow keys.
- 支持常见的本地文本编码。<br>
  Read local text files in common encodings.
- 从书架移除小说时只删除引用，不会删除本地文件。<br>
  Remove a novel reference without deleting the local file.

> 如果源文件被移动或删除，插件将无法继续读取该小说。<br>
> If the source file is moved or deleted, the extension will no longer be able to read it.

---

## 使用方法 / Usage

1. 点击活动栏中的书本图标，打开 **Best Novel Reader**。<br>
   Click the book icon in the Activity Bar to open **Best Novel Reader**.
2. 点击侧边栏右上角的加号，选择本地 `.txt` 小说。<br>
   Click the plus button in the sidebar and select a local `.txt` novel.
3. 点击章节开始阅读，也可以点击小说旁边的书本按钮继续上次进度。<br>
   Select a chapter, or use the book button beside a novel to continue from the last position.
4. 小说会显示在底部的“文档预览”面板中。<br>
   The novel will open in the Document Preview panel at the bottom.
5. 使用“章节”搜索小说或跳转章节，使用“控件”调整阅读方式和排版。<br>
   Use Chapters to search or jump, and Controls to change the reading mode and typography.

---

## 修改说明 / Credits

本插件基于 [Le-dawn/novel-reader](https://github.com/Le-dawn/novel-reader) `0.0.4` 修改，原项目使用 MIT License。

This extension is based on [Le-dawn/novel-reader](https://github.com/Le-dawn/novel-reader) `0.0.4`, originally released under the MIT License.

在原有导入、侧边栏和基础章节阅读功能之上，增加了中英文界面自动切换、文档预览面板、阅读现场恢复、面板内文档与章节搜索、翻页和连续滚动双模式、上下章节预加载、缓存回收、排版调节、更完整的中文章节识别，以及双击 `Esc` 切换终端等功能。

This version adds automatic Chinese/English UI switching, the Document Preview panel, reading restoration, in-panel document and chapter search, paging and continuous modes, bidirectional chapter preloading, cache reclamation, typography controls, broader Chinese chapter recognition, and the double-`Esc` terminal shortcut.

许可证内容见 `LICENSE.txt`。

See `LICENSE.txt` for license details.
