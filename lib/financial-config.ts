// 需要过滤掉的字段
export const EXCLUDED_FIELDS = ['report_date', 'report_name', 'ctime'];

// 财务数据字段中文名称映射
export const FINANCIAL_DATA_NAMES: { [key: string]: string } = {
  // 资产负债表
  'total_assets': '资产总计',
  'total_current_assets': '流动资产合计',
  'total_noncurrent_assets': '非流动资产合计',
  'current_assets': '流动资产',
  'non_current_assets': '非流动资产',
  'currency_funds': '货币资金',
  'cash_and_equivalents': '现金及现金等价物',
  'tradable_fnncl_assets': '交易性金融资产',
  'bills_receivable': '应收票据',
  'account_receivable': '应收账款',
  'accounts_receivable': '应收账款',
  'ar_and_br': '应收票据及应收账款',
  'pre_payment': '预付款项',
  'dividend_receivable': '应收股利',
  'interest_receivable': '应收利息',
  'othr_receivables': '其他应收款',
  'inventory': '存货',
  'contractual_assets': '合同资产',
  'nca_due_within_one_year': '一年内到期的非流动资产',
  'othr_current_assets': '其他流动资产',
  'to_sale_asset': '持有待售资产',
  'saleable_finacial_assets': '可供出售金融资产',
  'salable_financial_assets': '可供出售金融资产',
  'held_to_maturity_invest': '持有至到期投资',
  'lt_receivable': '长期应收款',
  'lt_equity_invest': '长期股权投资',
  'other_eq_ins_invest': '其他权益工具投资',
  'other_illiquid_fnncl_assets': '其他非流动金融资产',
  'invest_property': '投资性房地产',
  'fixed_asset': '固定资产',
  'fixed_assets': '固定资产',
  'fixed_asset_sum': '固定资产合计',
  'fixed_assets_disposal': '固定资产清理',
  'construction_in_process': '在建工程',
  'construction_in_process_sum': '在建工程合计',
  'project_goods_and_material': '工程物资',
  'productive_biological_assets': '生产性生物资产',
  'oil_and_gas_asset': '油气资产',
  'intangible_assets': '无形资产',
  'dev_expenditure': '开发支出',
  'goodwill': '商誉',
  'lt_deferred_expense': '长期待摊费用',
  'dt_assets': '递延所得税资产',
  'othr_noncurrent_assets': '其他非流动资产',
  'total_liabilities': '负债合计',
  'total_liab': '负债合计',
  'total_current_liab': '流动负债合计',
  'total_noncurrent_liab': '非流动负债合计',
  'current_liabilities': '流动负债',
  'non_current_liabilities': '非流动负债',
  'st_loan': '短期借款',
  'short_term_debt': '短期借款',
  'tradable_fnncl_liab': '交易性金融负债',
  'derivative_fnncl_liab': '衍生金融负债',
  'bill_payable': '应付票据',
  'accounts_payable': '应付账款',
  'bp_and_ap': '应付票据及应付账款',
  'pre_receivable': '预收款项',
  'contract_liabilities': '合同负债',
  'payroll_payable': '应付职工薪酬',
  'tax_payable': '应交税费',
  'interest_payable': '应付利息',
  'dividend_payable': '应付股利',
  'othr_payables': '其他应付款',
  'noncurrent_liab_due_in1y': '一年内到期的非流动负债',
  'othr_current_liab': '其他流动负债',
  'to_sale_debt': '持有待售负债',
  'lt_loan': '长期借款',
  'long_term_debt': '长期借款',
  'bond_payable': '应付债券',
  'perpetual_bond': '永续债',
  'lt_payable': '长期应付款',
  'lt_payroll_payable': '长期应付职工薪酬',
  'estimate_liab': '预计负债',
  'dt_liab': '递延所得税负债',
  'othr_noncurrent_liab': '其他非流动负债',
  'total_equity': '所有者权益合计',
  'total_holder_equity': '股东权益合计',
  'paid_in_capital': '实收资本',
  'share_capital': '股本',
  'othr_equity_ins': '其他权益工具',
  'preferred_shares': '优先股',
  'preferred_share': '优先股',
  'capital_reserve_fund': '资本公积',
  'treasury_shares': '库存股',
  'othr_compre_income': '其他综合收益',
  'specific_reserves': '专项储备',
  'surplus_reserve_fund': '盈余公积',
  'retained_profit': '未分配利润',
  'retained_earnings': '留存收益',
  'minority_interests': '少数股东权益',

  // 港股和美股映射新增字段的中文名称
  'gross_profit_us': '毛利润(US)',
  'othr_operating_expenses': '其他营业费用',
  'op_include_finance': '营业利润(含财务费用)',
  'income_tax_current': '当期所得税费用',
  'depreciation_amortization': '折旧与摊销',
  'dividend_per_share': '每股股利',
  'common_dividend': '普通股股利',
  'non_recurring_items': '非经常性损益',
  'depreciation_amortization_cf': '折旧与摊销(现金流)',
  'interest_received_cash': '收到利息现金',
  'interest_paid_cash': '支付利息现金',
  'financial_instrument_invest': '金融工具投资',
  'financial_instrument_disposal': '金融工具处置',
  'other_cash_flow': '其他现金流量',
  'fixed_asset_original': '固定资产原值',
  'accumulated_depreciation': '累计折旧',
  'accumulated_amortization': '累计摊销',
  'deferred_revenue_noncurrent': '递延收益(非流动)',
  'depreciation_amortization_us': '折旧与摊销(US)',
  'working_capital_change': '营运资金变动',
  'stock_repurchase_cash': '回购股票支付现金',
  'preferred_dividend_us': '优先股股利(US)',

  // 利润表
  'total_revenue': '营业收入',
  'operating_revenue': '营业收入',
  'revenue': '营业收入',
  'cost_of_revenue': '营业成本',
  'operating_costs': '营业成本',
  'operating_cost': '营业成本',
  'gross_profit': '毛利润',
  'operating_expenses': '营业费用',
  'selling_expenses': '销售费用',
  'sales_fee': '销售费用',
  'admin_expenses': '管理费用',
  'manage_fee': '管理费用',
  'rd_expenses': '研发费用',
  'rad_cost': '研发费用',
  'financial_expenses': '财务费用',
  'financing_expenses': '财务费用',
  'finance_cost_interest_fee': '财务费用-利息支出',
  'finance_cost_interest_income': '财务费用-利息收入',
  'operating_profit': '营业利润',
  'op': '营业利润',
  'non_operating_income': '营业外收入',
  'non_operating_payout': '营业外支出',
  'non_operating_expenses': '营业外支出',
  'profit_before_tax': '利润总额',
  'profit_total_amt': '利润总额',
  'income_tax': '所得税费用',
  'income_tax_expenses': '所得税费用',
  'net_profit': '净利润',
  'net_profit_atsopc': '归属于母公司所有者的净利润',
  'net_profit_bi': '净利润',
  'net_profit_after_nrgal_atsolc': '扣除非经常性损益后的净利润',
  'continous_operating_np': '持续经营净利润',
  'basic_eps': '基本每股收益',
  'diluted_eps': '稀释每股收益',
  'dlt_earnings_per_share': '稀释每股收益',
  'minority_gal': '少数股东损益',
  'income_from_chg_in_fv': '公允价值变动收益',
  'invest_incomes_from_rr': '投资收益',
  'invest_income': '投资收益',
  'exchg_gain': '汇兑收益',
  'operating_taxes_and_surcharge': '税金及附加',
  'asset_impairment_loss': '资产减值损失',
  'credit_impairment_loss': '信用减值损失',
  'asset_disposal_income': '资产处置收益',
  'other_income': '其他收益',
  'noncurrent_assets_dispose_gain': '非流动资产处置利得',
  'noncurrent_asset_disposal_loss': '非流动资产处置损失',
  'total_compre_income': '综合收益总额',
  'total_compre_income_atsopc': '归属于母公司所有者的综合收益总额',
  'total_compre_income_atms': '归属于少数股东的综合收益总额',
  'othr_compre_income_atoopc': '归属于母公司所有者的其他综合收益',
  'othr_compre_income_atms': '归属于少数股东的其他综合收益',

  // 现金流量表
  'operating_cash_flow': '经营活动现金流量净额',
  'ncf_from_oa': '经营活动现金流量净额',
  'investing_cash_flow': '投资活动现金流量净额',
  'ncf_from_ia': '投资活动现金流量净额',
  'financing_cash_flow': '筹资活动现金流量净额',
  'ncf_from_fa': '筹资活动现金流量净额',
  'net_cash_flow': '现金及现金等价物净增加额',
  'net_increase_in_cce': '现金及现金等价物净增加额',
  'cash_from_operations': '经营活动产生的现金流量',
  'cash_from_investing': '投资活动产生的现金流量',
  'cash_from_financing': '筹资活动产生的现金流量',
  'free_cash_flow': '自由现金流',
  'capex': '资本支出',
  'depreciation': '折旧摊销',
  'cash_received_of_sales_service': '销售商品、提供劳务收到的现金',
  'refund_of_tax_and_levies': '收到的税费返还',
  'cash_received_of_othr_oa': '收到其他与经营活动有关的现金',
  'sub_total_of_ci_from_oa': '经营活动现金流入小计',
  'goods_buy_and_service_cash_pay': '购买商品、接受劳务支付的现金',
  'cash_paid_to_employee_etc': '支付给职工以及为职工支付的现金',
  'payments_of_all_taxes': '支付的各项税费',
  'othrcash_paid_relating_to_oa': '支付其他与经营活动有关的现金',
  'sub_total_of_cos_from_oa': '经营活动现金流出小计',
  'cash_received_of_dspsl_invest': '收回投资收到的现金',
  'invest_income_cash_received': '取得投资收益收到的现金',
  'net_cash_of_disposal_assets': '处置固定资产、无形资产和其他长期资产收回的现金净额',
  'net_cash_of_disposal_branch': '处置子公司及其他营业单位收到的现金净额',
  'cash_received_of_othr_ia': '收到其他与投资活动有关的现金',
  'sub_total_of_ci_from_ia': '投资活动现金流入小计',
  'invest_paid_cash': '投资支付的现金',
  'cash_paid_for_assets': '购建固定资产、无形资产和其他长期资产支付的现金',
  'othrcash_paid_relating_to_ia': '支付其他与投资活动有关的现金',
  'sub_total_of_cos_from_ia': '投资活动现金流出小计',
  'cash_received_of_absorb_invest': '吸收投资收到的现金',
  'cash_received_from_investor': '其中：子公司吸收少数股东投资收到的现金',
  'cash_received_from_bond_issue': '发行债券收到的现金',
  'cash_received_of_borrowing': '取得借款收到的现金',
  'cash_received_of_othr_fa': '收到其他与筹资活动有关的现金',
  'sub_total_of_ci_from_fa': '筹资活动现金流入小计',
  'cash_pay_for_debt': '偿还债务支付的现金',
  'cash_paid_of_distribution': '分配股利、利润或偿付利息支付的现金',
  'branch_paid_to_minority_holder': '其中：子公司支付给少数股东的股利、利润',
  'othrcash_paid_relating_to_fa': '支付其他与筹资活动有关的现金',
  'sub_total_of_cos_from_fa': '筹资活动现金流出小计',
  'effect_of_exchange_chg_on_cce': '汇率变动对现金及现金等价物的影响',
  'initial_balance_of_cce': '期初现金及现金等价物余额',
  'final_balance_of_cce': '期末现金及现金等价物余额',
  'net_cash_amt_from_branch': '处置子公司及其他营业单位收到的现金净额',

  // 补充缺失的字段翻译
  'shares': '股本',
  'capital_reserve': '资本公积',
  'earned_surplus': '盈余公积',
  'undstrbtd_profit': '未分配利润',
  'minority_equity': '少数股东权益',
  'total_holders_equity': '股东权益合计',
  'total_liab_and_holders_equity': '负债和股东权益总计',
  'asset_liab_ratio': '资产负债率',
  'total_quity_atsopc': '归属于母公司所有者权益合计',
  'estimated_liab': '预计负债',
  'general_risk_provision': '一般风险准备',
  'frgn_currency_convert_diff': '外币报表折算差额',
  'total_assets_less_current_liab': '资产总计减流动负债',
  'total_non_current_liab': '非流动负债合计',
  'total_current_liab_and_equity': '流动负债和所有者权益合计',
  'total_liab_and_equity': '负债和所有者权益总计',
  'total_equity_atsopc': '归属于母公司所有者权益',
  'total_equity_atms': '少数股东权益',
  'total_hldr_eqy_exc_min_int': '股东权益合计(不含少数股东权益)',
  'total_hldr_eqy_inc_min_int': '股东权益合计(含少数股东权益)',
  'total_cptl': '实收资本(或股本)',
  'cptl_rsrv': '资本公积金',
  'surplus_rsrv': '盈余公积金',
  'undistributed_profit': '未分配利润',
  'treasury_stock': '减：库存股',

  // 最后一批未翻译字段
  'othr_equity_instruments': '其他权益工具',
  'current_assets_si': '流动资产特殊项目',
  'noncurrent_assets_si': '非流动资产特殊项目',
  'current_liab_si': '流动负债特殊项目',
  'special_payable': '专项应付款',
  'othr_non_current_liab': '其他非流动负债',
  'noncurrent_liab_si': '非流动负债特殊项目',
  'lt_payable_sum': '长期应付款合计',
  'noncurrent_liab_di': '非流动负债差额(特殊报表科目)',
  'special_reserve': '专项储备',

  // 银行业特有资产负债表字段
  'central_bank_cash_and_deposit': '存放央行款项',
  'interbank_storage': '存放同业',
  'precious_metal': '贵金属',
  'lending_fund': '拆出资金',
  'buy_resale_fnncl_assets': '买入返售金融资产',
  'disbursement_loan_and_advance': '发放贷款和垫款',
  'receivable_invest': '应收款项投资',
  'derivative_fnncl_assets': '衍生金融资产',
  'othr_assets': '其他资产',
  'asset_si': '资产特殊项目',
  'loan_from_central_bank': '向央行借款',
  'interbank_deposit_etc': '同业及其他金融机构存放款项',
  'borrowing_funds': '拆入资金',
  'fnncl_assets_sold_for_repur': '卖出回购金融资产款',
  'savings_absorption': '吸收存款',
  'othr_liab': '其他负债',
  'liab_si': '负债特殊项目',
  'amortized_cost_fnncl_assets': '以摊余成本计量的金融资产',
  'fv_chg_income_fnncl_assets': '以公允价值计量且其变动计入当期损益的金融资产',

  // 银行业特有利润表字段
  'interest_net_income': '利息净收入',
  'interest_income': '利息收入',
  'interest_payout': '利息支出',
  'commi_net_income': '手续费及佣金净收入',
  'fee_and_commi_income': '手续费及佣金收入',
  'charge_and_commi_expenses': '手续费及佣金支出',
  'operating_payout': '业务及管理费',
  'business_and_manage_fee': '业务及管理费',
  'othr_business_costs': '其他业务成本',
  'othr_income': '其他业务收入',

  // 银行业特有现金流表字段
  'deposit_and_interbank_net_add': '客户存款和同业存放款项净增加额',
  'borrowing_net_add_central_bank': '向央行借款净增加额',
  'lending_net_add_other_org': '向其他金融机构拆入资金净增加额',
  'cash_received_of_interest_etc': '收取利息、手续费及佣金的现金',
  'loan_and_advance_net_add': '客户贷款及垫款净增加额',
  'naa_of_cb_and_interbank': '存放央行和同业款项净增加额',
  'cash_paid_for_interests_etc': '支付利息、手续费及佣金的现金',

  // 补充缺失的财务数据字段翻译
  'receivable': '应收款项',
  'total_invest': '投资合计',
  'payable': '应付款项',
  'st_borrowing': '短期借款',
  'depreciation_and_amortization': '折旧与摊销',
  'total_expense_special_subject': '费用特殊科目合计',
  'total_expense': '费用合计'
};

