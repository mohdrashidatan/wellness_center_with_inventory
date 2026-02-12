import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import pwglogo from "../../assets/pwglogo.svg";

Font.register({
  family: "Lexend",
  src: "/Lexend-Regular.ttf",
});

const styles = StyleSheet.create({
  page: { fontFamily: "Lexend", fontSize: 14 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#D3AAFB", padding: 5 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logo: { width: 60, height: 60, marginRight: 8 },
  section: { marginTop: 30, flexDirection: "row", padding: 20, gap: 10 },
  table: { display: "flex", flexDirection: "column", marginTop: 40, borderWidth: 1, borderColor: "#ccc", padding: 20 },
  from: { marginRight: 50 },
  soldto: { marginLeft: 50, paddingRight: 50 },
  tableRow: { flexDirection: "row" },
  tableHeader: { backgroundColor: "#f3f3f3", fontWeight: "bold" },
  tableColDesc: { flex: 3, borderWidth: 1, borderColor: "#ccc", padding: 4 },
  tableColCenter: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 4, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 80, padding: 20 },
  totalBox: { width: 200, textAlign: "right", borderTopWidth: 1, borderTopColor: "#000", paddingTop: 4 },
  divider: { height: 5, backgroundColor: "#fff" },
  bottomBar: { height: 10, backgroundColor: "#D3AAFB" },
  bottomfooter: { position: "absolute", bottom: 0, left: 0, backgroundColor: "#D3AAFB", textAlign: "center", padding: 30, width: "100%" },
});

const today = new Date().toISOString().split("T")[0];
// Component
export const EmailReceipt = ({ personData, selectedData, discountShow, totalPrice }) => (
  <Document>
    <Page size='A3' orientation='landscape' style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image style={styles.logo} src={"/pwglogo.png"} />
          <Text>Prife Wellness Group</Text>
        </View>
        <View>
          <Text>Payment Date: {today}</Text>
          <Text>Receipt #322323</Text>
        </View>
      </View>

      {/* From & Sold To */}
      <View style={styles.section}>
        <View style={styles.from}>
          <Text>From</Text>
          <Text>Prife Wellness Group</Text>
          <Text>Address Of Prife Wellness Group</Text>
          <Text>(223)321311231231</Text>
        </View>
        <View style={styles.soldto}>
          <Text>Sold To</Text>
          <Text>{personData.name}</Text>
          <Text>{personData.contact_no}</Text>
          <Text>{personData.email}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableColDesc}>Description</Text>
          <Text style={styles.tableColCenter}>Quantity</Text>
          <Text style={styles.tableColCenter}>Unit Price</Text>
          {discountShow && <Text style={styles.tableColCenter}>Subtotal</Text>}
          {discountShow && <Text style={styles.tableColCenter}>Discount</Text>}
          <Text style={styles.tableColCenter}>Total</Text>
        </View>

        {/* Rows */}
        {selectedData.map((item, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.tableColDesc}>{item.name ? item.name : item.packageCusFlag ? `${item.packagedesc} (Package Customer)` : `${item.packagedesc} (Package)`}</Text>
            <Text style={styles.tableColCenter}>{item.amount}</Text>
            <Text style={styles.tableColCenter}>${discountShow ? item.price : item.subPrice}</Text>
            {discountShow && <Text style={styles.tableColCenter}>${(item.price * item.amount).toFixed(2)}</Text>}
            {discountShow && <Text style={styles.tableColCenter}>{item.discpercent ? `${item.discount}%` : `-$${(item.discount * 1).toFixed(2)}`}</Text>}
            <Text style={styles.tableColCenter}>${(item.subPrice * 1).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={{ fontWeight: "bold" }}>Payment Method:</Text>
          <Text>Cash</Text>
        </View>
        <View style={styles.totalBox}>
          <Text>Total: ${totalPrice}</Text>
        </View>
      </View>

      <View style={styles.bottomfooter}>
        <Text>Thank You For Your Purchase</Text>
        <Text>For question or any concern please contact</Text>
        <Text>PWG@gmail.com, Bob(21)32132123</Text>
      </View>
    </Page>
  </Document>
);
