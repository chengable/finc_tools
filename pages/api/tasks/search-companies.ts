import { NextApiRequest, NextApiResponse } from 'next';

interface XueqiuSearchResponse {
  code: number;
  data: Array<{
    code: string;
    label: string;
    query: string;
    state: number;
    stock_type: number;
    type: number;
  }>;
  message: string;
  success: boolean;
}

/**
 * 判断是否为企业股票
 * @param stockType 股票类型
 * @returns 是否为企业股票
 */
function isCompanyStock(stockType: number): boolean {
  const companyStockTypes = new Set([
    0,   // 美股普通股
    6,   // 美股ET
    11,  // A股主板
    12,  // 创业板
    30,  // 港股主板
    31,  // 港股创业板
    82,  // 科创板
    83,  // 北交所
  ]);
  return companyStockTypes.has(stockType);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ message: '搜索关键词不能为空' });
  }

  try {
    // 调用雪球搜索API
    const response = await fetch(
      `https://xueqiu.com/query/v1/suggest_stock.json?q=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://xueqiu.com/',
          'Origin': 'https://xueqiu.com',
          'Cookie': process.env.XUEQIU_COOKIE || ''
        }
      }
    );

    if (!response.ok) {
      throw new Error('雪球API调用失败');
    }

    const data: XueqiuSearchResponse = await response.json();

    if (data.code !== 200 || !data.success) {
      throw new Error(data.message || '搜索失败');
    }

    // 过滤企业股票，排除基金、债券等
    const filteredData = data.data.filter(item => isCompanyStock(item.stock_type));

    // 格式化返回结果
    const companies = filteredData.map(item => ({
      code: item.code,
      name: item.query,
      label: item.label,
      type: item.stock_type
    }));

    res.status(200).json({
      success: true,
      data: companies
    });

  } catch (error) {
    console.error('搜索企业失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '搜索失败'
    });
  }
} 