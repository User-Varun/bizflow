require("dotenv").config({ path: "./config.env" });

const sequelize = require("../src/config/db");
const Invoice = require("../src/models/invoiceModel");

const INVOICE_PREFIX_BY_TYPE = {
  stock_in: "PURCHASE",
  stock_out: "INV",
};

function buildInvoiceNumber(invoiceType, year, sequence) {
  const prefixLabel = INVOICE_PREFIX_BY_TYPE[invoiceType];

  if (!prefixLabel) {
    throw new Error(`invalid invoice type: ${invoiceType}`);
  }

  const isSale = String(invoiceType) === "stock_out";
  return isSale
    ? `${prefixLabel}_${year}_${String(sequence).padStart(3, "0")}`
    : `${prefixLabel}-${year}-${String(sequence).padStart(3, "0")}`;
}

async function ensureInvoiceNumberSplitSchema() {
  await sequelize.query(`
    ALTER TABLE "invoices"
    ADD COLUMN IF NOT EXISTS "legacy_invoice_number" VARCHAR(120);
  `);

  await sequelize.query(`
    DO $$
    DECLARE
      index_record record;
    BEGIN
      FOR index_record IN
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND tablename = 'invoices'
      LOOP
        IF index_record.indexdef ILIKE '%UNIQUE%'
          AND index_record.indexdef ILIKE '%tenant_id%'
          AND index_record.indexdef ILIKE '%invoice_number%'
          AND index_record.indexdef NOT ILIKE '%invoice_type%' THEN
          EXECUTE format('DROP INDEX IF EXISTS %I', index_record.indexname);
        END IF;
      END LOOP;
    END $$;
  `);

  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "invoices_tenant_type_number_uq"
    ON "invoices" ("tenant_id", "invoice_type", "invoice_number");
  `);
}

async function runBackfill() {
  const summary = {
    totalInvoicesScanned: 0,
    updatedInvoices: 0,
    tenantsProcessed: 0,
  };

  await ensureInvoiceNumberSplitSchema();

  await sequelize.transaction(async (transaction) => {
    const invoices = await Invoice.findAll({
      attributes: [
        "id",
        "tenant_id",
        "invoice_type",
        "invoice_number",
        "legacy_invoice_number",
        "createdAt",
      ],
      order: [
        ["tenant_id", "ASC"],
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    summary.totalInvoicesScanned = invoices.length;

    const grouped = new Map();

    for (const invoice of invoices) {
      const createdAt = new Date(invoice.createdAt);
      const year = Number.isNaN(createdAt.getTime())
        ? new Date().getFullYear()
        : createdAt.getUTCFullYear();
      const groupKey = [invoice.tenant_id, invoice.invoice_type, year].join(":");

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }

      grouped.get(groupKey).push({ invoice, year });
    }

    for (const [, entries] of grouped) {
      entries.forEach(({ invoice, year }, index) => {
        const nextInvoiceNumber = buildInvoiceNumber(
          invoice.invoice_type,
          year,
          index + 1,
        );

        invoice.legacy_invoice_number =
          invoice.legacy_invoice_number || invoice.invoice_number;
        invoice.invoice_number = nextInvoiceNumber;
      });

      for (const { invoice } of entries) {
        await invoice.save({ transaction });
        summary.updatedInvoices += 1;
      }

      summary.tenantsProcessed += 1;
    }
  });

  return summary;
}

(async () => {
  try {
    const summary = await runBackfill();
    console.log("Invoice number backfill completed.");
    console.table(summary);
    process.exitCode = 0;
  } catch (err) {
    console.error("Invoice number backfill failed:", err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();