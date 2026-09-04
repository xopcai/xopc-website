import { ArrowLeft, Github, Mail } from "lucide-react";
import Link from "next/link";

import { LandingLocaleTransition } from "@/components/landing-locale-transition";
import { LandingNavState } from "@/components/landing-nav-state";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoHomeLink } from "@/components/logo-home-link";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { LANDING_GITHUB_REPO } from "@/lib/landing-urls";

const contactEmail = "lyxopc.ai@gmail.com";

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalContent = {
  eyebrow: string;
  title: string;
  intro: string;
  effectiveLabel: string;
  effectiveDate: string;
  publisherLabel: string;
  publisher: string;
  contactLabel: string;
  sections: Section[];
  contactTitle: string;
  contactBody: string;
  backHome: string;
};

const privacyContent: Record<Locale, LegalContent> = {
  zh: {
    eyebrow: "xopc 移动端",
    title: "隐私政策",
    intro: "本政策说明个人开发者徐巧民发行的 xopc 移动端如何处理数据。App 免费提供，不含购买或订阅，仅连接由用户自行运行和管理的网关。",
    effectiveLabel: "生效日期",
    effectiveDate: "2026 年 9 月 4 日",
    publisherLabel: "发布者／运营主体",
    publisher: "徐巧民",
    contactLabel: "隐私和删除请求邮箱",
    backHome: "返回 xopc 首页",
    contactTitle: "联系与政策更新",
    contactBody: "重大政策变更将通过本页面、App 更新说明或 App 内提示发布。请勿在公开问题跟踪系统中提交个人内容或凭据。",
    sections: [
      {
        title: "适用范围",
        paragraphs: [
          "发布者不向 App 用户提供托管网关、App 账号或强制使用的 AI 云服务。用户选择的网关、模型及其他服务有各自的运营者、隐私政策和数据处理责任。",
        ],
      },
      {
        title: "数据及用途",
        paragraphs: [
          "设备配对向选定网关发送设备显示名称、平台和公钥，用于识别、认证和撤销设备。App 使用操作系统安全存储保存刷新凭据。",
          "消息、相关会话历史、同步的笔记、任务、文件、附件及批准的工具结果会发送到网关，用于工作区和助手功能。根据网关配置，相关内容可能交由 AI 模型、搜索、图片生成、语音转写、语音合成服务处理，或用于自动整理和定时工作。提交内容前，App 展示已配置的模型和语音接收方，包括可用备用服务，并请求用户授权。",
          "相机、照片、麦克风和联系人权限仅用于相关功能。联系人工具请求批准后返回选中或匹配的姓名、电话和邮箱。剪贴板建议默认关闭；开启后，App 会在打开或返回前台时读取剪贴板文本。主动选择“粘贴配对链接”会为该操作读取剪贴板。",
          "开启通知后，App 向网关注册 Expo 推送令牌、平台和语言。iOS 通知通过 Expo 和 Apple 推送服务发送，可能包含网关配置的内容预览。",
          "App 在设备上保存偏好设置、工作区缓存、待提交内容、授权选择及最多 200 条使用或性能事件。发行包不包含远程分析、广告或第三方崩溃上报 SDK；使用测试版期间，TestFlight 本身可能向开发者提供 Apple 收集的崩溃和测试诊断信息。",
        ],
      },
      {
        title: "服务商及传输",
        paragraphs: [
          "发布者不代用户选择或运营网关、AI、搜索、图片、语音或其他内容处理服务。用户或其网关管理员负责配置这些服务，并应查看相应服务商的隐私政策、处理地区、跨境安排、数据保存和模型训练规则。",
          "启用通知时，推送令牌和通知内容会经过 Expo Push Service 与 Apple 推送通知服务。打开 link.xopc.ai 配对页时，URL fragment 中的配对载荷不会随 HTTP 请求发送；页面不使用分析服务或第三方脚本，也不会主动读取剪贴板。托管和证书服务仍可能处理提供网页所必需的网络连接信息及运维错误日志。",
          "自建网关也可能调用云服务，代理服务可能使用下游服务商。用户配置的扩展、连接器和工具可能访问其他目的地，网关管理员应说明这些服务。在了解网关及服务商的数据规则前，请勿提交敏感内容。",
        ],
      },
      {
        title: "保存期限与训练",
        paragraphs: [
          "发布者不在自有后端保存用户的消息、笔记、文件、语音、网关凭据或 AI 内容，也不使用这些内容训练模型。设备本地数据保留至用户在 App 中删除、移除连接、清除 App 数据或卸载 App。配对网页不保存配对载荷；必要的运维错误日志按站点安全和故障处理所需期限保留。",
          "对于独立运营的网关及服务商，请向相关运营者了解其保存与训练规则。本 App 不对所有可配置服务商作出“不保存数据”或“不用于训练”的统一承诺。",
        ],
      },
      {
        title: "用户选择与删除",
        paragraphs: [
          "你可以在“设置 → 关于 → 隐私与数据共享”中撤回内容共享授权，关闭剪贴板建议和通知，并修改系统权限。撤回会阻止 App 新的内容提交，不会撤回已接收内容，也不会停止已安排的服务器工作。请另行暂停自动化和正在运行的任务。",
          "你可以在相应工作区页面删除内容，在网关撤销设备，并联系网关运营者申请删除备份或下游服务中的数据。卸载 App 不会删除远程内容。对于徐巧民控制的数据，请通过本页邮箱私下提出请求，并提供足以定位相关交互的信息；处理请求前，发布者可能合理核验你对相关账号、设备或邮箱的控制权。",
        ],
      },
    ],
  },
  en: {
    eyebrow: "xopc Mobile",
    title: "Privacy Policy",
    intro: "This policy explains how the xopc Mobile application distributed by individual developer Qiaomin Xu handles data. The app is free, contains no purchases or subscriptions, and connects only to gateways run and administered by users.",
    effectiveLabel: "Effective date",
    effectiveDate: "September 4, 2026",
    publisherLabel: "Publisher / operator",
    publisher: "Qiaomin Xu",
    contactLabel: "Privacy and deletion contact",
    backHome: "Back to xopc home",
    contactTitle: "Contact and policy updates",
    contactBody: "Material changes will be announced on this page, in app release notes, or through an in-app notice. Do not post personal content or credentials in public issue trackers.",
    sections: [
      {
        title: "Scope",
        paragraphs: [
          "The publisher does not provide app users with a hosted gateway, app account, or mandatory AI cloud service. Gateways, models, and other services selected by users have their own operators, privacy policies, and data-handling responsibilities.",
        ],
      },
      {
        title: "Data and purposes",
        paragraphs: [
          "Device pairing sends a device display name, platform, and public key to the selected gateway so it can identify, authenticate, and revoke that device. The app uses secure operating-system storage for refresh credentials.",
          "Messages, relevant conversation history, synchronized notes, tasks, files, attachments, and approved tool results are sent to the gateway to provide workspace and assistant functionality. Depending on the gateway configuration, relevant content may be processed by AI models, search, image generation, transcription, speech services, automatic organization, or scheduled work. The app displays configured model and speech recipients, including available fallbacks, before requesting permission to submit content.",
          "Camera, photo, microphone, and contact access are used for the associated features. Contact tools ask for approval and return selected or matching names, phone numbers, and email addresses. Clipboard suggestions are disabled by default; enabling them permits reading clipboard text when the app opens or returns to the foreground. Explicitly choosing “Paste pairing link” reads the clipboard for that action.",
          "If notifications are enabled, the app registers an Expo push token, platform, and language with the gateway. Push notifications pass through Expo and Apple Push Notification service on iOS and may contain previews configured by the gateway.",
          "The app keeps preferences, cached workspace content, pending submissions, consent choices, and up to 200 usage or performance events locally. The distribution build contains no remote analytics, advertising, or third-party crash-reporting SDK. TestFlight may provide Apple crash and testing diagnostics to the developer while a beta build is used.",
        ],
      },
      {
        title: "Service providers and transfers",
        paragraphs: [
          "The publisher does not select or operate the gateways, AI, search, image, speech, or other content-processing services configured by users. Users or their gateway administrators are responsible for selecting those services and reviewing each provider's privacy policy, processing locations, cross-border arrangements, retention, and model-training practices.",
          "If notifications are enabled, push tokens and notification content pass through Expo Push Service and Apple Push Notification service. When the link.xopc.ai pairing page is opened, the pairing payload in the URL fragment is not sent in the HTTP request. The page uses no analytics or third-party scripts and does not read the clipboard automatically. Hosting and certificate services may still process network connection information and operational error logs needed to serve and secure the page.",
          "A self-hosted gateway may still use cloud providers. Proxies may use downstream providers. User-configured extensions, connected services, and tools may access additional destinations; the gateway administrator is responsible for explaining those services. Do not submit sensitive content until you understand the gateway and provider practices.",
        ],
      },
      {
        title: "Retention and training",
        paragraphs: [
          "The publisher does not store users' messages, notes, files, audio, gateway credentials, or AI content on a publisher backend and does not use that content to train models. On-device data remains until the user deletes it in the app, removes a connection, clears app data, or uninstalls the app. The pairing page does not retain pairing payloads; necessary operational error logs are retained only as needed for site security and troubleshooting.",
          "For independently operated gateways and providers, contact the relevant operator for their retention and training practices. This application does not make a blanket promise that all configurable providers retain no data or never train on it.",
        ],
      },
      {
        title: "Choices and deletion",
        paragraphs: [
          "You can withdraw mobile content-sharing permission in Settings → About → Privacy and data sharing, disable clipboard suggestions and notifications, and change system permissions. Withdrawal blocks new content submissions from the app; it does not retract content already received or stop scheduled server work. Pause automations and ongoing work separately.",
          "Use the corresponding workspace screens to delete content, revoke the device on the gateway, and contact the gateway operator for backup or downstream deletion. Uninstalling the app does not delete remote content. For data controlled by Qiaomin Xu, contact the email address on this page privately and include enough information to identify the relevant interaction. The publisher may request reasonable proof that you control the affected account, device, or email address before responding.",
        ],
      },
    ],
  },
};

