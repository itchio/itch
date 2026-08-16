// Minimal markdown renderer for GitHub release notes shown in the
// changelog modal (itch / butler / itch-setup). Covers only the syntax
// those notes use, unsupported constructs render as plain text. Emits
// React elements directly (never HTML strings), so untrusted input
// cannot inject markup.

import urls from "common/constants/urls";
import React from "react";

interface Props {
  source: string;
  externalLinks?: boolean;
}

interface RenderOptions {
  externalLinks: boolean;
}

// absolute http(s) only: the page has a local URL, so relative links
// would resolve to file: before reaching shell.openExternal
const isSafeUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (e) {
    return false;
  }
};

// alternatives: code span, bold, italic, ![alt](src), [label](url),
// bare URL, #issue, html <img>
const inlineRe =
  /`([^`\n]+)`|\*\*(\S(?:[^*\n]*\S)?)\*\*|\*(\S(?:[^*\n]*\S)?)\*|!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>)\]]+)|#([0-9]+)|<img\s([^>]*?)\/?>/g;

const imgAttrRe = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;

const renderLink = (
  label: React.ReactNode,
  url: string,
  options: RenderOptions,
  key: number
): React.ReactNode => {
  if (!isSafeUrl(url)) {
    return label;
  }
  return (
    <a
      key={key}
      href={url}
      rel="noopener noreferrer"
      target={options.externalLinks ? "_popout" : undefined}
    >
      {label}
    </a>
  );
};

// the renderer CSP only allows itch image hosts, so embedded images
// become links that open in the external browser instead
const renderImg = (
  alt: string,
  src: string,
  options: RenderOptions,
  key: number
): React.ReactNode => {
  return renderLink(alt || "image", src, options, key);
};

const renderInline = (
  text: string,
  options: RenderOptions
): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const m of Array.from(text.matchAll(inlineRe))) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    last = m.index + m[0].length;

    const [
      ,
      code,
      bold,
      italic,
      imgAlt,
      imgSrc,
      label,
      url,
      bareUrl,
      issue,
      imgAttrs,
    ] = m;
    if (code !== undefined) {
      nodes.push(<code key={key++}>{code}</code>);
    } else if (bold !== undefined) {
      nodes.push(<strong key={key++}>{renderInline(bold, options)}</strong>);
    } else if (italic !== undefined) {
      nodes.push(<em key={key++}>{renderInline(italic, options)}</em>);
    } else if (imgSrc !== undefined) {
      nodes.push(renderImg(imgAlt || "", imgSrc, options, key++));
    } else if (label !== undefined && url !== undefined) {
      nodes.push(renderLink(renderInline(label, options), url, options, key++));
    } else if (bareUrl !== undefined) {
      const trimmed = bareUrl.replace(/[.,;:!?]+$/, "");
      nodes.push(renderLink(trimmed, trimmed, options, key++));
      if (trimmed.length < bareUrl.length) {
        nodes.push(bareUrl.slice(trimmed.length));
      }
    } else if (issue !== undefined) {
      nodes.push(
        renderLink(
          `#${issue}`,
          `${urls.itchRepo}/issues/${issue}`,
          options,
          key++
        )
      );
    } else if (imgAttrs !== undefined) {
      const attrs: { [key: string]: string } = {};
      for (const am of Array.from(imgAttrs.matchAll(imgAttrRe))) {
        attrs[am[1].toLowerCase()] = am[2];
      }
      if (attrs.src) {
        nodes.push(renderImg(attrs.alt || "", attrs.src, options, key++));
      }
    }
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
};

const headingRe = /^(#{1,6})\s+(.*)$/;
const bulletRe = /^(\s*)[-*]\s+(.*)$/;
const orderedRe = /^(\s*)\d+[.)]\s+(.*)$/;
const quoteRe = /^\s*>\s?(.*)$/;
const fenceRe = /^\s*```/;
// GFM table rows may omit the outer pipes; the separator line is the
// signal that distinguishes a table from prose containing "|"
const tableRowRe = /^[^\n]*\|/;
const tableSeparatorRe = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/;

interface ListItem {
  indent: number;
  text: string;
  ordered: boolean;
}

const buildList = (
  items: ListItem[],
  options: RenderOptions,
  key: number
): React.ReactNode => {
  const base = Math.min(...items.map((it) => it.indent));
  const groups: { item: ListItem; children: ListItem[] }[] = [];
  for (const it of items) {
    if (it.indent <= base || groups.length === 0) {
      groups.push({ item: it, children: [] });
    } else {
      groups[groups.length - 1].children.push(it);
    }
  }

  const children = groups.map((g, i) => (
    <li key={i}>
      {renderInline(g.item.text, options)}
      {g.children.length > 0 ? buildList(g.children, options, 0) : null}
    </li>
  ));
  return React.createElement(
    groups[0].item.ordered ? "ol" : "ul",
    { key },
    children
  );
};

const splitTableRow = (line: string): string[] => {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
};

const parseBlocks = (
  source: string,
  options: RenderOptions
): React.ReactNode[] => {
  const blocks: React.ReactNode[] = [];
  const lines = source.split(/\r?\n/);
  let para: string[] = [];
  let list: ListItem[] = [];
  let quote: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length > 0) {
      blocks.push(<p key={key++}>{renderInline(para.join(" "), options)}</p>);
      para = [];
    }
  };

  const flushList = () => {
    if (list.length > 0) {
      blocks.push(buildList(list, options, key++));
      list = [];
    }
  };

  const flushQuote = () => {
    if (quote.length > 0) {
      blocks.push(
        <blockquote key={key++}>
          {renderInline(quote.join(" "), options)}
        </blockquote>
      );
      quote = [];
    }
  };

  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (fenceRe.test(line)) {
      flushAll();
      const code: string[] = [];
      i++;
      while (i < lines.length && !fenceRe.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      blocks.push(
        <pre key={key++}>
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (
      tableRowRe.test(line) &&
      i + 1 < lines.length &&
      tableSeparatorRe.test(lines[i + 1])
    ) {
      flushAll();
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        tableRowRe.test(lines[i])
      ) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      i--;
      blocks.push(
        <table key={key++}>
          <thead>
            <tr>
              {header.map((cell, c) => (
                <th key={c}>{renderInline(cell, options)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{renderInline(cell, options)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }

    const heading = headingRe.exec(line);
    if (heading) {
      flushAll();
      const tag = `h${heading[1].length}` as keyof JSX.IntrinsicElements;
      blocks.push(
        React.createElement(
          tag,
          { key: key++ },
          renderInline(heading[2], options)
        )
      );
      continue;
    }

    const bullet = bulletRe.exec(line) || orderedRe.exec(line);
    if (bullet) {
      flushPara();
      flushQuote();
      list.push({
        indent: bullet[1].length,
        text: bullet[2],
        ordered: /\d/.test(line.trim()[0]),
      });
      continue;
    }

    const quoted = quoteRe.exec(line);
    if (quoted) {
      flushPara();
      flushList();
      quote.push(quoted[1]);
      continue;
    }

    if (line.trim() === "") {
      flushAll();
      continue;
    }

    flushList();
    flushQuote();
    para.push(line);
  }
  flushAll();

  return blocks;
};

const Markdown = ({ source, externalLinks = false }: Props) => {
  return <div>{parseBlocks(source, { externalLinks })}</div>;
};

export default React.memo(Markdown);
