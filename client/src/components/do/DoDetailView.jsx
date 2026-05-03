import { useEffect, useState } from "react";
import { doService } from "@/services/doService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

const fmt = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
};

const addressLine = (h) => {
  const parts = [h.billing_address1, h.billing_address2, h.billing_city, h.billing_postal_code, h.billing_country];
  return parts.filter(Boolean).join(", ") || "—";
};

export default function DoDetailView({ doId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!doId) return;
    setLoading(true);
    doService
      .getById(doId)
      .then(setData)
      .catch(() => setError("Failed to load Delivery Order details"))
      .finally(() => setLoading(false));
  }, [doId]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
      </div>
    );

  if (error) return <p className="text-red-500 text-center py-8">{error}</p>;
  if (!data)  return null;

  const { header: h, lines } = data;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 rounded-xl p-4 space-y-2 text-sm border border-orange-100">
          <h3 className="font-semibold text-base text-orange-700 border-b border-orange-200 pb-1 mb-2">
            Delivery Order Information
          </h3>
          <Row label="DO No."         value={`DO-${String(h.doid).padStart(5, "0")}`} />
          <Row label="Transfer Date"  value={fmt(h.transferdate)} />
          <Row label="DO Reference"   value={h.delivery_order_no || "—"} />
          <Row label="Remarks"        value={h.remarks || "—"} />
        </div>

        <div className="bg-orange-50 rounded-xl p-4 space-y-2 text-sm border border-orange-100">
          <h3 className="font-semibold text-base text-orange-700 border-b border-orange-200 pb-1 mb-2">
            Recipient
          </h3>
          <Row label="Name"           value={h.recipient_name    || "—"} bold />
          <Row label="Code"           value={h.recipient_code    || "—"} />
          <Row label="Contact Person" value={h.recipient_contact_person || "—"} />
          <Row label="Phone"          value={h.recipient_phone   || "—"} />
          <Row label="Email"          value={h.recipient_email   || "—"} />
          <Row label="Address"        value={addressLine(h)} />
        </div>
      </div>

      {/* ── Lines ── */}
      <div>
        <h3 className="font-semibold text-base text-orange-700 mb-2">Transferred Items</h3>
        <div className="rounded-xl border border-orange-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-50">
                <TableHead className="w-8">#</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>Batch No.</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-6">
                    No items found
                  </TableCell>
                </TableRow>
              )}
              {lines.map((ln, i) => (
                <TableRow key={ln.dolineid} className="text-sm">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{ln.product_name || "—"}</TableCell>
                  <TableCell className="text-gray-500 text-xs">{ln.product_desc || "—"}</TableCell>
                  <TableCell className="text-right">{ln.qty}</TableCell>
                  <TableCell>{ln.uom || "—"}</TableCell>
                  <TableCell>{ln.batch_no || "—"}</TableCell>
                  <TableCell>{fmt(ln.expiry_date)}</TableCell>
                  <TableCell>{ln.remarks || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mt-3">
          <div className="bg-orange-50 border border-orange-100 rounded-lg px-6 py-2 text-sm">
            <span className="text-gray-500">Total Lines: </span>
            <span className="font-semibold">{lines.length}</span>
            <span className="mx-4 text-gray-300">|</span>
            <span className="text-gray-500">Total Qty: </span>
            <span className="font-semibold">{lines.reduce((s, l) => s + (parseFloat(l.qty) || 0), 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold = false }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <span className={bold ? "font-semibold text-gray-800" : "text-gray-700"}>{value}</span>
    </div>
  );
}
