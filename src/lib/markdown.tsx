// Tiny inline markdown renderer for lesson bodies. Intentionally minimal — we
// don't want a full library on the client just for a handful of inline rules.
// Supported: # / ## / ### headings, **bold**, *italic*, `code`, - lists, blank-
// line paragraphs, > blockquotes, and ``` fenced code. Anything we don't
// recognise renders verbatim — markdown is plain text by design.
import React from "react";

function renderInline(s: string, keyBase: string): React.ReactNode[] {
  // Bold then italic then inline code — order matters so we don't double-eat.
  const out: React.ReactNode[] = [];
  let buf = "";
  let i = 0;
  let k = 0;
  function flush() { if (buf) { out.push(buf); buf = ""; } }

  while (i < s.length) {
    if (s.startsWith("**", i)) {
      const end = s.indexOf("**", i + 2);
      if (end > -1) {
        flush();
        out.push(<strong key={`${keyBase}-b${k++}`}>{s.slice(i + 2, end)}</strong>);
        i = end + 2; continue;
      }
    }
    if (s[i] === "*") {
      const end = s.indexOf("*", i + 1);
      if (end > -1) {
        flush();
        out.push(<em key={`${keyBase}-i${k++}`}>{s.slice(i + 1, end)}</em>);
        i = end + 1; continue;
      }
    }
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end > -1) {
        flush();
        out.push(<code key={`${keyBase}-c${k++}`} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{s.slice(i + 1, end)}</code>);
        i = end + 1; continue;
      }
    }
    buf += s[i++];
  }
  flush();
  return out;
}

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  // Split into blocks on blank lines, then classify each.
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const nodes: React.ReactNode[] = [];
  let inFence: string[] | null = null;

  blocks.forEach((rawBlock, bi) => {
    // Handle multi-line fenced code (``` ... ```). The fence may span blocks if
    // the user pasted blank lines inside; rejoin until we see the close fence.
    const lines = rawBlock.split("\n");
    if (inFence) {
      for (const ln of lines) {
        if (ln.trim().startsWith("```")) {
          nodes.push(
            <pre key={`pre-${bi}`} className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
              {inFence.join("\n")}
            </pre>
          );
          inFence = null;
          return;
        }
        inFence.push(ln);
      }
      return;
    }
    if (lines[0]?.trim().startsWith("```")) {
      inFence = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith("```")) {
          nodes.push(
            <pre key={`pre-${bi}`} className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
              {inFence.join("\n")}
            </pre>
          );
          inFence = null;
          return;
        }
        inFence.push(lines[i]);
      }
      return; // unclosed fence — keep collecting in next block
    }

    // Headings
    if (lines.length === 1) {
      const m = lines[0].match(/^(#{1,3})\s+(.+)$/);
      if (m) {
        const lvl = m[1].length;
        const inner = renderInline(m[2], `h-${bi}`);
        if (lvl === 1) nodes.push(<h1 key={bi} className="mt-2 text-2xl font-bold tracking-tight">{inner}</h1>);
        else if (lvl === 2) nodes.push(<h2 key={bi} className="mt-2 text-xl font-semibold">{inner}</h2>);
        else nodes.push(<h3 key={bi} className="mt-2 text-base font-semibold">{inner}</h3>);
        return;
      }
    }

    // Blockquote
    if (lines.every((l) => l.startsWith("> "))) {
      nodes.push(
        <blockquote key={bi} className="border-l-2 border-brand/40 pl-3 text-sm italic text-muted-foreground">
          {lines.map((l, i) => <p key={i}>{renderInline(l.slice(2), `bq-${bi}-${i}`)}</p>)}
        </blockquote>
      );
      return;
    }

    // List (- or *)
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      nodes.push(
        <ul key={bi} className="ml-5 list-disc space-y-1 text-sm">
          {lines.map((l, i) => <li key={i}>{renderInline(l.replace(/^[-*]\s+/, ""), `li-${bi}-${i}`)}</li>)}
        </ul>
      );
      return;
    }

    // Paragraph (preserve single \n as <br/>)
    nodes.push(
      <p key={bi} className="text-sm leading-relaxed">
        {lines.flatMap((l, i) => {
          const parts = renderInline(l, `p-${bi}-${i}`);
          return i < lines.length - 1 ? [...parts, <br key={`br-${bi}-${i}`} />] : parts;
        })}
      </p>
    );
  });

  return <div className={`space-y-3 ${className}`}>{nodes}</div>;
}
