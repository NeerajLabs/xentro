import {
  FinancialUpdateRecord,
  RevenueBreakdownItem,
  ExpenseBreakdownItem,
  FundingRoundItem,
  GrantItem,
  CapitalStructureItem,
  FinancialForecastItem,
  FinanceSourceFileVersion,
  FinanceVisibilityConfig,
  CalculatedFinancialMetrics,
  ImportPreviewData,
  ValidationErrorItem,
} from '@/types/finance';

const STORAGE_KEY_UPDATES = 'xentro_finances_updates_v2';
const STORAGE_KEY_REVENUE = 'xentro_finances_revenue_v2';
const STORAGE_KEY_EXPENSES = 'xentro_finances_expenses_v2';
const STORAGE_KEY_FUNDING = 'xentro_finances_funding_v2';
const STORAGE_KEY_GRANTS = 'xentro_finances_grants_v2';
const STORAGE_KEY_CAP_STRUCTURE = 'xentro_finances_cap_structure_v2';
const STORAGE_KEY_FORECASTS = 'xentro_finances_forecasts_v2';
const STORAGE_KEY_VERSIONS = 'xentro_finances_versions_v2';
const STORAGE_KEY_VISIBILITY = 'xentro_finances_visibility_v2';

// -------------------------------------------------------------
// Initial Structured Normalized Data (Empty State by default)
// -------------------------------------------------------------
export const INITIAL_FINANCIAL_UPDATES: FinancialUpdateRecord[] = [];
export const INITIAL_REVENUE_BREAKDOWN: RevenueBreakdownItem[] = [];
export const INITIAL_EXPENSE_BREAKDOWN: ExpenseBreakdownItem[] = [];
export const INITIAL_FUNDING_HISTORY: FundingRoundItem[] = [];
export const INITIAL_GRANTS: GrantItem[] = [];
export const INITIAL_CAP_STRUCTURE: CapitalStructureItem[] = [];
export const INITIAL_FORECASTS: FinancialForecastItem[] = [];
export const INITIAL_SOURCE_VERSIONS: FinanceSourceFileVersion[] = [];

export const INITIAL_VISIBILITY_CONFIG: FinanceVisibilityConfig = {
  revenueStatus: 'Public',
  revenue: 'Connections Only',
  mrr: 'Connections Only',
  arr: 'Connections Only',
  expenses: 'Private',
  burn: 'Private',
  cash: 'Private',
  runway: 'Connections Only',
  fundingRaised: 'Public',
  valuation: 'Private',
  growth: 'Public',
};

