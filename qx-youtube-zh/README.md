# YouTube 韩/英等已有字幕 → Azure 简体中文（Quantumult X）

此项目用于 QX 拦截 YouTube App 的 \`www.youtube.com/api/timedtext\` **字幕响应**并把字幕文本发送到 Azure AI Translator 翻译为简体中文。翻译失败会保留原有字幕，不会把原字幕请求修改成另一条请求。

> 该方案需要已有字幕轨道（包含自动生成的字幕）；不会凭空识别视频语音，也不保证所有 YouTube 版本都使用此接口。

## 先注册 Azure Translator（F0）

1. 在 https://portal.azure.com 创建单独的 **Translator** 资源。
2. Region 选 **Global**，Pricing tier 选 **F0**。Azure 平台可能要求绑定付款方式，务必确认资源选择的是 F0。
3. 进入资源的 **Keys and Endpoint** 页面，复制 KEY 1。**切勿把 API Key 上传到 GitHub 或发送给别人。**

## 一次性在手机 QX 本地保存密钥

打开 QX 配置文件，在已有的 \`[task_local]\` 段下添加：

\`\`\`ini
event-interaction https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-youtube-zh/azure-setup.js#key=替换为你自己的KEY1&region=global, tag=Azure字幕配置, enabled=true
\`\`\`

将“替换为你自己的KEY1”替换为自己的 Azure KEY 1（不要包含中文或尖括号）；Global 区域保持 \`region=global\`。如果 Azure 用的是区域资源，则填 \`southeastasia\` 等实际资源区域代码。

保存配置，连接 QX，进入「任务 / 交互任务」执行 \`Azure字幕配置\` 一次。出现「Azure 密钥保存成功」后**立即删除这个临时任务配置行**。URL \`#\` 后的内容不会作为 HTTP URL fragment 发送给 GitHub，但会暂时保存在 QX 本地配置文件中；不要导出或分享包含密钥的配置文件。

密钥会被保存到 QX 的 \`$prefs\` 中，主 JS 和 snippet 永远不写入密钥。

## 添加远程字幕重写

打开 QX → 重写 → 引用 → ＋，添加：

\`\`\`
https://raw.githubusercontent.com/hb1314bye-afk/gate/main/qx-youtube-zh/yt-zh-azure.snippet
\`\`\`

启用重写、MitM；请先关闭原有 \`Yt-zh.snippet\`、\`yt-zh-onefile.snippet\`、\`yt-zh-safe.snippet\`，避免规则冲突。

用 YouTube App 打开带「韩语（自动生成）」字幕的视频，开启字幕，刷新视频。QX 日志会显示：
- \`[YT-ZH-Azure] translating ...\` 开始请求 Azure；
- \`[YT-ZH-Azure] success: ...\` Azure 成功翻译；
- \`Azure HTTP ...; original kept\` 翻译出错，保留原字幕；
- \`Azure key not configured\` 还没配置本地 KEY。

## 注意事项

- 支持 YouTube \`json3\`、常见 timedtext XML 和 WebVTT 字幕格式；依赖 YouTube App 的接口行为，仍需设备实测。
- 只发送字幕文本到 \`https://api.cognitive.microsofttranslator.com\`，不上传原请求的 Cookie 或 YouTube 视频链接。字幕会被微软处理。
- F0 免费层每月 200 万字符额度；请以 Azure 订阅及资源的实际计费设置为准。
- 对超时、429、认证错误或不支持的格式会保留原字幕。
- 可以用 \`azure-setup.js#remove=1\` 的 UI 交互任务清除本地密钥，然后删除该任务。
