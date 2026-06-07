export type ClientOs = "macos" | "windows" | "linux" | "unknown";
export type ClientArch = "arm64" | "x64" | "unknown";

/** Client Hints（部分浏览器）；TS 内置 Navigator 类型未必包含。 */
type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    getHighEntropyValues: (
      hints: string[],
    ) => Promise<{ architecture?: string; platform?: string }>;
  };
};

export function detectOsSync(): ClientOs {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) {
    if (/iPhone|iPad|iPod/i.test(ua)) return "unknown";
    return "macos";
  }
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "linux";
  return "unknown";
}

/**
 * 尽量识别本机 CPU 架构；无法确定时返回 unknown（由用户自行选择）。
 */
export async function detectArchAsync(): Promise<ClientArch> {
  if (typeof navigator === "undefined") return "unknown";

  try {
    const ud = (navigator as NavigatorWithUAData).userAgentData;
    if (ud?.getHighEntropyValues) {
      const h = await ud.getHighEntropyValues(["architecture", "platform"]);
      if (h.architecture === "arm" || h.architecture === "aarch64") return "arm64";
      if (h.architecture === "x86" || h.architecture === "amd64") return "x64";
      if (h.platform === "macOS" && h.architecture) {
        /* covered above */
      }
    }
  } catch {
    /* ignore */
  }

  const ua = navigator.userAgent;

  if (/Windows/i.test(ua)) {
    if (/ARM64|aarch64|ARM;/.test(ua)) return "arm64";
    if (/Win64|x64|WOW64/i.test(ua)) return "x64";
    return "unknown";
  }

  if (/Mac OS X|Macintosh/i.test(ua)) {
    if (/Intel Mac OS X/i.test(ua)) return "x64";
    return "arm64";
  }

  if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
    if (/aarch64|arm64|armv8/i.test(ua)) return "arm64";
    if (/x86_64|x64/i.test(ua)) return "x64";
  }

  return "unknown";
}
