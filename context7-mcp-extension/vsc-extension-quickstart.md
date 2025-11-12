# Quick Start Guide for Context7 MCP Extension

## Overview

This guide provides a quick start for developing the Context7 MCP extension for real-time documentation access. Follow the steps below to set up your development environment and get started.

## Prerequisites

- Node.js (version 14 or later)
- npm (Node package manager)
- TypeScript (version 4.0 or later)
- Visual Studio Code

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd context7-mcp-extension
   ```

2. **Install dependencies:**

   Run the following command to install the required packages:

   ```bash
   npm install
   ```

3. **Compile the TypeScript files:**

   Use the TypeScript compiler to compile the source files:

   ```bash
   npm run build
   ```

## Development

- Open the project in Visual Studio Code:

  ```bash
  code .
  ```

- Start the extension in the Extension Development Host:

  Press `F5` to launch a new instance of Visual Studio Code with the extension loaded.

## Commands

The extension provides several commands that can be accessed via the Command Palette (`Ctrl+Shift+P`):

- **Resolve Library ID**: Fetches the library ID for the selected text.
- **Fetch Documentation**: Retrieves the latest documentation for the specified library.

## Best Practices

- Keep your code modular by organizing related functionalities into separate files.
- Use TypeScript interfaces to define the structure of data returned from the MCP server.
- Regularly test your extension in the Extension Development Host to ensure functionality.

## Contribution

If you would like to contribute to this project, please fork the repository and submit a pull request with your changes. Ensure that your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.