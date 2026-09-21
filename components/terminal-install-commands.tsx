"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Command = {
  label: string;
  value: string;
};

type Props = {
  commands: Command[];
  copyLabel: string;
  copiedLabel: string;
};

export function TerminalInstallCommands({ commands, copyLabel, copiedLabel }: Props) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
  }, []);

  const copyCommand = useCallback(async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);

      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
      }
      resetTimer.current = window.setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      /* Clipboard access can be unavailable in non-secure browser contexts. */
    }
  }, []);

  return (
    <div className="terminal-install-commands">
      {commands.map(({ label, value }) => {
        const isCopied = copiedCommand === value;

        return (
          <div className="terminal-install-command" key={label}>
            <span className="terminal-install-command-label">{label}</span>
            <div className="terminal-install-command-shell">
              <code>{value}</code>
              <button
                type="button"
                className="terminal-install-copy"
                data-copied={isCopied || undefined}
                onClick={() => void copyCommand(value)}
                aria-label={`${isCopied ? copiedLabel : copyLabel}: ${value}`}
              >
                {isCopied ? <Check aria-hidden /> : <Copy aria-hidden />}
                <span aria-live="polite">{isCopied ? copiedLabel : copyLabel}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
