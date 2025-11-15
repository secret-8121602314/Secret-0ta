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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationProvider = void 0;
const vscode = __importStar(require("vscode"));
const client_1 = require("../mcp/client");
class DocumentationProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        this.mcpClient = new client_1.MCPClient();
    }
    provideTextDocumentContent(uri) {
        const libraryId = uri.path.split('/').pop();
        return this.fetchDocumentation(libraryId);
    }
    resolveLibraryId(libraryName) {
        return this.mcpClient.resolveLibraryId(libraryName);
    }
    fetchDocumentation(libraryId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!libraryId) {
                return 'Library ID is not defined.';
            }
            try {
                const documentation = yield this.mcpClient.fetchDocumentation(libraryId);
                return this.formatDocumentation(documentation);
            }
            catch (error) {
                return `Error fetching documentation: ${error.message}`;
            }
        });
    }
    formatDocumentation(doc) {
        return `# ${doc.title}\n\n${doc.content}`;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
}
exports.DocumentationProvider = DocumentationProvider;
