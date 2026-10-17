import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Lexend",
  src: "/Lexend-Regular.ttf",
});

// Base font size: 9pt  |  Date/Receipt# (meta): 14pt  |  Title: 15pt
const s = StyleSheet.create({
  page: {
    fontFamily: "Lexend",
    fontSize: 9,
    color: "#222",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#e8d5fb",
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  headerLeft: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  logo: { width: 44, height: 44, objectFit: "contain", marginRight: 8 },
  coyName: { fontSize: 10.5, fontWeight: "bold" },
  coyAddr: { fontSize: 7.5, color: "#555", marginTop: 1 },
  headerRight: { alignItems: "flex-end" },
  receiptTitle: { fontSize: 15, fontWeight: "bold", color: "#4a0080", marginBottom: 4 },
  receiptMeta: { fontSize: 14, marginTop: 2 },
  metaLabel: { fontWeight: "bold" },

  /* Parties */
  parties: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 6,
  },
  partyBlock: { flex: 1 },
  partyLabel: { fontSize: 7.5, fontWeight: "bold", color: "#777", textTransform: "uppercase", marginBottom: 2 },
  partyLine: { fontSize: 8.5, marginTop: 1 },

  /* Table */
  table: { width: "100%", marginBottom: 6 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f3f3f3" },
  tableRow: { flexDirection: "row" },
  cellDesc: { flex: 3, borderWidth: 1, borderColor: "#ccc", padding: 3 },
  cellDescText: { fontSize: 8.5 },
  cellDescVariant: { fontSize: 7, color: "#666", marginTop: 1 },
  cellCenter: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 3, fontSize: 8.5, textAlign: "center" },
  cellHeaderDesc: { flex: 3, borderWidth: 1, borderColor: "#ccc", padding: 3, fontSize: 8.5, fontWeight: "bold" },
  cellHeaderCenter: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 3, fontSize: 8.5, fontWeight: "bold", textAlign: "center" },

  /* Footer */
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
    paddingTop: 4,
    marginBottom: 6,
  },
  footerLabel: { fontSize: 9, fontWeight: "bold", marginBottom: 2 },
  footerValue: { fontSize: 9 },
  totalBox: {
    borderTopWidth: 2,
    borderTopColor: "#333",
    paddingTop: 3,
    textAlign: "right",
    fontSize: 10,
  },

  /* Bottom bar */
  bottomBar: {
    backgroundColor: "#e8d5fb",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 4,
  },
  thankTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  thankContact: { fontSize: 8, color: "#444" },
});

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtReceipt = (id) => (id ? `RCP-${String(id).padStart(6, "0")}` : "—");

export const EmailReceipt = ({ personData, formWalkinData, selectedData, discountShow, totalPrice, posSetup = {}, receiptId, receiptDate, paymentMethod }) => {
  const customerName  = personData?.name  || formWalkinData?.walkinName  || "Walk-in";
  const customerPhone = personData?.contact_no || formWalkinData?.walkinContact || "";
  const customerEmail = personData?.email || formWalkinData?.walkinEmail || "";
  const payLabel = paymentMethod ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) : "—";

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Image style={s.logo} src="/tcpl-logo.png" />
            <View>
              <Text style={s.coyName}>{posSetup.coyname || ""}</Text>
              {posSetup.addr1 ? <Text style={s.coyAddr}>{posSetup.addr1}</Text> : null}
              {posSetup.addr2 ? <Text style={s.coyAddr}>{posSetup.addr2}</Text> : null}
              {posSetup.addr3 ? <Text style={s.coyAddr}>{posSetup.addr3}</Text> : null}
              {posSetup.coycontactnumber ? <Text style={s.coyAddr}>{posSetup.coycontactnumber}</Text> : null}
              {posSetup.coyemail ? <Text style={s.coyAddr}>{posSetup.coyemail}</Text> : null}
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.receiptTitle}>Sales Receipt</Text>
            <Text style={s.receiptMeta}><Text style={s.metaLabel}>Date : </Text>{fmtDate(receiptDate)}</Text>
            <Text style={s.receiptMeta}><Text style={s.metaLabel}>Receipt : </Text>{fmtReceipt(receiptId)}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.parties}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>FROM</Text>
            <Text style={s.partyLine}>{posSetup.coyname || ""}</Text>
            {posSetup.addr1 ? <Text style={s.partyLine}>{posSetup.addr1}</Text> : null}
            {posSetup.coycontactnumber ? <Text style={s.partyLine}>{posSetup.coycontactnumber}</Text> : null}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>SOLD TO</Text>
            <Text style={s.partyLine}>{customerName}</Text>
            {customerPhone ? <Text style={s.partyLine}>{customerPhone}</Text> : null}
            {customerEmail ? <Text style={s.partyLine}>{customerEmail}</Text> : null}
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={s.cellHeaderDesc}>Description</Text>
            <Text style={s.cellHeaderCenter}>Qty</Text>
            <Text style={s.cellHeaderCenter}>Unit Price</Text>
            {discountShow ? <Text style={s.cellHeaderCenter}>Subtotal</Text> : null}
            {discountShow ? <Text style={s.cellHeaderCenter}>Discount</Text> : null}
            <Text style={s.cellHeaderCenter}>Total</Text>
          </View>
          {selectedData.map((item, idx) => (
            <View style={s.tableRow} key={idx}>
              <View style={s.cellDesc}>
                <Text style={s.cellDescText}>
                  {item.name
                    ? item.name
                    : item.packageCusFlag
                    ? `${item.packagedesc} (Package Customer)`
                    : `${item.packagedesc} (New Package)`}
                </Text>
                {item.variantLabel ? (
                  <Text style={s.cellDescVariant}>{item.variantLabel}</Text>
                ) : null}
              </View>
              <Text style={s.cellCenter}>{item.amount}</Text>
              <Text style={s.cellCenter}>${discountShow ? item.price : item.subPrice}</Text>
              {discountShow ? <Text style={s.cellCenter}>${(item.price * item.amount).toFixed(2)}</Text> : null}
              {discountShow ? (
                <Text style={s.cellCenter}>
                  {item.discpercent ? `${item.discount}%` : `-$${(item.discount * 1).toFixed(2)}`}
                </Text>
              ) : null}
              <Text style={s.cellCenter}>${(item.subPrice * 1).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footerRow}>
          <View>
            <Text style={s.footerLabel}>Payment Method</Text>
            <Text style={s.footerValue}>{payLabel}</Text>
          </View>
          <View style={s.totalBox}>
            <Text>Total : ${totalPrice}</Text>
          </View>
        </View>

        {/* Bottom bar */}
        <View style={s.bottomBar}>
          <Text style={s.thankTitle}>Thank You For Your Purchase</Text>
          {(posSetup.coyemail || posSetup.coycontactnumber) ? (
            <Text style={s.thankContact}>
              {[posSetup.coyemail, posSetup.coycontactnumber].filter(Boolean).join("  |  ")}
            </Text>
          ) : null}
        </View>

      </Page>
    </Document>
  );
};