// -------------------------------------------------------------
// Xentro Finance Service Class
// -------------------------------------------------------------
class FinanceService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // --- Storage Getters & Setters ---
  public getFinancialUpdates(): FinancialUpdateRecord[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_UPDATES);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('upd-2026-'))) {
        localStorage.removeItem(STORAGE_KEY_UPDATES);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setFinancialUpdates(updates: FinancialUpdateRecord[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify(updates));
    this.notifyUpdate();
  }

  public getRevenueBreakdown(): RevenueBreakdownItem[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_REVENUE);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('rev-'))) {
        localStorage.removeItem(STORAGE_KEY_REVENUE);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setRevenueBreakdown(items: RevenueBreakdownItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_REVENUE, JSON.stringify(items));
    this.notifyUpdate();
  }

  public getExpenseBreakdown(): ExpenseBreakdownItem[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('exp-'))) {
        localStorage.removeItem(STORAGE_KEY_EXPENSES);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setExpenseBreakdown(items: ExpenseBreakdownItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(items));
    this.notifyUpdate();
  }

  public getFundingHistory(): FundingRoundItem[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_FUNDING);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('fnd-'))) {
        localStorage.removeItem(STORAGE_KEY_FUNDING);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setFundingHistory(items: FundingRoundItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_FUNDING, JSON.stringify(items));
    this.notifyUpdate();
  }

  public getGrants(): GrantItem[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_GRANTS);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('grt-'))) {
        localStorage.removeItem(STORAGE_KEY_GRANTS);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setGrants(items: GrantItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_GRANTS, JSON.stringify(items));
    this.notifyUpdate();
  }

  public getCapitalStructure(): CapitalStructureItem[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_CAP_STRUCTURE);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('cap-') && ['cap-1', 'cap-2', 'cap-3', 'cap-4', 'cap-5'].includes(p.id))) {
        localStorage.removeItem(STORAGE_KEY_CAP_STRUCTURE);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setCapitalStructure(items: CapitalStructureItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_CAP_STRUCTURE, JSON.stringify(items));
    this.notifyUpdate();
  }

  public addCapitalStructureItem(item: Omit<CapitalStructureItem, 'id'>): CapitalStructureItem {
    const items = this.getCapitalStructure();
    const newItem: CapitalStructureItem = {
      ...item,
      id: `cap-${Date.now()}`,
    };
    const updated = [...items, newItem];
    this.setCapitalStructure(updated);
    return newItem;
  }

  public updateCapitalStructureItem(updatedItem: CapitalStructureItem) {
    const items = this.getCapitalStructure();
    const updated = items.map((it) => (it.id === updatedItem.id ? updatedItem : it));
    this.setCapitalStructure(updated);
  }

  public deleteCapitalStructureItem(id: string) {
    const items = this.getCapitalStructure();
    const updated = items.filter((it) => it.id !== id);
    this.setCapitalStructure(updated);
  }

  public getForecasts(): FinancialForecastItem[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_FORECASTS);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('fc-'))) {
        localStorage.removeItem(STORAGE_KEY_FORECASTS);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setForecasts(items: FinancialForecastItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_FORECASTS, JSON.stringify(items));
    this.notifyUpdate();
  }

  public getSourceVersions(): FinanceSourceFileVersion[] {
    if (!this.isBrowser()) return [];
    const stored = localStorage.getItem(STORAGE_KEY_VERSIONS);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((p: any) => p?.id?.startsWith('ver-'))) {
        localStorage.removeItem(STORAGE_KEY_VERSIONS);
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public setSourceVersions(items: FinanceSourceFileVersion[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(items));
    this.notifyUpdate();
  }

  public getVisibilityConfig(): FinanceVisibilityConfig {
    if (!this.isBrowser()) return INITIAL_VISIBILITY_CONFIG;
    const stored = localStorage.getItem(STORAGE_KEY_VISIBILITY);
    if (!stored) {
      this.setVisibilityConfig(INITIAL_VISIBILITY_CONFIG);
      return INITIAL_VISIBILITY_CONFIG;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_VISIBILITY_CONFIG;
    }
  }

  public setVisibilityConfig(config: FinanceVisibilityConfig) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(config));
    this.notifyUpdate();
  }

  public updateVisibilityField(
    field: keyof FinanceVisibilityConfig,
    level: FinanceVisibilityConfig[keyof FinanceVisibilityConfig]
  ) {
    const current = this.getVisibilityConfig();
    this.setVisibilityConfig({ ...current, [field]: level });
  }

  // --- Automatic Metrics Calculations ---
  public calculateMetrics(): CalculatedFinancialMetrics {
    const updates = this.getFinancialUpdates();
    const funding = this.getFundingHistory();
    const grants = this.getGrants();

    if (updates.length === 0) {
      return {
        latestPeriod: 'No Data',
        lastUpdated: 'Never',
        totalRevenue: 0,
        recurringRevenue: 0,
        mrr: 0,
        arr: 0,
        totalExpenses: 0,
        grossBurn: 0,
        netBurn: 0,
        isCashFlowPositive: true,
        closingCash: 0,
        runwayMonths: 0,
        isRunwayApplicable: false,
        revenueGrowthPct: 0,
        payingCustomers: 0,
        totalCustomers: 0,
        arpu: 0,
        totalFundingRaised: funding.reduce((sum, f) => sum + f.amountRaised, 0),
        grantsTotal: grants.reduce((sum, g) => sum + g.amount, 0),
      };
    }

    const latest = updates[0];
    const prev = updates[1];

    // Gross Burn = Total Expenses
    const grossBurn = latest.totalExpenses;

    // Net Burn = Total Expenses - Total Revenue
    const rawNetBurn = latest.totalExpenses - latest.totalRevenue;
    const isCashFlowPositive = latest.totalRevenue >= latest.totalExpenses;
    const netBurn = isCashFlowPositive ? 0 : rawNetBurn;

    // Runway = Closing Cash Balance / Average Monthly Net Burn
    // If Net Burn <= 0: Runway not applicable — cash flow positive
    let runwayMonths = 0;
    const isRunwayApplicable = !isCashFlowPositive && netBurn > 0;
    if (isRunwayApplicable) {
      runwayMonths = Math.max(0, Math.round((latest.closingCashBalance / netBurn) * 10) / 10);
    }

    // Revenue Growth
    let revenueGrowthPct = 0;
    if (prev && prev.totalRevenue > 0) {
      revenueGrowthPct =
        Math.round(((latest.totalRevenue - prev.totalRevenue) / prev.totalRevenue) * 1000) / 10;
    }

    // ARPU = MRR / Paying Customers
    const arpu =
      latest.payingCustomers > 0 ? Math.round(latest.mrr / latest.payingCustomers) : 0;

    const totalFundingRaised = funding.reduce((sum, f) => sum + f.amountRaised, 0);
    const grantsTotal = grants.reduce((sum, g) => sum + g.amount, 0);
    const latestValuation = funding[0]?.postMoneyValuation;

    return {
      latestPeriod: latest.period,
      lastUpdated: new Date(latest.uploadedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      totalRevenue: latest.totalRevenue,
      recurringRevenue: latest.recurringRevenue,
      mrr: latest.mrr,
      arr: latest.arr || latest.mrr * 12,
      totalExpenses: latest.totalExpenses,
      grossBurn,
      netBurn,
      isCashFlowPositive,
      closingCash: latest.closingCashBalance,
      runwayMonths,
      isRunwayApplicable,
      revenueGrowthPct,
      payingCustomers: latest.payingCustomers,
      totalCustomers: latest.totalCustomers,
      arpu,
      totalFundingRaised,
      latestValuation,
      grantsTotal,
    };
  }

  // --- Validation & Parsing Engine ---
  public async validateAndParseSpreadsheet(
    file: File,
    options?: { simulateErrors?: boolean }
  ): Promise<ImportPreviewData> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (fileExt !== 'xlsx' && fileExt !== 'csv') {
          reject(new Error('Invalid file format. Only .xlsx and .csv are supported.'));
          return;
        }

        const sizeInKB = Math.round(file.size / 1024);
        const fileSizeStr = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;

        const existingUpdates = this.getFinancialUpdates();
        const existingPeriods = existingUpdates.map((u) => u.period.toLowerCase());

        // Parsed Records (Simulated robust parser following Xentro normalized schema)
        const parsedUpdates: FinancialUpdateRecord[] = [
          {
            id: `upd_import_${Date.now()}_1`,
            period: 'Oct 2026',
            frequency: 'Monthly',
            currency: 'INR',
            revenueStatus: 'Revenue Generating',
            totalRevenue: 540000,
            recurringRevenue: 410000,
            nonRecurringRevenue: 130000,
            mrr: 540000,
            arr: 6480000,
            otherIncome: 0,
            totalCustomers: 27,
            payingCustomers: 21,
            newCustomers: 4,
            lostCustomers: 1,
            activeCustomers: 27,
            totalExpenses: 740000,
            openingCashBalance: 3850000,
            closingCashBalance: 3650000,
            fundingReceived: 0,
            grantReceived: 0,
            uploadedAt: new Date().toISOString(),
            sourceFile: file.name,
            version: 2,
          },
          {
            id: `upd_import_${Date.now()}_2`,
            period: 'Sep 2026', // Known duplicate period for demonstration
            frequency: 'Monthly',
            currency: 'INR',
            revenueStatus: 'Revenue Generating',
            totalRevenue: 480000,
            recurringRevenue: 360000,
            nonRecurringRevenue: 120000,
            mrr: 480000,
            arr: 5760000,
            otherIncome: 0,
            totalCustomers: 24,
            payingCustomers: 18,
            newCustomers: 3,
            lostCustomers: 0,
            activeCustomers: 24,
            totalExpenses: 720000,
            openingCashBalance: 4090000,
            closingCashBalance: 3850000,
            fundingReceived: 0,
            grantReceived: 0,
            uploadedAt: new Date().toISOString(),
            sourceFile: file.name,
            version: 2,
          },
        ];

        const parsedRevenue: RevenueBreakdownItem[] = [
          { id: `rev_imp_1`, period: 'Oct 2026', category: 'SaaS', amount: 410000, percentage: 75.9 },
          { id: `rev_imp_2`, period: 'Oct 2026', category: 'Enterprise Contracts', amount: 90000, percentage: 16.7 },
          { id: `rev_imp_3`, period: 'Oct 2026', category: 'Consulting', amount: 40000, percentage: 7.4 },
        ];

        const parsedExpenses: ExpenseBreakdownItem[] = [
          { id: `exp_imp_1`, period: 'Oct 2026', category: 'Salaries / Payroll', amount: 333000, percentage: 45 },
          { id: `exp_imp_2`, period: 'Oct 2026', category: 'Technology / Cloud', amount: 185000, percentage: 25 },
          { id: `exp_imp_3`, period: 'Oct 2026', category: 'Marketing', amount: 111000, percentage: 15 },
          { id: `exp_imp_4`, period: 'Oct 2026', category: 'Office / Rent', amount: 55500, percentage: 7.5 },
          { id: `exp_imp_5`, period: 'Oct 2026', category: 'Legal', amount: 37000, percentage: 5 },
          { id: `exp_imp_6`, period: 'Oct 2026', category: 'Operations', amount: 18500, percentage: 2.5 },
        ];

        const parsedFunding: FundingRoundItem[] = [];
        const parsedGrants: GrantItem[] = [];
        const parsedCapStructure: CapitalStructureItem[] = [];
        const parsedForecasts: FinancialForecastItem[] = [];

        // Duplicate periods detection
        const duplicatePeriods = parsedUpdates
          .map((u) => u.period)
          .filter((p) => existingPeriods.includes(p.toLowerCase()));

        // Validation error engine
        const errors: ValidationErrorItem[] = [];

        // Check 1: Revenue breakdown sum vs Total Revenue
        const revTotal = parsedRevenue.reduce((s, r) => s + r.amount, 0);
        if (revTotal !== parsedUpdates[0].totalRevenue) {
          errors.push({
            id: 'err-rev-sum',
            sheetOrFile: fileExt === 'xlsx' ? 'Revenue Breakdown' : 'revenue_breakdown.csv',
            row: 4,
            column: 'Total Revenue',
            currentValue: `₹${revTotal}`,
            error: 'Revenue breakdown total differs from Total Revenue in Financial Updates.',
            suggestedFix: `Adjust category splits to sum to ₹${parsedUpdates[0].totalRevenue}`,
            severity: 'Warning',
          });
        }

        // Check 2: Customer validation rule (Paying Customers <= Total Customers)
        if (parsedUpdates[0].payingCustomers > parsedUpdates[0].totalCustomers) {
          errors.push({
            id: 'err-cust-rule',
            sheetOrFile: fileExt === 'xlsx' ? 'Financial Updates' : 'financial_updates.csv',
            row: 2,
            column: 'Paying Customers',
            currentValue: `${parsedUpdates[0].payingCustomers}`,
            error: 'Paying customers cannot exceed Total Customers.',
            suggestedFix: `Ensure Paying Customers (${parsedUpdates[0].payingCustomers}) <= Total Customers (${parsedUpdates[0].totalCustomers})`,
            severity: 'Critical Error',
          });
        }

        // Check 3: Lost customers >= 0
        if (parsedUpdates[0].lostCustomers < 0) {
          errors.push({
            id: 'err-lost-cust',
            sheetOrFile: fileExt === 'xlsx' ? 'Financial Updates' : 'financial_updates.csv',
            row: 2,
            column: 'Lost Customers',
            currentValue: `${parsedUpdates[0].lostCustomers}`,
            error: 'Lost customers cannot be negative.',
            suggestedFix: 'Set to 0 or positive integer.',
            severity: 'Critical Error',
          });
        }

        // Optional simulated critical error for demonstration if requested
        if (options?.simulateErrors) {
          errors.push({
            id: 'err-sim-type',
            sheetOrFile: fileExt === 'xlsx' ? 'Financial Updates' : 'financial_updates.csv',
            row: 3,
            column: 'Total Revenue',
            currentValue: '₹4.5L',
            error: 'Expected numeric value without symbols.',
            suggestedFix: '450000',
            severity: 'Critical Error',
          });
        }

        const criticalCount = errors.filter((e) => e.severity === 'Critical Error').length;
        const warningCount = errors.filter((e) => e.severity === 'Warning').length;

        const preview: ImportPreviewData = {
          fileName: file.name,
          fileType: fileExt as 'xlsx' | 'csv',
          fileSize: fileSizeStr,
          periodsCount: parsedUpdates.length,
          validRowsCount: parsedUpdates.length + parsedRevenue.length + parsedExpenses.length,
          warningsCount: warningCount,
          errorsCount: criticalCount,
          canImport: criticalCount === 0,
          summary: {
            financialUpdates: parsedUpdates.length,
            revenueRecords: parsedRevenue.length,
            expenseRecords: parsedExpenses.length,
            fundingRounds: parsedFunding.length,
            grants: parsedGrants.length,
            capStructure: parsedCapStructure.length,
            forecasts: parsedForecasts.length,
          },
          errors,
          duplicatePeriods,
          parsedUpdates,
          parsedRevenue,
          parsedExpenses,
          parsedFunding,
          parsedGrants,
          parsedCapStructure,
          parsedForecasts,
        };

        resolve(preview);
      }, 750);
    });
  }

  // --- Commit Import to Database ---
  public commitImport(
    preview: ImportPreviewData,
    duplicateStrategy: 'replace' | 'update' | 'skip' | 'cancel'
  ): boolean {
    if (duplicateStrategy === 'cancel') return false;

    let currentUpdates = this.getFinancialUpdates();
    const incomingPeriods = preview.parsedUpdates.map((u) => u.period.toLowerCase());

    if (duplicateStrategy === 'replace') {
      // Remove all records matching incoming periods
      currentUpdates = currentUpdates.filter(
        (u) => !incomingPeriods.includes(u.period.toLowerCase())
      );
      currentUpdates = [...preview.parsedUpdates, ...currentUpdates];
    } else if (duplicateStrategy === 'update') {
      // Merge updates
      const updatedMap = new Map<string, FinancialUpdateRecord>();
      currentUpdates.forEach((u) => updatedMap.set(u.period.toLowerCase(), u));
      preview.parsedUpdates.forEach((u) => {
        const key = u.period.toLowerCase();
        if (updatedMap.has(key)) {
          const old = updatedMap.get(key)!;
          updatedMap.set(key, { ...old, ...u, version: (old.version || 1) + 1 });
        } else {
          updatedMap.set(key, u);
        }
      });
      currentUpdates = Array.from(updatedMap.values());
    } else if (duplicateStrategy === 'skip') {
      // Only add periods that do not exist
      const existingSet = new Set(currentUpdates.map((u) => u.period.toLowerCase()));
      const nonDuplicates = preview.parsedUpdates.filter(
        (u) => !existingSet.has(u.period.toLowerCase())
      );
      currentUpdates = [...nonDuplicates, ...currentUpdates];
    }

    this.setFinancialUpdates(currentUpdates);

    // Append revenue & expenses
    const currentRev = this.getRevenueBreakdown();
    this.setRevenueBreakdown([...preview.parsedRevenue, ...currentRev]);

    const currentExp = this.getExpenseBreakdown();
    this.setExpenseBreakdown([...preview.parsedExpenses, ...currentExp]);

    // Record source file version
    const newVersion: FinanceSourceFileVersion = {
      id: `ver-${Date.now()}`,
      fileName: preview.fileName,
      fileType: preview.fileType,
      fileSize: preview.fileSize,
      uploadedBy: 'Owner / Founder',
      uploadedAt: new Date().toISOString(),
      importStatus: 'Success',
      importVersion: this.getSourceVersions().length + 1,
      reportingPeriods: preview.parsedUpdates.map((u) => u.period),
      summary: {
        updatesCount: preview.summary.financialUpdates,
        revenueRecordsCount: preview.summary.revenueRecords,
        expenseRecordsCount: preview.summary.expenseRecords,
        fundingCount: preview.summary.fundingRounds,
        grantsCount: preview.summary.grants,
        capStructureCount: preview.summary.capStructure,
      },
    };
    const versions = this.getSourceVersions();
    this.setSourceVersions([newVersion, ...versions]);

    return true;
  }

  // --- Template Generators ---
  public downloadXlsxTemplate(): void {
    const content = `# XENTRO OFFICIAL FINANCIAL WORKBOOK TEMPLATE
# Instructions: Fill each sheet with clean numeric values. Do not insert currency symbols or formatted strings.
# Sheets included in full workbook:
# 1. Financial Updates (Core Monthly/Quarterly reporting)
# 2. Revenue Breakdown (Category-wise splits)
# 3. Expense Breakdown (Category-wise splits)
# 4. Funding History (Cap rounds & venture investors)
# 5. Grants (Non-dilutive institutional grants)
# 6. Capital Structure (High-level ownership & ESOP pool)
# 7. Forecasts [Pro] (6-12 month model projection)

[SHEET: Financial Updates]
Reporting Period,Reporting Frequency,Currency,Revenue Status,Total Revenue,Recurring Revenue,Non-Recurring Revenue,MRR,ARR,Other Income,Total Customers,Paying Customers,New Customers,Lost Customers,Active Customers,Total Expenses,Opening Cash Balance,Closing Cash Balance,Funding Received,Grant Received
Oct 2026,Monthly,INR,Revenue Generating,540000,410000,130000,540000,6480000,0,27,21,4,1,27,740000,3850000,3650000,0,0
Sep 2026,Monthly,INR,Revenue Generating,480000,360000,120000,480000,5760000,0,24,18,3,0,24,720000,4090000,3850000,0,0

[SHEET: Revenue Breakdown]
Period,Category,Amount,Description
Oct 2026,SaaS,410000,Enterprise Agent Subscription Licenses
Oct 2026,Enterprise Contracts,90000,On-Premise Private Cluster Retainers
Oct 2026,Consulting,40000,Custom LLM Agent Optimization

[SHEET: Expense Breakdown]
Period,Category,Amount,Description
Oct 2026,Salaries / Payroll,333000,Engineering & Core Product Team
Oct 2026,Technology / Cloud,185000,GCP TPU & Server Inference
Oct 2026,Marketing,111000,Enterprise DevRel & Developer Events
Oct 2026,Office / Rent,55500,Incubator Co-Working Desks
Oct 2026,Legal,37000,IP Filings & Review
Oct 2026,Operations,18500,Audit & Regulatory Filings

[SHEET: Funding History]
Round Type,Date,Funding Type,Amount Raised,Currency,Investor Name,Investor Type,Instrument,Pre-Money Valuation,Post-Money Valuation,Equity Diluted %,Status
Pre-Seed,2024-03-15,SAFE / i-SAFE,2500000,INR,Blume Founders Fund,VC,i-SAFE,10000000,12500000,15,Closed

[SHEET: Grants]
Grant Name,Agency or Gov,Date Awarded,Amount,Currency,Disbursed Amount,Milestone Status,Equity Dilution,Terms
Startup India Seed Fund Scheme,DPIIT,2024-08-10,2000000,INR,1500000,Milestone 2 Verified,No Equity,Proof of Concept validation grant

[SHEET: Capital Structure]
Stakeholder,Category,Ownership %,Shares Count,Share Class
Founders,Founders,75,750000,Common Stock
ESOP Pool,ESOP,10,100000,Reserved Pool
Pre-Seed Investors,Investors,15,150000,Series Seed Preference
`;
    this.triggerDownload(content, 'Xentro_Financial_Workbook_Template_2026.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  public downloadCsvTemplate(sheetName: string): void {
    const templates: Record<string, string> = {
      financial_updates: `Reporting Period,Reporting Frequency,Currency,Revenue Status,Total Revenue,Recurring Revenue,Non-Recurring Revenue,MRR,ARR,Other Income,Total Customers,Paying Customers,New Customers,Lost Customers,Active Customers,Total Expenses,Opening Cash Balance,Closing Cash Balance,Funding Received,Grant Received
Oct 2026,Monthly,INR,Revenue Generating,540000,410000,130000,540000,6480000,0,27,21,4,1,27,740000,3850000,3650000,0,0
Sep 2026,Monthly,INR,Revenue Generating,480000,360000,120000,480000,5760000,0,24,18,3,0,24,720000,4090000,3850000,0,0`,
      revenue_breakdown: `Period,Category,Amount,Description
Oct 2026,SaaS,410000,Enterprise Agent Subscription Licenses
Oct 2026,Enterprise Contracts,90000,On-Premise Private Cluster Retainers
Oct 2026,Consulting,40000,Custom LLM Agent Optimization`,
      expense_breakdown: `Period,Category,Amount,Description
Oct 2026,Salaries / Payroll,333000,Engineering & Core Product Team
Oct 2026,Technology / Cloud,185000,GCP TPU & Server Inference
Oct 2026,Marketing,111000,Enterprise DevRel & Developer Events
Oct 2026,Office / Rent,55500,Incubator Co-Working Desks
Oct 2026,Legal,37000,IP Filings & Review
Oct 2026,Operations,18500,Audit & Regulatory Filings`,
      funding_history: `Round Type,Date,Funding Type,Amount Raised,Currency,Investor Name,Investor Type,Instrument,Pre-Money Valuation,Post-Money Valuation,Equity Diluted %,Status
Pre-Seed,2024-03-15,SAFE / i-SAFE,2500000,INR,Blume Founders Fund,VC,i-SAFE,10000000,12500000,15,Closed`,
      grants: `Grant Name,Agency or Gov,Date Awarded,Amount,Currency,Disbursed Amount,Milestone Status,Equity Dilution,Terms
Startup India Seed Fund Scheme,DPIIT,2024-08-10,2000000,INR,1500000,Milestone 2 Verified,No Equity,Proof of Concept validation grant`,
      capital_structure: `Stakeholder,Category,Ownership %,Shares Count,Share Class
Founders,Founders,75,750000,Common Stock
ESOP Pool,ESOP,10,100000,Reserved Pool
Pre-Seed Investors,Investors,15,150000,Series Seed Preference`,
      forecasts: `Period,Projected Revenue,Projected Expenses,Projected Net Burn,Projected Cash Balance,Projected Runway,Scenario
Oct 2026,540000,740000,200000,3650000,18.2,Baseline
Nov 2026,610000,760000,150000,3500000,23.3,Baseline
Dec 2026,720000,780000,60000,3440000,57.3,Baseline`,
    };

    const csvContent = templates[sheetName] || templates.financial_updates;
    this.triggerDownload(csvContent, `${sheetName}.csv`, 'text/csv;charset=utf-8;');
  }

  public downloadAllCsvTemplates(): void {
    const list = [
      'financial_updates',
      'revenue_breakdown',
      'expense_breakdown',
      'funding_history',
      'grants',
      'capital_structure',
      'forecasts',
    ];
    list.forEach((name, idx) => {
      setTimeout(() => {
        this.downloadCsvTemplate(name);
      }, idx * 150);
    });
  }

  private triggerDownload(content: string, fileName: string, mimeType: string) {
    if (!this.isBrowser()) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Reset & Empty States for Testing ---
  public resetToEmptyState(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEY_UPDATES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_REVENUE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_FUNDING, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_GRANTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_CAP_STRUCTURE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_FORECASTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify([]));
    this.notifyUpdate();
  }

  public loadSeedFinancials(): void {
    if (!this.isBrowser()) return;
    this.setFinancialUpdates(INITIAL_FINANCIAL_UPDATES);
    this.setRevenueBreakdown(INITIAL_REVENUE_BREAKDOWN);
    this.setExpenseBreakdown(INITIAL_EXPENSE_BREAKDOWN);
    this.setFundingHistory(INITIAL_FUNDING_HISTORY);
    this.setGrants(INITIAL_GRANTS);
    this.setCapitalStructure(INITIAL_CAP_STRUCTURE);
    this.setForecasts(INITIAL_FORECASTS);
    this.setSourceVersions(INITIAL_SOURCE_VERSIONS);
    this.setVisibilityConfig(INITIAL_VISIBILITY_CONFIG);
  }

  public isFinanceDataEmpty(): boolean {
    return this.getFinancialUpdates().length === 0;
  }

  private notifyUpdate() {
    if (!this.isBrowser()) return;
    window.dispatchEvent(new CustomEvent('xentro-finances-updated'));
  }
}

export const financeService = new FinanceService();
