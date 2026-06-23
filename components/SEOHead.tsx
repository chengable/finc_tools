import React from 'react';
import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;

  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  additionalMeta?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'FINC AI智能财报分析平台',
  description = '专业的AI驱动财务报告分析平台，提供企业财务数据分析、投资决策支持和智能财务洞察服务。',
  keywords = '财报分析,AI分析,财务数据,投资决策,企业分析,财务报告,智能分析',
  ogTitle,
  ogDescription,
  ogImage = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/og-image.jpg`,
  ogUrl = process.env.NEXT_PUBLIC_SITE_URL || '',
  canonical,
  noindex = false,
  nofollow = false,
  additionalMeta = []
}) => {
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Head>
      {/* 基础 Meta 标签 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content={robotsContent} />
      
      {/* Open Graph 标签 */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="FINC AI智能财报分析平台" />
      
      {/* 微博分享优化 */}
      <meta property="weibo:webpage:create_at" content="1735027200" />
      <meta property="weibo:webpage:update_at" content={Math.floor(Date.now() / 1000).toString()} />
      
      {/* 百度相关 Meta 标签 */}
      <meta name="baidu-site-verification" content="codeva-finc" />
      <meta name="applicable-device" content="pc,mobile" />
      <meta name="MobileOptimized" content="width" />
      <meta name="HandheldFriendly" content="true" />
      
      {/* 移动端优化 */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="FINC AI" />
      
      {/* 安全相关 */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/favicon.svg" />
      
      {/* DNS 预解析 - 移除Google服务，优化国内访问 */}
      <link rel="dns-prefetch" href="//hm.baidu.com" />
      
      {/* 额外的 Meta 标签 */}
      {additionalMeta.map((meta, index) => {
        if (meta.name) {
          return <meta key={index} name={meta.name} content={meta.content} />;
        }
        if (meta.property) {
          return <meta key={index} property={meta.property} content={meta.content} />;
        }
        return null;
      })}
      
      {/* 结构化数据 - 面包屑导航 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: process.env.NEXT_PUBLIC_SITE_URL || ''
              }
            ]
          })
        }}
      />
    </Head>
  );
};

export default SEOHead;