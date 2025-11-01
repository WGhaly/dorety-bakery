import { prisma } from '@/lib/db';
import { LedgerDirection, AccountType, AccountCategory, LedgerReferenceType } from '@prisma/client';

/**
 * Financial Ledger Service
 * 
 * Implements double-entry bookkeeping following best practices from:
 * - Beancount accounting principles
 * - ErpSaas accounting patterns
 * - E-commerce COD tracking systems
 * 
 * Core Principles:
 * 1. Every transaction must balance (sum of debits = sum of credits)
 * 2. Automated ledger generation from business events
 * 3. Comprehensive audit trail
 * 4. COD-specific tracking for cash flow management
 * 
 * Chart of Accounts Structure:
 * 1000-1999: Assets (Cash, Accounts Receivable, Inventory)
 * 2000-2999: Liabilities (COD Outstanding, Accounts Payable)
 * 3000-3999: Equity (Owner's Equity, Retained Earnings)
 * 4000-4999: Revenue (Product Sales, Delivery Fees)
 * 5000-5999: Expenses (COGS, Operating Expenses)
 */

interface LedgerEntry {
  accountCode: string;
  amount: number;
  direction: LedgerDirection;
  description: string;
}

interface TransactionEntry {
  orderId?: string;
  referenceType?: LedgerReferenceType;
  referenceId?: string;
  entries: LedgerEntry[];
  createdBy?: string;
}

class LedgerService {
  
  /**
   * Initialize Chart of Accounts with standard bakery business accounts
   */
  async initializeChartOfAccounts(): Promise<void> {
    const accounts = [
      // Assets (1000-1999)
      { code: '1000', name: 'Cash', type: AccountType.ASSET, category: AccountCategory.CASH },
      { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET, category: AccountCategory.ACCOUNTS_RECEIVABLE },
      { code: '1200', name: 'COD Receivable', type: AccountType.ASSET, category: AccountCategory.ACCOUNTS_RECEIVABLE },
      { code: '1300', name: 'Inventory - Raw Materials', type: AccountType.ASSET, category: AccountCategory.INVENTORY },
      { code: '1310', name: 'Inventory - Finished Goods', type: AccountType.ASSET, category: AccountCategory.INVENTORY },
      { code: '1400', name: 'Prepaid Expenses', type: AccountType.ASSET, category: AccountCategory.PREPAID_EXPENSES },
      { code: '1500', name: 'Equipment', type: AccountType.ASSET, category: AccountCategory.FIXED_ASSETS },
      
      // Liabilities (2000-2999)
      { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, category: AccountCategory.ACCOUNTS_PAYABLE },
      { code: '2100', name: 'COD Outstanding', type: AccountType.LIABILITY, category: AccountCategory.COD_OUTSTANDING },
      { code: '2200', name: 'Accrued Expenses', type: AccountType.LIABILITY, category: AccountCategory.ACCRUED_EXPENSES },
      
      // Equity (3000-3999)
      { code: '3000', name: 'Owner\'s Equity', type: AccountType.EQUITY, category: AccountCategory.OWNERS_EQUITY },
      { code: '3100', name: 'Retained Earnings', type: AccountType.EQUITY, category: AccountCategory.RETAINED_EARNINGS },
      
      // Revenue (4000-4999)
      { code: '4000', name: 'Product Sales', type: AccountType.REVENUE, category: AccountCategory.PRODUCT_SALES },
      { code: '4100', name: 'Delivery Fee Revenue', type: AccountType.REVENUE, category: AccountCategory.DELIVERY_FEES },
      { code: '4200', name: 'Service Revenue', type: AccountType.REVENUE, category: AccountCategory.SERVICE_REVENUE },
      
      // Expenses (5000-5999)
      { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, category: AccountCategory.COST_OF_GOODS_SOLD },
      { code: '5100', name: 'Delivery Expenses', type: AccountType.EXPENSE, category: AccountCategory.DELIVERY_EXPENSES },
      { code: '5200', name: 'Operating Expenses', type: AccountType.EXPENSE, category: AccountCategory.OPERATING_EXPENSES },
      { code: '5300', name: 'Administrative Expenses', type: AccountType.EXPENSE, category: AccountCategory.ADMINISTRATIVE_EXPENSES },
    ];

    // Create accounts if they don't exist
    for (const account of accounts) {
      await prisma.chartOfAccount.upsert({
        where: { code: account.code },
        update: {},
        create: account,
      });
    }
  }

