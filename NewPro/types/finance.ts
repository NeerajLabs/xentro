export type FinanceReportingFrequency = 'Monthly' | 'Quarterly';
export type FinanceRevenueStatus = 'Pre-Revenue' | 'Revenue Generating';

export type FinanceVisibilityLevel =
  | 'Public'
  | 'Connections Only'
  | 'Approved Users'
  | 'Private';

export interface FinancialUpdateRecord {
  id: string;
  period: string; // e.g., 'Sep 2026', 'Q3 2026'
  frequency: FinanceReportingFrequency;
  currency: string;
  revenueStatus: FinanceRevenueStatus;
  totalRevenue: number;
  recurringRevenue: number;
  nonRecurringRevenue: number;
  mrr: number;
  arr: number;
  otherIncome: number;
  totalCustomers: number;
  payingCustomers: number;
  newCustomers: number;
  lostCustomers: number;
  activeCustomers: number;
  totalExpenses: number;
  openingCashBalance: number;
  closingCashBalance: number;
  fundingReceived: number;
  grantReceived: number;
  uploadedAt: string;
  sourceFile: string;
  version: number;
}

export interface RevenueBreakdownItem {
  id: string;
  period: string;
  category:
    | 'Subscription'
    | 'SaaS'
    | 'Product Sales'
    | 'Services'
    | 'Commission'
    | 'Marketplace Fees'
    | 'Licensing'
    | 'Advertising'
    | 'Enterprise Contracts'
    | 'Consulting'
    | 'Other'
    | string;
  amount: number;
  percentage?: number;
  description?: string;
}

export interface ExpenseBreakdownItem {
  id: string;
  period: string;
  category:
    | 'Salaries / Payroll'
    | 'Technology / Cloud'
    | 'Marketing'
    | 'Sales'
    | 'Office / Rent'
    | 'Legal'
    | 'Compliance'
    | 'Professional Services'
    | 'Travel'
    | 'Product Development'
    | 'Operations'
    | 'Infrastructure'
    | 'Other'
    | string;
  amount: number;
  percentage?: number;
  description?: string;
}

export interface FundingRoundItem {
  id: string;
  roundType: 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Bridge' | 'Angel' | string;
  date: string;
  fundingType: 'Equity' | 'Convertible Note' | 'SAFE / i-SAFE' | 'Debt';
  amountRaised: number;
  currency: string;
  investorName: string;
  investorType: 'VC' | 'Angel' | 'Syndicate' | 'Corporate' | 'Family Office';
  instrument: string;
  preMoneyValuation?: number;
  postMoneyValuation?: number;
  equityDilutedPct?: number;
  status: 'Closed' | 'Term Sheet Signed' | 'In Progress';
}

export interface GrantItem {
  id: string;
  grantName: string;
  agencyOrGov: string;
  dateAwarded: string;
  amount: number;
  currency: string;
  disbursedAmount: number;
  milestoneStatus: string;
  equityDilution: 'No Equity' | string;
  terms: string;
}

export interface CapitalStructureItem {
  id: string;
  stakeholder: string;
  category: 'Founders' | 'ESOP' | 'Investors' | 'Advisors';
  ownershipPct: number;
  sharesCount?: number;
  shareClass: string;
  investmentAmount?: number;
  vestingTerms?: string;
  dateAdded?: string;
}

export interface FinancialForecastItem {
  id: string;
  period: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedNetBurn: number;
  projectedCashBalance: number;
  projectedRunway: number;
  scenario: 'Baseline' | 'Optimistic' | 'Conservative';
  actualRevenue?: number;
  actualExpenses?: number;
}

export interface FinanceSourceFileVersion {
  id: string;
  fileName: string;
  fileType: 'xlsx' | 'csv';
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  importStatus: 'Success' | 'Partial' | 'Draft';
  importVersion: number;
  reportingPeriods: string[];
  summary: {
    updatesCount: number;
    revenueRecordsCount: number;
    expenseRecordsCount: number;
    fundingCount: number;
    grantsCount: number;
    capStructureCount: number;
  };
}

export interface FinanceVisibilityConfig {
  revenueStatus: FinanceVisibilityLevel;
  revenue: FinanceVisibilityLevel;
  mrr: FinanceVisibilityLevel;
  arr: FinanceVisibilityLevel;
  expenses: FinanceVisibilityLevel;
  burn: FinanceVisibilityLevel;
  cash: FinanceVisibilityLevel;
  runway: FinanceVisibilityLevel;
  fundingRaised: FinanceVisibilityLevel;
  valuation: FinanceVisibilityLevel;
  growth: FinanceVisibilityLevel;
}

export interface CalculatedFinancialMetrics {
  latestPeriod: string;
  lastUpdated: string;
  totalRevenue: number;
  recurringRevenue: number;
  mrr: number;
  arr: number;
  totalExpenses: number;
  grossBurn: number;
  netBurn: number;
  isCashFlowPositive: boolean;
  closingCash: number;
  runwayMonths: number;
  isRunwayApplicable: boolean;
  revenueGrowthPct: number;
  payingCustomers: number;
  totalCustomers: number;
  arpu: number;
  totalFundingRaised: number;
  latestValuation?: number;
  grantsTotal: number;
}

export interface ValidationErrorItem {
  id: string;
  sheetOrFile: string;
  row: number;
  column: string;
  currentValue: string;
  error: string;
  suggestedFix: string;
  severity: 'Critical Error' | 'Warning' | 'Informational';
}

export interface ImportPreviewData {
  fileName: string;
  fileType: 'xlsx' | 'csv';
  fileSize: string;
  periodsCount: number;
  validRowsCount: number;
  warningsCount: number;
  errorsCount: number;
  canImport: boolean;
  summary: {
    financialUpdates: number;
    revenueRecords: number;
    expenseRecords: number;
    fundingRounds: number;
    grants: number;
    capStructure: number;
    forecasts?: number;
  };
  errors: ValidationErrorItem[];
  duplicatePeriods: string[];
  parsedUpdates: FinancialUpdateRecord[];
  parsedRevenue: RevenueBreakdownItem[];
  parsedExpenses: ExpenseBreakdownItem[];
  parsedFunding: FundingRoundItem[];
  parsedGrants: GrantItem[];
  parsedCapStructure: CapitalStructureItem[];
  parsedForecasts: FinancialForecastItem[];
}
