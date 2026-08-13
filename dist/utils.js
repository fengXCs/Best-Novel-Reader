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
exports.readTextFileWithAutoEncoding = readTextFileWithAutoEncoding;
const fs = __importStar(require("fs"));
const jschardet = __importStar(require("jschardet"));
const iconv = __importStar(require("iconv-lite"));
function readTextFileWithAutoEncoding(filePath) {
    try {
        // Read the file as binary buffer
        const buffer = fs.readFileSync(filePath);
        // Detect encoding
        const detected = jschardet.detect(buffer);
        const encoding = detected.encoding.toLowerCase();
        // If encoding is utf-8 or ascii, use native fs.readFileSync
        if (encoding === 'utf-8' || encoding === 'ascii') {
            return fs.readFileSync(filePath, 'utf8');
        }
        // For other encodings like gbk, use iconv-lite
        if (iconv.encodingExists(encoding)) {
            return iconv.decode(buffer, encoding);
        }
        // Fallback to utf-8 if encoding is not supported
        return iconv.decode(buffer, 'utf-8');
    }
    catch (error) {
        console.error(`Error detecting encoding for file ${filePath}:`, error);
        // Fallback to UTF-8 if encoding detection fails
        try {
            return fs.readFileSync(filePath, 'utf8');
        }
        catch (utf8Error) {
            console.error(`Error reading file ${filePath} as UTF-8:`, utf8Error);
            throw new Error(`Unable to read file ${filePath}: ${error}`);
        }
    }
}
