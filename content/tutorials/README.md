# 官网教程交付约定

制作源位于相邻仓库 `xopc-tutorials`，本目录只保存发布索引。不要手改生成的 catalog.json 或修改已发布版本文件；先在制作源修改、审核、提升版本，再同步。

- `catalog.json`：以 `id + locale` 唯一定位当前版本，关联 `mapNodeIds`；包含视频、封面、字幕、图文资源 URL 和章节。
- `public/media/tutorials/<id>/<revision>/<locale>/`：可公开的 MP4、封面、VTT、article.json、步骤截图及完整性 manifest。
- `scripts/check-tutorials.mjs`：构建前校验引用、语言、章节时间、资源白名单及 SHA-256。

从制作库执行 `python3 scripts/sync-website.py --website ../xopc-website` 查看计划；加 `--write` 同步。同步不会部署线上。随后运行官网构建和既有部署脚本即可随官网一起发布。

语言必须明确区分：站点 zh 对应 zh-CN；站点 en 对应 en-US。当前仅有中文版，不能把 zh-CN 视频标为英文。尚无对应语言时，界面可以隐藏教程，或明确标出原视频语言。该决策应由消费组件执行，发布索引不伪造语言副本。

多个教程可覆盖同一节点；教程不一定完整覆盖节点全部能力。first-task 对应首次对话和笔记使用，不代表完整安装引导。英文字幕、配音以及未来不同产品版本使用独立语言或版本目录。

原始素材、账号配置、录制会话、完整音频源、字体和 HyperFrames 日志一律不进入 public。后续迁移至对象存储时保留相同版本路径，只更换索引中的媒体源与发布工具，避免地图链接失效。