// 财务指标字段中文名称映射
export const FINANCIAL_INDICATORS_NAMES: { [key: string]: string } = {
  // 盈利能力指标
  'grossProfitMargin': '毛利率',
  'operatingProfitMargin': '营业利润率',
  'netProfitMargin': '净利润率',
  'preTaxProfitMargin': '税前利润率',
  'salesExpenseRatio': '销售费用率',
  'managementExpenseRatio': '管理费用率',
  'rdExpenseRatio': '研发费用率',
  'financialExpenseRatio': '财务费用率',
  'periodExpenseRatio': '期间费用率',
  'roa': '总资产收益率',
  'roe': '净资产收益率',
  'roic': '投入资本回报率',
  'ebitda_margin': 'EBITDA利润率',
  'totalAssetNetProfitRatio': '总资产净利润率',
  'netAssetNetProfitRatio': '净资产净利润率',
  'basicEps': '基本每股收益',
  'dilutedEps': '稀释每股收益',
  'revenuePerShare': '每股营业收入',
  'netAssetPerShare': '每股净资产',
  
  // 现金流量指标
  'operatingCashFlow': '经营活动现金流量净额',
  'investingCashFlow': '投资活动现金流量净额',
  'financingCashFlow': '筹资活动现金流量净额',
  'netCashIncrease': '现金及现金等价物净增加额',
  'operatingCashFlowToNetProfit': '经营现金流与净利润比',
  'operatingCashFlowToRevenue': '经营现金流与收入比',
  'cashReceiptRatio': '现金收入比',
  'cashCostRatio': '现金成本比',
  'capexToTotalAssets': '资本支出与总资产比',
  'finalCashBalance': '期末现金余额',
  'cashRatio': '现金比率',
  'cashEquivalentsRatio': '现金及现金等价物比率',
  'cashToTotalAssets': '现金与总资产比',
  
  // 偿债能力指标
  'currentRatio': '流动比率',
  'quickRatio': '速动比率',
  'workingCapital': '营运资金',
  'debtToAssetRatio': '资产负债率',
  'equityMultiplier': '权益乘数',
  'debtToEquityRatio': '产权比率',
  'longTermDebtRatio': '长期负债比率',
  'debtEquityRatio': '负债权益比',
  'interestCoverageRatio': '利息保障倍数',
  'cashInterestCoverageRatio': '现金利息保障倍数',
  
  // 运营效率指标
  'totalAssetTurnover': '总资产周转率',
  'currentAssetTurnover': '流动资产周转率',
  'receivablesTurnover': '应收账款周转率',
  'inventoryTurnover': '存货周转率',
  'receivablesTurnoverDays': '应收账款周转天数',
  'inventoryTurnoverDays': '存货周转天数',
  'payablesTurnoverDays': '应付账款周转天数',
  'receivablesToRevenue': '应收账款与收入比',
  'inventoryToRevenue': '存货与收入比',
  'prepaymentToRevenue': '预付款项与收入比',
  
  // 成长能力指标
  'revenueGrowthRate': '营业收入增长率',
  'netProfitGrowthRate': '净利润增长率',
  'operatingProfitGrowthRate': '营业利润增长率',
  'totalAssetGrowthRate': '总资产增长率',
  'netAssetGrowthRate': '净资产增长率',
  'fixedAssetGrowthRate': '固定资产增长率',
  
  // 杜邦分析指标 - 使用不同的键名避免重复
  'dupont_roe': '杜邦ROE',
  'dupont_netProfitMargin': '杜邦销售净利率',
  'dupont_totalAssetTurnover': '杜邦总资产周转率',
  'dupont_equityMultiplier': '杜邦权益乘数',
  'dupont_roa': '杜邦总资产收益率',
  
  // 财务质量指标
  'quality_operatingCashFlowToNetProfit': '经营现金流与净利润比',
  'operatingProfitToTotalProfit': '营业利润与利润总额比',
  'coreNetProfitMargin': '核心净利润率',
  'currentAssetToTotalAsset': '流动资产与总资产比',
  'cashToTotalAsset': '现金与总资产比',
  'quality_receivablesToRevenue': '应收账款与收入比',
  'inventoryToOperatingCost': '存货与营业成本比',
  
  // 市场估值指标
  'valuation_netAssetPerShare': '每股净资产',
  'operatingCashFlowPerShare': '每股经营现金流',
  'equityRatio': '股东权益比率',
  
  // 财务风险指标
  'risk_currentRatio': '流动比率',
  'risk_debtToAssetRatio': '资产负债率',
  'cashDebtRatio': '现金债务比',
  'debtCoverageRatio': '债务覆盖率',
  'risk_rdExpenseRatio': '研发费用率',

  // 补充缺失的财务指标翻译
  'fixedAssetTurnover': '固定资产周转率',
  'cashConversionCycle': '现金转换周期'
};

