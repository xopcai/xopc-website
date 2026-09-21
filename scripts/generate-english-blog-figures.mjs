import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const palettes = {
  light: { bg:'#fafbfc', panel:'#ffffff', ink:'#17212f', muted:'#526071', line:'#b7c4d4', blue:'#245dc5', tint:'#edf3ff' },
  dark: { bg:'#151c25', panel:'#1d2733', ink:'#e5ebf3', muted:'#aab8c9', line:'#627184', blue:'#8bb9ff', tint:'#213652' },
};
const escape = (s) => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function wrap(text, limit) {
  const lines = []; let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + word.length + 1 > limit) { lines.push(line); line = word; }
    else line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines;
}
function canvas(w,h,title,p) {
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1L6 4L1 7" fill="none" stroke="${p.line}" stroke-width="1.4"/></marker></defs><rect width="${w}" height="${h}" rx="16" fill="${p.bg}"/><g font-family="Arial,Helvetica,sans-serif">`];
  const text=(x,y,s,size=20,color=p.ink,weight=400)=>out.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${escape(s)}</text>`);
  const box=(x,y,bw,bh,accent=false)=>out.push(`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${accent?p.tint:p.panel}" stroke="${accent?p.blue:p.line}"/>`);
  const line=(path,arrow=true)=>out.push(`<path d="${path}" fill="none" stroke="${p.line}" stroke-width="2"${arrow?' marker-end="url(#arrow)"':''}/>`);
  const node=(x,y,bw,bh,title,body,accent=false)=>{
    box(x,y,bw,bh,accent);
    let baseline=y+32;
    for(const s of wrap(title,Math.floor((bw-40)/11.5))){text(x+20,baseline,s,21,accent?p.blue:p.ink,600);baseline+=27;}
    baseline+=5;
    for(const s of body.flatMap(t=>wrap(t,Math.floor((bw-40)/9.5)))){text(x+20,baseline,s,17,p.muted);baseline+=24;}
  };
  return {text,box,line,node,end:()=>out.join('')+'</g></svg>'};
}
function heading(d,tag,title,m,p){
  d.text(32,40,tag,13,p.muted,500);
  wrap(title,m?26:46).forEach((s,i)=>d.text(32,82+i*34,s,m?26:30,p.ink,600));
}
function steps(m,p,tag,title,items,footnote){
 const w=m?440:840, gap=36, top=m?165:140;
 const heights=items.map(item=>{
   const bw=w-64;
   return 55+wrap(item[0],Math.floor((bw-40)/11.5)).length*27+item[1].flatMap(t=>wrap(t,Math.floor((bw-40)/9.5))).length*24;
 });
 const footer=wrap(footnote,m?40:85);
 const h=top+heights.reduce((a,b)=>a+b,0)+gap*(items.length-1)+footer.length*23+65;
 const d=canvas(w,h,title,p);heading(d,tag,title,m,p);let y=top;
 items.forEach(([name,body,accent],i)=>{
   d.node(32,y,w-64,heights[i],name,body,accent);
   y+=heights[i];
   if(i<items.length-1){d.line(`M${w/2} ${y}V${y+gap-5}`);y+=gap;}
 });
 footer.forEach((s,i)=>d.text(32,y+42+i*23,s,16,p.muted));
 return {svg:d.end(),w,h};
}
function branches(m,p,tag,title,input,cases,footnote){
 const w=m?440:840,top=m?162:135, inputH=120;
 const bw=m?344:(w-64-24*(cases.length-1))/cases.length;
 const heights=cases.map(([name,body])=>55+wrap(name,Math.floor((bw-40)/11.5)).length*27+body.flatMap(t=>wrap(t,Math.floor((bw-40)/9.5))).length*24);
 const boxH=Math.max(...heights),start=top+inputH+60;
 const footer=wrap(footnote,m?41:86);
 const footerHeight=footer.length*23+50;
 const h=m?start+heights.reduce((a,b)=>a+b,0)+(cases.length-1)*28+footerHeight:start+boxH+footerHeight;
 const d=canvas(w,h,title,p);heading(d,tag,title,m,p);
 d.node(32,top,w-64,inputH,input[0],input[1],true);
 if(m){
   const ys=[];let y=start;for(const bh of heights){ys.push(y);y+=bh+28;}
   d.line(`M220 ${top+inputH}V${top+inputH+24}H20V${ys.at(-1)+40}`,false);
   cases.forEach(([name,body,accent],i)=>{d.line(`M20 ${ys[i]+40}H62`);d.node(64,ys[i],344,heights[i]+5,name,body,accent);});
 }else{
   const center=(i)=>32+i*(bw+24)+bw/2;
   d.line(`M420 ${top+inputH}V${start-28}`,false);
   d.line(`M${center(0)} ${start-28}H${center(cases.length-1)}`,false);
   cases.forEach(([name,body,accent],i)=>{d.line(`M${center(i)} ${start-28}V${start-4}`);d.node(32+i*(bw+24),start,bw,boxH,name,body,accent);});
 }
 footer.forEach((s,i)=>d.text(32,h-footer.length*23-20+i*23,s,16,p.muted));
 return {svg:d.end(),w,h};
}
function relations(m,p){
 const w=m?440:840,h=m?1095:745,d=canvas(w,h,'Evidence and understanding',p);
 heading(d,'01 / MEMORY MODEL','Evidence and understanding',m,p);
 const labels=[['User assertions','Identity, habits, preferences'],['Goals','Outcomes to work toward'],['Current priorities','What matters in this period'],['Collaboration rules','How to work; action boundaries'],['Working knowledge','Project facts and decisions']];
 if(m){
  d.node(32,160,376,114,'Source evidence',['Conversations and references']);
  d.line('M220 274V300H18V864',false);
  labels.forEach(([a,b],i)=>{const y=325+i*119;d.line(`M18 ${y+45}H62`);d.node(64,y,330,98,a,[b]);d.line(`M394 ${y+45}H420`,false);});
  d.line('M420 370V970H220V986');
  d.node(32,990,376,82,'Select for this answer',[],true);
 }else{
  d.node(32,313,230,130,'Source evidence',['Conversations','and references']);
  d.line('M262 378H298V194',false);d.line('M298 378V574',false);
  labels.forEach(([a,b],i)=>{const y=150+i*95;d.line(`M298 ${y+44}H338`);d.node(340,y,400,83,a,[b]);d.line(`M740 ${y+44}H784`,false);});
  d.line('M784 194V637H420V659');
  d.node(32,663,776,64,'Select for this answer',[],true);
 }
 return {svg:d.end(),w,h};
}
function pairs(m,p){
 const cases=[
  ['Call + later result',['test-1 matches test-1','Keep the completed pair.'],true],
  ['Call without a result',['patch-1 has no result','Remove the orphan call.'],false],
  ['Result without a call',['No call for stale-1','Remove the orphan result.'],false],
 ];
 return branches(m,p,'02 / TOOL CALL PAIRING','What enters the next turn',['Scan calls and results',['Match by ID; the result must follow its call.']],cases,'Removing a record from model input does not undo the action.');
}
function validity(m,p){
 const w=m?440:840,h=m?840:600,d=canvas(w,h,'Validity is checked before use',p);
 heading(d,'01 / VALIDITY & TIME','Validity is checked before use',m,p);
 d.text(32,m?177:144,'A / An explicit correction',20,p.ink,600);
 const left=40,right=w-40,mid=w/2,y=m?232:195;
 d.line(`M${left} ${y}H${right}`);
 d.line(`M${mid} ${y}V${y+196}`,false);
 d.text(mid-49,y-16,'Correction',17,p.blue,500);
 d.box(left,y+26,mid-left-8,67);d.text(left+15,y+67,'Old value',19,p.muted);
 d.box(mid+8,y+116,right-mid-8,67,true);d.text(mid+22,y+158,'New value',19,p.blue);
 d.text(32,y+232,'Old record retained; new value takes effect.',m?17:20,p.muted);
 d.text(32,y+297,'B / Expiry does not wait for maintenance',m?18:20,p.ink,600);
 const ty=y+346;d.line(`M40 ${ty}H${w-40}`);
 const labels=[['10:00','Expires'],['10:30','Excluded'],['11:00','Maintenance']];
 labels.forEach(([time,label],i)=>{const x=40+i*(w-160)/2;d.text(x,ty-16,time,m?18:21,p.ink,500);d.text(x,ty+35,label,m?15:18,i===1?p.blue:p.muted);});
 if(m){d.text(32,ty+96,'The answer at 10:30 already excludes',17,p.muted);d.text(32,ty+121,'the record, before maintenance runs.',17,p.muted);}
 return {svg:d.end(),w,h};
}
const definitions=[
 {slug:'when-memory-changes',number:'01',cover:['When you change your mind','How a personal agent','updates its memory'],subtitle:'Identity, corrections, expiry, and selection',labels:['Old value','Correction','New value'],figures:{
  'memory-relationships':relations,
  'correction-flow':(m,p)=>branches(m,p,'01 / RECONCILIATION','One preference, different outcomes',['Resolve the same fact slot',['Subject, attribute, and scope identify the slot.']],[
   ['Explicit correction',['Value changes','Validate authority and target.','Create a new record; archive the old one.'],true],
   ['Repeated value',['Value stays the same','Reuse the record.','Add supporting evidence.'],false],
   ['Different value',['No explicit correction','Compare authority.','Review or flag conflicts when replacement is not justified.'],false],
  ],'An explicit correction with the same value reuses the record. These are typical single-value paths.'),
  'memory-validity':validity,
 }},
 {slug:'history-is-not-context',number:'02',cover:['Why chat history','isn’t the same as','model context'],subtitle:'Tool pairs, screenshots, and compaction checkpoints',labels:['Stored history','Preparation','Model context'],figures:{
  'history-projection':(m,p)=>branches(m,p,'02 / HISTORY PROJECTION','One history, different readers',['Stored transcript records',['Messages, tool results, metadata, and checkpoints']],[
   ['For display',['Read according to display rules.','Show the conversation to people.'],false],
   ['For the model',['Read messages and checkpoints.','Then pair tools and filter browser images.'],true],
  ],'These are views of the same records, not two independently edited histories.'),
  'tool-pairs':pairs,
  'compaction-boundary':(m,p)=>steps(m,p,'02 / COMPACTION BOUNDARY','Resume from the latest checkpoint',[
   ['01 / Read checkpoint A',['Replace current output with A.messages.','The snapshot carries the history it retains.']],
   ['02 / Later, read checkpoint B',['Replace current output with B.messages.','Do not re-append A or older raw messages.']],
   ['03 / Read newer messages',['Final context: B.messages + newer messages.','Then check tool pairs and browser images.'],true],
  ],'A valid structure does not prove the summary preserved every important detail.'),
 }},
 {slug:'what-an-approval-allows',number:'03',cover:['What does clicking “Allow”','actually authorize?'],subtitle:'Specific actions, one-time approval, and execution outcomes',labels:['Pending','Approved','Used ≠ succeeded'],figures:{
  'policy-gates':(m,p)=>steps(m,p,'03 / EXECUTION POLICY','Check policy before confirmation',[
   ['Is the connector enabled?',['Disabled → deny.']],
   ['Are the agent and account allowed?',['Outside the allowed set → deny.']],
   ['Is the action within the scope ceiling?',['Excessive scope or unmet action requirements → deny.']],
   ['Does this invocation require confirmation?',['Required but not confirmed → wait for approval.'],true],
  ],'Confirmation satisfies the final condition; it cannot override earlier denials.'),
  'approval-binding':(m,p)=>branches(m,p,'03 / APPROVAL BINDING','Approval covers this request',['Check identity and action first',['Then hash arguments + account + available objective scope.']],[
   ['Only key order changes',['Sort object keys recursively.','The fingerprint stays the same.','Still check state and expiry.'],true],
   ['Recipient or body changes',['Actual values differ.','The fingerprint changes.','The old approval cannot be reused.'],false],
  ],'The fingerprint checks consistency. It does not judge semantic similarity.'),
  'approval-lifecycle':(m,p)=>steps(m,p,'03 / APPROVAL & EXECUTION','Approved is not yet completed',[
   ['pending / Waiting for a decision',['The user can approve or deny.']],
   ['approved / Permission granted',['Match the request and check expiry.']],
   ['consumed / Approval used',['Consume approval in a local write transaction.'],true],
   ['External execution',['Continue policy checks and attempt the service call.']],
   ['Success, error, or an uncertain outcome',['External failure does not automatically restore approval.']],
  ],'After a timeout, the external facts still need to be checked.'),
 }},
];
async function cover(directory,article){
 const p=palettes.light,d=canvas(1200,630,article.cover.join(' '),p);
 d.text(64,66,'INSIDE XOPC / '+article.number,20,p.muted,500);
 article.cover.forEach((s,i)=>d.text(64,143+i*60,s,article.number==='03'?46:48,p.ink,600));
 d.text(64,333,article.subtitle,23,p.muted);
 article.labels.forEach((s,i)=>{const x=64+i*370;d.box(x,397,332,124,i===2);d.text(x+22,468,s,27,i===2?p.blue:p.ink,500);if(i<2)d.line(`M${x+336} 459H${x+361}`);});
 d.text(64,584,'xopc · Personal agent engineering',18,p.muted);
 const svg=d.end();await writeFile(new URL('cover.svg',directory),svg);
 await sharp(Buffer.from(svg)).png().toFile(new URL('cover.png',directory).pathname);
}
for(const article of definitions){
 const directory=new URL(`../content/blog/${article.slug}/images/en/`,import.meta.url);
 await mkdir(directory,{recursive:true});const manifest={};
 for(const [name,draw] of Object.entries(article.figures)){
  for(const [theme,palette] of Object.entries(palettes)){
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
 await writeFile(new URL('manifest.json',directory),JSON.stringify(manifest,null,2)+'\n');await cover(directory,article);
}
console.log('Generated nine English diagrams, mobile/theme variants, and three English covers.');
