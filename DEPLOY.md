# 部署指南 · 紫米芽和六角星的港湾

> 从零开始，每一步都写清楚。大约 20 分钟。

---

## 你要准备的

| 东西 | 去哪弄 |
|------|--------|
| Cloudflare 账号 | [点此注册](https://dash.cloudflare.com/sign-up)，免费的 |
| GitHub 账号 | [点此注册](https://github.com/signup)，也是免费的 |
| Node.js | [点此下载](https://nodejs.org)，点左边 LTS 绿色大按钮，一路 Next 安装 |

---

## 第 0 步：确认工具装好

按 `Win + R`，输入 `cmd` 回车，打开黑窗口。

```bash
node -v
npm install -g wrangler
wrangler login
```

第一条出现 `v20.x.x` 之类版本号就说明装好了。第三条会自动弹浏览器让你授权。

---

## 第 1 步：创建 D1 数据库

在黑窗口里进入项目文件夹：

```bash
cd "F:\pblf\project\第二章  车牌识别项目code\MyPresent\our-garden"
```

创建数据库：

```bash
npx wrangler d1 create our-garden-db
```

会输出一串 `database_id`，类似：

```
database_id = "477e80f5-f6b2-440e-bc0a-b33c32e11fa7"
```

去你的 `wrangler.toml` 文件里，确认这行写对了：

```toml
database_id = "你拿到的那串ID"
```

然后建表：

```bash
npx wrangler d1 execute our-garden-db --file=schema.sql
```

没报错就是成功了。

---

## 第 2 步：把代码传到 GitHub

```bash
git add -A
git commit -m "上线"
git push
```

如果还没关联远程仓库，先做这一步（只做一次）：

```bash
git remote add origin https://github.com/你的用户名/our-garden.git
git push -u origin main
```

---

## 第 3 步：在 Cloudflare 部署

1. 打开 [https://dash.cloudflare.com](https://dash.cloudflare.com)，登录
2. 左侧菜单点 **Workers & Pages**
3. 点 **创建** → **Pages** → **连接到 Git**
4. 选 GitHub → 选 `our-garden` 仓库 → **开始设置**
5. 构建设置页面：
   - 构建命令：**留空**
   - 输出目录：填 **`.`**（一个英文句号）
6. 点 **保存并部署**

等 1-2 分钟，出现 `xxx.pages.dev` 链接就上线了。

---

## 第 4 步：绑定 D1 数据库

1. 点顶部 **Settings** → 左侧 **Functions**
2. 找到 **D1 database bindings**，点 **Add binding**：
   - Variable name：填 **`DB`**（大写）
   - D1 database：选 **`our-garden-db`**

---

## 第 5 步：设置密码

仍然是 Settings → **Environment variables** → Add variable：

| Variable name | Value |
|---------------|-------|
| `AUTH_PASSWORD` | 你的花园登录密码 |

> ⚠️ 必须和你打开网站时输入的密码一致。

设置完后点 **重试部署**。

---

## 第 6 步：打开看看

访问 `our-garden-xxx.pages.dev`（Cloudflare 给你的链接）。

第一次打开 → 设置密码 → 进入日记页 → 写日记、传照片、列愿望 → 全都能用就说明部署成功。

---

## 以后怎么更新？

改了代码（比如换了纪念日、加了情话），在黑窗口里：

```bash
cd "F:\pblf\project\第二章  车牌识别项目code\MyPresent\our-garden"
git add -A
git commit -m "更新内容"
git push
```

Cloudflare 会自动检测到，1-2 分钟后线上生效。

---

## 常见问题

**Q: 网站打开了但日记保存不了？**

A: 检查第 5 步的 `AUTH_PASSWORD` 有没有设，值对不对。

**Q: 照片上传失败？**

A: 图片可能太大，试试小于 2-3MB 的照片。

**Q: wrangler 命令报错？**

A: 前面加 `npx`，比如 `npx wrangler d1 create ...`

**Q: 想换域名？**

A: 项目页面 → Custom domains → 设置自定义域 → 输入你买的域名 → 按提示改 DNS。
