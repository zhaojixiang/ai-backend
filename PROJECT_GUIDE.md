# ai-backend 项目说明

面向 **研发** 与 **产品 / 设计** 的共用说明：业务在做什么、技术如何实现、如何本地跑起来、以及对接与上线时要注意什么。

---

## 1. 文档与读者

| 章节 | 主要读者 |
|------|----------|
| 业务描述 | 产品、设计、前端、测试 |
| 技术描述 | 后端、运维、全栈 |
| 本地调试与启动 | 全体研发 |
| 接口与数据约定 | 前端、联调、测试 |
| 配置与环境变量 | 后端、运维 |
| 注意点与限制 | 产品、研发、运维 |

---

## 2. 业务描述

### 2.1 产品目标

本服务提供 **视频处理流水线** 的能力：根据用户提交的 **视频链接**，后台完成 **下载 → 提取音频 → 场景检测（分镜时间点）**，并持久化结果；客户端可通过 **任务 ID** 查询处理状态与分镜列表。

### 2.2 用户使用路径（逻辑流程）

1. 客户端调用 **提交处理** 接口，传入合法的 `http(s)` 视频地址。
2. 服务端立即返回 **任务 ID** 与可访问的 **视频 URL 占位**（实际文件在后台生成完成后才可播放）。
3. 客户端可轮询 **任务状态**，了解 `queued` / `processing` / `completed` / `failed`。
4. 处理完成后，客户端调用 **分镜列表** 接口，获取每个分镜的 `start` / `end` 时间；当前架构下 **所有分镜共用同一份主视频文件**（通过时间区间在端上裁剪播放）。

### 2.3 产品需知的行为特性

- **异步**：提交接口不会等整段流水线结束，避免前端长时间阻塞；需配合状态轮询或后续扩展 WebSocket / 推送。
- **限流**：同一 IP 对「提交处理」有频率限制，避免被刷爆；产品文案或错误提示中可说明「请求过于频繁」。
- **失败可感知**：任务失败时状态为 `failed`，并带有错误摘要；适合在 UI 上展示重试或反馈入口。

---

## 3. 技术描述

### 3.1 技术栈

- **运行时**：Node.js + **NestJS**（HTTP API、模块化、全局管道与过滤器）。
- **视频下载**：`yt-dlp`（子进程调用，带超时）。
- **音视频处理**：`ffmpeg`（子进程调用，带超时）。
- **分镜检测**：Python 脚本 + **PySceneDetect**（OpenCV），由 Node 以子进程方式执行。

### 3.2 架构要点

- **统一响应体**：成功与业务错误多为 `{ code, data, message }`；HTTP 异常与未捕获错误由全局异常过滤器统一格式（生产环境对 500 隐藏细节）。
- **后台任务**：提交后任务在进程内异步执行，并通过 **`storage/<taskId>/task.json`** 写入状态；单机多任务通过 **并发上限**（环境变量）限制，避免 CPU/磁盘被打满。
- **静态资源**：默认挂载 **`/storage`** 到本地 `storage` 目录；生产可关闭挂载，改由 CDN / 对象存储提供文件（见配置说明）。
- **健康检查**：`GET /health` 使用 Terminus，**不参与**统一响应包装，便于负载均衡 / K8s 探针解析。

### 3.3 数据落盘

- 每个任务对应目录：`storage/<taskId>/`
- 典型文件：`video.*`（由 yt-dlp 决定扩展名）、`audio.mp3`、`scenes/scenes.json`（脚本也会写回任务目录下的 `scenes.json`）、`task.json`（状态）。

### 3.4 安全相关（研发需知）

- 对提交 URL 做 **基础 SSRF 防护**（内网、回环、常见元数据地址等）；**不能**覆盖所有 DNS 重绑定场景，高安全环境应叠加 **域名白名单** 或专用下载代理。
- 子进程使用 **参数数组** 调用，避免 shell 拼接注入。
- 任务 ID 校验：**新任务为 UUID**；读取接口仍 **兼容旧版纯数字 ID**，并对路径做规范化校验，防止目录穿越。

