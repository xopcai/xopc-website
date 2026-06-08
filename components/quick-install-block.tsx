"use client";

import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { DesktopPlatformId } from "@/components/desktop-download-picker";
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
type Method = "oneliner" | "npm" | "hackable" | DesktopPlatformId;
type PackageTool = "npm" | "pnpm";
type HackableTool = "installer" | "pnpm";

const DESKTOP_METHODS: DesktopPlatformId[] = ["macos", "windows", "linux"];

function isDesktopMethod(method: Method): method is DesktopPlatformId {
  return DESKTOP_METHODS.includes(method as DesktopPlatformId);
}

function detectShellPlatform(): ShellPlatform {
  if (typeof navigator === "undefined") return "unix";
  return /Win/i.test(navigator.userAgent) ? "windows" : "unix";
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

function ToolTabs<T extends string>({
  ariaLabel,
  tabs,
  active,
  onChange,
}: {
  ariaLabel: string;
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="quick-start-tool-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          className={`quick-start-tool-tab${active === id ? " quick-start-tool-tab--active" : ""}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PlatformTabs({
  ariaLabel,
  unixLabel,
  windowsLabel,
  platform,
  onChange,
}: {
  ariaLabel: string;
  unixLabel: string;
  windowsLabel: string;
  platform: ShellPlatform;
  onChange: (platform: ShellPlatform) => void;
}) {
  return (
    <div className="quick-start-platform-tabs" role="tablist" aria-label={ariaLabel}>
      <button
        type="button"
        role="tab"
        id="quick-start-platform-unix"
        aria-selected={platform === "unix"}
        className={`quick-start-platform-tab${platform === "unix" ? " quick-start-platform-tab--active" : ""}`}
        onClick={() => onChange("unix")}
      >
        {unixLabel}
      </button>
      <button
        type="button"
        role="tab"
        id="quick-start-platform-windows"
        aria-selected={platform === "windows"}
        className={`quick-start-platform-tab${platform === "windows" ? " quick-start-platform-tab--active" : ""}`}
        onClick={() => onChange("windows")}
      >
        {windowsLabel}
      </button>
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
  const [shellPlatform, setShellPlatform] = useState<ShellPlatform>("unix");
  const [method, setMethod] = useState<Method>("oneliner");
  const [packageTool, setPackageTool] = useState<PackageTool>("npm");
  const [hackableTool, setHackableTool] = useState<HackableTool>("installer");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setShellPlatform(detectShellPlatform());
  }, []);

  const onelinerCommand =
    shellPlatform === "unix" ? d.quickInstallUnixCommand : d.quickInstallWindowsCommand;
  const onelinerPrompt = shellPlatform === "unix" ? "$" : "PS>";

  const hackableCommand =
    shellPlatform === "unix" ? d.hackableUnixCommand : d.hackableWindowsCommand;
  const hackablePrompt = shellPlatform === "unix" ? "$" : "PS>";

  const npmInstallCommand = packageTool === "npm" ? d.npmCommand : d.pnpmCommand;

  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const showShellPlatformToggle =
    method === "oneliner" || (method === "hackable" && hackableTool === "installer");

  const methodTabs: { id: Method; label: string }[] = [
    { id: "oneliner", label: d.methodOneLiner },
    { id: "npm", label: d.methodNpm },
    { id: "hackable", label: d.methodHackable },
    { id: "macos", label: d.platformNames.macos },
    { id: "windows", label: d.platformNames.windows },
    { id: "linux", label: d.platformNames.linux },
  ];

  const packageToolTabs: { id: PackageTool; label: string }[] = [
    { id: "npm", label: d.npmToolNpm },
    { id: "pnpm", label: d.npmToolPnpm },
  ];

  const hackableToolTabs: { id: HackableTool; label: string }[] = [
    { id: "installer", label: d.hackableToolInstaller },
    { id: "pnpm", label: d.hackableToolPnpm },
  ];

  const titlebarSecondary =
    method === "npm" ? (
      <ToolTabs
        ariaLabel={d.npmToolTabsAria}
        tabs={packageToolTabs}
        active={packageTool}
        onChange={setPackageTool}
      />
    ) : method === "hackable" ? (
      <ToolTabs
        ariaLabel={d.hackableToolTabsAria}
        tabs={hackableToolTabs}
        active={hackableTool}
        onChange={setHackableTool}
      />
    ) : showShellPlatformToggle ? (
      <PlatformTabs
        ariaLabel={d.quickInstallTabsAria}
        unixLabel={d.quickInstallUnixTab}
        windowsLabel={d.quickInstallWindowsTab}
        platform={shellPlatform}
        onChange={setShellPlatform}
      />
    ) : (
      <span className="quick-start-titlebar-spacer" aria-hidden />
    );

  const titlebarTertiary =
    method === "hackable" && hackableTool === "installer" ? (
      <PlatformTabs
        ariaLabel={d.quickInstallTabsAria}
        unixLabel={d.quickInstallUnixTab}
        windowsLabel={d.quickInstallWindowsTab}
        platform={shellPlatform}
        onChange={setShellPlatform}
      />
    ) : null;

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

          <div className="quick-start-titlebar-actions">
            {titlebarSecondary}
            {titlebarTertiary}
          </div>
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
                command={npmInstallCommand}
                copyLabel={`${d.copy}: ${npmInstallCommand}`}
                copiedLabel={`${d.copied}: ${npmInstallCommand}`}
                copied={copied === "npm-install"}
                onCopy={() => void copy("npm-install", npmInstallCommand)}
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

          {method === "hackable" && hackableTool === "installer" ? (
            <>
              <p className="quick-start-comment">{d.hackableComment}</p>
              <CodeLine
                prompt={hackablePrompt}
                command={hackableCommand}
                copyLabel={`${d.copy}: ${hackableCommand}`}
                copiedLabel={`${d.copied}: ${hackableCommand}`}
                copied={copied === "hackable-installer"}
                onCopy={() => void copy("hackable-installer", hackableCommand)}
              />
            </>
          ) : null}

          {method === "hackable" && hackableTool === "pnpm" ? (
            <div className="quick-start-stack">
              <p className="quick-start-comment">{d.hackablePnpmComment1}</p>
              <CodeLine
                prompt="$"
                command={d.hackablePnpmCloneCommand}
                copyLabel={`${d.copy}: ${d.hackablePnpmCloneCommand}`}
                copiedLabel={`${d.copied}: ${d.hackablePnpmCloneCommand}`}
                copied={copied === "hackable-clone"}
                onCopy={() => void copy("hackable-clone", d.hackablePnpmCloneCommand)}
              />
              <CodeLine
                prompt="$"
                command={d.hackablePnpmInstallCommand}
                copyLabel={`${d.copy}: ${d.hackablePnpmInstallCommand}`}
                copiedLabel={`${d.copied}: ${d.hackablePnpmInstallCommand}`}
                copied={copied === "hackable-install"}
                onCopy={() => void copy("hackable-install", d.hackablePnpmInstallCommand)}
              />
              <p className="quick-start-comment quick-start-comment--tight">{d.hackablePnpmComment2}</p>
              <CodeLine
                prompt="$"
                command={d.hackablePnpmOnboardCommand}
                copyLabel={`${d.copy}: ${d.hackablePnpmOnboardCommand}`}
                copiedLabel={`${d.copied}: ${d.hackablePnpmOnboardCommand}`}
                copied={copied === "hackable-onboard"}
                onCopy={() => void copy("hackable-onboard", d.hackablePnpmOnboardCommand)}
              />
            </div>
          ) : null}

          {isDesktopMethod(method) ? (
            <div className="quick-start-desktop">
              <p className="quick-start-comment">{d.desktopQuickComment}</p>
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
