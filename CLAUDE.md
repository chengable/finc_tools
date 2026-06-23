# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Next.js 14 的金融数据分析平台，提供企业财务分析、AI 智能分析、微信登录支付等功能。项目采用 TypeScript 开发，使用 Prisma ORM 操作 MySQL 数据库，Redis 做缓存。

## 开发命令

### 基础开发
```bash
npm run dev              # 启动开发服务器，监听所有网络接口
npm run build           # 构建生产版本
npm run start           # 启动生产服务器
npm run lint            # 运行 ESLint 代码检查
```

### 数据库操作
```bash
npm run db:push         # 推送数据库 schema 变更到数据库
npm run db:studio       # 打开 Prisma Studio 数据库管理界面
npm run db:generate     # 生成 Prisma 客户端代码
```

### 管理脚本
```bash
npm run init-admin      # 初始化管理员账户
npm run init-db         # 初始化数据库数据
npm run check-expired   # 检查过期用户
npm run check-subscription  # 检查订阅状态
npm run test-wechat-pay  # 测试微信支付配置
npm run cleanup-orders   # 清理过期订单
```

## 项目架构

### 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + Chart.js
- **后端**: Next.js API Routes + Prisma ORM + MySQL + Redis
- **认证**: JWT + 微信 OAuth
- **支付**: 微信支付 API
- **AI**: OpenAI-compatible API (支持任意兼容 OpenAI 的服务)

### 目录结构
```
├── components/         # React 组件
│   ├── FinancialDataTable.tsx    # 财务数据表格
│   ├── StreamingAIAnalysis.tsx   # AI 分析流式组件
│   ├── TopHeader.tsx             # 顶部导航
│   └── SEOHead.tsx               # SEO 头部组件
├── lib/                 # 核心业务逻辑
│   ├── prisma.ts                   # Prisma 客户端
│   ├── auth.ts                     # 认证相关
│   ├── ai-provider.ts              # AI 服务提供者
│   ├── wechat-pay.ts               # 微信支付
│   ├── redis.ts                    # Redis 工具
│   ├── financial-config.ts         # 财务配置
│   └── ai-analysis-cache.ts        # AI 分析缓存
├── pages/              # Next.js 页面
│   ├── api/            # API 路由
│   │   ├── auth/wechat/         # 微信认证
│   │   ├── financial/           # 财务数据接口
│   │   ├── tasks/               # 任务管理
│   │   ├── payment/             # 支付接口
│   │   └── admin/               # 管理接口
│   ├── index.tsx               # 首页
│   ├── login.tsx               # 登录页
│   ├── tasks.tsx               # 任务列表
│   ├── payment.tsx             # 支付页面
│   └── admin-control.tsx       # 管理后台
├── prisma/             # 数据库模型
│   ├── schema.prisma           # 数据库模型定义
│   └── migrations/             # 数据库迁移文件
└── scripts/            # 数据库脚本
    ├── init-admin.ts           # 初始化管理员
    ├── init-db.ts              # 初始化数据库
    └── check-expired-users.ts  # 检查过期用户
```

### 数据库模型主要关系

1. **User** - 用户表，包含微信登录信息、订阅状态
2. **Task** - 任务表，关联用户，存储财务分析任务
3. **CompanyFinancialData** - 企业财务原始数据
4. **CompanyFinancialIndicators** - 计算后的财务指标
5. **CompanyAiAnalysis** - AI 分析结果
6. **PaymentOrder** - 支付订单，关联用户
7. **AiAnalysisCache** - AI 分析结果缓存

### 核心业务逻辑

#### 认证流程
- 使用微信 OAuth 登录，获取用户信息
- 生成 JWT token 存储在 cookie 中
- 通过中间件验证用户身份

#### 财务分析流程
1. 用户创建分析任务（企业或行业分析）
2. 系统收集财务数据（资产负债表、利润表、现金流量表）
3. 计算 9 大类财务指标
4. AI 进行智能分析并生成报告
5. 结果存储在数据库并缓存

#### 支付流程
- 用户选择订阅套餐
- 生成微信支付二维码
- 用户扫码支付
- 微信回调通知
- 更新用户订阅状态

### 环境变量配置

项目需要配置以下关键环境变量：

```env
# 数据库
DATABASE_URL="mysql://username:password@host:port/database"

# Redis
REDIS_URL="redis://username:password@host:port/db"

# JWT
JWT_SECRET="your-jwt-secret"

# 微信登录
WECHAT_APP_ID="your-wechat-app-id"
WECHAT_APP_SECRET="your-wechat-app-secret"

# 微信支付
WECHAT_MERCHANT_ID="your-merchant-id"
WECHAT_MERCHANT_KEY="your-merchant-key"

# AI 服务
OPENAI_API_KEY="your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"
```

### 开发注意事项

1. **数据库操作**: 使用 Prisma 客户端，所有数据库操作都要通过 Prisma
2. **错误处理**: API 路由要有统一的错误处理和响应格式
3. **缓存策略**: AI 分析结果使用 Redis 缓存，提高响应速度
4. **安全性**:
   - 所有 API 都要验证用户身份
   - 敏感信息存储在环境变量中
   - 微信支付回调需要验证签名
5. **代码规范**: 使用 TypeScript 严格模式，所有函数都要有类型定义

### 常见任务

#### 添加新的财务指标
1. 在 `lib/financial-config.ts` 中配置指标计算逻辑
2. 更新 `prisma/schema.prisma` 中的 `CompanyFinancialIndicators` 模型
3. 修改前端组件显示新指标

#### 添加新的 AI 服务提供商
1. 在 `lib/ai-provider.ts` 中添加新的 provider
2. 实现统一的接口方法
3. 更新环境变量配置

#### 修改用户订阅逻辑
1. 检查 `User` 模型的订阅相关字段
2. 更新支付相关 API 路由
3. 修改权限验证中间件

### 部署

项目使用 Docker 容器化部署：

```bash
# 开发环境
docker compose -f docker-compose.dev.yml up -d

# 生产环境
docker compose -f docker-compose.prod.yml up -d
```

生产环境配置了 Nginx 反向代理，SSL 证书，以及性能优化。