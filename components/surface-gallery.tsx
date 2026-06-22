"use client";

import { useState } from "react";

import { MediaPlaceholder } from "@/components/media-placeholder";
import type { Locale } from "@/lib/i18n/config";
import { LANDING_MEDIA, type SurfaceMediaId } from "@/lib/landing-media";

type SurfaceMediaSrcs = Partial<Record<SurfaceMediaId, string>>;

type SurfaceItem = {
  id: string;
  label: string;
  tag: string;
  caption: string;
  imageAlt: string;
  placeholderTitle: string;
};

type Props = {
  locale: Locale;
  titleLine1: string;
  titleLine2: string;
  desc: string;
  items: SurfaceItem[];
  placeholderAction: string;
  mediaSrcs?: SurfaceMediaSrcs;
};

const MOBILE_SURFACE_IDS = new Set(["mobile", "telegram", "wechat"]);

export function SurfaceGallery({ locale, titleLine1, titleLine2, desc, items, placeholderAction, mediaSrcs }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "tui");
  const active = items.find((item) => item.id === activeId) ?? items[0];
  const mediaId = (active?.id ?? "tui") as SurfaceMediaId;
  const slot = LANDING_MEDIA.surfaces[mediaId] ?? LANDING_MEDIA.surfaces.tui;
  const isMobileLike = MOBILE_SURFACE_IDS.has(active?.id ?? "");

  return (
    <section className="surfaces-section landing-reveal" id="channels">
      <div className="container">
        <div className="section-header surfaces-header">
          <h2>
            {titleLine1}
            <br />
            {titleLine2}
          </h2>
          <p>{desc}</p>
        </div>

        <div className="surfaces-layout">
          <div className="surfaces-tabs-wrap">
            <div className="surfaces-tabs" role="tablist" aria-label={`${titleLine1} ${titleLine2}`}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`surface-tab-${item.id}`}
                  aria-selected={activeId === item.id}
                  aria-controls={`surface-panel-${item.id}`}
                  className={`surfaces-tab${activeId === item.id ? " active" : ""}`}
                  onClick={() => setActiveId(item.id)}
                >
                  <span className="surfaces-tab-label">{item.label}</span>
                  <span className="surfaces-tab-tag">{item.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {active ? (
            <div
              key={active.id}
              className="surfaces-panel surfaces-panel-enter"
              role="tabpanel"
              id={`surface-panel-${active.id}`}
              aria-labelledby={`surface-tab-${active.id}`}
            >
              <div className={`surfaces-visual${isMobileLike ? " surfaces-visual--mobile" : ""}`}>
                <MediaPlaceholder
                  slot={slot}
                  locale={locale}
                  alt={active.imageAlt}
                  variant={isMobileLike ? "mobile" : "screenshot"}
                  placeholderTitle={active.placeholderTitle}
                  placeholderAction={placeholderAction}
                  className="surfaces-visual-img"
                  sizes={isMobileLike ? "320px" : "(max-width: 900px) 100vw, 960px"}
                  priority={active.id === items[0]?.id}
                  unoptimized
                  initialSrc={mediaSrcs?.[mediaId]}
                />
              </div>
              <p className="surfaces-caption">{active.caption}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
