# Ivan Project 日志可视化面板

一个带管理员入口的前端页面，用于浏览宿主机 `/var/ivanproject/logs` 下的日志文件。应用默认运行在 **2888** 端口，内置密码为 **Zyf021206**。

## 功能
- 管理员入口（提示“管理员入口 · 需要密码”），密码：`Zyf021206`。
- 自动列出 `/var/ivanproject/logs` 目录下的文件（名称、类型、大小、更新时间）。
- 选择文件即可在页面内预览内容。
- 支持通过 `LOG_DIR` 环境变量修改日志目录。

## 本地运行
1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动服务（默认端口 2888，可通过 `PORT` 环境变量修改）：
   ```bash
   npm start
   ```
3. 浏览器访问 `http://localhost:2888`，输入管理员密码后即可查看日志。

## Docker 部署
1. 构建镜像：
   ```bash
   docker build -t ivan-log-viewer .
   ```
2. 运行容器（将宿主机日志目录挂载到容器内）：
   ```bash
   docker run -d \
     -p 2888:2888 \
     -e PORT=2888 \
     -e LOG_DIR=/var/ivanproject/logs \
     -v /var/ivanproject/logs:/var/ivanproject/logs:ro \
     --name ivan-log-viewer \
     ivan-log-viewer
   ```
3. 在浏览器访问 `http://<服务器 IP>:2888`，输入密码 `Zyf021206` 进入管理员入口。

> 说明：容器内的应用只读访问挂载的日志目录；如需查看其他目录，可调整 `-v` 挂载和 `LOG_DIR` 环境变量。

## 运行环境
- 基础镜像：`node:20-slim`
- 服务器系统：Debian（容器内运行）
- 监听端口：2888

