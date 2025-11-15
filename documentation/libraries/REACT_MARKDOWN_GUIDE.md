# React Markdown Complete Integration Guide

Comprehensive guide to React Markdown—a safe, pluggable component for rendering Markdown in React applications with support for custom components, plugins, and GitHub Flavored Markdown.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [Component Mapping](#component-mapping)
4. [Plugin System](#plugin-system)
5. [GitHub Flavored Markdown](#github-flavored-markdown)
6. [Code Syntax Highlighting](#code-syntax-highlighting)
7. [Math Rendering](#math-rendering)
8. [Security & HTML Handling](#security--html-handling)
9. [Advanced Patterns](#advanced-patterns)
10. [Best Practices](#best-practices)

## Installation & Setup

### Install Dependencies

```bash
npm install react-markdown remark-gfm
```

### Optional Plugins for Advanced Features

```bash
# For syntax highlighting
npm install prismjs

# For math support
npm install rehype-katex remark-math

# For HTML support (use with caution!)
npm install rehype-raw

# For heading IDs
npm install remark-heading-id
```

## Basic Usage

### Simple Markdown Rendering

```tsx
import Markdown from 'react-markdown';

function BlogPost() {
  const markdown = `
# Hello World

This is a **bold** and *italic* text.

- List item 1
- List item 2
- List item 3
  `;

  return <Markdown>{markdown}</Markdown>;
}
```

### Load from File

```tsx
import Markdown from 'react-markdown';
import { useState, useEffect } from 'react';

function DocumentView() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/docs/guide.md')
      .then(res => res.text())
      .then(setContent);
  }, []);

  return <Markdown>{content}</Markdown>;
}
```

### With Custom Container

```tsx
import Markdown from 'react-markdown';

function MarkdownPage() {
  const markdown = `
# My Blog Post

Lorem ipsum dolor sit amet...

## Section Title

More content here.
  `;

  return (
    <div className="prose prose-lg max-w-none">
      <Markdown>{markdown}</Markdown>
    </div>
  );
}
```

## Component Mapping

### Map Markdown Elements to Components

```tsx
import Markdown from 'react-markdown';

function CustomMarkdown() {
  const markdown = '# Hello\n\nThis is a [link](https://example.com)';

  const components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-4xl font-bold my-4" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl font-bold my-3" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="leading-relaxed my-2" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
    ),
    code: ({ node, inline, ...props }) => (
      inline ? (
        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm" {...props} />
      ) : (
        <pre className="bg-gray-900 text-white p-4 rounded overflow-auto" {...props} />
      )
    ),
    li: ({ node, ...props }) => (
      <li className="ml-6 list-disc" {...props} />
    )
  };

  return <Markdown components={components}>{markdown}</Markdown>;
}
```

### Custom Link Handler

```tsx
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';

function RouterEnabledMarkdown() {
  const markdown = 'Check out [our guide](/docs/guide)';

  const components = {
    a: ({ node, href, children, ...props }) => {
      // Internal links
      if (href?.startsWith('/')) {
        return <Link to={href} {...props}>{children}</Link>;
      }

      // External links
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }
  };

  return <Markdown components={components}>{markdown}</Markdown>;
}
```

### Custom Image Component

```tsx
import Markdown from 'react-markdown';
import Image from 'next/image'; // or your image component

function MarkdownWithImages() {
  const components = {
    img: ({ src, alt, ...props }) => (
      <Image
        src={src}
        alt={alt}
        width={600}
        height={400}
        className="rounded-lg shadow-lg"
        {...props}
      />
    )
  };

  return <Markdown components={components}>{markdown}</Markdown>;
}
```

### Custom Block Components

```tsx
import Markdown from 'react-markdown';

function MarkdownWithCallouts() {
  const components = {
    blockquote: ({ node, ...props }) => (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded" {...props} />
    ),
    code: ({ node, inline, className, children, ...props }) => {
      const language = className?.replace(/language-/, '');

      return !inline ? (
        <div className="bg-gray-900 text-white p-4 rounded overflow-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </div>
      ) : (
        <code className="bg-gray-100 px-2 py-1 rounded" {...props}>
          {children}
        </code>
      );
    }
  };

  return <Markdown components={components}>{markdown}</Markdown>;
}
```

## Plugin System

### Use Remark Plugins

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkHeadingId from 'remark-heading-id';

function MarkdownWithPlugins() {
  const markdown = `
# Main Title

## Subsection

[Back to top](#main-title)
  `;

  return (
    <Markdown
      remarkPlugins={[
        remarkGfm,
        remarkHeadingId
      ]}
    >
      {markdown}
    </Markdown>
  );
}
```

### Custom Remark Plugin

```tsx
import Markdown from 'react-markdown';
import { visit } from 'unist-util-visit';

// Plugin to add custom attributes
const customPlugin = () => (tree) => {
  visit(tree, 'link', (node) => {
    if (node.url.startsWith('http')) {
      node.data = node.data || {};
      node.data.hProperties = node.data.hProperties || {};
      node.data.hProperties.target = '_blank';
      node.data.hProperties.rel = 'noopener noreferrer';
    }
  });
};

function MarkdownWithCustomPlugin() {
  return (
    <Markdown
      remarkPlugins={[customPlugin]}
    >
      {markdown}
    </Markdown>
  );
}
```

## GitHub Flavored Markdown

### Enable GFM Features

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function GitHubMarkdown() {
  const markdown = `
| Name | Age | City |
|------|-----|------|
| John | 28  | NYC  |
| Jane | 32  | LA   |

~~strikethrough~~

- [x] Completed task
- [ ] Incomplete task

\`\`\`
code block
\`\`\`

https://example.com (auto link)
  `;

  return <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>;
}
```

### Table Styling

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function StyledTables() {
  const components = {
    table: ({ node, ...props }) => (
      <table className="w-full border-collapse" {...props} />
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-gray-100" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="border p-2 text-left font-bold" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="border p-2" {...props} />
    ),
    tr: ({ node, ...props }) => (
      <tr className="hover:bg-gray-50" {...props} />
    )
  };

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {markdown}
    </Markdown>
  );
}
```

## Code Syntax Highlighting

### With Prism

```tsx
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

function HighlightedCode() {
  const components = {
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      return !inline && language ? (
        <SyntaxHighlighter
          style={dracula}
          language={language}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return <Markdown components={components}>{markdown}</Markdown>;
}
```

## Math Rendering

### LaTeX Support with KaTeX

```tsx
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function MathMarkdown() {
  const markdown = `
## Quadratic Formula

Inline math: $a^2 + b^2 = c^2$

Block math:

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
  `;

  return (
    <Markdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {markdown}
    </Markdown>
  );
}
```

## Security & HTML Handling

### Safe by Default

```tsx
import Markdown from 'react-markdown';

function SafeMarkdown() {
  // This contains malicious HTML that will be escaped
  const markdown = `
# Title

<script>alert('XSS')</script>

[Click me](javascript:alert('XSS'))
  `;

  // Safe rendering - script tags and dangerous links are stripped
  return <Markdown>{markdown}</Markdown>;
}
```

### Allow Specific HTML Elements

```tsx
import Markdown from 'react-markdown';

function AllowSpecificElements() {
  const markdown = `
# Title

<div className="custom-container">
  Content here
</div>

Dangerous: <script>alert('XSS')</script>
  `;

  return (
    <Markdown
      allowedElements={['div', 'span', 'p', 'a', 'img', 'h1', 'h2']}
      unwrapDisallowed
    >
      {markdown}
    </Markdown>
  );
}
```

### Raw HTML Support

```tsx
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

function MarkdownWithRawHTML() {
  const markdown = `
# Title

<div style="color: red;">
  This HTML will be rendered as-is
</div>
  `;

  // Use with caution - verify content sources!
  return (
    <Markdown
      rehypePlugins={[rehypeRaw]}
    >
      {markdown}
    </Markdown>
  );
}
```

## Advanced Patterns

### Lazy Loading Code Blocks

```tsx
import Markdown from 'react-markdown';
import { lazy, Suspense } from 'react';

const CodeBlock = lazy(() => import('./CodeBlock'));

function MarkdownWithLazyCode() {
  const components = {
    code: ({ node, inline, children, ...props }) => {
      if (!inline) {
        return (
          <Suspense fallback={<div>Loading syntax highlighter...</div>}>
            <CodeBlock>{children}</CodeBlock>
          </Suspense>
        );
      }
      return <code {...props}>{children}</code>;
    }
  };

  return <Markdown components={components}>{markdown}</Markdown>;
}
```

### Extract Table of Contents

```tsx
import Markdown from 'react-markdown';
import { useState } from 'react';
import { visit } from 'unist-util-visit';

function MarkdownWithTOC() {
  const [headings, setHeadings] = useState([]);

  const extractHeadings = () => (tree) => {
    const headingList = [];
    
    visit(tree, 'heading', (node) => {
      if (node.depth < 4) {
        const text = node.children[0].value;
        headingList.push({
          level: node.depth,
          text,
          id: text.toLowerCase().replace(/\s+/g, '-')
        });
      }
    });

    setHeadings(headingList);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h2>Contents</h2>
        <ul>
          {headings.map((heading) => (
            <li key={heading.id} style={{ marginLeft: `${heading.level * 10}px` }}>
              <a href={`#${heading.id}`}>{heading.text}</a>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-2">
        <Markdown
          remarkPlugins={[extractHeadings]}
        >
          {markdown}
        </Markdown>
      </div>
    </div>
  );
}
```

### Parse and Transform Markdown

```tsx
import Markdown from 'react-markdown';
import { visit } from 'unist-util-visit';
import remarkGfm from 'remark-gfm';

// Transform links to add analytics tracking
const analyticsPlugin = () => (tree) => {
  visit(tree, 'link', (node) => {
    node.data = node.data || {};
    node.data.hProperties = node.data.hProperties || {};
    node.data.hProperties.onClick = 'trackLink(event)';
  });
};

// Transform code blocks to add copy button
const addCopyButton = () => (tree) => {
  visit(tree, 'code', (node) => {
    if (!node.lang) return;
    
    node.data = node.data || {};
    node.data.meta = (node.data.meta || '') + ' copy-button';
  });
};

function AnalyticsMarkdown() {
  return (
    <Markdown
      remarkPlugins={[
        remarkGfm,
        analyticsPlugin,
        addCopyButton
      ]}
    >
      {markdown}
    </Markdown>
  );
}
```

## Best Practices

### 1. Sanitize User Input

```tsx
import Markdown from 'react-markdown';
import DOMPurify from 'dompurify';

function UserGeneratedMarkdown({ content }) {
  const sanitized = DOMPurify.sanitize(content);

  return <Markdown>{sanitized}</Markdown>;
}
```

### 2. Performance Optimization

```tsx
import Markdown from 'react-markdown';
import { memo } from 'react';

const MemoizedMarkdown = memo(({ content }) => (
  <Markdown>{content}</Markdown>
));

export default MemoizedMarkdown;
```

### 3. Error Boundaries

```tsx
import Markdown from 'react-markdown';
import { Component } from 'react';

class MarkdownErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <p>Error rendering markdown</p>;
    }

    return (
      <Markdown remarkPlugins={this.props.plugins}>
        {this.props.children}
      </Markdown>
    );
  }
}
```

### 4. Consistent Styling

```tsx
// markdown-styles.css
.markdown {
  font-size: 16px;
  line-height: 1.6;
}

.markdown h1 {
  font-size: 2em;
  font-weight: bold;
  margin: 1em 0 0.5em 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.3em;
}

.markdown h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.8em 0 0.4em 0;
}

.markdown p {
  margin: 0.5em 0;
}

.markdown code {
  background-color: #f3f4f6;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.markdown pre {
  background-color: #1e293b;
  color: #e2e8f0;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}

.markdown a {
  color: #3b82f6;
  text-decoration: none;
}

.markdown a:hover {
  text-decoration: underline;
}

.markdown ul,
.markdown ol {
  margin: 0.5em 0;
  padding-left: 2em;
}

.markdown li {
  margin: 0.25em 0;
}
```

### 5. Responsive Tables

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ResponsiveMarkdown() {
  const components = {
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th className="bg-gray-100 border border-gray-300 p-2 text-left font-bold" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="border border-gray-300 p-2" {...props} />
    )
  };

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {markdown}
    </Markdown>
  );
}
```

## Conclusion

React Markdown provides a secure, extensible way to render Markdown in React applications. With support for custom components, plugins, and various flavors of Markdown, it enables rich content rendering while maintaining security and flexibility for diverse use cases.
