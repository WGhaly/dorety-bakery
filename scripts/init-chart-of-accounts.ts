import { PrismaClient } from '@prisma/client';
import { ledgerService } from '../src/lib/ledger';

const prisma = new PrismaClient();

async function initializeAccounts() {
  console.log('🏦 Initializing Chart of Accounts...');
  
  try {
    await ledgerService.initializeChartOfAccounts();
    console.log('✅ Chart of accounts initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing chart of accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeAccounts()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });