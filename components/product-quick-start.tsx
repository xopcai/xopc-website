"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

type Step = {
  label: string;
  title: string;
  body: string;
  command: string;
};

type Props = {
  kicker: string;
  title: string;
  desc: string;
  copy: string;
  copied: string;
  steps: Step[];
};

export function ProductQuickStart({ kicker, title, desc, copy, copied, steps }: Props) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const onCopy = useCallback(async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      window.setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      /* Clipboard access is optional. */
    }
  }, []);

  return (
    <section className="product-get-started" id="get-started">
      <div className="container">
        <div className="product-section-header">
          <p className="product-kicker">{kicker}</p>
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
        <ol className="product-start-grid">
          {steps.map((step, index) => {
            const isCopied = copiedCommand === step.command;
            return (
              <li className="product-start-step" key={step.title}>
                <span className="product-step-number">0{index + 1} · {step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <div className="product-command">
                  <code>{step.command}</code>
                  <button
                    type="button"
                    onClick={() => void onCopy(step.command)}
                    aria-label={`${isCopied ? copied : copy}: ${step.command}`}
                  >
                    {isCopied ? <Check aria-hidden /> : <Copy aria-hidden />}
                    <span>{isCopied ? copied : copy}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
