import * as vscode from 'vscode';
import { MCPClient } from './mcp/client';
import { DocumentationProvider } from './providers/documentationProvider';
import { registerCommands } from './commands/index';

export function activate(context: vscode.ExtensionContext) {
    const mcpClient = new MCPClient();
    const documentationProvider = new DocumentationProvider(mcpClient);

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'javascript' }, documentationProvider)
    );

    registerCommands(context, mcpClient);
}

export function deactivate() {
    // Cleanup if necessary
}