---

## 4. 环境依赖

在运行本服务前，本机或部署环境需具备：

| 依赖 | 说明 |
|------|------|
| Node.js | 与 `package.json` / 团队规范一致（建议 LTS） |
| pnpm | 项目使用 pnpm 安装依赖（见仓库锁文件） |
| ffmpeg | 需在 `PATH` 中可执行 |
| yt-dlp | 需在 `PATH` 中可执行 |
| Python 虚拟环境 | 仓库内 `python/venv`（或自定义路径），并已安装 `python/requirements.txt` |

---

## 5. 本地调试与启动

### 5.1 安装依赖

```bash
pnpm install
```

若公司镜像不稳定，仓库根目录已提供 **`.npmrc`** 指向官方 npm 源，可按需调整。

### 5.2 Python 环境（分镜）

```bash
cd python
python3 -m venv venv
source venv/bin/activate   # Windows 使用 venv\Scripts\activate
pip install -r requirements.txt
```

默认使用 `python/venv/bin/python`；若路径不同，在环境变量 **`PYTHON_BIN`** 中指定。

### 5.3 环境变量

复制示例文件并按本机修改：

```bash
cp .env.example .env
```

关键项见下一章「配置说明」。

### 5.4 启动方式

| 场景 | 命令 |
|------|------|
| 开发热重载 | `pnpm run start:dev` |
| 调试 | `pnpm run start:debug` |
| 生产构建 | `pnpm run build` 后 `pnpm run start:prod` |

默认监听端口由 **`PORT`** 决定（默认 `3000`）。前端联调时请与 **`PUBLIC_BASE_URL`** 保持一致（用于拼接返回给客户端的视频地址）。

### 5.5 测试

```bash
pnpm test          # 单元测试
pnpm run test:e2e  # e2e（已带 --forceExit）
pnpm run lint
```

---

## 6. 接口与数据约定

### 6.1 统一成功响应（多数业务接口）

经全局拦截器包装后形如：

```json
{
  "code": 200,
  "data": { },
  "message": "成功或自定义文案"
}
```

部分接口（如已返回完整 `{ code, data, message }`）会原样透传。

### 6.2 主要 HTTP 接口（视频域）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/video/process` | 提交 `url`，立即返回任务信息 |
| GET | `/video/:id/status` | 查询 `task.json` 中的状态 |
| GET | `/video/:id/scenes` | 分镜列表（处理中或不存在时 `data` 可能为 `null`） |

**请求体（提交处理）**：JSON `{ "url": "https://..." }`，需通过 class-validator 校验。

**限流**：`POST /video/process` 单独更严（默认约 **每 IP 每分钟 10 次**），全局限流见全局 Throttler 配置。

### 6.3 健康检查

- **`GET /health`**：返回 Terminus 标准结构，**不**包一层 `{ code, data, message }`。

---

## 7. 配置说明（`.env` / `.env.example`）

| 变量 | 含义 |
|------|------|
| `NODE_ENV` | `development` / `production` 等；影响 500 错误是否对外暴露详情 |
| `PORT` | HTTP 端口 |
| `PUBLIC_BASE_URL` | 对外站点根地址，**不要**末尾 `/`，用于生成 `/storage/...` 完整 URL |
| `CORS_ORIGIN` | `*` 或逗号分隔的多域名 |
| `SERVE_STORAGE` | `false` 时不挂载 `/storage` 静态目录 |
| `MAX_CONCURRENT_VIDEO_JOBS` | 后台视频流水线最大并发数 |
| `DOWNLOAD_TIMEOUT_MS` | yt-dlp 超时 |
| `FFMPEG_TIMEOUT_MS` | ffmpeg / 分镜子进程超时 |
| `PYTHON_BIN` | Python 可执行文件路径（可选） |

---

