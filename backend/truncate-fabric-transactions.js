const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function truncateFabricTransactions() {
  console.log('⚠️  WARNING: This will delete ALL fabric transaction data!');
  console.log('Starting truncation process...\n');

  try {
    // For PostgreSQL, we use CASCADE to handle foreign keys
    console.log('✓ Using PostgreSQL CASCADE truncation');

    // Truncate all tables in one command with CASCADE
    console.log('\n🗑️  Truncating all Fabric transaction tables...');
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        fabric_bill_taxes,
        fabric_bill_details,
        fabric_bill_headers,
        fabric_return_processes,
        fabric_return_details,
        fabric_return_headers,
        fabric_dc_processes,
        fabric_dc_details,
        fabric_dc_headers,
        fabric_inward_processes,
        fabric_inward_details,
        fabric_inward_headers,
        rate_quotation_details,
        rate_quotation_headers
      RESTART IDENTITY CASCADE;
    `);
    console.log('✓ All tables truncated successfully');

    // Verify counts
    console.log('\n📊 Verification - Checking record counts...');
    const counts = {
      fabric_inwards: await prisma.fabricInwardHeader.count(),
      fabric_inward_details: await prisma.fabricInwardDetail.count(),
      fabric_inward_processes: await prisma.fabricInwardProcess.count(),
      fabric_dcs: await prisma.fabricDcHeader.count(),
      fabric_dc_details: await prisma.fabricDcDetail.count(),
      fabric_dc_processes: await prisma.fabricDcProcess.count(),
      fabric_returns: await prisma.fabricReturnHeader.count(),
      fabric_return_details: await prisma.fabricReturnDetail.count(),
      fabric_return_processes: await prisma.fabricReturnProcess.count(),
      fabric_bills: await prisma.fabricBillHeader.count(),
      fabric_bill_details: await prisma.fabricBillDetail.count(),
      fabric_bill_taxes: await prisma.fabricBillTax.count(),
      rate_quotations: await prisma.rateQuotationHeader.count(),
      rate_quotation_details: await prisma.rateQuotationDetail.count(),
    };

    console.log('\nRecord counts after truncation:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count}`);
    });

    const allZero = Object.values(counts).every(count => count === 0);
    if (allZero) {
      console.log('\n✅ SUCCESS: All fabric transaction tables have been truncated!');
    } else {
      console.log('\n⚠️  WARNING: Some tables still have records!');
    }

  } catch (error) {
    console.error('\n❌ ERROR during truncation:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the truncation
truncateFabricTransactions()
  .then(() => {
    console.log('\n✨ Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  });
