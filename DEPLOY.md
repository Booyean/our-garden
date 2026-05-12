# 部署指南 · 紫米芽和六角星的港湾

> 这篇指南假设你是第一次接触这些工具。每一步都尽量写清楚，
> 照着做大约 20-30 分钟就能让网站上线。

---

## 你需要准备的（都是免费的）

| 东西 | 是什么 | 去哪弄 |
|------|--------|--------|
| Cloudflare 账号 | 托管网站的服务器 | [点此注册](https://dash.cloudflare.com/sign-up)（免费的） |
| GitHub 账号 | 存放代码的网盘 | [点此注册](https://github.com/signup)（也是免费的） |
| Node.js | 电脑上的命令行工具 | 往下看"第 0 步" |
| 你的花园代码 | 就是你现在这个文件夹 | 已经有了 ✅ |

---

## 第 0 步：在电脑上安装工具（只需一次）

### 0.1 安装 Node.js

1. 打开 [https://nodejs.org](https://nodejs.org)
2. 点左边的绿色大按钮「LTS」（长期支持版），下载安装包
3. 打开下载的文件，一路点「Next」→「Install」→「Finish」
4. 验证安装成功：按键盘 `Win + R`，输入 `cmd` 回车，在弹出的黑色窗口里输入：

```bash
node -v
```

如果出现一行版本号（如 `v20.11.0`），说明装好了。

### 0.2 安装 Wrangler（Cloudflare 的命令行工具）

在同一个黑色窗口里输入：

```bash
npm install -g wrangler
```

等它跑完。然后输入：

```bash
wrangler login
```

会自动弹出浏览器，点「Allow」授权即可。

> ✅ 到这里工具就准备好了。下面开始正式部署。

---

## 第 1 步：把代码传到 GitHub 上

### 1.1 安装 Git

如果你电脑上还没有 Git：[https://git-scm.com/download/win](https://git-scm.com/download/win)

下载 → 安装 → 一路 Next 即可。

### 1.2 初始化 Git 仓库

在黑色命令行窗口里，先进入到你的花园文件夹：

```bash
cd "F:\pblf\project\第二章  车牌识别项目code\MyPresent\our-garden"
```

然后一行一行输入下面三条命令：

```bash
git init
git add -A
git commit -m "我们的花园上线啦"
```

### 1.3 推送到 GitHub

1. 打开 [https://github.com/new](https://github.com/new)
2. Repository name 填：`our-garden`（其他全都不用改）
3. 点底部绿色的「Create repository」按钮
4. 页面会显示几行命令，找你刚创建的仓库地址，类似 `https://github.com/你的用户名/our-garden.git`

回到黑色窗口，输入（把 `你的用户名` 换成你的实际 GitHub 用户名）：

```bash
git remote add origin https://github.com/你的用户名/our-garden.git
git branch -M main
git push -u origin main
```

会弹出一个窗口让你登录 GitHub，点「Sign in with your browser」授权就行。

> ✅ 代码已经存在 GitHub 上了。可以去 `https://github.com/你的用户名/our-garden` 看看是不是有文件了。

---

## 第 2 步：创建数据库和图片存储

### 2.1 创建 D1 数据库（存日记、愿望清单的文字）

在黑色窗口里输入：

```bash
wrangler d1 create our-garden-db
```

等一下，屏幕上会出来一行结果，类似：

```
✅ Created database 'our-garden-db' with database_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

**重要**：把 `database_id` 后面 `'...'` 里的那串字符（`a1b2c3d4-...`）复制下来，待会儿要用。

### 2.2 建表

```bash
wrangler d1 execute our-garden-db --file=schema.sql
```

跑完后没有任何报错就是成功了。

### 2.3 创建 R2 存储桶（存照片）

```bash
wrangler r2 bucket create our-garden-photos
```

> ✅ 数据库和照片仓库都建好了。

---

## 第 3 步：修改配置文件

### 3.1 填入 database_id

用记事本打开你花园文件夹里的 `wrangler.toml` 文件。

找到这一行：

```toml
database_id = "<用实际ID替换>"
```

把 `<用实际ID替换>` 改成你在第 2 步复制的那串字符，保存关闭。

---

## 第 4 步：让网站上线

### 4.1 连接 Cloudflare 和 GitHub

1. 打开 [https://dash.cloudflare.com](https://dash.cloudflare.com)，登录
2. 左侧菜单点「Workers & Pages」
3. 点页面中间的「创建」→「Pages」→「连接到 Git」
4. 选择 GitHub → 选 `our-garden` 仓库 → 点「开始设置」
5. 在「构建设置」页面：
   - 构建命令：**留空**（什么都不填）
   - 输出目录：填一个英文句号 **`.`**
6. 点「保存并部署」

等 1-2 分钟，部署完成。页面上会出现一个网址，类似：

```
our-garden-xxx.pages.dev
```

点进去看看，是不是你的花园页面出现了？🎉

### 4.2 绑定数据库和照片存储

部署完后还需要把之前创建的数据库和 R2 绑定上去：

1. 在 Cloudflare 项目页面，点顶部的「Settings」
2. 左侧菜单点「Functions」
3. 找到「D1 database bindings」→ 点「Add binding」
   - Variable name：填 `DB`（大写）
   - D1 database：选 `our-garden-db`
4. 找到「R2 bucket bindings」→ 点「Add binding」
   - Variable name：填 `R2`（大写）
   - R2 bucket：选 `our-garden-photos`

### 4.3 设置密码环境变量

还是在 Settings 页面 → Environment variables → 点「Add variable」：

| Variable name | Value |
|---------------|-------|
| `AUTH_PASSWORD` | 你设的花园密码 |

> ⚠️ 这个密码要和你在网页上第一次打开时输入的密码一样，否则日记保存等功能会报错。

设置完后，点页面顶部的「重试部署」按钮，等重新部署完成。

> ✅ 网站上线了！把 `our-garden-xxx.pages.dev` 这个链接发给她就行。

---

## 第 5 步（可选）：换个好看的域名

默认域名是 `xxx.pages.dev`，换成 `ourstory.love` 之类的更好看。

### 5.1 买个域名

- [Porkbun](https://porkbun.com) — 便宜，支持支付宝
- [Namecheap](https://namecheap.com) — 老牌域名商
- 搜索你想要的域名，买下来（一般几十块一年）

### 5.2 绑定到 Cloudflare

1. Cloudflare Pages 项目页面 → 顶部「Custom domains」→「设置自定义域」
2. 输入你买的域名（如 `ourstory.love`）
3. 它会提示你修改 DNS 记录，按提示操作：
   - 去你买域名的网站，找到 DNS 管理
   - 添加一条 CNAME 记录，指向 `our-garden-xxx.pages.dev`
4. 等 5-10 分钟，SSL 证书自动签发后就能用自定义域名访问了

---

## 以后怎么改内容？

### 改纪念日、昵称、密码提示

打开 `js/config.js`，改最上面的几个值：

```javascript
ANNIVERSARY_DATE: '2024-01-01',   // 改成你们的日子
HER_NAME: '紫米芽',                // 改成她的昵称
HIS_NAME: '六角星',               // 改成你的昵称
```

改完保存，在黑色窗口里输入：

```bash
git add -A
git commit -m "更新配置"
git push
```

Cloudflare 会自动检测到代码更新，1-2 分钟后线上就生效了。

### 写新日记 / 传照片

直接打开花园网址正常使用就行，数据会自动存到 D1 数据库里。

### 日常备份

```bash
# 导出日记数据（JSON 文件）
wrangler d1 export our-garden-db --output=backup.sql
```

---

## 常见问题

**Q: 网站打开了但日记保存不了？**

A: 检查第 4 步的 `AUTH_PASSWORD` 环境变量有没有设。

**Q: 照片上传失败？**

A: 检查第 4 步的 R2 绑定有没有添加，Variable name 必须是 `R2`（大写）。

**Q: wrangler 命令报错「command not found」？**

A: 可能是没有全局安装。试试：

```bash
npx wrangler d1 create our-garden-db
```

**Q: 想换一个域名怎么办？**

A: 在第 5 步的地方添加新域名即可，Cloudflare 支持同时绑定多个域名。
