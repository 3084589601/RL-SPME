# 贵州民族大学机器人实验室管理系统



物理与机电工程学院机器人实验室网页版管理系统，支持资源管理、信息展示、用户权限控制与学习追踪。



## 快速启动



```bash

npm install

npm run setup

npm run dev

```



浏览器访问：**http://localhost:3000**



## 演示账号



| 角色 | 用户名 | 密码 |

|------|--------|------|

| 管理员 | admin | admin123 |

| 成员 | member | member123 |



## 功能模块



- **资源管理**：模板例程、学习视频、比赛作品、代码文件的上传/分类/预览/下载

- **信息展示**：实验室介绍、荣誉证书、成员照片墙与作品轮播

- **权限管理**：管理员 / 成员 / 游客三级权限

- **学习追踪**：学习计时器、时长统计、进度可视化图表



## 生产部署



```bash

npm run build

npm start

```



建议将 `NEXTAUTH_URL` 设置为实际域名，并更换 `NEXTAUTH_SECRET` 为随机字符串。



## 公网访问（Cloudflare 域名）



本站使用域名：**https://gzmzdxwlyjdgcxysys.top**



### 域名配置



1. 登录 Cloudflare 控制台，域名 `gzmzdxwlyjdgcxysys.top` 已托管在 Cloudflare

2. 通过 Cloudflare Tunnel 暴露本地 3000 端口，无需公网 IP 或路由器端口转发

3. 首次使用执行一次 DNS 路由绑定：
   `cloudflared\cloudflared.exe tunnel route dns robot-lab gzmzdxwlyjdgcxysys.top`



### 一键启动



```bash

npm run public

```



或双击 `启动网站.bat` / `公网访问.bat`。



### 开机自启（可选）



```bash

npm run public:install    # 注册 Windows 登录自启任务

npm run public:uninstall  # 移除自启任务

```



`.env` 关键配置：



```env

PUBLIC_URL="https://gzmzdxwlyjdgcxysys.top"

NEXTAUTH_URL="https://gzmzdxwlyjdgcxysys.top"

```


