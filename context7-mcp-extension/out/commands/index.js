"use strict";
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
exports.registerCommands = registerCommands;
const vscode_1 = require("vscode");
function registerCommands(context, mcpClient) {
    const resolveLibraryIdCommand = vscode_1.commands.registerCommand('extension.resolveLibraryId', (libraryName) => __awaiter(this, void 0, void 0, function* () {
        const libraryId = yield mcpClient.resolveLibraryId(libraryName);
        return libraryId;
    }));
    const fetchDocumentationCommand = vscode_1.commands.registerCommand('extension.fetchDocumentation', (libraryId) => __awaiter(this, void 0, void 0, function* () {
        const documentation = yield mcpClient.fetchDocumentation(libraryId);
        return documentation;
    }));
    context.subscriptions.push(resolveLibraryIdCommand, fetchDocumentationCommand);
}
