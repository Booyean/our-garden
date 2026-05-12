# 紫米芽和六角星的港湾

一个只属于两个人的私密线上空间──写日记、传照片、列愿望、藏惊喜。

---

## 给她的话

> 亲爱的紫米芽：
>
> 这是我们的小花园。在这个链接里，你可以像用普通网站一样：
>
> -   📖 **写日记**：点日历上的日期，选一个心情，写下今天想说的话
> -   📸 **传照片**：上传我们的合照，每张都能写配文
> -   🎯 **列愿望**：把想一起做的事写下来，完成后打个勾
> -   💝 **秘密惊喜**：藏在相册里，等你发现
>
> 打开网址 → 输入密码 → 就是我们的小世界了。

---

## 给你的维护说明

### 快速改配置

编辑 `js/config.js` 文件顶部：

```javascript
var APP_CONFIG = {
  SITE_TITLE: '紫米芽和六角星的港湾',   // 网站标题
  HER_NAME: '紫米芽',                   // 她的昵称
  HIS_NAME: '六角星',                   // 你的昵称
  ANNIVERSARY_DATE: '2024-01-01',      // 纪念日
  SURPRISE_PASSPHRASE: 'iloveyou',     // 触发惊喜的暗号
  // ...
};
```

### 改惊喜页情话

编辑 `js/surprise.js` 中的 `LINES` 数组：

```javascript
var LINES = [
  { text: '正在初始化连接...', delay: 600 },
  { text: '我爱你。', delay: 1200 },
  // 在这里加更多行...
];
```

### 修改密码

1. 打开你的花园网址
2. 按 F12 打开控制台
3. 输入 `localStorage.clear()` 回车
4. 刷新页面，重新设定密码

### 导出数据

每个页面底部（滚动到最下方）都有一个「📥 导出数据」按钮，点击下载 JSON 文件备份。

### 部署更新

```bash
git add -A && git commit -m "update: xxx"
git push
# Cloudflare Pages 自动部署
```

---

## 技术栈

-   前端：HTML + CSS + 原生 JS（零框架）
-   后端：Cloudflare Pages Functions
-   图片：Cloudflare D1（base64 存储）
-   数据库：Cloudflare D1 (SQLite)
-   托管：Cloudflare Pages

## 详细部署

见 [DEPLOY.md](./DEPLOY.md)
