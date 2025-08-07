// 美股(US)到内地(CN)字段映射

// 资产负债表映射 - US to CN
export const US_TO_CN_BALANCE_SHEET_MAPPING: { [key: string]: string | null } = {
  // 非财务字段（前端可不展示）
  'report_date': null,
  'report_name': null,
  'report_type_code': null,
  'report_annual': null,
  'sd': null,
  'ed': null,
  
  // 资产总计
  'total_assets': 'total_assets',
  'total_assets_special_subject': null,    // 特殊科目不在前端展示
  
  // 流动资产
  'total_current_assets': 'total_current_assets',
  'current_assets_special_subject': null,
  'cce': 'currency_funds',                 // 货币资金
  'total_cash': 'currency_funds',          // 现金及现金等价物（与cce合并）
  'st_invest': 'tradable_fnncl_assets',    // 短期投资
  'net_receivables': 'account_receivable', // 应收账款净额
  'inventory': 'inventory',                // 存货
  'prepaid_expense': 'pre_payment',        // 预付费用
  'dt_assets_current_assets': 'dt_assets', // 递延税项资产(流动)
  
  // 非流动资产
  'total_noncurrent_assets': 'total_noncurrent_assets',
  'nca_si': null,                          // 特殊项目不展示
  'net_property_plant_and_equip': 'fixed_asset', // 固定资产净值
  'gross_property_plant_and_equip': 'fixed_asset_original', // 固定资产原值
  'accum_depreciation': 'accumulated_depreciation', // 累计折旧
  'equity_and_othr_invest': 'lt_equity_invest', // 股权及其他投资
  'goodwill': 'goodwill',                  // 商誉
  'net_intangible_assets': 'intangible_assets', // 无形资产净值
  'accum_amortization': 'accumulated_amortization', // 累计摊销
  'dt_assets_noncurrent_assets': 'dt_assets', // 递延税项资产(非流动)
  
  // 负债总计
  'total_liab': 'total_liab',
  'total_liab_si': null,
  'asset_liab_ratio': 'asset_liab_ratio',  // 资产负债率
  
  // 流动负债
  'total_current_liab': 'total_current_liab',
  'current_liab_si': null,
  'st_debt': 'st_loan',                    // 短期借款
  'accounts_payable': 'accounts_payable',  // 应付账款
  'income_tax_payable': 'tax_payable',     // 应交税费
  'accrued_liab': 'payroll_payable',       // 预提费用（映射为应付职工薪酬）
  'deferred_revenue_current_liab': 'contract_liabilities', // 递延收益(流动)
  
  // 非流动负债
  'total_noncurrent_liab': 'total_noncurrent_liab',
  'noncurrent_liab_si': null,
  'lt_debt': 'lt_loan',                    // 长期借款
  'deferred_tax_liab': 'dt_liab',          // 递延税项负债
  'dr_noncurrent_liab': 'deferred_revenue_noncurrent', // 递延收益(非流动)
  
  // 所有者权益
  'total_equity': 'total_holders_equity',  // 所有者权益总计
  'total_equity_special_subject': null,
  'total_holders_equity': 'total_holders_equity', // 股东权益合计
  'total_holders_equity_si': null,
  'preferred_stock': 'othr_equity_instruments', // 优先股
  'common_stock': 'shares',                // 普通股股本
  'add_paid_in_capital': 'capital_reserve', // 资本公积
  'retained_earning': 'undstrbtd_profit',  // 留存收益
  'treasury_stock': 'treasury_stock',      // 库存股
  'accum_othr_compre_income': 'othr_compre_income', // 累计其他综合收益
  'minority_interest': 'minority_equity',  // 少数股东权益
};

// 利润表映射 - US to CN
export const US_TO_CN_INCOME_STATEMENT_MAPPING: { [key: string]: string | null } = {
  // 非财务字段（前端可不展示）
  'report_date': null,
  'report_name': null,
  'report_type_code': null,
  'report_annual': null,
  'sd': null,
  'ed': null,
  
  // 收入项目
  'total_revenue': 'total_revenue',        // 营业收入总计
  'revenue': 'revenue',                    // 营业收入
  'othr_revenues': 'other_income',         // 其他收入
  
  // 成本费用
  'sales_cost': 'operating_cost',          // 营业成本
  'total_operate_expenses': 'operating_costs', // 营业费用合计
  'total_operate_expenses_si': null,       // 特殊项目不展示
  'marketing_selling_etc': 'sales_fee',    // 销售及市场费用
  'rad_expenses': 'rad_cost',              // 研发费用
  'net_interest_expense': 'financing_expenses', // 利息费用净额
  'interest_income': 'finance_cost_interest_income', // 利息收入
  'interest_expense': 'finance_cost_interest_fee', // 利息支出
  
  // 毛利润
  'gross_profit': 'gross_profit_us',       // 毛利润（US版本）
  
  // 营业利润
  'operating_income': 'op',                // 营业利润
  
  // 税前利润
  'income_from_co_before_tax_si': null,    // 特殊项目不展示
  'income_from_co_before_it': 'profit_total_amt', // 税前利润
  
  // 所得税
  'income_tax': 'income_tax_expenses',     // 所得税费用
  
  // 净利润
  'income_from_co': 'continous_operating_np', // 持续经营净利润
  'net_income': 'net_profit',              // 净利润
  'net_income_atcss': 'net_profit_atsopc', // 归属普通股股东净利润
  'total_net_income_atcss': 'net_profit_atsopc', // 归属普通股股东净利润总计（重复）
  'net_income_atms_interest': 'minority_gal', // 归属少数股东净利润
  
  // 综合收益
  'total_compre_income': 'total_compre_income', // 综合收益总额
  'total_compre_income_atcss': 'total_compre_income_atsopc', // 归属普通股股东综合收益
  'total_compre_income_atms': 'total_compre_income_atms', // 归属少数股东综合收益
  
  // 每股收益
  'total_basic_earning_common_ps': 'basic_eps', // 基本每股收益
  'total_dlt_earnings_common_ps': 'dlt_earnings_per_share', // 稀释每股收益
  
  // 股利
  'preferred_dividend': 'preferred_dividend_us', // 优先股股利
  
  // 其他项目
  'share_of_earnings_of_affiliate': 'invest_incomes_from_rr', // 联营企业投资收益
};