  /**
   * Record order placement in ledger
   * 
   * Dr. COD Receivable (Asset)      $total
   *     Cr. Product Sales (Revenue)     $subtotal
   *     Cr. Delivery Fee Revenue        $deliveryFee
   */
  async recordOrderPlacement(orderId: string, subtotal: number, deliveryFee: number, createdBy?: string): Promise<void> {
    const total = subtotal + deliveryFee;
    
    const transaction: TransactionEntry = {
      orderId,
      referenceType: LedgerReferenceType.ORDER,
      referenceId: orderId,
      entries: [
        {
          accountCode: '1200', // COD Receivable
          amount: total,
          direction: LedgerDirection.DEBIT,
          description: `Order placed - ${orderId}`,
        },
        {
          accountCode: '4000', // Product Sales
          amount: subtotal,
          direction: LedgerDirection.CREDIT,
          description: `Product sales - ${orderId}`,
        },
        {
          accountCode: '4100', // Delivery Fee Revenue
          amount: deliveryFee,
          direction: LedgerDirection.CREDIT,
          description: `Delivery fee - ${orderId}`,
        },
      ],
      createdBy,
    };

    await this.recordTransaction(transaction);
  }

  /**
   * Record COD collection
   * 
   * Dr. Cash (Asset)                    $amount
   *     Cr. COD Receivable (Asset)          $amount
   */
  async recordCODCollection(orderId: string, amountCollected: number, collectedBy?: string): Promise<void> {
    const transaction: TransactionEntry = {
      orderId,
      referenceType: LedgerReferenceType.PAYMENT,
      referenceId: orderId,
      entries: [
        {
          accountCode: '1000', // Cash
          amount: amountCollected,
          direction: LedgerDirection.DEBIT,
          description: `COD collected - ${orderId}`,
        },
        {
          accountCode: '1200', // COD Receivable
          amount: amountCollected,
          direction: LedgerDirection.CREDIT,
          description: `COD collection - ${orderId}`,
        },
      ],
      createdBy: collectedBy,
    };

    await this.recordTransaction(transaction);

    // Update COD tracking
    await this.updateCODTracking(orderId, amountCollected, collectedBy);
  }

  /**
   * Record order cancellation
   * 
   * Dr. Product Sales (Revenue)         $subtotal
   * Dr. Delivery Fee Revenue (Revenue)  $deliveryFee
   *     Cr. COD Receivable (Asset)          $total
   */
  async recordOrderCancellation(orderId: string, subtotal: number, deliveryFee: number, createdBy?: string): Promise<void> {
    const total = subtotal + deliveryFee;
    
    const transaction: TransactionEntry = {
      orderId,
      referenceType: LedgerReferenceType.ORDER,
      referenceId: orderId,
      entries: [
        {
          accountCode: '4000', // Product Sales
          amount: subtotal,
          direction: LedgerDirection.DEBIT,
          description: `Order cancelled - ${orderId}`,
        },
        {
          accountCode: '4100', // Delivery Fee Revenue
          amount: deliveryFee,
          direction: LedgerDirection.DEBIT,
          description: `Delivery fee reversed - ${orderId}`,
        },
        {
          accountCode: '1200', // COD Receivable
          amount: total,
          direction: LedgerDirection.CREDIT,
          description: `Order cancellation - ${orderId}`,
        },
      ],
      createdBy,
    };

    await this.recordTransaction(transaction);
  }

  /**
   * Record inventory cost (COGS) when order is fulfilled
   * 
   * Dr. Cost of Goods Sold (Expense)   $cost
   *     Cr. Inventory (Asset)               $cost
   */
  async recordCostOfGoodsSold(orderId: string, cost: number, createdBy?: string): Promise<void> {
    const transaction: TransactionEntry = {
      orderId,
      referenceType: LedgerReferenceType.INVENTORY,
      referenceId: orderId,
      entries: [
        {
          accountCode: '5000', // Cost of Goods Sold
          amount: cost,
          direction: LedgerDirection.DEBIT,
          description: `COGS - ${orderId}`,
        },
        {
          accountCode: '1310', // Finished Goods Inventory
          amount: cost,
          direction: LedgerDirection.CREDIT,
          description: `Inventory reduction - ${orderId}`,
        },
      ],
      createdBy,
    };

    await this.recordTransaction(transaction);
  }

  /**
   * Record financial adjustment
   */
  async recordFinancialAdjustment(
    type: string,
    amount: number,
    reason: string,
    debitAccount: string,
    creditAccount: string,
    createdBy: string
  ): Promise<void> {
    const transaction: TransactionEntry = {
      referenceType: LedgerReferenceType.ADJUSTMENT,
      entries: [
        {
          accountCode: debitAccount,
          amount,
          direction: LedgerDirection.DEBIT,
          description: `Adjustment: ${reason}`,
        },
        {
          accountCode: creditAccount,
          amount,
          direction: LedgerDirection.CREDIT,
          description: `Adjustment: ${reason}`,
        },
      ],
      createdBy,
    };

    await this.recordTransaction(transaction);
  }

