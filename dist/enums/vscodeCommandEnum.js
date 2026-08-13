"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VscodeCommandEnum = void 0;
var VscodeCommandEnum;
(function (VscodeCommandEnum) {
    VscodeCommandEnum["IMPORT_NOVEL"] = "novelReader.importNovel";
    VscodeCommandEnum["OPEN_CHAPTER"] = "novelReader.openChapter";
    VscodeCommandEnum["SHOW_CURRENT_NOVEL"] = "novelReader.showCurrentNovel";
    VscodeCommandEnum["SHOW_CURRENT_CHAPTER"] = "novelReader.showCurrentChapter";
    VscodeCommandEnum["NEXT_CHAPTER"] = "novelReader.nextChapter";
    VscodeCommandEnum["PREVIOUS_CHAPTER"] = "novelReader.previousChapter";
    VscodeCommandEnum["REFRESH_SIDEBAR"] = "novelReader.refreshSidebar";
    VscodeCommandEnum["DELETE_NOVEL"] = "novelReader.deleteNovel";
})(VscodeCommandEnum || (exports.VscodeCommandEnum = VscodeCommandEnum = {}));
