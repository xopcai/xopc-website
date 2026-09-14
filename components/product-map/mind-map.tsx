"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Maximize2, Minus, Plus, Scan } from "lucide-react";

import { mapGroups, type GroupId, type NodeId } from "@/lib/product-map/model";
import type { ProductMapMessages } from "@/lib/product-map/messages";

type Position = { x: number; y: number; width: number };
type Item = Position & ({ kind: "group"; id: GroupId; open: boolean; color: string; count: number } | { kind: "node"; id: NodeId; color: string });
type Edge = { x1: number; y1: number; x2: number; y2: number; color: string; main?: boolean };
function layoutMap(collapsed: Set<GroupId>) {
  const items: Item[] = [], edges: Edge[] = [];
  const sides = [mapGroups.slice(4), mapGroups.slice(0, 4)];
  const totals = sides.map(groups => groups.reduce((sum, group) => sum + (collapsed.has(group.id) ? 110 : group.ids.length * 58 + 50), 0));
  const height = Math.max(580, ...totals) + 100, cy = height / 2;
  sides.forEach((groups, side) => {
    const right = side === 1; let y = (height - totals[side]) / 2;
    groups.forEach(group => {
      const open = !collapsed.has(group.id), h = open ? group.ids.length * 58 + 50 : 110;
      const x = right ? 1030 : 530, gy = y + h / 2;
      items.push({ kind: "group", id: group.id, open, x, y: gy, width: 290, count: group.ids.length, color: group.color });
      edges.push({ x1: right ? 865 : 695, y1: cy, x2: right ? x - 145 : x + 145, y2: gy, color: group.color, main: true });
      if (open) group.ids.forEach((id, index) => {
        const nx = right ? 1400 : 170, ny = y + 49 + index * 58;
        items.push({ kind: "node", id, x: nx, y: ny, width: 300, color: group.color });
        edges.push({ x1: right ? x + 145 : x - 145, y1: gy, x2: right ? nx - 150 : nx + 150, y2: ny, color: group.color });
      });
      y += h;
    });
  });
  return { items, edges, width: 1580, height, cy };
}

