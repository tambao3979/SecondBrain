"use client";

import React from "react";

interface RichMarkdownProps {
  content: string;
  className?: string;
  clampLines?: number;
}

export default function RichMarkdown({
  content,
  className = "",
  clampLines,
}: RichMarkdownProps) {
  if (!content) return null;

  // Pre-process and parse markdown blocks
  const parseInline = (text: string): React.ReactNode[] => {
    // Regex for bold, italic, inline code, link
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    // Matches **bold**, `code`, *italic*, [text](url)
    const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/;

    while (remaining.length > 0) {
      const match = remaining.match(tokenRegex);
      if (!match) {
        parts.push(remaining);
        break;
      }

      const matchIndex = match.index || 0;
      if (matchIndex > 0) {
        parts.push(remaining.substring(0, matchIndex));
      }

      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={keyIndex++} className="font-semibold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code
            key={keyIndex++}
            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-[11px]"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <em key={keyIndex++} className="italic text-slate-200">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
        const titleMatch = token.match(/\[(.*?)\]/);
        const urlMatch = token.match(/\((.*?)\)/);
        const title = titleMatch ? titleMatch[1] : token;
        const url = urlMatch ? urlMatch[1] : "#";
        parts.push(
          <a
            key={keyIndex++}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            {title}
          </a>
        );
      }

      remaining = remaining.substring(matchIndex + token.length);
    }

    return parts;
  };

  // Split content into lines for block-level parsing
  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="space-y-1 my-1.5 pl-4 list-disc marker:text-indigo-400">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      renderedElements.push(
        <pre
          key={`code-${renderedElements.length}`}
          className="p-3 my-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto"
        >
          <code>{codeBlockLines.join("\n")}</code>
        </pre>
      );
      codeBlockLines = [];
      inCodeBlock = false;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();

    // Check code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      return;
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      flushList();
      renderedElements.push(<hr key={idx} className="border-slate-800/80 my-2" />);
      return;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      renderedElements.push(
        <h4 key={idx} className="text-xs font-bold text-slate-100 tracking-tight mt-2 mb-1">
          {parseInline(line.substring(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      renderedElements.push(
        <h3 key={idx} className="text-sm font-bold text-white tracking-tight mt-2.5 mb-1">
          {parseInline(line.substring(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushList();
      renderedElements.push(
        <h2 key={idx} className="text-base font-bold text-white tracking-tight mt-3 mb-1.5">
          {parseInline(line.substring(2))}
        </h2>
      );
      return;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      flushList();
      renderedElements.push(
        <div
          key={idx}
          className="border-l-2 border-indigo-500/70 pl-3 py-1 my-1.5 text-xs text-slate-300 italic bg-indigo-500/5 rounded-r-lg"
        >
          {parseInline(line.substring(2))}
        </div>
      );
      return;
    }

    // Bullet lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      inList = true;
      const cleanLine = line.trim().substring(2);
      // Check if task checkbox
      if (cleanLine.startsWith("[ ] ") || cleanLine.startsWith("[x] ")) {
        const isChecked = cleanLine.startsWith("[x] ");
        listItems.push(
          <li key={idx} className="flex items-center gap-2 list-none text-xs text-slate-300">
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] border ${
                isChecked
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                  : "bg-slate-900 border-slate-700"
              }`}
            >
              {isChecked ? "✓" : ""}
            </span>
            <span className={isChecked ? "line-through text-slate-500" : ""}>
              {parseInline(cleanLine.substring(4))}
            </span>
          </li>
        );
      } else {
        listItems.push(
          <li key={idx} className="text-xs text-slate-300 leading-relaxed">
            {parseInline(cleanLine)}
          </li>
        );
      }
      return;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      return;
    }

    // Normal paragraph
    flushList();
    renderedElements.push(
      <p key={idx} className="text-xs text-slate-300 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
  });

  flushList();
  flushCodeBlock();

  return (
    <div
      className={`prose-custom ${
        clampLines ? `line-clamp-${clampLines}` : ""
      } ${className}`}
      style={
        clampLines
          ? {
              display: "-webkit-box",
              WebkitLineClamp: clampLines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
          : undefined
      }
    >
      {renderedElements}
    </div>
  );
}