## 8. 注意点与限制

### 8.1 给产品 / 设计的提示

- 提交后 **不能假设视频立即可播**，需依赖 **状态接口** 或超时策略。
- 分镜列表在 **`scenes.json` 未生成** 时会返回「处理中或不存在」类提示，UI 应区分加载中、失败、空数据。
- 返回中的 **`file` / `videoUrl` 依赖 `PUBLIC_BASE_URL`**，环境切域名、HTTPS、反向代理时必须同步改配置，否则前端播放地址错误。

### 8.2 给研发的提示

- **进程内队列**：未接入 Redis/Bull；**多实例部署**时任务仅落在各自进程，无全局队列与故障迁移，扩展前需评估。
- **静态目录暴露**：开启 `SERVE_STORAGE` 时，知晓 URL 的用户可能拉取文件；生产建议鉴权、签名 URL 或对象存储私有桶。
- **yt-dlp 输出扩展名**：不一定总是 `.mp4`，若某源仅提供其它封装，需考虑 **探测实际文件名** 再喂给 ffmpeg（当前实现以流水线代码为准，遇源站差异需迭代）。
- **磁盘与健康**：`/health` 会检查 `storage` 磁盘空间；磁盘满会导致任务失败，应配合监控告警。

---

## 9. 目录结构（简表）

```
src/
  app.module.ts          # 根模块：配置、限流、健康检查、全局过滤器/拦截器
  main.ts                # 入口：端口、CORS、ValidationPipe、静态目录
  config/                # 配置工厂
  common/                # 统一响应、异常过滤、URL 安全、子进程封装等
  video/                 # 视频业务：控制器、服务、DTO、任务状态
  health/                # 健康检查
  processor/             # 下载、音频、分镜（调用外部命令）
python/
  scripts/               # 分镜脚本等
  requirements.txt
storage/                 # 本地任务数据（勿提交敏感内容到版本库）
```

---

## 10. Docker 部署

### 10.1 文件说明

| 文件 | 作用 |
|------|------|
| `Dockerfile` | 多阶段构建：编译 Nest 应用；运行镜像含 Node、ffmpeg、yt-dlp、Python venv（分镜依赖） |
| `docker-compose.yml` | 启动服务、持久化 `storage`、健康检查 |
| `.dockerignore` | 减小构建上下文（排除 `node_modules`、`storage`、本地 `python/venv` 等） |

### 10.2 首次启动

1. 在项目根目录准备环境变量（Compose 会读取根目录 **`.env`** 做变量替换）：

   ```bash
   cp .env.example .env
   ```

2. 按部署环境修改 **`PUBLIC_BASE_URL`**（须与浏览器/客户端访问的根地址一致，含协议与端口）。若修改宿主机映射端口，设置 **`HOST_PORT`**，并同步更新 **`PUBLIC_BASE_URL`**（容器内应用固定监听 **3000**）。

3. 构建并后台启动：

   ```bash
   docker compose build
   docker compose up -d
   ```

4. 验证：`curl -s http://127.0.0.1:${HOST_PORT:-3000}/health`（或对应域名）。

### 10.3 数据持久化

Compose 使用命名卷 **`storage_data`** 挂载到容器内 `/app/storage`，重启容器后任务文件保留。

### 10.4 注意点

- 镜像内 **`PYTHON_BIN`** 默认为 `/app/python/venv/bin/python`，一般无需改。
- **多副本**：当前任务队列在进程内，多个容器共用一个卷时仍可能产生并发写入冲突；水平扩展前需引入队列与一致的任务调度策略。
- **yt-dlp**：站点策略变化时建议定期 **`docker compose build --no-cache`** 重建镜像以更新 yt-dlp。

---

## 11. 修订与反馈

需求变更（例如：队列化、多清晰度、鉴权、仅允许指定域名）时，建议同步更新本文档 **业务描述** 与 **注意点** 章节，便于产品、前端、后端对齐预期。
