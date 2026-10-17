const pos = require("../models/posModel");
const serialModel = require("../models/serialModel");

const posInsertHd = async (data, userId) => {
  try {
    const result = await pos.addPosHd(data, userId);
    return result;
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

/**
 * Insert the sale lines, then record any serial numbers captured at checkout.
 *
 * The loop awaits each insert sequentially so the generated poslinesid is known
 * and can be attached to the serial movement — the previous forEach fired the
 * inserts without awaiting and discarded the ids.
 */
const posInsertLine = async (idPosHd, data, userId) => {
  try {
    const inserted = [];

    for (const item of data) {
      const isPackage = Boolean(item.packageid);
      const itemId = isPackage ? item.packageid : item.id;
      const poslinesid = await pos.addPosLine(idPosHd, item, userId, itemId, isPackage ? 1 : 0);
      inserted.push({ poslinesid, itemId, isPackage, serials: item.serials });
    }

    // Stock out: a serial either moves an existing in-stock unit to Sold, or is
    // created now for products whose serial is only applied at the point of sale.
    for (const line of inserted) {
      if (line.isPackage) continue;
      if (!line.serials || line.serials.length === 0) continue;
      await serialModel.issueOnStockOut({
        productid: line.itemId,
        docType: "pos",
        lineId: line.poslinesid,
        serials: line.serials,
        enteredby: userId,
        status: "Sold",
      });
    }

    return inserted.length ? inserted[inserted.length - 1].poslinesid : null;
  } catch (error) {
    console.error("Failed to save POS lines:", error.message);
    // Surface serial problems (unknown/duplicate/already sold) to the cashier
    // instead of collapsing them into a generic failure.
    if (String(error.code || "").startsWith("SERIAL_")) throw error;
    throw new Error("Error while storing POS line data");
  }
};

const getCustomerPosHd = async (id) => {
  try {
    const result = await pos.getPosHdCusData(id);
    return result;
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

const getCustomerPosLine = async (id) => {
  try {
    const result = await pos.getPosLineCusData(id);
    return result;
  } catch (error) {
    console.error("Failed to save consent:", error.message);
    throw new Error("Error while storing consent data");
  }
};

module.exports = { posInsertHd, posInsertLine, getCustomerPosHd, getCustomerPosLine };