const supportContent: Record<Locale, LegalContent> = {
  zh: {
    eyebrow: "xopc 移动端",
    title: "支持与帮助",
    intro: "xopc 移动端连接你自己运行和管理的 xopc 网关。如果连接、配对或移动端功能遇到问题，请按本页步骤检查。",
    effectiveLabel: "适用版本",
    effectiveDate: "iOS 1.0 及以后版本",
    publisherLabel: "支持方",
    publisher: "徐巧民",
    contactLabel: "支持邮箱",
    backHome: "返回 xopc 首页",
    contactTitle: "仍然需要帮助？",
    contactBody: "来信时请说明 iOS 版本、xopc App 版本、网关版本和可复现步骤。请勿发送 API Key、访问令牌、配对链接、密码或私人内容。",
    sections: [
      {
        title: "开始连接",
        items: [
          "安装并更新你自己的 xopc 网关，确保它可通过受信任的 HTTPS 地址访问。",
          "在网关控制台打开“连接手机”，生成新的二维码或配对链接。",
          "在 App 中扫描二维码；只有一台设备时，可复制链接并选择“其他方式 → 粘贴配对链接”。",
          "核对 App 与网关显示的六位确认码，然后在网关端允许设备。",
        ],
      },
      {
        title: "常见问题",
        items: [
          "配对链接有效期为 10 分钟且只能使用一次。链接过期、已使用或重新安装 App 后，请重新生成。",
          "无法打开链接时，请确认完整复制了链接，包括 # 后的内容；也可在 App 中手动粘贴。",
          "无法连接时，请从手机网络直接访问网关 HTTPS 地址，并检查证书、反向代理、WebSocket 和网关版本。",
          "消息、上传或语音被阻止时，请查看 App 的“隐私与数据共享”说明，并确认网关支持移动端接收方披露接口。",
          "通知不可用时，请检查 iOS 通知权限、网关推送配置和设备是否仍处于已配对状态。",
        ],
      },
      {
        title: "数据与设备管理",
        paragraphs: [
          "xopc 不提供发布者托管的 App 账号。移除 App 中的连接或在网关撤销设备可终止该设备访问；工作区中的远程数据和备份由网关运营者管理。请在对应页面删除内容，或联系网关运营者处理备份与下游服务中的数据。",
          "隐私处理详情请查看 xopc 移动端隐私政策。",
        ],
      },
    ],
  },
  en: {
    eyebrow: "xopc Mobile",
    title: "Support",
    intro: "xopc Mobile connects to an xopc gateway that you run and administer. Follow these checks if you have trouble pairing, connecting, or using mobile features.",
    effectiveLabel: "Applies to",
    effectiveDate: "iOS 1.0 and later",
    publisherLabel: "Support provider",
    publisher: "Qiaomin Xu",
    contactLabel: "Support email",
    backHome: "Back to xopc home",
    contactTitle: "Still need help?",
    contactBody: "Include your iOS version, xopc app version, gateway version, and reproducible steps. Do not send API keys, access tokens, pairing links, passwords, or private content.",
    sections: [
      {
        title: "Connect your device",
        items: [
          "Install or update your own xopc gateway and make sure it is reachable through a trusted HTTPS address.",
          "Open Connect phone in the gateway console and generate a new QR code or pairing link.",
          "Scan the QR code in the app. With one device, copy the link and choose Other options → Paste pairing link.",
          "Compare the six-digit confirmation code shown by the app and gateway, then allow the device in the gateway.",
        ],
      },
      {
        title: "Common issues",
        items: [
          "A pairing link expires after 10 minutes and can be used only once. Generate another after expiry, use, or app reinstallation.",
          "If a link does not open, copy the complete link including the content after #, then paste it manually in the app.",
          "If the gateway cannot connect, open its HTTPS address directly on the phone and check its certificate, reverse proxy, WebSocket support, and gateway version.",
          "If messages, uploads, or voice are blocked, review Privacy and data sharing in the app and confirm the gateway supports mobile recipient disclosure.",
          "If notifications are unavailable, check iOS notification permission, gateway push configuration, and whether the device remains paired.",
        ],
      },
      {
        title: "Data and device management",
        paragraphs: [
          "xopc does not provide a publisher-hosted app account. Removing the connection in the app or revoking the device on the gateway ends that device's access. The gateway operator manages remote workspace data and backups. Delete content in the corresponding workspace screens or contact that operator about backups and downstream services.",
          "See the xopc Mobile Privacy Policy for details about data handling.",
        ],
      },
    ],
  },
};

