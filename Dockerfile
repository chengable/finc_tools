# 多阶段构建 - 优化的Next.js standalone部署 (修复网络问题版)

# 第一阶段：构建依赖
FROM node:18-alpine AS deps
WORKDIR /app

# 配置Alpine使用多个镜像源以提高成功率
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main" > /etc/apk/repositories \
    && echo "https://mirrors.aliyun.com/alpine/v3.18/community" >> /etc/apk/repositories \
    && echo "https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.18/main" >> /etc/apk/repositories \
    && echo "https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.18/community" >> /etc/apk/repositories \
    && echo "https://dl-cdn.alpinelinux.org/alpine/v3.18/main" >> /etc/apk/repositories \
    && echo "https://dl-cdn.alpinelinux.org/alpine/v3.18/community" >> /etc/apk/repositories

# 更新包索引并安装基础工具
RUN apk update --no-cache || true \
    && apk upgrade --no-cache || true

# 配置npm使用国内镜像源
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-timeout 600000 \
    && npm config set fetch-retries 5

# 只复制package文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci --only=production --no-audit --no-fund && npm cache clean --force

# 第二阶段：构建应用
FROM node:18-alpine AS builder
WORKDIR /app

# 配置Alpine使用多个镜像源
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main" > /etc/apk/repositories \
    && echo "https://mirrors.aliyun.com/alpine/v3.18/community" >> /etc/apk/repositories \
    && echo "https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.18/main" >> /etc/apk/repositories \
    && echo "https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.18/community" >> /etc/apk/repositories \
    && echo "https://dl-cdn.alpinelinux.org/alpine/v3.18/main" >> /etc/apk/repositories \
    && echo "https://dl-cdn.alpinelinux.org/alpine/v3.18/community" >> /etc/apk/repositories

# 更新包索引
RUN apk update --no-cache || true \
    && apk upgrade --no-cache || true

# 安装构建时需要的系统依赖
RUN apk add --no-cache libc6-compat openssl || \
    (apk update && apk add --no-cache libc6-compat openssl)

# 配置npm
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-timeout 600000 \
    && npm config set fetch-retries 5

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 只复制必要的构建文件
COPY package.json package-lock.json* ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY lib ./lib
COPY pages ./pages
COPY components ./components
COPY styles ./styles
COPY public ./public

# 设置构建环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL 通过 docker-compose 运行时注入

# 生成Prisma客户端
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# 安装所有依赖（包括devDependencies用于构建）
RUN npm ci --no-audit --no-fund

# 构建应用
RUN npm run build

# 第三阶段：运行时镜像
FROM node:18-alpine AS runner
WORKDIR /app

# 配置Alpine使用多个镜像源
RUN echo "https://mirrors.aliyun.com/alpine/v3.18/main" > /etc/apk/repositories \
    && echo "https://mirrors.aliyun.com/alpine/v3.18/community" >> /etc/apk/repositories \
    && echo "https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.18/main" >> /etc/apk/repositories \
    && echo "https://mirrors.tuna.tsinghua.edu.cn/alpine/v3.18/community" >> /etc/apk/repositories \
    && echo "https://dl-cdn.alpinelinux.org/alpine/v3.18/main" >> /etc/apk/repositories \
    && echo "https://dl-cdn.alpinelinux.org/alpine/v3.18/community" >> /etc/apk/repositories

# 更新包索引
RUN apk update --no-cache || true \
    && apk upgrade --no-cache || true

# 安装运行时系统依赖（带重试机制）
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    bash \
    wget \
    curl \
    && rm -rf /var/cache/apk/* || \
    (apk update && apk add --no-cache \
    libc6-compat \
    openssl \
    bash \
    wget \
    curl \
    && rm -rf /var/cache/apk/*)

# 创建用户
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# NEXT_PUBLIC_FINANCIAL_AI_AGENT_URL 通过 docker-compose 运行时注入

# 复制构建产物（只复制必要文件）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 如果有Prisma，复制生成的客户端
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 环境变量将在运行时通过docker-compose注入，不需要复制.env文件

# 确保nextjs用户有写入/tmp的权限
RUN chown -R nextjs:nodejs /tmp

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查（使用curl作为备用）
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || wget -q --spider http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["node", "server.js"] 