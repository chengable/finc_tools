// 港股(HK)到内地(CN)字段映射

// 资产负债表映射 - HK to CN
export const HK_TO_CN_BALANCE_SHEET_MAPPING: { [key: string]: string | null } = {
  // 非财务字段（前端可不展示）
  'report_date': null,  // 不映射到前端展示
  'report_name': null,
  'month_num': null,
  'sd': null,
  'ed': null,
  'rptsourefc': null,
  
  // 资产类
  'ta': 'total_assets',                    // 资产总计
  'ca': 'total_current_assets',            // 流动资产
  'tnca': 'total_noncurrent_assets',       // 非流动资产合计
  'miint': 'currency_funds',               // 货币资金
  'cceq': 'currency_funds',                // 货币资金等价物（与miint合并）
  'rpaculo': 'account_receivable',         // 应收账款
  'otrx': 'othr_receivables',              // 其他应收款
  'inv': 'inventory',                      // 存货
  'otca': 'othr_current_assets',           // 其他流动资产
  'fxda': 'fixed_asset',                   // 固定资产
  'iga': 'intangible_assets',              // 无形资产
  'iv': 'lt_equity_invest',                // 投资（映射为长期股权投资）
  'fina': 'tradable_fnncl_assets',         // 金融资产（映射为交易性金融资产）
  'otnca': 'othr_noncurrent_assets',       // 其他非流动资产
  
  // 负债类
  'tlia': 'total_liab',                    // 负债总计
  'clia': 'total_current_liab',            // 流动负债合计
  'tnclia': 'total_noncurrent_liab',       // 非流动负债合计
  'stdt': 'st_loan',                       // 短期借款
  'trpy': 'accounts_payable',              // 应付账款
  'otstdt': 'othr_current_liab',           // 其他短期负债
  'ltdt': 'lt_loan',                       // 长期借款
  'otltlia': 'othr_non_current_liab',      // 其他长期负债
  
  // 所有者权益类
  'teqy': 'total_holders_equity',          // 所有者权益合计
  'shpm': 'total_holders_equity',          // 股东权益（重复字段）
  'shhfd': 'total_holders_equity',         // 股东权益合计（重复字段）
  'caprx': 'capital_reserve',              // 资本公积
  'trrb': 'undstrbtd_profit',              // 未分配利润
  
  // 计算字段
  'ncalia': 'total_holders_equity',        // 净资产（等同于所有者权益）
  'nalia': 'total_liab',                   // 负债合计（重复字段）
  'diftatclia': null,                      // 资产负债差额（可计算得出，不需要单独字段）
  'ta_tlia': 'asset_liab_ratio',           // 资产负债率
  
  // 其他
  'numtsh': 'shares',                      // 总股本数量
  'trx': 'revenue',                        // 营业收入（跨表映射）
  'otnc': null,                           // 其他非流动（含义不明确，暂不映射）
};

// 利润表映射 - HK to CN
export const HK_TO_CN_INCOME_STATEMENT_MAPPING: { [key: string]: string | null } = {
  // 非财务字段（前端可不展示）
  'report_date': null,
  'report_name': null,
  'month_num': null,
  'sd': null,
  'ed': null,
  'rptsourefc': null,
  
  // 收入项目
  'sr_ta': 'revenue',                      // 营业收入
  'tto': 'total_revenue',                  // 营业总收入
  'otiog': 'other_income',                 // 其他营业收入
  
  // 成本项目
  'slgcost': 'operating_cost',             // 营业成本
  'fcgcost': 'operating_cost',             // 主营业务成本（与营业成本合并）
  
  // 毛利润（需要计算：营业收入-营业成本）
  'gp': 'gross_profit',                    // 毛利润
  
  // 费用项目
  'topeexp': 'operating_costs',            // 营业费用合计
  'slgdstexp': 'sales_fee',                // 销售费用
  'admexp': 'manage_fee',                  // 管理费用
  'rshdevexp': 'rad_cost',                 // 研发费用
  'otopeexp': 'othr_operating_expenses',   // 其他营业费用
  
  // 利润项目
  'opeplo': 'op',                          // 营业利润
  'opeploinclfincost': 'op_include_finance', // 营业利润(含财务费用)
  'plobtx': 'profit_total_amt',            // 利润总额(税前利润)
  'plocyr': 'net_profit',                  // 净利润
  'ploashh': 'net_profit_atsopc',          // 归属股东净利润
  
  // 税收相关
  'tx': 'income_tax_expenses',             // 所得税费用
  'txexcliotx': 'income_tax_current',      // 所得税费用(不含递延)
  
  // 折旧摊销
  'depaz': 'depreciation_amortization',    // 折旧与摊销
  
  // 股本及每股收益
  'amteqyhdcom': 'shares',                 // 普通股股本
  'beps_aju': 'basic_eps',                 // 基本每股收益(调整后)
  'deps_aju': 'dlt_earnings_per_share',    // 稀释每股收益(调整后)
  'divdbups_ajupd': 'dividend_per_share',  // 每股股利(调整后)
  
  // 现金流相关（这些字段应该在现金流量表中）
  'tcphio': 'ncf_from_oa',                 // 经营活动现金流量（跨表映射）
  'otcphio': 'other_cash_flow',            // 其他现金流量（跨表映射）
  'amtmiint': 'finance_cost_interest_income', // 利息收支净额
  
  // 股利分配
  'cmnshdiv': 'common_dividend',           // 普通股股利
  
  // 其他项目
  'nosplitems': 'non_recurring_items',     // 非经常性损益
  'jtctletiascom': 'invest_incomes_from_rr', // 联营企业投资收益
  'tipmcgpvs': 'invest_income',            // 投资收益
  'npdsubu': 'minority_gal',               // 少数股东损益
};