// 现金流量表映射 - US to CN
export const US_TO_CN_CASH_FLOW_MAPPING: { [key: string]: string | null } = {
  // 非财务字段（前端可不展示）
  'report_date': null,
  'report_name': null,
  'report_type_code': null,
  'report_annual': null,
  'sd': null,
  'ed': null,
  
  // 经营活动现金流量
  'net_cash_provided_by_oa': 'ncf_from_oa', // 经营活动现金流量净额
  'depreciation_and_amortization': 'depreciation_amortization_us', // 折旧与摊销（US版本）
  'operating_asset_and_liab_chg': 'working_capital_change', // 经营性资产负债变动
  
  // 投资活动现金流量
  'net_cash_used_in_ia': 'ncf_from_ia',    // 投资活动现金流量净额
  'payment_for_property_and_equip': 'cash_paid_for_assets', // 购建固定资产支付现金
  'purs_of_invest': 'invest_paid_cash',    // 投资支出
  
  // 融资活动现金流量
  'net_cash_used_in_fa': 'ncf_from_fa',    // 融资活动现金流量净额
  'common_stock_issue': 'cash_received_of_absorb_invest', // 发行普通股收到现金
  'repur_of_common_stock': 'stock_repurchase_cash', // 回购普通股支付现金
  'dividend_paid': 'cash_paid_of_distribution', // 支付股利现金
  
  // 现金及现金等价物变动
  'cce_at_boy': 'initial_balance_of_cce',  // 期初现金及现金等价物
  'cce_at_eoy': 'final_balance_of_cce',    // 期末现金及现金等价物
  'increase_in_cce': 'net_increase_in_cce', // 现金及现金等价物净增加额
  'effect_of_exchange_chg_on_cce': 'effect_of_exchange_chg_on_cce', // 汇率变动对现金影响
};

// 需要在CN系统中新增的字段
export const CN_ADDITIONAL_FIELDS: { [key: string]: { name: string; unit: string } } = {
  // 资产负债表新增字段
  'fixed_asset_original': { name: '固定资产原值', unit: '亿元' },
  'accumulated_depreciation': { name: '累计折旧', unit: '亿元' },
  'accumulated_amortization': { name: '累计摊销', unit: '亿元' },
  'deferred_revenue_noncurrent': { name: '递延收益(非流动)', unit: '亿元' },
  
  // 利润表新增字段
  'gross_profit': { name: '毛利润', unit: '亿元' },
  'gross_profit_us': { name: '毛利润(US)', unit: '亿元' },
  'othr_operating_expenses': { name: '其他营业费用', unit: '亿元' },
  'op_include_finance': { name: '营业利润(含财务费用)', unit: '亿元' },
  'income_tax_current': { name: '当期所得税费用', unit: '亿元' },
  'depreciation_amortization': { name: '折旧与摊销', unit: '亿元' },
  'dividend_per_share': { name: '每股股利', unit: '元/股' },
  'common_dividend': { name: '普通股股利', unit: '亿元' },
  'non_recurring_items': { name: '非经常性损益', unit: '亿元' },
  'preferred_dividend_us': { name: '优先股股利(US)', unit: '亿元' },
  
  // 现金流量表新增字段
  'depreciation_amortization_cf': { name: '折旧与摊销(现金流)', unit: '亿元' },
  'depreciation_amortization_us': { name: '折旧与摊销(US)', unit: '亿元' },
  'working_capital_change': { name: '营运资金变动', unit: '亿元' },
  'interest_received_cash': { name: '收到利息现金', unit: '亿元' },
  'interest_paid_cash': { name: '支付利息现金', unit: '亿元' },
  'financial_instrument_invest': { name: '金融工具投资', unit: '亿元' },
  'financial_instrument_disposal': { name: '金融工具处置', unit: '亿元' },
  'stock_repurchase_cash': { name: '回购股票支付现金', unit: '亿元' },
};

// 映射函数
export function mapUsToCnFields(usData: any, statementType: 'balance' | 'income' | 'cashflow'): any {
  const mappingDict = {
    'balance': US_TO_CN_BALANCE_SHEET_MAPPING,
    'income': US_TO_CN_INCOME_STATEMENT_MAPPING,
    'cashflow': US_TO_CN_CASH_FLOW_MAPPING
  };
  
  const mapping = mappingDict[statementType];
  if (!mapping) {
    return usData;
  }
  
  const cnData: any = {};
  
  // 必须保留的系统字段（数据库操作需要，但前端不展示）
  const systemFields = ['report_date', 'report_name'];
  
  for (const [usField, value] of Object.entries(usData)) {
    const cnField = mapping[usField];
    if (cnField) {  // 只保留有映射关系且不为null的字段
      cnData[cnField] = value;
    } else if (cnField === null) {
      // 非财务字段，检查是否为必需的系统字段
      if (systemFields.includes(usField)) {
        // 系统字段必须保留，数据库操作需要
        cnData[usField] = value;
      }
      // 其他非财务字段过滤掉，不在前端展示
    } else {
      // 如果映射表中没有定义，保留原字段
      cnData[usField] = value;
    }
  }
  
  return cnData;
} 