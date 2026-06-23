import React from 'react';
import Head from 'next/head';

interface StructuredDataProps {
  type: 'WebSite' | 'WebApplication' | 'Organization' | 'BreadcrumbList' | 'Article';
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    return JSON.stringify(baseData, null, 2);
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredData()
        }}
      />
    </Head>
  );
};

// 获取站点URL
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

// 预定义的结构化数据模板
export const WebSiteStructuredData = () => (
  <StructuredData
    type="WebSite"
    data={{
      name: 'FINC AI智能财报分析平台',
      description: '专业的AI驱动财务报告分析平台，提供企业财务数据分析、投资决策支持和智能财务洞察服务。',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/tasks?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: 'FINC AI',
        url: siteUrl
      }
    }}
  />
);

export const OrganizationStructuredData = () => (
  <StructuredData
    type="Organization"
    data={{
      name: 'FINC AI',
      description: '专业的AI驱动财务分析服务提供商',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Chinese', 'English']
      },
      sameAs: [
        siteUrl
      ]
    }}
  />
);

export const WebApplicationStructuredData = () => (
  <StructuredData
    type="WebApplication"
    data={{
      name: 'FINC AI智能财报分析平台',
      description: '基于人工智能的财务报告分析应用，帮助用户进行专业的财务数据分析和投资决策。',
      url: siteUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CNY',
        description: '免费版本提供基础财务分析功能'
      },
      featureList: [
        'AI财务报告分析',
        '企业财务数据分析',
        '行业对比分析',
        '投资决策支持',
        '实时数据更新'
      ]
    }}
  />
);

export default StructuredData;