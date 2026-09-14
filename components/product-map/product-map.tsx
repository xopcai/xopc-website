"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Play, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { XopcLogoMark } from "@/components/xopc-logo-mark";
import { docUrl, type Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import type { ProductMapMessages } from "@/lib/product-map/messages";
import { interpolate, mapGroups, mapJourneys, mapLayers, mapNodes, nodeById, type GroupId, type MapView, type NodeId } from "@/lib/product-map/model";
import { MindMap } from "./mind-map";

type Props = { locale: Locale; copy: ProductMapMessages; header: Messages["header"]; initialView: MapView; initialNode: NodeId; initialQuery: string; initialGroup: GroupId | "" };
export function ProductMap({ locale, copy: c, header, initialView, initialNode, initialQuery, initialGroup }: Props) {
  const u = c.ui;
  const [view,setView]=useState<MapView>(initialView),[selected,setSelected]=useState<NodeId>(initialNode);
  const [query,setQuery]=useState(initialQuery),[group,setGroup]=useState<GroupId | "">(initialGroup);
  const [visited,setVisited]=useState(new Set<NodeId>([initialNode]));
  const [tour,setTour]=useState<{index:number;step:number}|null>(null),[tourPicker,setTourPicker]=useState(false);
  const [detailOpen,setDetailOpen]=useState(false),[videoOpen,setVideoOpen]=useState(false);
  const detail=useRef<HTMLDialogElement>(null),video=useRef<HTMLDialogElement>(null);
  const detailContent=useRef<HTMLDivElement>(null);
  const node=nodeById(selected)!,n=c.nodes[selected];
  const params=new URLSearchParams({view,node:selected});if(query)params.set("q",query);if(group)params.set("group",group);
  const locationSuffix=`?${params.toString()}`;
  useEffect(()=>{window.history.replaceState(null,"",`/${locale}/product-map${locationSuffix}`);},[locale,locationSuffix]);
  useEffect(()=>{if(detailOpen)detail.current?.showModal();else detail.current?.close();},[detailOpen]);
  useEffect(()=>{if(videoOpen)video.current?.showModal();else video.current?.close();},[videoOpen]);
  useEffect(()=>{
    if(!detailOpen)return;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return ()=>{document.body.style.overflow=overflow;};
  },[detailOpen]);
  useEffect(()=>{detailContent.current?.scrollTo({top:0,behavior:"instant"});},[selected,detailOpen]);
  const select=(id:NodeId,open=true)=>{setSelected(id);setVisited(current=>new Set([...current,id]));if(open)setDetailOpen(true);};
  const startTour=(index:number)=>{setTour({index,step:0});setTourPicker(false);setView("map");setQuery("");const id=mapJourneys[index].ids[0];setGroup(nodeById(id)!.group);select(id,false);};
  const moveTour=(step:number)=>{if(!tour)return;const journey=mapJourneys[tour.index];if(step>=journey.ids.length){setTour(null);setGroup("");return;}const id=journey.ids[step];setTour({...tour,step});setGroup(nodeById(id)!.group);select(id,false);};
  const setMode=(mode:MapView)=>{setView(mode);setGroup("");setQuery("");setTour(null);setTourPicker(false);};
  const matching=mapNodes.filter(item=>{if(group&&item.group!==group)return false;const text=c.nodes[item.id];return `${item.id} ${text.title} ${text.description} ${text.features.join(" ")}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale));});
  const card=(id:NodeId)=>{const item=nodeById(id)!,text=c.nodes[id];return <button key={id} className={`pm-card ${id===selected?"is-selected":""}`} onClick={()=>select(id)} aria-pressed={id===selected}>
    <span className="pm-card-title">{text.title}<ArrowUpRight size={15}/></span><p>{text.description}</p><div className="pm-card-meta">{item.status!=="available"?<span>{u[item.status]}</span>:null}{visited.has(id)?<Check size={13} aria-label={u.available}/>:null}</div>
  </button>;};
  const sourceLocale=locale==="zh"&&node.docLocale==="localized"?"zh":"en";
  // Design documents are linked to their repository source; public guides use the localized documentation site.
  const sourceUrl=node.source.startsWith("adr/")?`https://github.com/xopcai/xopc/blob/main/docs/${node.source}`:docUrl(sourceLocale,node.source.replace(/\.md$/,""));
  return <div className="landing-page product-atlas">
    <LandingLocaleTransition/>
    <header className="pm-header"><Link href={`/${locale}`} className="pm-brand" aria-label={u.home}><XopcLogoMark/><b>xopc</b></Link><Link href={`/${locale}`} className="pm-home"><ArrowLeft size={14}/>{u.home}</Link><span className="pm-header-title">{u.title}</span><div className="pm-header-tools">
      <LocaleSwitcher locale={locale} labelZh={header.langZh} labelEn={header.langEn} chooseLanguageLabel={header.chooseLanguage} variant="landing" locationSuffix={locationSuffix}/>
      <ThemeToggle variant="pill" ariaLight={header.themeLight} ariaDark={header.themeDark} ariaToggle={header.themeToggle}/>
      <Link className="pm-primary" href={`/${locale}#download`}>{u.download}</Link>
    </div></header>
    <main className="pm-main"><div className="pm-intro"><div><p className="pm-eyebrow">{u.eyebrow}</p><h1>{u.headline}</h1><p className="pm-intro-description">{u.description}</p></div><div className="pm-intro-actions"><button onClick={()=>setVideoOpen(true)}><Play size={16}/>{u.video}</button><button className="pm-primary" onClick={()=>{setTourPicker(value=>!value);setTour(null);}}>{u.start}<ArrowRight size={16}/></button></div></div>
      <div className="pm-workspace"><aside className="pm-sidebar"><label className="pm-search"><Search size={17}/><input type="search" aria-label={u.searchLabel} placeholder={u.search} value={query} onChange={event=>{setQuery(event.target.value);setView("catalog");setTourPicker(false);setTour(null);}}/></label><div className="pm-groups" aria-label={u.all}><button className={!group?"is-active":""} onClick={()=>{setGroup("");setQuery("");setTour(null);setTourPicker(false);}}>{u.all}<span>{mapNodes.length}</span></button>{mapGroups.map(g=><button className={group===g.id?"is-active":""} key={g.id} onClick={()=>{setGroup(g.id);setView("map");setQuery("");setTour(null);setTourPicker(false);}}><small>{g.number}</small>{c.groups[g.id].title}<span>{g.ids.length}</span></button>)}</div><p className="pm-progress">{interpolate(u.progress,{count:visited.size,total:mapNodes.length})}</p><progress value={visited.size} max={mapNodes.length} aria-label={u.all}/></aside>
      <div className="pm-content"><div className="pm-view-switch" role="group" aria-label={u.views}>{(["map","mindmap","architecture","catalog"] as const).map(mode=><button key={mode} aria-pressed={view===mode} onClick={()=>setMode(mode)}>{u[mode]}</button>)}</div>
      {tourPicker?<section className="pm-tour-picker"><h2>{u.chooseJourney}</h2><p>{u.journeyDescription}</p><div>{mapJourneys.map((journey,index)=><button key={journey.id} onClick={()=>startTour(index)}><strong>{c.journeys[journey.id].title}<ArrowUpRight size={16}/></strong><p>{c.journeys[journey.id].description}</p></button>)}</div></section>:null}
      {tour?<section className="pm-tour" aria-live="polite"><div><strong>{c.journeys[mapJourneys[tour.index].id].title}</strong><span>{interpolate(u.step,{current:tour.step+1,total:mapJourneys[tour.index].ids.length})}</span><button aria-label={u.end} onClick={()=>{setTour(null);setGroup("");}}><X size={17}/></button></div><h2>{n.title}</h2><p>{n.description}</p><div className="pm-buttons"><button disabled={tour.step===0} onClick={()=>moveTour(tour.step-1)}><ArrowLeft size={15}/>{u.previous}</button><button onClick={()=>select(selected)}>{u.detail}</button><button className="pm-primary" onClick={()=>moveTour(tour.step+1)}>{tour.step===mapJourneys[tour.index].ids.length-1?u.finish:u.next}<ArrowRight size={15}/></button></div></section>:null}
      {view==="mindmap"?<MindMap copy={c} selected={selected} onSelect={select}/>:view==="architecture"?<div className="pm-architecture">{mapLayers.map((ids,index)=><section key={index}><span className="pm-eyebrow">0{index+1}</span><h2>{c.layers[index].title}</h2><p>{c.layers[index].description}</p><div className="pm-chips">{ids.map(id=><button key={id} onClick={()=>select(id)}>{c.nodes[id].title}<ArrowUpRight size={14}/></button>)}</div>{index<mapLayers.length-1?<span className="pm-layer-arrow" aria-hidden="true">↓</span>:null}</section>)}<p>{u.architectureNote}</p></div>:<>
      {query?<p className="pm-result-count" role="status">{interpolate(u.results,{count:matching.length})}<button onClick={()=>setQuery("")}>{u.clear}</button></p>:null}
      {matching.length===0?<p className="pm-empty">{u.empty}</p>:mapGroups.filter(g=>!group||g.id===group).map((g,index)=>{const ids=g.ids.filter(id=>matching.some(item=>item.id===id));return ids.length?<section key={g.id} className={`pm-map-group ${view==="catalog"?"pm-catalog":""}`} style={{"--group-color":g.color} as CSSProperties}>
        {!group&&index===4?<p className="pm-support-label">{u.support}</p>:null}<div className="pm-group-heading"><span>{g.number}</span><h2>{c.groups[g.id].title}</h2><small>{interpolate(u.count,{count:ids.length})}</small></div><p className="pm-group-description">{c.groups[g.id].description}</p><div className="pm-card-grid">{ids.map(card)}</div>
      </section>:null;})}</>}
      </div></div><footer className="pm-footer"><p>{u.updated}</p><Link href={`/${locale}#download`}>{u.download}<ArrowUpRight size={14}/></Link></footer>
    </main>
    <dialog className="pm-dialog pm-detail-drawer" ref={detail} onClick={event=>{
      if(event.target!==event.currentTarget)return;
      const rect=event.currentTarget.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)setDetailOpen(false);
    }} onClose={()=>setDetailOpen(false)} aria-labelledby="pm-detail-title"><div className="pm-dialog-head"><span className={`pm-status pm-status-${node.status}`}>{u[node.status]}</span><button aria-label={u.close} onClick={()=>setDetailOpen(false)}><X/></button></div><div className="pm-dialog-scroll" ref={detailContent}><p className="pm-eyebrow">{c.groups[node.group].title}</p><h2 id="pm-detail-title">{n.title}</h2><p className="pm-detail-description">{n.description}</p><h3>{u.capabilities}</h3><ul className="pm-features">{n.features.map(text=><li key={text}>{text}</li>)}</ul><h3>{u.path}</h3><ol className="pm-steps">{n.steps.map((text,index)=><li key={text}><span>{index+1}</span>{text}</li>)}</ol><section className="pm-boundary"><h3>{u.boundary}</h3><p>{n.boundary}</p></section><h3>{u.related}</h3><div className="pm-chips">{node.related.map(id=><button key={id} onClick={()=>select(id)}>{c.nodes[id].title}<ArrowUpRight size={14}/></button>)}</div></div><div className="pm-dialog-footer"><a href={sourceUrl} target="_blank" rel="noopener noreferrer"><BookOpen size={16}/>{locale==="zh"&&sourceLocale==="en"?u.englishDocs:u.docs}<ArrowUpRight size={14}/></a></div></dialog>
    <dialog className="pm-dialog pm-video-dialog" ref={video} aria-labelledby="pm-video-title" onClose={()=>{setVideoOpen(false);video.current?.querySelector("video")?.pause();}}><div className="pm-dialog-head"><h2 id="pm-video-title">{u.videoTitle}</h2><button aria-label={u.close} onClick={()=>setVideoOpen(false)}><X/></button></div><video src="/media/product/xopc-desktop.mp4" controls playsInline preload="none" aria-label={u.videoTitle}/><p>{u.videoNote}</p></dialog>
  </div>;
}