// 现金流量表映射 - HK to CN
export const HK_TO_CN_CASH_FLOW_MAPPING: { [key: string]: string | null } = {
  // 非财务字段（前端可不展示）
  'report_date': null,
  'report_name': null,
  'month_num': null,
  'sd': null,
  'ed': null,
  'rptsourefc': null,
  
  // 现金流量净额
  'nocf': 'ncf_from_oa',                   // 经营活动现金流量净额
  'ninvcf': 'ncf_from_ia',                 // 投资活动现金流量净额
  'nfcgcf': 'ncf_from_fa',                 // 融资活动现金流量净额
  
  // 经营活动现金流量
  'depaz': 'depreciation_amortization_cf', // 折旧与摊销（现金流量表版本）
  
  // 投资活动现金流量
  'ncfrldpty_invact': 'ncf_from_ia',       // 投资活动现金流量（重复字段）
  'icinv': 'cash_received_of_dspsl_invest', // 投资现金流入
  'dcinv': 'invest_paid_cash',             // 投资现金流出
  'adtfxda': 'cash_paid_for_assets',       // 购建固定资产支付现金
  'dsfxda': 'net_cash_of_disposal_assets', // 处置固定资产收到现金
  
  // 融资活动现金流量
  'ncfrldpty_finact': 'ncf_from_fa',       // 融资活动现金流量（重复字段）
  'eqyfin': 'cash_received_of_absorb_invest', // 股权融资收到现金
  'nicln': 'cash_received_of_borrowing',   // 取得借款收到现金
  'lnrpa': 'cash_pay_for_debt',            // 偿还债务支付现金
  'divp': 'cash_paid_of_distribution',     // 分配股利支付现金
  'divrc': 'invest_income_cash_received',  // 收到股利现金
  'intrc': 'interest_received_cash',       // 收到利息现金
  'intp': 'interest_paid_cash',            // 支付利息现金
  
  // 金融工具相关
  'fxdiodtinstr': 'financial_instrument_invest', // 金融工具投资
  'rpafxdiodtinstr': 'financial_instrument_disposal', // 金融工具处置
  
  // 现金及现金等价物
  'cceqbegyr': 'initial_balance_of_cce',   // 期初现金及现金等价物
  'cceqeyr': 'final_balance_of_cce',       // 期末现金及现金等价物
  'icdccceq': 'net_increase_in_cce',       // 现金及现金等价物净增加额
  
  // 其他项目
  'ncfdchexrateot': 'effect_of_exchange_chg_on_cce', // 汇率变动对现金影响
  'txprf': 'profit_total_amt',             // 税前利润（跨表映射）
};

// 映射函数
export function mapHkToCnFields(hkData: any, statementType: 'balance' | 'income' | 'cashflow'): any {
  const mappingDict = {
    'balance': HK_TO_CN_BALANCE_SHEET_MAPPING,
    'income': HK_TO_CN_INCOME_STATEMENT_MAPPING,
    'cashflow': HK_TO_CN_CASH_FLOW_MAPPING
  };
  
  const mapping = mappingDict[statementType];
  if (!mapping) {
    return hkData;
  }
  
  const cnData: any = {};
  
  // 必须保留的系统字段（数据库操作需要，但前端不展示）
  const systemFields = ['report_date', 'report_name'];
  
  for (const [hkField, value] of Object.entries(hkData)) {
    const cnField = mapping[hkField];
    if (cnField) {  // 只保留有映射关系且不为null的字段
      cnData[cnField] = value;
    } else if (cnField === null) {
      // 非财务字段，检查是否为必需的系统字段
      if (systemFields.includes(hkField)) {
        // 系统字段必须保留，数据库操作需要
        cnData[hkField] = value;
      }
      // 其他非财务字段过滤掉，不在前端展示
    } else {
      // 如果映射表中没有定义，保留原字段
      cnData[hkField] = value;
    }
  }
  
  return cnData;
} 