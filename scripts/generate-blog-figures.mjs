import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// The SVGs and PNG exports share this editable drawing source.
const destination = new URL('../content/blog/when-memory-changes/images/', import.meta.url);
await mkdir(destination, { recursive: true });
const themes = {
  light: { bg: '#fafbfc', panel: '#ffffff', ink: '#17212f', muted: '#526071', line: '#c8d2df', blue: '#245dc5', tint: '#edf3ff' },
  dark: { bg: '#151c25', panel: '#1d2733', ink: '#e5ebf3', muted: '#aab8c9', line: '#506074', blue: '#8bb9ff', tint: '#213652' },
};
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
function drawing(width, height, title, description, p) {
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1L6 4L1 7" fill="none" stroke="${p.line}" stroke-width="1.4"/></marker></defs><rect width="${width}" height="${height}" rx="16" fill="${p.bg}"/><g font-family="PingFang SC,Microsoft YaHei,Noto Sans CJK SC,sans-serif">`];
  const text = (x,y,s,size=20,color=p.ink,weight=400,anchor='start') => parts.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`);
  const box = (x,y,w,h,accent=false) => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${accent?p.tint:p.panel}" stroke="${accent?p.blue:p.line}"/>`);
  const line = (d,arrow=false,dashed=false,color=p.line) => parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2"${arrow?' marker-end="url(#arrow)"':''}${dashed?' stroke-dasharray="5 6"':''}/>`);
  const dot = (x,y,color=p.blue) => parts.push(`<circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`);
  return { text,box,line,dot,end:()=>parts.join('')+'</g></svg>' };
}
function relationships(mobile,p) {
  const w=mobile?440:840, h=mobile?940:670;
  const d=drawing(w,h,'来源与理解分开保存','来源证据关联到五类持久信息；各类信息按自己的规则被选入当前上下文。',p);
  d.text(32,42,'01 / MEMORY MODEL',13,p.muted,500);
  d.text(32,84,'来源与理解分开保存',mobile?25:30,p.ink,600);
  const labels=[['用户陈述','身份、偏好与习惯'],['长期目标','希望达成的结果'],['阶段优先级','在一段时间内优先做什么'],['协作规则','如何协作、哪些行动受约束'],['工作知识','项目事实、决定与经验']];
  if(mobile){
    d.box(64,122,344,96); d.text(88,158,'来源证据',21,p.ink,600); d.text(88,190,'对话、来源引用与观察时间',17,p.muted);
    d.line('M64 170H30V704');
    labels.forEach(([name,meaning],i)=>{const y=252+i*94;d.line(`M30 ${y+36}H62`,true);d.box(64,y,344,76);d.text(84,y+30,name,20,p.ink,500);d.text(84,y+57,meaning,16,p.muted);});
    d.line('M236 704V762',true);d.text(32,798,'按各自的资格与相关性规则选择',18,p.muted);
    d.box(32,823,376,76,true);d.text(56,869,'进入本轮回答的上下文',22,p.blue,500);
  } else {
    d.box(32,284,225,116);d.text(56,329,'来源证据',23,p.ink,600);d.text(56,363,'对话与来源引用',18,p.muted);
    d.line('M257 342H302M302 169V513');d.text(279,138,'关联',15,p.muted);
    labels.forEach(([name,meaning],i)=>{const y=132+i*86;d.line(`M302 ${y+37}H344`,true);d.box(346,y,328,74);d.text(366,y+30,name,21,p.ink,500);d.text(366,y+57,meaning,17,p.muted);d.line(`M674 ${y+37}H722`);});
    d.line('M722 169V567',true);d.box(32,582,776,58,true);d.text(56,620,'按各自规则选择 → 本轮回答的上下文',22,p.blue,500);
  }
  return {svg:d.end(),w,h};
}
function correction(mobile,p) {
  const w=mobile?440:840,h=mobile?1050:690;
  const d=drawing(w,h,'同一条偏好，三种处理结果','明确纠正且值改变时替代旧记录；重复值去重；没有明确纠正关系的不同值需要进一步协调权限和冲突。',p);
  d.text(32,42,'02 / RECONCILIATION',13,p.muted,500);d.text(32,84,'同一条偏好，三种处理结果',mobile?23:30,p.ink,600);
  const cases=[['明确纠正，取值改变','校验用户权限与原记录','创建新记录','关联旧记录，并将其归档'],['重复表达，取值相同','复用已有记录','补充支持证据','避免积累重复的偏好'],['取值不同，无明确纠正','继续比较信息的权威性','不能直接替代时','进入待复核或冲突状态']];
  if(mobile){
    d.box(64,124,344,88,true);d.text(86,158,'新信息 → 同一个事实位置',19,p.blue,500);d.text(86,187,'先解析对象、属性和范围',16,p.muted);
    d.line('M64 168H30V841');
    cases.forEach(([a,b,c,e],i)=>{const y=246+i*244;d.line(`M30 ${y+40}H62`,true);d.box(64,y,344,212,i===0);d.text(84,y+34,a,19,p.ink,600);d.text(84,y+65,b,16,p.muted);d.line(`M236 ${y+82}V${y+115}`,true);d.text(84,y+149,c,20,p.blue,500);d.text(84,y+181,e,16,p.muted);});
    d.text(32,1003,'图示为单值偏好的典型路径。',16,p.muted);
  } else {
    d.box(226,130,388,90,true);d.text(420,168,'新信息 → 同一个事实位置',23,p.blue,500,'middle');d.text(420,199,'先解析对象、属性和范围',17,p.muted,400,'middle');
    d.line('M420 220V263M152 263H688');
    cases.forEach(([a,b,c,e],i)=>{const x=32+i*272;d.line(`M${x+116} 263V306`,true);d.box(x,308,232,105);d.text(x+116,347,a,18,p.ink,600,'middle');d.text(x+116,383,b,16,p.muted,400,'middle');d.line(`M${x+116} 413V466`,true);d.box(x,468,232,110,i===0);d.text(x+116,510,c,21,p.blue,500,'middle');d.text(x+116,546,e,16,p.muted,400,'middle');});
    d.text(32,623,'明确纠正先于普通去重处理；纠正后的值相同则复用原记录。',18,p.muted);
    d.text(32,654,'图示为单值偏好的典型路径，不包含所有状态分支。',16,p.muted);
  }
  return {svg:d.end(),w,h};
}
function validity(mobile,p) {
  const w=mobile?440:840,h=mobile?850:670;
  const d=drawing(w,h,'保留历史，也停止使用过期信息','一次纠正连接两段有效期；使用前检查会即时排除过期记录，无须等待后台维护。',p);
  d.text(32,42,'03 / VALIDITY & TIME',13,p.muted,500);d.text(32,84,'记忆存在，不代表仍然有效',mobile?23:30,p.ink,600);
  const left=mobile?32:48,right=w-32,change=mobile?210:424;
  d.text(left,142,'A / 一次明确纠正前后',19,p.ink,600);
  d.line(`M${left} 197H${right}`,true);d.dot(change,197);d.text(change,181,'纠正时刻',16,p.blue,500,'middle');
  d.box(left,226,change-left-8,60);d.text(left+14,263,'旧偏好',20,p.muted,500);
  d.box(change+8,305,right-change-8,60,true);d.text(change+22,342,'新偏好',20,p.blue,500);
  d.line(`M${change} 202V385`,false,true);d.text(left,410,'旧记录保留在历史中，新记录接续生效。',mobile?17:19,p.muted);
  const y=mobile?486:466;d.text(left,y,'B / 到期检查不等待后台维护',mobile?18:19,p.ink,600);
  const times=mobile?[68,220,368]:[130,420,710];
  d.line(`M${left} ${y+69}H${right}`,true);
  ['10:00','10:30','11:00'].forEach((t,i)=>{d.dot(times[i],y+69);d.text(times[i],y+46,t,18,p.ink,500,'middle');});
  const descriptions=mobile?[['记忆到期','停止适用'],['本轮回答','已被排除'],['后台维护','更新状态']]:[['记忆到期','停止适用'],['本轮回答前检查','已排除过期记录'],['后台维护','清理或更新状态']];
  descriptions.forEach(([a,b],i)=>{d.text(times[i],y+110,a,mobile?17:19,i===1?p.blue:p.ink,500,'middle');d.text(times[i],y+140,b,mobile?15:17,p.muted,400,'middle');});
  if(mobile){d.box(32,696,376,100,true);d.text(52,733,'10:30 的回答无需等到 11:00',20,p.blue,500);d.text(52,768,'使用资格会在每次选择信息时检查。',17,p.muted);}
  return {svg:d.end(),w,h};
}
const figures={'memory-relationships':relationships,'correction-flow':correction,'memory-validity':validity};
const manifest={};
for(const [name,draw] of Object.entries(figures)) {
  for(const [theme,p] of Object.entries(themes)) for(const mobile of [false,true]) {
    const {svg,w,h}=draw(mobile,p);
    const suffix=`${mobile?'-mobile':''}${theme==='dark'?'-dark':''}`;
    await writeFile(new URL(`${name}${suffix}.svg`,destination),svg);
    if(theme==='light'&&!mobile){
      await sharp(Buffer.from(svg)).resize(w*2,h*2).png().toFile(new URL(`${name}.png`,destination).pathname);
      manifest[name]={width:w,height:h,mobileWidth:440,mobileHeight:draw(true,p).h};
    }
  }
}
await writeFile(new URL('manifest.json',destination),JSON.stringify(manifest,null,2)+'\n');
console.log('Generated 3 figures: desktop/mobile SVGs in two themes, plus PNG exports.');