export function LegalPage({ locale, messages: m, kind }: { locale: Locale; messages: Messages; kind: "privacy" | "support" }) {
  const content = (kind === "privacy" ? privacyContent : supportContent)[locale];
  const otherKindHref = `/${locale}/${kind === "privacy" ? "support" : "privacy"}`;
  const otherKindLabel = kind === "privacy"
    ? locale === "zh" ? "支持与帮助" : "Support"
    : locale === "zh" ? "隐私政策" : "Privacy Policy";

  return (
    <div className="landing-page legal-page">
      <LandingLocaleTransition />
      <LandingNavState />
      <nav>
        <div className="container nav-inner">
          <div className="nav-logo"><LogoHomeLink locale={locale} ariaLabel="xopc home" /></div>
          <div className="legal-nav-links">
            <Link href={`/${locale}`}><ArrowLeft aria-hidden />{content.backHome}</Link>
            <Link href={otherKindHref}>{otherKindLabel}</Link>
          </div>
          <div className="nav-extra">
            <div className="nav-extra-tools">
              <LocaleSwitcher locale={locale} labelZh={m.header.langZh} labelEn={m.header.langEn} chooseLanguageLabel={m.header.chooseLanguage} variant="landing" />
              <ThemeToggle variant="pill" ariaLight={m.header.themeLight} ariaDark={m.header.themeDark} ariaToggle={m.header.themeToggle} />
              <a href={LANDING_GITHUB_REPO} className="nav-github-link" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github strokeWidth={1.75} aria-hidden /></a>
            </div>
          </div>
        </div>
      </nav>

      <main className="container legal-main">
        <header className="legal-hero">
          <p className="legal-eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="legal-intro">{content.intro}</p>
          <dl className="legal-meta">
            <div><dt>{content.effectiveLabel}</dt><dd>{content.effectiveDate}</dd></div>
            <div><dt>{content.publisherLabel}</dt><dd>{content.publisher}</dd></div>
            <div><dt>{content.contactLabel}</dt><dd><a href={`mailto:${contactEmail}`}>{contactEmail}</a></dd></div>
          </dl>
        </header>

        <article className="legal-article">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items ? <ol>{section.items.map((item) => <li key={item}>{item}</li>)}</ol> : null}
              {kind === "support" && section.title === (locale === "zh" ? "数据与设备管理" : "Data and device management") ? (
                <p><Link href={`/${locale}/privacy`}>{locale === "zh" ? "阅读隐私政策" : "Read the Privacy Policy"}</Link></p>
              ) : null}
            </section>
          ))}
          <section className="legal-contact">
            <Mail aria-hidden />
            <div><h2>{content.contactTitle}</h2><p>{content.contactBody}</p><a href={`mailto:${contactEmail}`}>{contactEmail}</a></div>
          </section>
        </article>
      </main>
    </div>
  );
}