// 字段单位配置
export const FIELD_UNITS: { [key: string]: { unit: string; scale: number; type: 'amount' | 'ratio' | 'times' | 'days' | 'percentage' | 'decimal_to_percentage' } } = {
  // 金额类字段 - 单位：亿元，需要除以100000000
  'total_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_current_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_noncurrent_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'current_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'non_current_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'currency_funds': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_and_equivalents': { unit: '亿元', scale: 100000000, type: 'amount' },
  'tradable_fnncl_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'bills_receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'account_receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'accounts_receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'ar_and_br': { unit: '亿元', scale: 100000000, type: 'amount' },
  'pre_payment': { unit: '亿元', scale: 100000000, type: 'amount' },
  'dividend_receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interest_receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_receivables': { unit: '亿元', scale: 100000000, type: 'amount' },
  'inventory': { unit: '亿元', scale: 100000000, type: 'amount' },
  'contractual_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'nca_due_within_one_year': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_current_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'to_sale_asset': { unit: '亿元', scale: 100000000, type: 'amount' },
  'saleable_finacial_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'salable_financial_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'held_to_maturity_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lt_receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lt_equity_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'other_eq_ins_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'other_illiquid_fnncl_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'invest_property': { unit: '亿元', scale: 100000000, type: 'amount' },
  'fixed_asset': { unit: '亿元', scale: 100000000, type: 'amount' },
  'fixed_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'fixed_asset_sum': { unit: '亿元', scale: 100000000, type: 'amount' },
  'fixed_assets_disposal': { unit: '亿元', scale: 100000000, type: 'amount' },
  'construction_in_process': { unit: '亿元', scale: 100000000, type: 'amount' },
  'construction_in_process_sum': { unit: '亿元', scale: 100000000, type: 'amount' },
  'project_goods_and_material': { unit: '亿元', scale: 100000000, type: 'amount' },
  'productive_biological_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'oil_and_gas_asset': { unit: '亿元', scale: 100000000, type: 'amount' },
  'intangible_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'dev_expenditure': { unit: '亿元', scale: 100000000, type: 'amount' },
  'goodwill': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lt_deferred_expense': { unit: '亿元', scale: 100000000, type: 'amount' },
  'dt_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_noncurrent_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_liabilities': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_current_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_noncurrent_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'current_liabilities': { unit: '亿元', scale: 100000000, type: 'amount' },
  'non_current_liabilities': { unit: '亿元', scale: 100000000, type: 'amount' },
  'st_loan': { unit: '亿元', scale: 100000000, type: 'amount' },
  'short_term_debt': { unit: '亿元', scale: 100000000, type: 'amount' },
  'tradable_fnncl_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'derivative_fnncl_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'bill_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'accounts_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'bp_and_ap': { unit: '亿元', scale: 100000000, type: 'amount' },
  'pre_receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'contract_liabilities': { unit: '亿元', scale: 100000000, type: 'amount' },
  'payroll_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'tax_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interest_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'dividend_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_payables': { unit: '亿元', scale: 100000000, type: 'amount' },
  'noncurrent_liab_due_in1y': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_current_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'to_sale_debt': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lt_loan': { unit: '亿元', scale: 100000000, type: 'amount' },
  'long_term_debt': { unit: '亿元', scale: 100000000, type: 'amount' },
  'bond_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'perpetual_bond': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lt_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lt_payroll_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'estimate_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'dt_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_noncurrent_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_equity': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_holder_equity': { unit: '亿元', scale: 100000000, type: 'amount' },
  'paid_in_capital': { unit: '亿元', scale: 100000000, type: 'amount' },
  'share_capital': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_equity_ins': { unit: '亿元', scale: 100000000, type: 'amount' },
  'preferred_shares': { unit: '亿元', scale: 100000000, type: 'amount' },
  'preferred_share': { unit: '亿元', scale: 100000000, type: 'amount' },
  'capital_reserve_fund': { unit: '亿元', scale: 100000000, type: 'amount' },
  'treasury_shares': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_compre_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'specific_reserves': { unit: '亿元', scale: 100000000, type: 'amount' },
  'surplus_reserve_fund': { unit: '亿元', scale: 100000000, type: 'amount' },
  'retained_profit': { unit: '亿元', scale: 100000000, type: 'amount' },
  'retained_earnings': { unit: '亿元', scale: 100000000, type: 'amount' },
  'minority_interests': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 补充缺失字段的单位配置
  'shares': { unit: '亿元', scale: 100000000, type: 'amount' },
  'capital_reserve': { unit: '亿元', scale: 100000000, type: 'amount' },
  'earned_surplus': { unit: '亿元', scale: 100000000, type: 'amount' },
  'undstrbtd_profit': { unit: '亿元', scale: 100000000, type: 'amount' },
  'minority_equity': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_holders_equity': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_liab_and_holders_equity': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_cash_amt_from_branch': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 港股映射新增字段的单位配置
  'gross_profit_us': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_operating_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'op_include_finance': { unit: '亿元', scale: 100000000, type: 'amount' },
  'income_tax_current': { unit: '亿元', scale: 100000000, type: 'amount' },
  'depreciation_amortization': { unit: '亿元', scale: 100000000, type: 'amount' },
  'dividend_per_share': { unit: '元/股', scale: 1, type: 'amount' },
  'common_dividend': { unit: '亿元', scale: 100000000, type: 'amount' },
  'non_recurring_items': { unit: '亿元', scale: 100000000, type: 'amount' },
  'depreciation_amortization_cf': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interest_received_cash': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interest_paid_cash': { unit: '亿元', scale: 100000000, type: 'amount' },
  'financial_instrument_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'financial_instrument_disposal': { unit: '亿元', scale: 100000000, type: 'amount' },
  'other_cash_flow': { unit: '亿元', scale: 100000000, type: 'amount' },
  
  // 美股映射新增字段的单位配置
  'fixed_asset_original': { unit: '亿元', scale: 100000000, type: 'amount' },
  'accumulated_depreciation': { unit: '亿元', scale: 100000000, type: 'amount' },
  'accumulated_amortization': { unit: '亿元', scale: 100000000, type: 'amount' },
  'deferred_revenue_noncurrent': { unit: '亿元', scale: 100000000, type: 'amount' },
  'depreciation_amortization_us': { unit: '亿元', scale: 100000000, type: 'amount' },
  'working_capital_change': { unit: '亿元', scale: 100000000, type: 'amount' },
  'stock_repurchase_cash': { unit: '亿元', scale: 100000000, type: 'amount' },
  'preferred_dividend_us': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 补充更多缺失字段的单位配置
  'asset_liab_ratio': { unit: '%', scale: 1, type: 'ratio' },
  'total_quity_atsopc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'estimated_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'general_risk_provision': { unit: '亿元', scale: 100000000, type: 'amount' },
  'frgn_currency_convert_diff': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_assets_less_current_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_non_current_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_current_liab_and_equity': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_liab_and_equity': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_equity_atsopc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_equity_atms': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_hldr_eqy_exc_min_int': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_hldr_eqy_inc_min_int': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_cptl': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cptl_rsrv': { unit: '亿元', scale: 100000000, type: 'amount' },
  'surplus_rsrv': { unit: '亿元', scale: 100000000, type: 'amount' },
  'undistributed_profit': { unit: '亿元', scale: 100000000, type: 'amount' },
  'treasury_stock': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 最后一批字段的单位配置
  'othr_equity_instruments': { unit: '亿元', scale: 100000000, type: 'amount' },
  'current_assets_si': { unit: '亿元', scale: 100000000, type: 'amount' },
  'noncurrent_assets_si': { unit: '亿元', scale: 100000000, type: 'amount' },
  'current_liab_si': { unit: '亿元', scale: 100000000, type: 'amount' },
  'special_payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_non_current_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'noncurrent_liab_si': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lt_payable_sum': { unit: '亿元', scale: 100000000, type: 'amount' },
  'noncurrent_liab_di': { unit: '亿元', scale: 100000000, type: 'amount' },
  'special_reserve': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 利润表金额字段
  'total_revenue': { unit: '亿元', scale: 100000000, type: 'amount' },
  'operating_revenue': { unit: '亿元', scale: 100000000, type: 'amount' },
  'revenue': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cost_of_revenue': { unit: '亿元', scale: 100000000, type: 'amount' },
  'operating_costs': { unit: '亿元', scale: 100000000, type: 'amount' },
  'operating_cost': { unit: '亿元', scale: 100000000, type: 'amount' },
  'gross_profit': { unit: '亿元', scale: 100000000, type: 'amount' },
  'operating_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'selling_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'sales_fee': { unit: '亿元', scale: 100000000, type: 'amount' },
  'admin_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'manage_fee': { unit: '亿元', scale: 100000000, type: 'amount' },
  'rd_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'rad_cost': { unit: '亿元', scale: 100000000, type: 'amount' },
  'financial_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'financing_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'finance_cost_interest_fee': { unit: '亿元', scale: 100000000, type: 'amount' },
  'finance_cost_interest_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'operating_profit': { unit: '亿元', scale: 100000000, type: 'amount' },
  'op': { unit: '亿元', scale: 100000000, type: 'amount' },
  'non_operating_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'non_operating_payout': { unit: '亿元', scale: 100000000, type: 'amount' },
  'non_operating_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'profit_before_tax': { unit: '亿元', scale: 100000000, type: 'amount' },
  'profit_total_amt': { unit: '亿元', scale: 100000000, type: 'amount' },
  'income_tax': { unit: '亿元', scale: 100000000, type: 'amount' },
  'income_tax_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_profit': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_profit_atsopc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_profit_bi': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_profit_after_nrgal_atsolc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'continous_operating_np': { unit: '亿元', scale: 100000000, type: 'amount' },
  'minority_gal': { unit: '亿元', scale: 100000000, type: 'amount' },
  'income_from_chg_in_fv': { unit: '亿元', scale: 100000000, type: 'amount' },
  'invest_incomes_from_rr': { unit: '亿元', scale: 100000000, type: 'amount' },
  'invest_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'exchg_gain': { unit: '亿元', scale: 100000000, type: 'amount' },
  'operating_taxes_and_surcharge': { unit: '亿元', scale: 100000000, type: 'amount' },
  'asset_impairment_loss': { unit: '亿元', scale: 100000000, type: 'amount' },
  'credit_impairment_loss': { unit: '亿元', scale: 100000000, type: 'amount' },
  'asset_disposal_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'other_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'noncurrent_assets_dispose_gain': { unit: '亿元', scale: 100000000, type: 'amount' },
  'noncurrent_asset_disposal_loss': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_compre_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_compre_income_atsopc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_compre_income_atms': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_compre_income_atoopc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_compre_income_atms': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 现金流量表金额字段
  'operating_cash_flow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'ncf_from_oa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'investing_cash_flow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'ncf_from_ia': { unit: '亿元', scale: 100000000, type: 'amount' },
  'financing_cash_flow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'ncf_from_fa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_cash_flow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_increase_in_cce': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_from_operations': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_from_investing': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_from_financing': { unit: '亿元', scale: 100000000, type: 'amount' },
  'free_cash_flow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'capex': { unit: '亿元', scale: 100000000, type: 'amount' },
  'depreciation': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_sales_service': { unit: '亿元', scale: 100000000, type: 'amount' },
  'refund_of_tax_and_levies': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_othr_oa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'sub_total_of_ci_from_oa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'goods_buy_and_service_cash_pay': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_paid_to_employee_etc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'payments_of_all_taxes': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othrcash_paid_relating_to_oa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'sub_total_of_cos_from_oa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_dspsl_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'invest_income_cash_received': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_cash_of_disposal_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'net_cash_of_disposal_branch': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_othr_ia': { unit: '亿元', scale: 100000000, type: 'amount' },
  'sub_total_of_ci_from_ia': { unit: '亿元', scale: 100000000, type: 'amount' },
  'invest_paid_cash': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_paid_for_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othrcash_paid_relating_to_ia': { unit: '亿元', scale: 100000000, type: 'amount' },
  'sub_total_of_cos_from_ia': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_absorb_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_from_investor': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_from_bond_issue': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_borrowing': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_othr_fa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'sub_total_of_ci_from_fa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_pay_for_debt': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_paid_of_distribution': { unit: '亿元', scale: 100000000, type: 'amount' },
  'branch_paid_to_minority_holder': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othrcash_paid_relating_to_fa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'sub_total_of_cos_from_fa': { unit: '亿元', scale: 100000000, type: 'amount' },
  'effect_of_exchange_chg_on_cce': { unit: '亿元', scale: 100000000, type: 'amount' },
  'initial_balance_of_cce': { unit: '亿元', scale: 100000000, type: 'amount' },
  'final_balance_of_cce': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 每股收益类字段 - 单位：元/股
  'basic_eps': { unit: '元/股', scale: 1, type: 'amount' },
  'diluted_eps': { unit: '元/股', scale: 1, type: 'amount' },
  'dlt_earnings_per_share': { unit: '元/股', scale: 1, type: 'amount' },
  'basicEps': { unit: '元/股', scale: 1, type: 'amount' },
  'dilutedEps': { unit: '元/股', scale: 1, type: 'amount' },
  'revenuePerShare': { unit: '元/股', scale: 1, type: 'amount' },
  'netAssetPerShare': { unit: '元/股', scale: 1, type: 'amount' },
  'operatingCashFlowPerShare': { unit: '元/股', scale: 1, type: 'amount' },
  'valuation_netAssetPerShare': { unit: '元/股', scale: 1, type: 'amount' },

  // 比率类字段 - 单位：%，数据库存储为小数需要转换为百分比
  'grossProfitMargin': { unit: '%', scale: 1, type: 'percentage' },
  'operatingProfitMargin': { unit: '%', scale: 1, type: 'percentage' },
  'netProfitMargin': { unit: '%', scale: 1, type: 'percentage' },
  'preTaxProfitMargin': { unit: '%', scale: 1, type: 'percentage' },
  'salesExpenseRatio': { unit: '%', scale: 1, type: 'percentage' },
  'managementExpenseRatio': { unit: '%', scale: 1, type: 'percentage' },
  'rdExpenseRatio': { unit: '%', scale: 1, type: 'percentage' },
  'financialExpenseRatio': { unit: '%', scale: 1, type: 'percentage' },
  'periodExpenseRatio': { unit: '%', scale: 1, type: 'percentage' },
  'roa': { unit: '%', scale: 1, type: 'percentage' },
  'roe': { unit: '%', scale: 1, type: 'percentage' },
  'roic': { unit: '%', scale: 1, type: 'percentage' },
  'ebitda_margin': { unit: '%', scale: 1, type: 'percentage' },
  'totalAssetNetProfitRatio': { unit: '%', scale: 1, type: 'percentage' },
  'netAssetNetProfitRatio': { unit: '%', scale: 1, type: 'percentage' },
  'operatingCashFlowToNetProfit': { unit: '%', scale: 1, type: 'decimal_to_percentage' },
  'operatingCashFlowToRevenue': { unit: '%', scale: 1, type: 'percentage' },
  'cashReceiptRatio': { unit: '%', scale: 1, type: 'percentage' },
  'cashCostRatio': { unit: '%', scale: 1, type: 'percentage' },
  'capexToTotalAssets': { unit: '%', scale: 1, type: 'percentage' },
  'receivablesToRevenue': { unit: '%', scale: 1, type: 'percentage' },
  'inventoryToRevenue': { unit: '%', scale: 1, type: 'percentage' },
  'prepaymentToRevenue': { unit: '%', scale: 1, type: 'percentage' },
  'revenueGrowthRate': { unit: '%', scale: 1, type: 'percentage' },
  'netProfitGrowthRate': { unit: '%', scale: 1, type: 'percentage' },
  'operatingProfitGrowthRate': { unit: '%', scale: 1, type: 'percentage' },
  'totalAssetGrowthRate': { unit: '%', scale: 1, type: 'percentage' },
  'netAssetGrowthRate': { unit: '%', scale: 1, type: 'percentage' },
  'fixedAssetGrowthRate': { unit: '%', scale: 1, type: 'percentage' },
  'dupont_netProfitMargin': { unit: '%', scale: 1, type: 'percentage' },
  'dupont_roa': { unit: '%', scale: 1, type: 'percentage' },
  'dupont_roe': { unit: '%', scale: 1, type: 'percentage' },
  'quality_operatingCashFlowToNetProfit': { unit: '%', scale: 1, type: 'decimal_to_percentage' },
  'operatingProfitToTotalProfit': { unit: '%', scale: 1, type: 'percentage' },
  'coreNetProfitMargin': { unit: '%', scale: 1, type: 'percentage' },
  'currentAssetToTotalAsset': { unit: '%', scale: 1, type: 'percentage' },
  'cashToTotalAsset': { unit: '%', scale: 1, type: 'percentage' },
  'quality_receivablesToRevenue': { unit: '%', scale: 1, type: 'percentage' },
  'inventoryToOperatingCost': { unit: '%', scale: 1, type: 'percentage' },
  'equityRatio': { unit: '%', scale: 1, type: 'percentage' },
  'risk_rdExpenseRatio': { unit: '%', scale: 1, type: 'percentage' },

  // 资产负债率类 - 数据库存储为小数（如0.42），需要转换为百分比（42%）
  'debtToAssetRatio': { unit: '%', scale: 1, type: 'decimal_to_percentage' },
  'risk_debtToAssetRatio': { unit: '%', scale: 1, type: 'decimal_to_percentage' },

  // 比率类指标 - 现金比率用倍数，现金总资产比用百分比
  'cashRatio': { unit: '倍', scale: 1, type: 'times' },
  'cashEquivalentsRatio': { unit: '倍', scale: 1, type: 'times' },
  'cashToTotalAssets': { unit: '%', scale: 1, type: 'percentage' },
  'debtToEquityRatio': { unit: '倍', scale: 1, type: 'times' },
  'longTermDebtRatio': { unit: '倍', scale: 1, type: 'times' },
  'debtEquityRatio': { unit: '倍', scale: 1, type: 'times' },
  'cashDebtRatio': { unit: '倍', scale: 1, type: 'times' },
  'debtCoverageRatio': { unit: '倍', scale: 1, type: 'times' },

  // 倍数类字段 - 单位：倍
  'currentRatio': { unit: '倍', scale: 1, type: 'times' },
  'quickRatio': { unit: '倍', scale: 1, type: 'times' },
  'equityMultiplier': { unit: '倍', scale: 1, type: 'times' },
  'interestCoverageRatio': { unit: '倍', scale: 1, type: 'times' },
  'cashInterestCoverageRatio': { unit: '倍', scale: 1, type: 'times' },
  'totalAssetTurnover': { unit: '倍', scale: 1, type: 'times' },
  'currentAssetTurnover': { unit: '倍', scale: 1, type: 'times' },
  'receivablesTurnover': { unit: '倍', scale: 1, type: 'times' },
  'inventoryTurnover': { unit: '倍', scale: 1, type: 'times' },
  'fixedAssetTurnover': { unit: '倍', scale: 1, type: 'times' },
  'dupont_totalAssetTurnover': { unit: '倍', scale: 1, type: 'times' },
  'dupont_equityMultiplier': { unit: '倍', scale: 1, type: 'times' },
  'risk_currentRatio': { unit: '倍', scale: 1, type: 'times' },

  // 天数类字段 - 单位：天
  'receivablesTurnoverDays': { unit: '天', scale: 1, type: 'days' },
  'inventoryTurnoverDays': { unit: '天', scale: 1, type: 'days' },
  'payablesTurnoverDays': { unit: '天', scale: 1, type: 'days' },
  'cashConversionCycle': { unit: '天', scale: 1, type: 'days' },

  // 金额类财务指标字段 - 单位：亿元
  'operatingCashFlow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'investingCashFlow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'financingCashFlow': { unit: '亿元', scale: 100000000, type: 'amount' },
  'netCashIncrease': { unit: '亿元', scale: 100000000, type: 'amount' },
  'finalCashBalance': { unit: '亿元', scale: 100000000, type: 'amount' },
  'workingCapital': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 银行业特有字段 - 单位：亿元
  'central_bank_cash_and_deposit': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interbank_storage': { unit: '亿元', scale: 100000000, type: 'amount' },
  'precious_metal': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lending_fund': { unit: '亿元', scale: 100000000, type: 'amount' },
  'buy_resale_fnncl_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'disbursement_loan_and_advance': { unit: '亿元', scale: 100000000, type: 'amount' },
  'receivable_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'derivative_fnncl_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'loan_from_central_bank': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interbank_deposit_etc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'borrowing_funds': { unit: '亿元', scale: 100000000, type: 'amount' },
  'fnncl_assets_sold_for_repur': { unit: '亿元', scale: 100000000, type: 'amount' },
  'savings_absorption': { unit: '亿元', scale: 100000000, type: 'amount' },
  'amortized_cost_fnncl_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'fv_chg_income_fnncl_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interest_net_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interest_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'interest_payout': { unit: '亿元', scale: 100000000, type: 'amount' },
  'commi_net_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'fee_and_commi_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'charge_and_commi_expenses': { unit: '亿元', scale: 100000000, type: 'amount' },
  'operating_payout': { unit: '亿元', scale: 100000000, type: 'amount' },
  'business_and_manage_fee': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_business_costs': { unit: '亿元', scale: 100000000, type: 'amount' },
  'deposit_and_interbank_net_add': { unit: '亿元', scale: 100000000, type: 'amount' },
  'borrowing_net_add_central_bank': { unit: '亿元', scale: 100000000, type: 'amount' },
  'lending_net_add_other_org': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_received_of_interest_etc': { unit: '亿元', scale: 100000000, type: 'amount' },
  'loan_and_advance_net_add': { unit: '亿元', scale: 100000000, type: 'amount' },
  'naa_of_cb_and_interbank': { unit: '亿元', scale: 100000000, type: 'amount' },
  'cash_paid_for_interests_etc': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 补充遗漏的字段
  'othr_assets': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_liab': { unit: '亿元', scale: 100000000, type: 'amount' },
  'othr_income': { unit: '亿元', scale: 100000000, type: 'amount' },
  'asset_si': { unit: '亿元', scale: 100000000, type: 'amount' },
  'liab_si': { unit: '亿元', scale: 100000000, type: 'amount' },

  // 新补充的缺失字段单位配置
  'receivable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_invest': { unit: '亿元', scale: 100000000, type: 'amount' },
  'payable': { unit: '亿元', scale: 100000000, type: 'amount' },
  'st_borrowing': { unit: '亿元', scale: 100000000, type: 'amount' },
  'depreciation_and_amortization': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_expense_special_subject': { unit: '亿元', scale: 100000000, type: 'amount' },
  'total_expense': { unit: '亿元', scale: 100000000, type: 'amount' }
};

