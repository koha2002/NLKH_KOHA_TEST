import type { ReactNode } from "react";

function inline(text:string):ReactNode[]{
  const source=String(text||"");
  const pattern=/(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https?:\/\/[^)\s]+|\/[^)\s]+)\))/g;
  return source.split(pattern).filter(Boolean).map((part,index)=>{
    if(part.startsWith("**")&&part.endsWith("**")){
      return <strong key={index}>{part.slice(2,-2)}</strong>;
    }
    const link=part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)$/);
    if(link){
      const external=/^https?:\/\//i.test(link[2]);
      return <a key={index} href={link[2]} {...(external?{target:"_blank",rel:"noreferrer noopener"}:{})}>{link[1]}</a>;
    }
    return part;
  });
}

function tableRow(line:string){
  return line.trim().replace(/^\||\|$/g,"").split("|").map(x=>x.trim());
}
function isDivider(line:string){
  const cells=tableRow(line);
  return cells.length>0&&cells.every(x=>/^:?-{3,}:?$/.test(x));
}

export function SafeMarkdown({content}:{content:string}){
  const lines=String(content||"").replace(/\r/g,"").split("\n");
  const out:ReactNode[]=[];
  let list:{type:"ul"|"ol";items:string[]}|null=null;

  const flush=()=>{
    if(!list)return;
    const data=list;
    list=null;
    const children=data.items.map((item,i)=><li key={i}>{inline(item)}</li>);
    out.push(data.type==="ol"
      ? <ol key={`list-${out.length}`}>{children}</ol>
      : <ul key={`list-${out.length}`}>{children}</ul>);
  };

  let i=0;
  while(i<lines.length){
    const line=lines[i].trim();

    if(!line){flush();i++;continue}

    const image=line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)$/i);
    if(image){
      flush();
      out.push(
        <figure className="markdownImage" key={`img-${i}`}>
          <img src={image[2]} alt={image[1]||""} loading="lazy" />
          {image[1]?<figcaption>{image[1]}</figcaption>:null}
        </figure>
      );
      i++;
      continue;
    }

    const ul=line.match(/^[-*]\s+(.+)$/);
    const ol=line.match(/^\d+\.\s+(.+)$/);
    if(ul||ol){
      const type=ol?"ol":"ul";
      if(!list||list.type!==type){flush();list={type,items:[]}}
      list.items.push((ol?.[1]||ul?.[1]||"").trim());
      i++;
      continue;
    }

    if(line.includes("|")&&i+1<lines.length&&isDivider(lines[i+1])){
      flush();
      const head=tableRow(line);
      i+=2;
      const rows:string[][]=[];
      while(i<lines.length&&lines[i].trim()&&lines[i].includes("|")){
        rows.push(tableRow(lines[i]));
        i++;
      }
      out.push(
        <div className="markdownTableWrap" key={`table-${i}`}>
          <table>
            <thead><tr>{head.map((x,j)=><th key={j}>{inline(x)}</th>)}</tr></thead>
            <tbody>{rows.map((row,r)=><tr key={r}>{row.map((x,j)=><td key={j}>{inline(x)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    flush();
    const h=line.match(/^(#{1,3})\s+(.+)$/);
    if(h?.[1].length===1)out.push(<h2 key={i}>{inline(h[2])}</h2>);
    else if(h?.[1].length===2)out.push(<h3 key={i}>{inline(h[2])}</h3>);
    else if(h)out.push(<h4 key={i}>{inline(h[2])}</h4>);
    else if(line.startsWith("> "))out.push(<blockquote key={i}>{inline(line.slice(2))}</blockquote>);
    else out.push(<p key={i}>{inline(line)}</p>);
    i++;
  }
  flush();
  return <>{out}</>;
}