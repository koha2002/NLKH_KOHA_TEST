import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a href={link[2]} target="_blank" rel="noreferrer" key={index}>{link[1]}</a>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

export function SafeMarkdown({ content }: { content: string }) {
  const lines = String(content || "").replace(/\r/g, "").split("\n");
  const output: ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (!list.length) return;
    const items = list;
    list = [];
    output.push(<ul key={`list-${output.length}`}>{items.map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>);
  };
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (/^[-*]\s+/.test(line)) { list.push(line.replace(/^[-*]\s+/, "")); return; }
    flushList();
    if (!line) return;
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading?.[1].length === 1) output.push(<h2 key={index}>{inline(heading[2])}</h2>);
    else if (heading?.[1].length === 2) output.push(<h3 key={index}>{inline(heading[2])}</h3>);
    else if (heading) output.push(<h4 key={index}>{inline(heading[2])}</h4>);
    else if (line.startsWith("> ")) output.push(<blockquote key={index}>{inline(line.slice(2))}</blockquote>);
    else output.push(<p key={index}>{inline(line)}</p>);
  });
  flushList();
  return <>{output}</>;
}
