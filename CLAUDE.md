# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**
- `npm run dev` - Start development server on all interfaces (0.0.0.0)
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema changes to database
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:generate` - Generate Prisma client

**Database Scripts:**
- `npm run init-admin` - Initialize admin user
- `npm run init-db` - Initialize database
- `npm run check-expired` - Check expired users
- `npm run check-subscription` - Check subscription status
- `npm run test-wechat-pay` - Test WeChat Pay configuration
- `npm run cleanup-orders` - Clean up expired orders

**Docker Deployment:**
- `./deploy.sh start --rebuild` - Build and start all services
- `./deploy.sh logs` - View container logs
- `./deploy.sh stop` - Stop all services
- `./deploy.sh clean` - Clean up Docker resources

## Architecture Overview

**Core Technology Stack:**
- Next.js 14 with TypeScript
- Prisma ORM with MySQL database
- Redis for caching
- WeChat authentication and payment integration
- OpenAI API for financial analysis

**Database Models:**
- `User` - User accounts with WeChat integration and subscription management
- `Task` - Financial analysis tasks (enterprise/industry analysis)
- `CompanyFinancialData` - Raw financial data (balance sheet, income statement, cash flow)
- `CompanyFinancialIndicators` - Calculated financial ratios and metrics
- `CompanyAiAnalysis` - AI-generated financial analysis results
- `PaymentOrder` - WeChat payment orders and subscription management
- `AiAnalysisCache` - Cached AI analysis results with 3-month expiration

**Key Directories:**
- `pages/api/` - Next.js API routes organized by feature:
  - `auth/wechat/` - WeChat OAuth authentication
  - `financial/` - Financial data and AI analysis endpoints
  - `tasks/` - Task management (create, list, delete, restart)
  - `payment/` - WeChat Pay integration
  - `admin/` - Admin management functions
- `lib/` - Core business logic:
  - `financial-config.ts` - Comprehensive financial field mappings and formatting
  - `dataProcessingService.ts` - Financial data processing and calculations
  - `ai-provider.ts` - OpenAI integration for financial analysis
  - `wechat-pay.ts` - WeChat Pay SDK integration
  - `redis.ts` - Redis caching utilities
- `components/` - React components for financial data visualization
- `scripts/` - Database initialization and maintenance scripts

**Financial Data System:**
- Supports A-share, Hong Kong, and US stock markets
- Field mappings between different market data formats in `lib/field-mappings/`
- Automatic unit conversion (amounts to 100M yuan, ratios to percentages)
- Comprehensive financial indicator calculations across 9 categories:
  - Profitability, Cash Flow, Solvency, Operating Efficiency
  - Growth, DuPont Analysis, Quality, Valuation, Risk

**AI Analysis Pipeline:**
- Streaming AI analysis with real-time updates
- Caching system with queryHash for efficient retrieval
- Support for financial data analysis and indicator-specific insights
- Analysis results stored as JSON in database for audit trails

**Authentication & Payment:**
- WeChat OAuth for user authentication
- Subscription-based access (1/3/6/12 month plans)
- WeChat Pay integration with QR code generation
- Admin interface for user management and payment configuration

## Important Notes

- All financial amounts are stored in database as actual values and converted to 100M yuan for display
- Financial indicators use different storage formats (decimals vs percentages) - check `FIELD_UNITS` configuration
- Task system supports both enterprise analysis (specific companies) and industry analysis
- Redis is used for caching AI analysis results and session management
- The application is containerized with Docker Compose for production deployment
- Database schema uses MySQL with proper indexing for financial data queries

## 环境变量

本项目主要通过.env文件进行配置，以下为主要环境变量及其说明：

- `DATABASE_URL`：MySQL数据库连接字符串
- `REDIS_URL`：Redis连接字符串
- `JWT_SECRET`：JWT签名密钥
- `WECHAT_APP_ID`：微信开放平台AppID（用于微信登录）
- `WECHAT_APP_SECRET`：微信开放平台AppSecret
- `WECHAT_REDIRECT_URI`：微信登录回调地址
- `WECHAT_PAY_APP_ID`：微信支付AppID
- `WECHAT_PAY_MERCHANT_ID`：微信支付商户号
- `WECHAT_PAY_API_KEY`：微信支付API密钥
- `WECHAT_PAY_CERT_PATH`：微信支付API证书路径
- `WECHAT_PAY_KEY_PATH`：微信支付API私钥路径
- `WECHAT_PAY_NOTIFY_URL`：微信支付回调通知URL
- `WECHAT_PAY_MERCHANT_CERTIFICATE_SERIAL`：微信支付V3证书序列号
- `WECHAT_PAY_PLATFORM_PUBLIC_KEY_ID`：微信支付平台公钥ID
- `WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH`：微信支付平台公钥路径
- `XUEQIU_COOKIE`：雪球API访问所需Cookie
- `DASHSCOPE_API_KEY`：百炼AI（DashScope）API密钥
- `TENCENT_API_KEY`：腾讯大模型API密钥
- `ARK_API_KEY`：火山引擎大模型API密钥
- `NODE_ENV`：运行环境（如 production）
- `NEXTAUTH_URL`：Next.js认证URL
- `INIT_DATABASE`：是否初始化数据库（true/false）
- `INIT_ADMIN`：是否初始化管理员（true/false）
- `CHECK_EXPIRED`：是否检查过期用户（true/false）
- `NEXT_TELEMETRY_DISABLED`：禁用Next.js遥测（1表示禁用）
- `NEXT_PUBLIC_TALLY_URL`：前端埋点统计脚本URL

> 建议：生产环境请勿将敏感信息（如密钥、密码）暴露在代码库，实际部署时请通过安全方式注入环境变量。

---

## 关键配置说明

### Next.js 配置
- `reactStrictMode: true`：启用严格模式，提升开发体验。
- `output: 'standalone'`：便于Docker等容器化部署。
- `env`：通过process.env透传核心环境变量。
- `images`：自定义图片尺寸，禁用fetchPriority属性以避免React警告。

### Docker 构建优化（docker-build.config）
- 启用BuildKit、构建缓存、多平台支持、日志和网络优化。
- 支持自定义代理、DNS、构建超时等参数。
- 推荐使用`docker compose`进行多服务编排。

### Nginx 配置
- 反向代理Next.js应用，支持静态资源缓存、API路由、健康检查。
- 启用Gzip压缩，支持Brotli（可选）。
- 配置安全HTTP头，提升安全性。
- 静态资源、API、主应用均有独立location配置，便于扩展。
- 详细缓存策略，提升性能。

---