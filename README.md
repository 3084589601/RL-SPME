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

## 公网部署（阿里云服务器）

### 部署方式

项目部署在阿里云 ECS 服务器上，使用固定公网 IP 访问，systemd 管理进程实现开机自启和崩溃自动重启。

### 一键部署

```bash
# SSH 登录阿里云服务器后：
bash deploy.sh
```

脚本自动完成：环境检查 → 拉取代码 → 安装依赖 → 构建 → 配置 systemd → 配置防火墙。

### 服务管理

```bash
systemctl status robot-lab     # 查看状态
systemctl restart robot-lab    # 重启服务
journalctl -u robot-lab -f     # 查看日志
```

### 服务器环境要求

- Linux (Ubuntu 20.04+ / CentOS 7+)
- Node.js ≥ 18
- Git
- 阿里云安全组放行 3000 端口
