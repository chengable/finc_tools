# Finc Tools - 金融数据分析平台

一个基于 Next.js 的现代化金融数据分析平台，提供企业财务分析、行业研究、AI 智能分析等功能。

## 🚀 功能特性

- **📊 财务数据分析**：支持 A 股、港股、美股市场数据
- **🤖 AI 智能分析**：集成多个 AI 大模型，提供智能财务分析
- **📈 可视化图表**：丰富的财务指标图表展示
- **🔐 微信登录**：支持微信 OAuth 认证
- **💳 微信支付**：集成微信支付，支持订阅制服务
- **⚡ 高性能**：Redis 缓存、数据库优化、CDN 加速
- **🐳 容器化部署**：Docker Compose 一键部署

## 🛠️ 技术栈

### 前端
- **Next.js 14** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 现代化 UI 设计
- **Chart.js** - 数据可视化
- **React Markdown** - Markdown 渲染

### 后端
- **Prisma ORM** - 数据库操作
- **MySQL** - 主数据库
- **Redis** - 缓存和会话存储
- **JWT** - 身份认证
- **微信开放平台** - 登录和支付

### AI 集成
- **OpenAI API** - 主要 AI 分析
- **百炼 AI (DashScope)** - 备用 AI 服务
- **腾讯大模型** - 多模型支持
- **火山引擎** - 扩展 AI 能力

### 部署
- **Docker** - 容器化
- **Docker Compose** - 多服务编排
- **Nginx** - 反向代理
- **阿里云 RDS** - 云数据库

## 📦 快速开始

### 环境要求

- Node.js 18+
- Docker & Docker Compose
- MySQL 数据库
- Redis 服务

### 1. 克隆项目

```bash
git clone <repository-url>
cd finc_tools
```

### 2. 环境配置

复制环境配置文件：

```bash
cp .env.docker .env
```

编辑 `.env` 文件，配置以下关键信息：

```env
# 数据库配置
DATABASE_URL="mysql://username:password@host:port/database"

# Redis 配置
REDIS_URL="redis://username:password@host:port/db"

# JWT 密钥
JWT_SECRET="your-jwt-secret"

# 微信配置
WECHAT_APP_ID="your-wechat-app-id"
WECHAT_APP_SECRET="your-wechat-app-secret"

# AI 服务配置
OPENAI_API_KEY="your-openai-api-key"
DASHSCOPE_API_KEY="your-dashscope-api-key"
```

### 3. 开发环境启动

```bash
# 安装依赖
npm install

# 数据库迁移
npm run db:push

# 初始化管理员
npm run init-admin

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 开始使用。

### 4. 生产环境部署

使用 Docker Compose 一键部署：

```bash
# 使用快速启动脚本
./quick-start.sh

# 或手动部署
docker compose up -d --build
```

访问 http://localhost:8000 查看应用。

## 🐳 Docker 部署

### 使用部署脚本

```bash
# 启动服务（包含重建）
./deploy.sh start --rebuild

# 查看日志
./deploy.sh logs

# 停止服务
./deploy.sh stop

# 清理资源
./deploy.sh clean
```

### 手动部署

```bash
# 构建并启动
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

## 📚 开发指南

### 项目结构

```
finc_tools/
├── components/          # React 组件
├── lib/                # 核心业务逻辑
│   ├── financial-config.ts    # 财务配置
│   ├── ai-provider.ts         # AI 服务
│   ├── wechat-pay.ts          # 微信支付
│   └── redis.ts              # Redis 工具
├── pages/              # Next.js 页面
│   ├── api/            # API 路由
│   └── ...             # 页面组件
├── prisma/             # 数据库模型
├── scripts/            # 数据库脚本
├── styles/             # 样式文件
└── public/             # 静态资源
```

### 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build           # 构建生产版本
npm run start           # 启动生产服务器
npm run lint            # 代码检查

# 数据库
npm run db:push         # 推送数据库变更
npm run db:studio       # 打开 Prisma Studio
npm run db:generate     # 生成 Prisma 客户端

# 管理脚本
npm run init-admin      # 初始化管理员
npm run init-db         # 初始化数据库
npm run check-expired   # 检查过期用户
npm run test-wechat-pay # 测试微信支付
```

### 数据库模型

主要数据模型包括：

- **User** - 用户账户和订阅管理
- **Task** - 财务分析任务
- **CompanyFinancialData** - 原始财务数据
- **CompanyFinancialIndicators** - 财务指标
- **CompanyAiAnalysis** - AI 分析结果
- **PaymentOrder** - 支付订单

### API 路由

- `/api/auth/wechat/*` - 微信认证
- `/api/financial/*` - 财务数据接口
- `/api/tasks/*` - 任务管理
- `/api/payment/*` - 支付接口
- `/api/admin/*` - 管理接口

## 🔧 配置说明

### 环境变量

详细的环境变量配置请参考 [CLAUDE.md](./CLAUDE.md) 文档。

### 数据库配置

支持 MySQL 数据库，建议使用云数据库服务（如阿里云 RDS）。

### Redis 配置

用于缓存 AI 分析结果和会话管理，建议使用云 Redis 服务。

### 微信配置

需要配置微信开放平台和微信支付商户号：

1. 注册微信开放平台应用
2. 配置授权回调域名
3. 申请微信支付商户号
4. 上传 API 证书

## 📊 功能模块

### 财务数据分析

- 支持 A 股、港股、美股市场
- 资产负债表、利润表、现金流量表
- 9 大类财务指标分析
- 历史数据趋势分析

### AI 智能分析

- 多模型 AI 服务集成
- 实时流式分析
- 智能财务建议
- 风险预警分析

### 用户管理

- 微信 OAuth 登录
- 订阅制服务
- 用户权限管理
- 支付订单管理

## 🚨 注意事项

1. **数据安全**：生产环境请使用强密码和 HTTPS
2. **API 限制**：注意各 AI 服务的 API 调用限制
3. **数据库备份**：定期备份数据库数据
4. **监控告警**：建议配置应用监控和告警
5. **日志管理**：定期清理日志文件

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至：[your-email@example.com]
- 微信：[your-wechat-id]

---

**Finc Tools** - 让金融数据分析更简单、更智能 🚀
