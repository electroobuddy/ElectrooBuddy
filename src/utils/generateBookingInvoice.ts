import { escapeHtml } from "@/lib/security";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { getSiteSettingsCached } from "@/lib/siteSettings";

export async function generateBookingInvoice(booking: any) {
  try {
    const siteSettings = await getSiteSettingsCached().catch(() => ({}));
    const COMPANY = {
      name: "Electroobuddy",
      address: siteSettings.address || "",
      phone: siteSettings.phone_number || "",
      email: siteSettings.email || "",
      gst: "23ABCDE1234F1Z5",
      supportEmail: siteSettings.email || "",
    };
    const invoiceNumber = `INV-BKG-${(booking.id || "").slice(0, 8).toUpperCase()}`;
    const createdDate = booking.created_at
      ? new Date(booking.created_at).toLocaleDateString("en-IN", {
          year: "numeric", month: "long", day: "numeric",
        })
      : "N/A";

    const originalAmt = parseFloat(booking.original_amount) || 0;
    const discountAmt = parseFloat(booking.discount_amount) || 0;
    const finalAmt = parseFloat(booking.final_amount) || 0;
    const hasPricing = originalAmt > 0 || finalAmt > 0;

    const statusColor = (status: string) => {
      const colors: Record<string, string> = {
        pending: "#f59e0b", confirmed: "#3b82f6", assigned: "#6366f1",
        in_progress: "#a855f7", completed: "#10b981", cancelled: "#ef4444",
      };
      return colors[status] || "#6b7280";
    };

    const statusLabel = (status: string) => {
      const labels: Record<string, string> = {
        pending: "Pending", confirmed: "Confirmed", assigned: "Assigned",
        in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
      };
      return labels[status] || status;
    };

    const fanDetails = [];
    if (booking.is_switch_working) fanDetails.push(`Switch Working: ${booking.is_switch_working === "yes" ? "Yes" : "No"}`);
    if (booking.has_old_fan) fanDetails.push(`Old Fan Present: ${booking.has_old_fan === "yes" ? "Yes" : "No"}`);
    if (booking.is_electricity_supply_on) fanDetails.push(`Electricity Supply: ${booking.is_electricity_supply_on === "yes" ? "On" : "Off"}`);

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 40px 48px;
      color: #1f2937;
      background: #f8fafc;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .invoice-header {
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      padding: 32px 40px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .invoice-header .company-name {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .invoice-header .company-tagline {
      font-size: 11px;
      opacity: 0.8;
      margin-top: 2px;
    }
    .invoice-header .invoice-title {
      text-align: right;
    }
    .invoice-header .invoice-title h1 {
      font-size: 22px;
      font-weight: 700;
    }
    .invoice-header .invoice-title p {
      font-size: 12px;
      opacity: 0.85;
      margin-top: 2px;
    }
    .invoice-body { padding: 32px 40px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .info-box {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px 18px;
      border: 1px solid #e2e8f0;
    }
    .info-box h3 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .info-box p { font-size: 13px; line-height: 1.6; color: #1e293b; }
    .info-box .label { color: #94a3b8; font-size: 12px; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .service-detail {
      background: #f8fafc;
      border-radius: 10px;
      padding: 16px 18px;
      border: 1px solid #e2e8f0;
      margin-bottom: 12px;
    }
    .service-detail .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
    }
    .service-detail .row .lbl { color: #64748b; }
    .service-detail .row .val { font-weight: 600; color: #1e293b; }
    .fan-details {
      margin-top: 10px;
      padding: 12px 16px;
      background: #fffbeb;
      border-radius: 8px;
      border: 1px solid #fde68a;
      font-size: 13px;
    }
    .fan-details strong { color: #92400e; }
    .fan-details span { color: #78350f; }
    .pricing-table {
      margin-top: 14px;
      width: 100%;
      border-collapse: collapse;
    }
    .pricing-table td {
      padding: 8px 14px;
      font-size: 14px;
    }
    .pricing-table td:last-child { text-align: right; font-weight: 600; }
    .pricing-table .discount td { color: #059669; }
    .pricing-table .discount td:last-child { color: #059669; }
    .pricing-table .total td {
      font-size: 18px;
      font-weight: 800;
      border-top: 2px solid #3b82f6;
      padding-top: 12px;
      color: #1e3a8a;
    }
    .coupon-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: white;
      background: ${statusColor(booking.status)};
    }
    .invoice-footer {
      padding: 24px 40px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .invoice-footer p {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.8;
    }
    .invoice-footer .thank-you {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 6px;
    }
    .invoice-footer .company-foot {
      font-weight: 600;
      color: #64748b;
      margin-top: 10px;
    }
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-wrapper { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- Header -->
    <div class="invoice-header">
      <div>
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-tagline">Home Appliance Services</div>
      </div>
      <div class="invoice-title">
        <h1>TAX INVOICE</h1>
        <p>#${invoiceNumber}</p>
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Meta -->
      <div class="invoice-meta">
        <div>
          <span class="label">Invoice Date:</span>
          <span style="font-size:13px;font-weight:600;margin-left:6px;">${createdDate}</span>
        </div>
        <div>
          <span class="status-badge">${statusLabel(booking.status)}</span>
        </div>
      </div>

      <!-- Company & Customer -->
      <div class="info-grid">
        <div class="info-box">
          <h3>From</h3>
          <p><strong>${COMPANY.name}</strong><br/>
          ${COMPANY.address}<br/>
          Phone: ${COMPANY.phone}<br/>
          Email: ${COMPANY.email}</p>
        </div>
        <div class="info-box">
          <h3>Bill To</h3>
          <p><strong>${escapeHtml(booking.name || "N/A")}</strong><br/>
          ${booking.phone ? `Phone: ${escapeHtml(booking.phone)}<br/>` : ""}
          ${booking.email ? `Email: ${escapeHtml(booking.email)}<br/>` : ""}
          ${escapeHtml(booking.address || "")}</p>
        </div>
      </div>

      <!-- Service Details -->
      <div class="section-title">Service Details</div>
      <div class="service-detail">
        <div class="row">
          <span class="lbl">Service Type</span>
          <span class="val">${escapeHtml(booking.service_type || "N/A")}</span>
        </div>
        <div class="row">
          <span class="lbl">Preferred Date</span>
          <span class="val">${escapeHtml(booking.preferred_date || "N/A")}</span>
        </div>
        <div class="row">
          <span class="lbl">Preferred Time</span>
          <span class="val">${escapeHtml(booking.preferred_time || "N/A")}</span>
        </div>
        ${booking.exact_location ? `
        <div class="row">
          <span class="lbl">Exact Location</span>
          <span class="val">${escapeHtml(booking.exact_location)}</span>
        </div>` : ""}
      </div>

      ${booking.description ? `
      <div class="service-detail">
        <div class="row">
          <span class="lbl">Description</span>
        </div>
        <p style="font-size:13px;color:#475569;margin-top:4px;line-height:1.6;">${escapeHtml(booking.description)}</p>
      </div>` : ""}

      ${booking.custom_service_demand ? `
      <div class="service-detail">
        <div class="row">
          <span class="lbl">Custom Service Requirement</span>
        </div>
        <p style="font-size:13px;color:#475569;margin-top:4px;line-height:1.6;">${escapeHtml(booking.custom_service_demand)}</p>
      </div>` : ""}

      ${fanDetails.length > 0 ? `
      <div class="fan-details">
        <strong>Fan Installation Details</strong><br/>
        ${fanDetails.map((d: string) => `<span>• ${d}</span><br/>`).join("")}
      </div>` : ""}

      <!-- Pricing -->
      ${hasPricing ? `
      <div class="section-title" style="margin-top:20px;">Pricing Summary</div>
      <table class="pricing-table">
        <tr>
          <td>Original Amount</td>
          <td>₹${originalAmt.toFixed(2)}</td>
        </tr>
        ${discountAmt > 0 ? `
        <tr class="discount">
          <td>
            Discount${booking.coupon_code ? ` (${escapeHtml(booking.coupon_code)})` : ""}
            ${booking.coupon_code ? `<span class="coupon-badge">${escapeHtml(booking.coupon_code)}</span>` : ""}
          </td>
          <td>-₹${discountAmt.toFixed(2)}</td>
        </tr>` : ""}
        <tr class="total">
          <td>Total Amount</td>
          <td>₹${finalAmt > 0 ? finalAmt.toFixed(2) : originalAmt.toFixed(2)}</td>
        </tr>
      </table>` : ""}
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <p class="thank-you">Thank you for choosing ${COMPANY.name}!</p>
      <p>For any queries, contact us at ${COMPANY.supportEmail} or call ${COMPANY.phone}</p>
      <p>${COMPANY.address}</p>
      <p class="company-foot">${COMPANY.name} — Your Trusted Home Appliance Service Partner</p>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } else {
      toast.error("Unable to open invoice. Please allow popups for this site.");
    }
    toast.success("Invoice generated! Use 'Save as PDF' in print dialog.");
  } catch (error) {
    logger.error("Error generating invoice:", error);
    toast.error("Failed to generate invoice");
  }
}