  /**
   * Core method to record a balanced transaction
   */
  private async recordTransaction(transaction: TransactionEntry): Promise<string> {
    // Validate transaction balance
    const totalDebits = transaction.entries
      .filter(e => e.direction === LedgerDirection.DEBIT)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalCredits = transaction.entries
      .filter(e => e.direction === LedgerDirection.CREDIT)
      .reduce((sum, e) => sum + e.amount, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(`Transaction is not balanced: Debits ${totalDebits}, Credits ${totalCredits}`);
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create ledger entries
    const ledgerEntries = await Promise.all(
      transaction.entries.map(async (entry) => {
        // Get account ID from code
        const account = await prisma.chartOfAccount.findUnique({
          where: { code: entry.accountCode },
        });

        if (!account) {
          throw new Error(`Account not found: ${entry.accountCode}`);
        }

        return prisma.ledgerEntry.create({
          data: {
            transactionId,
            orderId: transaction.orderId,
            accountId: account.id,
            amount: entry.amount,
            direction: entry.direction,
            description: entry.description,
            referenceType: transaction.referenceType,
            referenceId: transaction.referenceId,
            createdBy: transaction.createdBy,
          },
        });
      })
    );

    return transactionId;
  }

  /**
   * Update COD tracking record
   */
  private async updateCODTracking(orderId: string, amountCollected: number, collectedBy?: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { total: true },
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    await prisma.cODTracking.upsert({
      where: { orderId },
      update: {
        amountCollected,
        collectedAt: new Date(),
        collectedBy,
        variance: amountCollected - order.total,
      },
      create: {
        orderId,
        amountDue: order.total,
        amountCollected,
        collectedAt: new Date(),
        collectedBy,
        variance: amountCollected - order.total,
      },
    });
  }

  /**
   * Get account balance for a specific account
   */
  async getAccountBalance(accountCode: string): Promise<number> {
    const account = await prisma.chartOfAccount.findUnique({
      where: { code: accountCode },
      include: {
        ledgerEntries: true,
      },
    });

    if (!account) {
      throw new Error(`Account not found: ${accountCode}`);
    }

    // Calculate balance based on account type
    const debits = account.ledgerEntries
      .filter(e => e.direction === LedgerDirection.DEBIT)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const credits = account.ledgerEntries
      .filter(e => e.direction === LedgerDirection.CREDIT)
      .reduce((sum, e) => sum + e.amount, 0);

    // For assets and expenses: Debit increases balance
    // For liabilities, equity, and revenue: Credit increases balance
    if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
      return debits - credits;
    } else {
      return credits - debits;
    }
  }

  /**
   * Get outstanding COD amounts
   */
  async getOutstandingCOD(): Promise<{ total: number; count: number }> {
    const outstanding = await prisma.cODTracking.aggregate({
      where: {
        isReconciled: false,
        collectedAt: null,
      },
      _sum: {
        amountDue: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      total: outstanding._sum.amountDue || 0,
      count: outstanding._count.id,
    };
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(dateFrom: Date, dateTo: Date) {
    const [revenue, expenses, assets, liabilities] = await Promise.all([
      this.getAccountTypeBalance(AccountType.REVENUE, dateFrom, dateTo),
      this.getAccountTypeBalance(AccountType.EXPENSE, dateFrom, dateTo),
      this.getAccountTypeBalance(AccountType.ASSET, dateFrom, dateTo),
      this.getAccountTypeBalance(AccountType.LIABILITY, dateFrom, dateTo),
    ]);

    const netIncome = revenue - expenses;

    return {
      revenue,
      expenses,
      netIncome,
      assets,
      liabilities,
      equity: assets - liabilities,
    };
  }

  /**
   * Get balance for account type within date range
   */
  private async getAccountTypeBalance(accountType: AccountType, dateFrom: Date, dateTo: Date): Promise<number> {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { type: accountType },
      include: {
        ledgerEntries: {
          where: {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          },
        },
      },
    });

    return accounts.reduce((total, account) => {
      const debits = account.ledgerEntries
        .filter(e => e.direction === LedgerDirection.DEBIT)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const credits = account.ledgerEntries
        .filter(e => e.direction === LedgerDirection.CREDIT)
        .reduce((sum, e) => sum + e.amount, 0);

      // Calculate account balance based on account type
      let balance = 0;
      if (accountType === AccountType.ASSET || accountType === AccountType.EXPENSE) {
        balance = debits - credits;
      } else {
        balance = credits - debits;
      }

      return total + balance;
    }, 0);
  }
}

export const ledgerService = new LedgerService();