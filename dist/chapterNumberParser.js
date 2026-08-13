"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chineseToNumber = chineseToNumber;
exports.extractChapterNumber = extractChapterNumber;
exports.findChapterIndexByNumber = findChapterIndexByNumber;

const DIGITS = {
    零: 0, 〇: 0, 一: 1, 壹: 1, 二: 2, 贰: 2, 两: 2,
    三: 3, 叁: 3, 四: 4, 肆: 4, 五: 5, 伍: 5,
    六: 6, 陆: 6, 七: 7, 柒: 7, 八: 8, 捌: 8,
    九: 9, 玖: 9, 十: 10, 拾: 10, 百: 100, 佰: 100,
    千: 1000, 仟: 1000, 万: 10000
};

function chineseToNumber(text) {
    if (!text) return null;
    if (/^\d+$/.test(text)) return parseInt(text, 10);
    let total = 0, section = 0, number = 0;
    for (const character of text) {
        const value = DIGITS[character];
        if (value === undefined) continue;
        if (value === 10000) {
            section = (section + number) * value;
            total += section;
            section = 0;
            number = 0;
        }
        else if (value === 10 || value === 100 || value === 1000) {
            if (number === 0) number = 1;
            section += number * value;
            number = 0;
        }
        else {
            number = value;
        }
    }
    total += section + number;
    return total > 0 ? total : null;
}

function extractChapterNumber(title) {
    if (!title) return null;
    const arabic = title.match(/第\s*(\d+)\s*章/);
    if (arabic) return parseInt(arabic[1], 10);
    const chinese = title.match(/第\s*([零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟〇两]+)\s*章/);
    if (chinese) return chineseToNumber(chinese[1]);
    const english = title.match(/(?:Chapter|Part|Section|Lecture)\s+(\d+)/i);
    return english ? parseInt(english[1], 10) : null;
}

function findChapterIndexByNumber(chapters, chapterNumber) {
    for (let index = 0; index < chapters.length; index++) {
        if (extractChapterNumber(chapters[index].title) === chapterNumber) return index;
    }
    return -1;
}
