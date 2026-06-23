# FINC Tools — AI 智能财报分析平台

基于 Next.js 的金融数据分析平台，支持 A 股/港股/美股财报数据采集、9 大类财务指标计算、AI 智能分析，并提供微信登录/支付等 SaaS 能力。

## 功能概览

- **多市场财报数据** — 覆盖 A 股、港股、美股，自动识别市场并转换字段
- **9 大类财务指标** — 盈利能力、现金流、偿债能力、运营效率、成长能力、杜邦分析、财务质量、市场估值、风险控制
- **AI 智能分析** — 接入 OpenAI-compatible API，流式输出财报解读与投资建议
- **财报智能体** — 对话式 AI 财务分析工具，自然语言查询企业财务状况
- **数据可视化** — 趋势图表与指标对比
- **微信登录** — OAuth 2.0 授权登录
- **微信支付** — Native 扫码支付，支持 1/3/6/12 月订阅套餐

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- 雪球 Cookie（从浏览器登录 [雪球](https://xueqiu.com) 后获取，用于财报数据采集）

### 1. 克隆项目

```bash
git clone <repository-url>
cd finc_tools
```

### 2. 环境配置

```bash
cp .env.example .env
```

编辑 `.env`，填入配置：

```env
# 数据库
DATABASE_URL="mysql://user:password@host:3306/finc_tools"

# Redis
REDIS_URL="redis://user:password@host:6379/0"

# JWT（务必修改为随机字符串）
JWT_SECRET="your-random-secret"

# AI 服务（必填，支持任意 OpenAI-compatible API）
OPENAI_API_KEY="your-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"

# 雪球 Cookie（登录 xueqiu.com 后从浏览器获取）
XUEQIU_COOKIE="your-xueqiu-cookie"

# 管理员账号（用于初始化）
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-admin-password"
ADMIN_AUTH_KEY="your-auth-key"
```

> 微信登录/支付相关配置见 `.env.example` 完整模板，按需填入即可。

### 3. 初始化数据库

```bash
npm install
npx prisma db push        # 创建数据库表
npm run init-db            # 初始化管理员和微信配置
```

### 4. 启动

```bash
npm run dev
```

访问 http://localhost:3000

## Docker 部署

```bash
docker compose up -d --build
```

服务启动后访问 http://localhost:8000

**架构：** Nginx (:8000) → Next.js (:3000, 内网)

**常用命令：**

```bash
docker compose ps          # 查看服务状态
docker compose logs -f     # 查看日志
docker compose down        # 停止服务
```

## AI 服务配置

本项目使用 OpenAI-compatible API，支持以下服务（及其他任何兼容 OpenAI 接口的服务）：

| 服务 | `OPENAI_BASE_URL` | `OPENAI_MODEL` |
|------|-------------------|----------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` / `gpt-4o-mini` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-v4-pro` / `deepseek-v4-flash` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` / `qwen-plus` |
| 其他兼容服务 | 按服务商文档配置 | 按服务商文档配置 |

## 财务分析流程

1. **创建任务** — 选择企业分析（单公司）或行业分析（多公司）
2. **数据采集** — 通过雪球 API 拉取 Q1~Q4 的资产负债表、利润表、现金流量表（港股/美股自动字段映射）
3. **指标计算** — 自动计算 9 大类 60+ 项财务指标
4. **AI 分析** — 调用 AI 模型生成财报解读和投资建议（流式输出）
5. **结果查看** — 趋势图表、指标详情、AI 分析报告

## 财务指标

| 类别 | 说明 |
|------|------|
| 盈利能力 | 毛利率、净利率、ROE、ROA、EPS、营收/利润增长率等 |
| 现金流量 | 经营/投资/筹资现金流、现金流/净利润比、现金收入比等 |
| 偿债能力 | 流动比率、速动比率、资产负债率、利息保障倍数等 |
| 运营效率 | 总资产周转率、存货周转率、应收/应付账款周转天数等 |
| 成长能力 | 营收/利润/总资产/净资产增长率等 |
| 杜邦分析 | ROE 分解：销售净利率 × 资产周转率 × 权益乘数 |
| 财务质量 | 经营现金流/净利润、扣非净利润率、资产结构等 |
| 市场估值 | 每股净资产、每股经营现金流、股东权益比率等 |
| 风险控制 | 研发费用率、现金债务比、债务保障倍数等 |

## 微信支付配置

### 开通步骤

1. 注册微信支付商户号
2. 获取商户号、API 密钥、证书
3. 在 `.env` 中配置 `WECHAT_PAY_*` 系列变量
4. 运行 `npm run test-wechat-pay` 验证

### 订阅套餐

| 套餐 | 时长 | 价格 |
|------|------|------|
| 月度 | 1 个月 | 自定义 |
| 季度 | 3 个月 | 自定义 |
| 半年 | 6 个月 | 自定义 |
| 年度 | 12 个月 | 自定义 |

套餐价格在管理后台的微信支付配置中设置。

## 管理后台

管理员登录后 (`/admin-control`) 可进行：

- 用户管理（查看、续费、禁用）
- 任务管理（查看所有用户任务）
- 微信配置（在线配置登录与支付参数）
- AI 缓存清理
- 支付订单管理

## 常用命令

```bash
npm run dev               # 启动开发服务器
npm run build             # 构建生产版本
npm run start             # 启动生产服务器
npm run db:push           # 推送 schema 变更
npm run db:generate       # 生成 Prisma 客户端
npm run db:studio         # 打开 Prisma Studio
npm run init-admin        # 初始化管理员
npm run init-db           # 初始化数据库
npm run check-expired     # 检查过期用户
```

## 注意事项

- `.env` 已加入 `.gitignore`，不会被提交
- 生产环境务必修改 `JWT_SECRET` 为随机字符串
- 雪球 Cookie 会过期，需定期更新
- 微信支付需要 HTTPS 和已备案域名
- AI 分析结果有缓存（3 个月有效期），可在管理后台手动清理

## License

MIT
