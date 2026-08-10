import fs from"node:fs";import path from"node:path";
const d=path.resolve("dist"),base=fs.readFileSync(path.join(d,"index.html"),"utf8");
for(const r of["login","auth/callback","site","navigation","content","seo","redirects","tools","news","software","data","cv","users","media","api"]){const x=path.join(d,...r.split("/"));fs.mkdirSync(x,{recursive:true});fs.writeFileSync(path.join(x,"index.html"),base)}
