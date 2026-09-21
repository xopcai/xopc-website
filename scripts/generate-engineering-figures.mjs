import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const themes = {
  light: { bg:'#fafbfc', panel:'#ffffff', ink:'#17212f', muted:'#526071', line:'#b7c4d4', blue:'#245dc5', tint:'#edf3ff', warn:'#965332' },
  dark: { bg:'#151c25', panel:'#1d2733', ink:'#e5ebf3', muted:'#aab8c9', line:'#627184', blue:'#8bb9ff', tint:'#213652', warn:'#efb78e' },
};
const escape = (s) => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function canvas(w,h,title,p) {
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1L6 4L1 7" fill="none" stroke="${p.line}" stroke-width="1.4"/></marker></defs><rect width="${w}" height="${h}" rx="16" fill="${p.bg}"/><g font-family="PingFang SC,Microsoft YaHei,Noto Sans CJK SC,sans-serif">`];
  const text=(x,y,s,size=20,color=p.ink,weight=400)=>out.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${escape(s)}</text>`);
  const box=(x,y,bw,bh,accent=false)=>out.push(`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${accent?p.tint:p.panel}" stroke="${accent?p.blue:p.line}"/>`);
  const line=(d,arrow=true)=>out.push(`<path d="${d}" fill="none" stroke="${p.line}" stroke-width="2"${arrow?' marker-end="url(#arrow)"':''}/>`);
  const node=(x,y,bw,title,lines=[],accent=false,bh=100)=>{
    box(x,y,bw,bh,accent);text(x+20,y+34,title,21,accent?p.blue:p.ink,600);
    lines.forEach((s,i)=>text(x+20,y+65+i*25,s,17,p.muted));
  };
  return {text,box,line,node,end:()=>out.join('')+'</g></svg>'};
}
function header(d,tag,title,m,p){d.text(32,42,tag,13,p.muted,500);d.text(32,85,title,m?25:30,p.ink,600);}
function projection(m,p){
 const w=m?440:840,h=m?840:600,d=canvas(w,h,'同一份历史，不同的读取规则',p);
 header(d,'02 / HISTORY PROJECTION','记录怎样成为上下文',m,p);
 if(m){
  d.node(32,125,376,'保存的会话记录',['消息、工具结果、元数据、检查点']);
  d.line('M220 225V265',false);d.line('M220 265H22V514',false);
  d.line('M22 335H62');d.node(64,282,344,'展示给人',['按展示规则读取','保留可回看的对话内容'],false,120);
  d.line('M22 514H62');d.node(64,445,344,'提供给模型',['识别消息与压缩边界','跳过非模型记录'],true,120);
  d.line('M236 565V610');d.node(64,612,344,'继续整理',['工具调用配对','旧浏览器截图改为文字说明'],true,120);
  d.text(32,793,'模型上下文只是一种读取结果。',18,p.muted);
 }else{
  d.node(32,230,252,'保存的会话记录',['消息、工具结果','元数据、压缩检查点'],false,132);
  d.line('M284 296H320V196H358');d.line('M320 296V382H358');
  d.node(360,130,448,'展示给人',['按展示规则读取对话内容'],false,118);
  d.node(360,310,448,'提供给模型',['识别消息与压缩边界','再进行工具配对与截图筛选'],true,138);
  d.text(32,530,'原始记录没有变成两份各自修改的历史。',20,p.muted);
 }
 return {svg:d.end(),w,h};
}
function pairs(m,p){
 const w=m?440:840,h=m?970:680,d=canvas(w,h,'工具调用和结果必须配对',p);
 header(d,'02 / TOOL CALL PAIRING','哪些记录进入下一轮',m,p);
 const rows=[
 ['测试：调用 + 后续结果','test-1 ↔ test-1','保留完整配对','模型能看到测试失败',true],
 ['修改：只有调用','patch-1 → 没有结果','移除孤立调用','不把缺失结果猜成失败',false],
 ['旧结果：没有对应调用','没有调用 → stale-1','移除孤立结果','不让结果失去来源',false],
 ];
 rows.forEach(([a,b,c,e,ok],i)=>{
  if(m){const y=128+i*254;d.node(32,y,376,a,[b],false,91);d.line(`M220 ${y+91}V${y+118}`);d.node(32,y+120,376,c,[e],ok,91);}
  else{const y=143+i*150;d.node(32,y,350,a,[b]);d.line(`M382 ${y+50}H456`);d.node(458,y,350,c,[e],ok);}
 });
 d.text(32,m?936:640,'移出模型输入 ≠ 撤销已经发生的动作',m?17:20,p.muted);
 return {svg:d.end(),w,h};
}
function compaction(m,p){
 const w=m?440:840,h=m?830:660,d=canvas(w,h,'后一个压缩检查点成为新的起点',p);
 header(d,'02 / COMPACTION BOUNDARY','从最近的有效检查点继续',m,p);
 const items=[
 ['01  读到检查点 A',['当前结果替换为 A.messages'],'旧消息已由这个快照承接'],
 ['02  继续聊天，再遇到 B',['当前结果替换为 B.messages'],'不再重复拼入 A 与更早的原文'],
 ['03  读到 B 后的新消息',['最终：B.messages + 新消息'],'最后再检查工具配对和浏览器图片'],
 ];
 items.forEach(([title,lines,note],i)=>{
   const y=128+i*(m?218:158),bh=m?148:114;
   d.node(32,y,w-64,title,lines,i===2,bh);
   d.text(52,y+(m?112:94),note,m?16:17,p.muted);
   if(i<2)d.line(`M${w/2} ${y+bh}V${y+(m?207:147)}`);
 });
 if(m)d.text(32,805,'结构检查通过，不代表摘要没有遗漏。',17,p.muted);
 return {svg:d.end(),w,h};
}
function policy(m,p){
 const w=m?440:840,h=m?930:690,d=canvas(w,h,'用户确认不能覆盖本地策略拒绝',p);
 header(d,'03 / EXECUTION POLICY','先检查权限，再请求确认',m,p);
 const stages=[
 ['连接器是否启用','禁用 → 拒绝'],
 ['Agent 与账户是否允许','超出允许范围 → 拒绝'],
 ['动作是否在权限上限内','越权或不符合动作要求 → 拒绝'],
 ['策略是否要求本次确认','需要且未确认 → 等待批准'],
 ];
 stages.forEach(([title,note],i)=>{
  const y=128+i*(m?180:127);
  d.node(32,y,w-64,title,[note],i===3,m?124:91);
  if(i<3)d.line(`M${w/2} ${y+(m?124:91)}V${y+(m?169:116)}`);
 });
 d.text(32,m?883:664,'通过确认，只满足最后一道条件。',m?18:20,p.muted);
 return {svg:d.end(),w,h};
}
function binding(m,p){
 const w=m?440:840,h=m?890:670,d=canvas(w,h,'批准绑定身份和完整动作参数',p);
 header(d,'03 / APPROVAL BINDING','批准的是这一次动作',m,p);
 d.node(32,128,w-64,'先核对身份与动作',['用户 · Agent · 会话 · 连接器 · 动作', '批准关联的连接必须对应当前账户'],false,128);
 d.line(`M${w/2} 256V290`);
 d.node(32,294,w-64,'再计算参数指纹',['完整动作参数 + 账户 + 可用的任务范围','递归排序对象键 → JSON → SHA-256'],true,128);
 if(m){
  d.line('M220 422V451',false);d.line('M220 451H22V679',false);
  d.line('M22 518H62');d.node(64,466,344,'取值相同，仅键顺序变化',['指纹相同','继续检查状态与有效期'],true,124);
  d.line('M22 679H62');d.node(64,628,344,'收件人或正文发生变化',['指纹不同','不能沿用原批准'],false,124);
  d.text(32,834,'指纹比较一致性，不判断语义相似。',17,p.muted);
 }else{
  d.line('M420 422V455H222V481');d.line('M420 455H622V481');
  d.node(32,486,376,'仅对象键顺序变化',['指纹相同，继续检查状态'],true,100);
  d.node(432,486,376,'收件人或正文改变',['指纹不同，原批准不能沿用'],false,100);
  d.text(32,638,'指纹比较一致性，不判断两段话是否“差不多”。',19,p.muted);
 }
 return {svg:d.end(),w,h};
}
function lifecycle(m,p){
 const w=m?440:840,h=m?1040:735,d=canvas(w,h,'批准状态不等于外部执行结果',p);
 header(d,'03 / APPROVAL & EXECUTION','已批准，还没有执行完',m,p);
 const stages=[
 ['pending · 等待确认','用户决定；拒绝则停止'],
 ['approved · 已批准','匹配动作与参数，并检查有效期'],
 ['consumed · 已使用','在本地事务中消耗这一次批准'],
 ['外部执行','继续策略检查并尝试调用服务'],
 ];
 stages.forEach(([title,note],i)=>{
  const y=128+i*(m?166:122);
  d.node(32,y,w-64,title,[note],i===2,m?112:86);
  if(i<3)d.line(`M${w/2} ${y+(m?112:86)}V${y+(m?155:111)}`);
 });
 d.box(32,m?830:616,w-64,m?152:87);
 d.text(52,m?869:650,'返回成功 / 报错 / 结果尚不确定',m?19:22,p.warn,600);
 d.text(52,m?902:680,'批准不会因为外部失败而自动变回可用。',m?16:18,p.muted);
 if(m)d.text(52,934,'超时之后，仍需核实外部事实。',17,p.muted);
 return {svg:d.end(),w,h};
}
async function cover(directory,number,titleLines,subtitle,labels){
 const p=themes.light,d=canvas(1200,630,titleLines.join(''),p);
 d.text(64,70,`INSIDE XOPC / ${number}`,20,p.muted,500);
 titleLines.forEach((s,i)=>d.text(64,155+i*65,s,48,p.ink,600));
 d.text(64,315,subtitle,23,p.muted);
 labels.forEach((s,i)=>{const x=64+i*370;d.box(x,395,332,126,i===2);d.text(x+28,468,s,28,i===2?p.blue:p.ink,500);if(i<2)d.line(`M${x+336} 458H${x+361}`);});
 d.text(64,584,'xopc · Personal agent engineering',18,p.muted);
 const svg=d.end();
 await writeFile(new URL('cover.svg',directory),svg);
 await sharp(Buffer.from(svg)).png().toFile(new URL('cover.png',directory).pathname);
}
const articles=[
 {slug:'history-is-not-context',number:'02',title:['聊天记录还在，','为什么不能原样交给模型？'],subtitle:'工具调用配对 · 浏览器截图 · 压缩检查点',labels:['保存的记录','读取与整理','本轮上下文'],figures:{'history-projection':projection,'tool-pairs':pairs,'compaction-boundary':compaction}},
 {slug:'what-an-approval-allows',number:'03',title:['用户点了“允许”，','Agent 究竟获准做什么？'],subtitle:'具体动作 · 一次性批准 · 外部执行结果',labels:['待确认','已批准','已使用 ≠ 已成功'],figures:{'policy-gates':policy,'approval-binding':binding,'approval-lifecycle':lifecycle}},
];
for(const article of articles){
 const directory=new URL(`../content/blog/${article.slug}/images/`,import.meta.url);
 await mkdir(directory,{recursive:true});const manifest={};
 for(const [name,draw] of Object.entries(article.figures)){
  for(const [theme,palette] of Object.entries(themes)){
   for(const mobile of [false,true]){
    const result=draw(mobile,palette),suffix=(mobile?'-mobile':'')+(theme==='dark'?'-dark':'');
    await writeFile(new URL(`${name}${suffix}.svg`,directory),result.svg);
    if(theme==='light'){
      manifest[name]??={};
      Object.assign(manifest[name],mobile?{mobileWidth:result.w,mobileHeight:result.h}:{width:result.w,height:result.h});
      if(!mobile)await sharp(Buffer.from(result.svg)).resize(result.w*2).png().toFile(new URL(`${name}.png`,directory).pathname);
    }
   }
  }
 }
 await writeFile(new URL('manifest.json',directory),JSON.stringify(manifest,null,2)+'\n');
 await cover(directory,article.number,article.title,article.subtitle,article.labels);
}
console.log('Generated six article diagrams, responsive theme variants and two cover images.');
