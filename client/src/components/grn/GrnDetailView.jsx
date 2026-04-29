import { useEffect, useState } from "react";
import { grnService } from "@/services/grnService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

const fmt = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return d.toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
};

const addressLine = (h) => {
  const parts = [h.billing_address1, h.billing_address2, h.billing_city, h.billing_postal_code, h.billing_country];
  return parts.filter(Boolean).join(", ") || "—";
};

export default function GrnDetailView({ grnId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!grnId) return;
    setLoading(true);
    grnService
      .getById(grnId)
      .then(setData)
      .catch(() => setError("Failed to load GRN details"))
      .finally(() => setLoading(false));
  }, [grnId]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
      </div>
    );

  if (error) return <p className="text-red-500 text-center py-8">{error}</p>;
  if (!data)  return null;

  const { header: h, lines } = data;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GRN Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-base text-gray-700 border-b pb-1 mb-2">GRN Information</h3>
          <Row label="GRN No."       value={`GRN-${String(h.grnid).padStart(5, "0")}`} />
          <Row label="Received Date" value={fmt(h.receiptdate)} />
          <Row label="Remarks"       value={h.remarks || "—"} />
        </div>

        {/* Supplier Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-base text-gray-700 border-b pb-1 mb-2">Supplier</h3>
          <Row label="Name"           value={h.supplier_name    || "—"} bold />
          <Row label="Code"           value={h.supplier_code    || "—"} />
          <Row label="Contact Person" value={h.supplier_contact_person || "—"} />
          <Row label="Phone"          value={h.supplier_phone   || "—"} />
          <Row label="Email"          value={h.supplier_email   || "—"} />
          <Row label="Address"        value={addressLine(h)} />
        </div>
      </div>

      {/* ── Lines ── */}
      <div>
        <h3 className="font-semibold text-base text-gray-700 mb-2">Received Items</h3>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-8">#</TableHead>
                <TableHead>Item Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>Consignment</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-6">
                    No items found
                  </TableCell>
                </TableRow>
              )}
              {lines.map((ln, i) => (
                <TableRow key={ln.grnlineid} className="text-sm">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{ln.product_name || "—"}</TableCell>
                  <TableCell className="text-gray-500 text-xs">{ln.product_desc || "—"}</TableCell>
                  <TableCell className="text-right">{ln.qty}</TableCell>
                  <TableCell>{ln.uom || "—"}</TableCell>
                  <TableCell>
                    <span className={ln.consign ? "text-amber-600 font-medium" : "text-gray-400"}>
                      {ln.consign ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell>{ln.remarks || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer summary */}
        <div className="flex justify-end mt-3">
          <div className="bg-gray-50 rounded-lg px-6 py-2 text-sm">
            <span className="text-gray-500">Total Lines: </span>
            <span className="font-semibold">{lines.length}</span>
            <span className="mx-4 text-gray-300">|</span>
            <span className="text-gray-500">Total Qty: </span>
            <span className="font-semibold">{lines.reduce((s, l) => s + (l.qty || 0), 0)}</span>
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
