"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChapters = parseChapters;
function parseChapters(text, fullTextTitle = 'Full Text') {
    if (!text) {
        return [];
    }
    const chapterRegex = /(?<=[　\s])(?:序章|楔子|正文(?!完|结)|终章|后记|尾声|番外|第\s{0,4}[\d〇零一二两三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+?\s{0,4}(?:章|节(?!课)|卷|集(?![合和]))).{0,30}$/;
    const lines = text.split(/\r?\n/);
    const isChapterLine = (line) => chapterRegex.test(`\n${line}`);
    const chapters = [];
    let currentChapterContent = [];
    let currentTitle = null;
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (isChapterLine(line)) {
            // When a new chapter title is found, push the previous chapter's content
            if (currentTitle) {
                chapters.push({ title: currentTitle, content: currentChapterContent.join('\n').trim() });
            }
            // Start a new chapter
            currentTitle = line.trim();
            currentChapterContent = [];
        }
        else {
            // If we haven't found the first chapter title yet, skip the content
            if (currentTitle) {
                currentChapterContent.push(line);
            }
        }
    }
    // Add the last chapter
    if (currentTitle) {
        chapters.push({ title: currentTitle, content: currentChapterContent.join('\n').trim() });
    }
    // If no chapters were found at all, return the entire text as a single "chapter"
    if (chapters.length === 0 && text.trim()) {
        return [{ title: fullTextTitle, content: text.trim() }];
    }
    return chapters;
}
