// controllers/reportController.js

const { Op } = require("sequelize");

const Invoice = require("../models/invoiceModel");

const generateReportPdf = require("../utilities/generateReportPdf");

exports.downloadReport = async (req, res, next) => {
  try {
    const tenant = req.tenant;

    const { range, dateFrom, dateTo } = req.body;

    let start;
    let end;

    const now = new Date();

    if (range === "this_month") {
      start = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1
        )
      );

      end = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          1
        )
      );
    }

    else if (range === "last_month") {
      start = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() - 1,
          1
        )
      );

      end = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1
        )
      );
    }

    else if (dateFrom && dateTo) {
      start = new Date(dateFrom);

      end = new Date(dateTo);

      end.setUTCDate(end.getUTCDate() + 1);
    }

    else {
      return res.status(400).json({
        status: "fail",
        message: "Invalid date range",
      });
    }

    const invoices = await Invoice.findAll({
      where: {
        tenant_id: tenant.id,
        createdAt: {
          [Op.gte]: start,
          [Op.lt]: end,
        },
      },

      order: [["createdAt", "DESC"]],
    });

    const totalBills = invoices.length;

    const totalRevenue = invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.grand_total),
      0
    );

    const totalGST = invoices.reduce(
      (sum, invoice) =>
        sum +
        Number(invoice.cgst_total) +
        Number(invoice.sgst_total),
      0
    );

    const averageBillValue =
      totalBills === 0
        ? 0
        : totalRevenue / totalBills;

    const pdfBuffer = await generateReportPdf({
      tenant,
      invoices,

      reportTitle: range || "Custom",

      summary: {
        totalBills,
        totalRevenue,
        totalGST,
        averageBillValue,
      },
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${Date.now()}.pdf"`
    );

    res.send(pdfBuffer);
  }

  catch (err) {
    next(err);
  }
};