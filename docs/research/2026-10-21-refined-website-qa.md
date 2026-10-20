# 收敛版官网验收

日期：2026-10-21。对象：本地生产构建 `http://127.0.0.1:3100` 的中文首页、英文首页及 Ada。

## 结果

保留收敛版内容与品牌布局。浏览器响应式、视频弹窗、下载解析与实际点击、事件落库检查已完成；发现并修复了下载缺包状态和三个埋点缺口。生产构建与 Lint 通过，24 项相关自动化测试通过。

本次是桌面浏览器的响应式验收，不等同于 iOS Safari、Android Chrome 真机及应用安装验收。

## 页面与视频

| 检查 | 结果与证据 |
| --- | --- |
| 320×568、375×667、390×844、430×932、768×1024、1280×800 | 实际 `innerWidth` 与文档宽度一致，没有整页水平溢出 |
| 390 像素中文手机首屏 | 主标题、说明、下载、故事、演示入口及 Loopi 便签可见 |
| 320 像素英文页 | 无整页水平溢出，英文演示标题与入口正确 |
| 小屏、平板与 844×390 横屏视频弹窗 | 弹窗位于视口内；关闭按钮 44×44；视频按比例显示 |
| 中文 Work 完整播放 | 实际播放器 `ended=true`，时间 63.1 秒，`played` 为 `[0,63.1]` |
| 弹窗关闭 | Escape、关闭按钮、点遮罩均实际测试；播放器移除、滚动恢复，焦点回到演示按钮 |
| 英文 Work | 使用英文视频资源，时长约 68 秒；打开、播放、关闭与焦点恢复实际通过 |
| Ada 章节 | 点击“看看如何交办”后，从对应章节约 31 秒处播放，并记录 `ada-chapter-2` |
| Ada 图片 | 四张实际图片均完成加载；窄屏以可键盘聚焦的局部横向滚动区展示，没有撑宽整页 |
| 手机导航 | 打开、关闭和下载跳转通过；菜单关闭后能到达下载区域 |

原生媒体控件的完整 Tab 顺序没有通过本次自动工具稳定复现，不将其记为已通过的人工键盘遍历。已独立验证 Escape 与关闭后的焦点恢复。

## 下载

验收期间桌面版本为 `v0.0.405`，Android 为 `mobile-expo-v0.0.78`。开始时桌面发布尚在上传，只有 Linux 安装包；随后 macOS 和 Windows 包补齐。

- macOS 两个 DMG、Windows 两个 EXE、Linux 三个安装文件、Android APK 与校验文件的实际下载链最终均返回 HTTP 200 和非零文件长度。
- Linux ARM64 第一次遇到 TLS 中断，单独复核后通过。
- 页面上实际点击 macOS ARM64 与 Android 下载，客户端点击及服务端安装包请求事件均收到。
- iOS 入口打开 Apple 官方页面，标题为 `Join the XOPC beta - TestFlight - Apple`。未接受邀请、安装或登录。
- Unix 终端复制按钮显示“已复制”，对应点击事件收到。自动浏览器的虚拟剪贴板未接到页面剪贴板写入，不能据此独立确认操作系统剪贴板内容。
- 鸿蒙申请入口与准备说明存在；表单校验、去重、通知失败重试通过隔离测试，没有提交真实手机号或发送真实邀请消息。

### 修复：部分上传不能伪装成可下载

原先在 macOS 安装包尚未上传时，解析接口返回 `available` 和空数组，页面显示两条横线。

现在无匹配安装包时返回 `assets-pending`，使用 HTTP 503 与 `Cache-Control: no-store`。页面清楚提示当前平台安装包未就绪，并保留平台切换、重试、官方发布页入口。加载中也可切换平台。没有更改版本选择或将固定版本悄悄换成旧版本。

平台切换按钮最小触控高度由 38px 调整为 44px。

## 事件落库

浏览器测试以 `utm_source=qa-refined-20261021` 标记，通过实际点击后读取本地 SQLite 的聚合结果核对；没有用手工提交同名事件代替前端点击验证。

| 事件 | 实际结果 |
| --- | --- |
| `page_viewed` | 中文首页、Ada、英文首页收到；刷新产生新的浏览事件 |
| `hero_download_clicked` | 收到，点击定位到首页下载区 |
| `nav_download_clicked` | 手机菜单收到 1 次，`method=mobile-menu` |
| `ada_download_clicked` | 直接进入 Ada 后点击，收到 1 次，原页面路径保留 |
| `download_section_viewed` | 进入下载区收到；同一挂载内不随滚动重复上报 |
| `desktop_platform_selected` | Linux、Windows、macOS 均收到正确平台值 |
| `desktop_download_clicked` | macOS、arm64、v0.0.405 参数正确 |
| `android_download_clicked` | Android 版本与英文 locale 正确 |
| `ios_download_clicked` | iOS 平台与中文 locale 正确 |
| `terminal_install_clicked` | Unix 点击收到，`method=unix` |
| `film_opened` / `film_started` | Work 与 Ada 入口实际收到，中文和英文 locale 区分正确 |
| `film_completed` | 中文 Work 自然完整播放后收到 1 次；提前关闭的几次观看没有计作完成 |
| `download_started` | 实际 macOS、Android 包请求各收到 1 次，HEAD 链接探测未增加计数 |

### 修复的事件问题

1. 手机导航下载按钮未声明事件：补 `nav_download_clicked` 与 `mobile-menu` 入口信息。
2. 终端复制按钮未声明事件：补 `terminal_install_clicked`，区分 Unix 与 Windows。该事件代表点击意图，不证明安装成功。
3. 安装包 HEAD 探测会被算成下载：只为成功 GET 响应记录 `download_started`，失败请求与 HEAD 不计数。

用户代理识别另以自动化测试覆盖 Android、iPhone、iPad 与桌面，确认设备类型、locale、来源与入口字段。响应式视口测试没有伪装成真实手机用户代理。

## 自动化检查

```sh
pnpm lint
pnpm build
node --test scripts/test-beta-signups.mjs scripts/test-desktop-downloads.mjs scripts/test-website-analytics.mjs scripts/test-ios-distribution.mjs scripts/test-mobile-release.mjs
git diff --check
```

24 项测试全部通过。构建保留了已有的 runtime-download 文件追踪范围警告，本次未修改该下载运行时模块。

新增桌面下载回归覆盖部分发布、各平台资源匹配、locale、加载及错误时的恢复操作；事件回归覆盖跨路由监听、播放器计数、HEAD 排除、用户代理识别和服务端事件接受。

本地截图位于 `.docs/previews/refined-mobile-video.png` 与 `.docs/previews/refined-mobile-download.png`，该目录按仓库规则忽略，不随源码提交。
