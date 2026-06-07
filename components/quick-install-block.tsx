"use client";

import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { Messages } from "@/lib/i18n/messages";

const DesktopDownloadPicker = dynamic(
  () => import("@/components/desktop-download-picker").then((m) => m.DesktopDownloadPicker),
  {
    ssr: false,
    loading: () => (
      <div className="quick-start-desktop-loading" role="status">
        …
      </div>
    ),
  },
);

type D = Messages["landing"]["download"];
type ShellPlatform = "unix" | "windows";
type Method = "oneliner" | "npm" | "macos" | "windows" | "linux";
type CopiedKey = "oneliner" | "npm" | "onboard" | null;
type DesktopPlatform = "macos" | "windows" | "linux";

const DESKTOP_METHODS = new Set<Method>(["macos", "windows", "linux"]);

function detectShellPlatform(): ShellPlatform {
  if (typeof navigator === "undefined") return "unix";
  return /Win/i.test(navigator.userAgent) ? "windows" : "unix";
}

function isDesktopMethod(method: Method): method is DesktopPlatform {
  return DESKTOP_METHODS.has(method);
}

function CopyButton({
  label,
  copiedLabel,
  copied,
  onCopy,
}: {
  label: string;
  copiedLabel: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      className="quick-start-copy"
      onClick={onCopy}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <Check className="quick-start-copy-ic" strokeWidth={2} aria-hidden />
      ) : (
        <Copy className="quick-start-copy-ic" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}

function CodeLine({
  prompt,
  command,
  copyLabel,
  copiedLabel,
  copied,
  onCopy,
}: {
  prompt: string;
  command: string;
  copyLabel: string;
  copiedLabel: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="quick-start-code-row">
      <code className="quick-start-code">
        <span className="quick-start-prompt" aria-hidden>
          {prompt}
        </span>{" "}
        {command}
      </code>
      <CopyButton label={copyLabel} copiedLabel={copiedLabel} copied={copied} onCopy={onCopy} />
    </div>
  );
}

export function QuickInstallBlock({
  d,
  compact = false,
}: {
  d: D;
  compact?: boolean;
}) {
  const [platform, setPlatform] = useState<ShellPlatform>("unix");
  const [method, setMethod] = useState<Method>("oneliner");
  const [copied, setCopied] = useState<CopiedKey>(null);

  useEffect(() => {
    setPlatform(detectShellPlatform());
  }, []);

  const onelinerCommand =
    platform === "unix" ? d.quickInstallUnixCommand : d.quickInstallWindowsCommand;
  const onelinerPrompt = platform === "unix" ? "$" : "PS>";

  const copy = useCallback(async (key: Exclude<CopiedKey, null>, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const showPlatformToggle = method === "oneliner";

  const methodTabs: { id: Method; label: string }[] = [
    { id: "oneliner", label: d.methodOneLiner },
    { id: "npm", label: d.methodNpm },
    { id: "macos", label: d.platformNames.macos },
    { id: "windows", label: d.platformNames.windows },
    { id: "linux", label: d.platformNames.linux },
  ];

  return (
    <div className={`quick-start-block${compact ? " quick-start-block--compact" : ""}`}>
      <div className="quick-start-heading">
        <span className="quick-start-heading-prompt" aria-hidden>
          &gt;
        </span>{" "}
        {d.quickStartHeading}
      </div>

      <div className="quick-start-window">
        <div className="quick-start-titlebar">
          <div className="quick-start-dots" aria-hidden>
            <span className="quick-start-dot quick-start-dot--red" />
            <span className="quick-start-dot quick-start-dot--yellow" />
            <span className="quick-start-dot quick-start-dot--green" />
          </div>

          <div className="quick-start-method-tabs" role="tablist" aria-label={d.methodTabsAria}>
            {methodTabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`quick-start-tab-${id}`}
                aria-selected={method === id}
                aria-controls="quick-start-panel"
                className={`quick-start-method-tab${method === id ? " quick-start-method-tab--active" : ""}`}
                onClick={() => setMethod(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {showPlatformToggle ? (
            <div
              className="quick-start-platform-tabs"
              role="tablist"
              aria-label={d.quickInstallTabsAria}
            >
              <button
                type="button"
                role="tab"
                id="quick-start-platform-unix"
                aria-selected={platform === "unix"}
                className={`quick-start-platform-tab${platform === "unix" ? " quick-start-platform-tab--active" : ""}`}
                onClick={() => setPlatform("unix")}
              >
                {d.quickInstallUnixTab}
              </button>
              <button
                type="button"
                role="tab"
                id="quick-start-platform-windows"
                aria-selected={platform === "windows"}
                className={`quick-start-platform-tab${platform === "windows" ? " quick-start-platform-tab--active" : ""}`}
                onClick={() => setPlatform("windows")}
              >
                {d.quickInstallWindowsTab}
              </button>
            </div>
          ) : (
            <span className="quick-start-titlebar-spacer" aria-hidden />
          )}
        </div>

        <div className="quick-start-body" id="quick-start-panel" role="tabpanel">
          {method === "oneliner" ? (
            <>
              <p className="quick-start-comment">{d.quickInstallComment}</p>
              <CodeLine
                prompt={onelinerPrompt}
                command={onelinerCommand}
                copyLabel={`${d.copy}: ${onelinerCommand}`}
                copiedLabel={`${d.copied}: ${onelinerCommand}`}
                copied={copied === "oneliner"}
                onCopy={() => void copy("oneliner", onelinerCommand)}
              />
            </>
          ) : null}

          {method === "npm" ? (
            <>
              <p className="quick-start-comment">{d.npmQuickComment}</p>
              <CodeLine
                prompt="$"
                command={d.npmCommand}
                copyLabel={`${d.copy}: ${d.npmCommand}`}
                copiedLabel={`${d.copied}: ${d.npmCommand}`}
                copied={copied === "npm"}
                onCopy={() => void copy("npm", d.npmCommand)}
              />
              <div className="quick-start-npm-onboard">
                <span className="quick-start-npm-label">{d.npmOnboardLabel}</span>
                <CodeLine
                  prompt="$"
                  command={d.onboardCommand}
                  copyLabel={`${d.copy}: ${d.onboardCommand}`}
                  copiedLabel={`${d.copied}: ${d.onboardCommand}`}
                  copied={copied === "onboard"}
                  onCopy={() => void copy("onboard", d.onboardCommand)}
                />
              </div>
            </>
          ) : null}

          {isDesktopMethod(method) ? (
            <div className="quick-start-desktop">
              <DesktopDownloadPicker d={d} platform={method} />
            </div>
          ) : null}
        </div>
      </div>

      {!compact && d.quickInstallFootnote.trim() ? (
        <p className="quick-start-footnote">{d.quickInstallFootnote}</p>
      ) : null}
    </div>
  );
}
