import { commands, ExtensionContext } from 'vscode';
import { MCPClient } from '../mcp/client';

export function registerCommands(context: ExtensionContext, mcpClient: MCPClient) {
    const resolveLibraryIdCommand = commands.registerCommand('extension.resolveLibraryId', async (libraryName: string) => {
        const libraryId = await mcpClient.resolveLibraryId(libraryName);
        return libraryId;
    });

    const fetchDocumentationCommand = commands.registerCommand('extension.fetchDocumentation', async (libraryId: string) => {
        const documentation = await mcpClient.fetchDocumentation(libraryId);
        return documentation;
    });

    context.subscriptions.push(resolveLibraryIdCommand, fetchDocumentationCommand);
}