// 格式化财务数据数值（需要转换单位）
export function formatValue(value: number | null | undefined, fieldName: string): string {
  // 处理null、undefined或NaN值
  if (value === null || value === undefined) {
    return '';
  }
  
  // 确保value是数字类型
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(numValue)) {
    return '';
  }

  const config = FIELD_UNITS[fieldName];
  if (!config) {
    return numValue.toFixed(2);
  }

  const scaledValue = numValue / config.scale;
  
  switch (config.type) {
    case 'amount':
      return scaledValue.toFixed(2);
    case 'ratio':
      return (scaledValue * 100).toFixed(2);
    case 'times':
      return scaledValue.toFixed(2);
    case 'days':
      return Math.round(scaledValue).toString();
    default:
      return scaledValue.toFixed(2);
  }
}

// 格式化财务指标数值（数据已经是正确格式，只需要格式化显示）
export function formatIndicatorValue(value: number | string | null | undefined, fieldName: string): string {
  // 处理null、undefined值
  if (value === null || value === undefined) {
    return '';
  }

  // 转换为数字类型
  let numValue: number;
  if (typeof value === 'number') {
    numValue = value;
  } else if (typeof value === 'string' && value.trim() !== '') {
    numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return '';
    }
  } else {
    return '';
  }

  const config = FIELD_UNITS[fieldName];
  if (!config) {
    return numValue.toFixed(2);
  }

  switch (config.type) {
    case 'amount':
      // 金额类指标，需要根据字段判断是否转换
      // 现金流相关的金额指标需要转换为亿元，每股类指标不需要转换
      if (fieldName.includes('CashFlow') || 
          fieldName.includes('CashBalance') || 
          fieldName.includes('workingCapital') ||
          fieldName.includes('netCashIncrease')) {
        return (numValue / config.scale).toFixed(2);
      } else {
        return numValue.toFixed(2);
      }
    case 'ratio':
      // 旧的比率类指标，数据库中已经是百分比数值（如10.80表示10.80%），直接显示
      return numValue.toFixed(2);
    case 'percentage':
      // 新的百分比类指标，数据库中已经是百分比数值（如10.80表示10.80%），直接显示
      return numValue.toFixed(2);
    case 'decimal_to_percentage':
      // 小数转百分比类指标，数据库中存储为小数（如0.42），需要转换为百分比（42%）
      return (numValue * 100).toFixed(2);
    case 'times':
      // 倍数类指标，直接显示
      return numValue.toFixed(2);
    case 'days':
      // 天数类指标，取整显示
      return Math.round(numValue).toString();
    default:
      return numValue.toFixed(2);
  }
}

// 获取字段单位
export function getFieldUnit(fieldName: string): string {
  const config = FIELD_UNITS[fieldName];
  return config ? config.unit : '';
}

// 获取字段显示名称
export function getFieldDisplayName(fieldName: string, isIndicator: boolean = false): string {
  if (isIndicator) {
    return FINANCIAL_INDICATORS_NAMES[fieldName] || fieldName;
  }
  return FINANCIAL_DATA_NAMES[fieldName] || fieldName;
} 