export function MindMap({ copy, selected, onSelect }: { copy: ProductMapMessages; selected: NodeId; onSelect: (id: NodeId) => void }) {
  const [collapsed, setCollapsed] = useState(new Set<GroupId>(mapGroups.filter(group => group.id !== "start").map(group => group.id)));
  const [wide, setWide] = useState(false);
  const [size, setSize] = useState({ width: 1000, height: 650 });
  const [transform, setTransform] = useState<{ x: number; y: number; scale: number } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const layout = useMemo(() => layoutMap(collapsed), [collapsed]);
  const scale = Math.min(1, (size.width - 32) / layout.width, (size.height - 32) / layout.height);
  const fitted = { scale, x: (size.width - layout.width * scale) / 2, y: (size.height - layout.height * scale) / 2 };
  const t = transform ?? fitted;
  const current = useRef(t);
  useEffect(() => { current.current = t; }, [t]);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      setTransform(null);
    });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const zoom = (factor: number, x = size.width / 2, y = size.height / 2) => {
    const next = Math.min(2.2, Math.max(.15, t.scale * factor));
    setTransform({ scale: next, x: x - (x - t.x) * next / t.scale, y: y - (y - t.y) * next / t.scale });
  };
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault(); const p = current.current;
      if (event.ctrlKey || event.metaKey) {
        const box = element.getBoundingClientRect(), x = event.clientX - box.left, y = event.clientY - box.top;
        const next = Math.min(2.2, Math.max(.15, p.scale * Math.exp(-event.deltaY * .008)));
        setTransform({ scale: next, x: x - (x - p.x) * next / p.scale, y: y - (y - p.y) * next / p.scale });
      } else setTransform({ ...p, x: p.x - event.deltaX, y: p.y - event.deltaY });
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, []);
  const resetBranches = (expand: boolean) => { setCollapsed(new Set(expand ? [] : mapGroups.map(g => g.id))); setTransform(null); };
  return <section className={`pm-mind ${wide ? "pm-mind-wide" : ""}`}>
    <div className="pm-mind-tools">
      <div><b>{copy.ui.mindmap}</b><span>{copy.ui.support} ← xopc → {copy.ui.primary}</span></div>
      <div className="pm-buttons">
        <button onClick={() => resetBranches(true)}>{copy.ui.expand}</button><button onClick={() => resetBranches(false)}>{copy.ui.collapse}</button>
        <button onClick={() => setTransform(null)} title={copy.ui.fit}><Scan size={16} /><span>{copy.ui.fit}</span></button>
        <button onClick={() => setWide(value => !value)} aria-pressed={wide}><Maximize2 size={16} />{wide ? copy.ui.exitWide : copy.ui.wide}</button>
      </div>
    </div>
    <div className="pm-mind-viewport" ref={viewport} tabIndex={0} aria-label={copy.ui.canvasLabel}
      onPointerDown={event => {
        if ((event.target as HTMLElement).closest("button") || event.button !== 0) return;
        drag.current = { x: event.clientX, y: event.clientY, tx: t.x, ty: t.y };event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => { if (drag.current) setTransform({ scale: t.scale, x: drag.current.tx + event.clientX - drag.current.x, y: drag.current.ty + event.clientY - drag.current.y }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const shifts: Record<string, [number, number]> = { ArrowLeft: [50,0], ArrowRight: [-50,0], ArrowUp: [0,50], ArrowDown: [0,-50] };
        const shift = shifts[event.key];
        if (shift) { event.preventDefault();setTransform({ ...t, x:t.x+shift[0],y:t.y+shift[1] }); }
        else if (["+","=","-","0"].includes(event.key)) { event.preventDefault();if(event.key === "0")setTransform(null);else zoom(event.key === "-" ? .8 : 1.25); }
        else if (event.key === "Escape") setWide(false);
      }}>
      <div className="pm-mind-world" style={{ width:layout.width,height:layout.height,transform:`translate(${t.x}px,${t.y}px) scale(${t.scale})` }}>
        <svg width={layout.width} height={layout.height} aria-hidden="true">{layout.edges.map((edge,index)=><path key={index} d={`M ${edge.x1} ${edge.y1} C ${(edge.x1+edge.x2)/2} ${edge.y1}, ${(edge.x1+edge.x2)/2} ${edge.y2}, ${edge.x2} ${edge.y2}`} fill="none" stroke={edge.color} strokeWidth={edge.main?3:1.5} opacity={edge.main?.75:.45}/>)}</svg>
        <button className="pm-root" style={{left:695,top:layout.cy-45}} onClick={()=>onSelect("onboard")}><b>xopc</b><span>{copy.ui.root}</span></button>
        {layout.items.map(item=><button key={item.id} className={`pm-mind-item ${item.kind === "group" ? "pm-branch" : "pm-leaf"} ${item.id===selected?"is-selected":""}`}
          style={{left:item.x-item.width/2,top:item.y-24,width:item.width,"--branch":item.color} as CSSProperties}
          aria-expanded={item.kind === "group" ? item.open : undefined}
          aria-pressed={item.kind === "node" ? item.id===selected : undefined}
          onFocus={event=>{const box=event.currentTarget.getBoundingClientRect(),v=viewport.current?.getBoundingClientRect();if(v&&(box.left<v.left||box.right>v.right||box.top<v.top||box.bottom>v.bottom))setTransform({...t,x:t.x+v.left+v.width/2-box.left-box.width/2,y:t.y+v.top+v.height/2-box.top-box.height/2});}}
          onClick={()=>{if(item.kind === "node")onSelect(item.id);else{setCollapsed(value=>{const next=new Set(value);if(next.has(item.id))next.delete(item.id);else next.add(item.id);return next;});setTransform(null);}}}>
          <span>{item.kind === "group"?copy.groups[item.id].title:copy.nodes[item.id].title}</span>{item.kind === "group"?<em>{item.open?"−":"+"} {item.count}</em>:null}
        </button>)}
      </div>
    </div>
    <div className="pm-mind-bottom"><p>{copy.ui.mindHint}</p><div className="pm-buttons"><button aria-label={copy.ui.zoomOut} onClick={()=>zoom(.8)}><Minus size={16}/></button><output>{Math.round(t.scale*100)}%</output><button aria-label={copy.ui.zoomIn} onClick={()=>zoom(1.25)}><Plus size={16}/></button></div></div>
  </section>;
}
