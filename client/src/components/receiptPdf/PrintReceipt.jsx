export default function PrintReceipt({ selectedData, personData, formWalkinData, discountShow, posSetup = {}, receiptId, receiptDate, paymentMethod }) {
  const totalPrice = selectedData.reduce((total, item) => total + item.subPrice * 1, 0).toFixed(2);

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmtReceipt = (id) => id ? `RCP-${String(id).padStart(6, "0")}` : "—";

  const customerName  = personData?.name  || formWalkinData?.walkinName  || "Walk-in";
  const customerPhone = personData?.contact_no || formWalkinData?.walkinContact || "";
  const customerEmail = personData?.email || formWalkinData?.walkinEmail || "";

  const payLabel = paymentMethod
    ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
    : "—";

  return (
    <>
      <div id="printreceipt">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="receipt-header">
          <div className="header-left">
            <img src="/tcpl-logo.png" alt="Logo" className="receipt-logo" />
            <div className="coy-block">
              <p className="coy-name">{posSetup.coyname || ""}</p>
              {posSetup.addr1 && <p className="coy-addr">{posSetup.addr1}</p>}
              {posSetup.addr2 && <p className="coy-addr">{posSetup.addr2}</p>}
              {posSetup.addr3 && <p className="coy-addr">{posSetup.addr3}</p>}
              {posSetup.coycontactnumber && <p className="coy-addr">{posSetup.coycontactnumber}</p>}
              {posSetup.coyemail && <p className="coy-addr">{posSetup.coyemail}</p>}
            </div>
          </div>
          <div className="header-right">
            <p className="receipt-title">Sales Receipt</p>
            <p className="receipt-meta"><span className="meta-label">Date&nbsp;:</span> {fmtDate(receiptDate)}</p>
            <p className="receipt-meta"><span className="meta-label">Receipt&nbsp;:</span> {fmtReceipt(receiptId)}</p>
          </div>
        </div>

        {/* ── From / Sold To ──────────────────────────────── */}
        <div className="receipt-parties">
          <div className="party-block">
            <p className="party-label">FROM</p>
            <p>{posSetup.coyname || ""}</p>
            {posSetup.addr1 && <p>{posSetup.addr1}</p>}
            {posSetup.coycontactnumber && <p>{posSetup.coycontactnumber}</p>}
          </div>
          <div className="party-block">
            <p className="party-label">SOLD TO</p>
            <p>{customerName}</p>
            {customerPhone && <p>{customerPhone}</p>}
            {customerEmail && <p>{customerEmail}</p>}
          </div>
        </div>

        {/* ── Items Table ──────────────────────────────────── */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th className="col-desc" colSpan={3}>Description</th>
              <th className="col-center">Qty</th>
              <th className="col-center">Unit Price</th>
              {discountShow && <th className="col-center">Subtotal</th>}
              {discountShow && <th className="col-center">Discount</th>}
              <th className="col-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedData.map((item, i) => (
              <tr key={i}>
                <td className="col-desc" colSpan={3}>
                  {item.name
                    ? item.name
                    : item.packageCusFlag
                    ? `${item.packagedesc} (Package Customer)`
                    : `${item.packagedesc} (New Package)`}
                  {item.variantLabel && (
                    <span className="receipt-variant-label">{item.variantLabel}</span>
                  )}
                </td>
                <td className="col-center">{item.amount}</td>
                <td className="col-center">${discountShow ? item.price : item.subPrice}</td>
                {discountShow && <td className="col-center">${(item.price * item.amount).toFixed(2)}</td>}
                {discountShow && <td className="col-center">{item.discpercent ? `${item.discount}%` : `-$${(item.discount * 1).toFixed(2)}`}</td>}
                <td className="col-center">${(item.subPrice * 1).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Footer: Payment + Total ─────────────────────── */}
        <div className="receipt-footer">
          <div>
            <p className="footer-label">Payment Method</p>
            <p>{payLabel}</p>
          </div>
          <div className="total-box">
            <p>Total&nbsp;: <strong>${totalPrice}</strong></p>
          </div>
        </div>

        {/* ── Thank You Bar ───────────────────────────────── */}
        <div className="thank-you-bar">
          <p className="thank-title">Thank You For Your Purchase</p>
          {(posSetup.coyemail || posSetup.coycontactnumber) && (
            <p className="thank-contact">
              {[posSetup.coyemail, posSetup.coycontactnumber].filter(Boolean).join("  |  ")}
            </p>
          )}
        </div>
      </div>

      <style>{`
        /* ── Screen: hide receipt (shown only on print) ── */
        #printreceipt {
          display: none;
        }

        @media print {
          body * { visibility: hidden; }
          #printreceipt, #printreceipt * { visibility: visible; }
          #printreceipt {
            display: block;
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            background: white;
          }
        }

        @page {
          size: A5 landscape;
          margin: 8mm;
        }

        /* ── Receipt Layout ── */
        #printreceipt {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 9pt;
          color: #222;
          width: 100%;
        }

        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: #e8d5fb;
          padding: 6px 10px;
          border-radius: 4px 4px 0 0;
        }
        .header-left { display: flex; align-items: flex-start; gap: 8px; }
        .receipt-logo { width: 44px; height: 44px; object-fit: contain; }
        .coy-block { display: flex; flex-direction: column; gap: 1px; }
        .coy-name { font-size: 10.5pt; font-weight: bold; margin: 0; }
        .coy-addr { font-size: 7.5pt; color: #444; margin: 0; }

        .header-right { text-align: right; }
        .receipt-title {
          font-size: 15pt;
          font-weight: bold;
          color: #4a0080;
          margin: 0 0 4px 0;
        }
        .receipt-meta { font-size: 14pt; margin: 1px 0; }
        .meta-label { font-weight: 600; }

        .receipt-parties {
          display: flex;
          gap: 30px;
          padding: 6px 10px;
          border-bottom: 1px solid #ccc;
          margin-bottom: 4px;
        }
        .party-block { flex: 1; font-size: 8.5pt; }
        .party-block p { margin: 1px 0; }
        .party-label { font-weight: bold; font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }

        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
          margin-bottom: 6px;
        }
        .receipt-table th {
          background: #f3f3f3;
          border: 1px solid #ccc;
          padding: 3px 5px;
          font-weight: 600;
        }
        .receipt-table td {
          border: 1px solid #ddd;
          padding: 3px 5px;
        }
        .col-desc { text-align: left; width: 50%; }
        .col-center { text-align: center; }
        .receipt-variant-label {
          display: block;
          font-size: 7pt;
          color: #666;
          margin-top: 1px;
        }

        .receipt-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 4px 10px;
          font-size: 9pt;
        }
        .footer-label { font-weight: 600; margin-bottom: 2px; }
        .total-box {
          border-top: 2px solid #333;
          padding-top: 3px;
          text-align: right;
          font-size: 10pt;
        }

        .thank-you-bar {
          background: #e8d5fb;
          text-align: center;
          padding: 6px 10px;
          border-radius: 0 0 4px 4px;
          margin-top: 4px;
        }
        .thank-title { font-size: 10pt; font-weight: 600; margin: 0; }
        .thank-contact { font-size: 8pt; color: #444; margin: 2px 0 0 0; }
      `}</style>
    </>
  );
}
