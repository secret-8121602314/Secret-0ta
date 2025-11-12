import * as vscode from 'vscode';
import { MCPClient } from '../mcp/client';
import { Library, Documentation } from '../types';

export class DocumentationProvider implements vscode.TextDocumentContentProvider {
    private mcpClient: MCPClient;
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    constructor() {
        this.mcpClient = new MCPClient();
    }

    public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
        const libraryId = uri.path.split('/').pop();
        return this.fetchDocumentation(libraryId);
    }

    public resolveLibraryId(libraryName: string): Promise<string> {
        return this.mcpClient.resolveLibraryId(libraryName);
    }

    private async fetchDocumentation(libraryId: string | undefined): Promise<string> {
        if (!libraryId) {
            return 'Library ID is not defined.';
        }

        try {
            const documentation: Documentation = await this.mcpClient.fetchDocumentation(libraryId);
            return this.formatDocumentation(documentation);
        } catch (error) {
            return `Error fetching documentation: ${error.message}`;
        }
    }

    private formatDocumentation(doc: Documentation): string {
        return `# ${doc.title}\n\n${doc.content}`;
    }

    public get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    public update(uri: vscode.Uri): void {
        this._onDidChange.fire(uri);
    }
}