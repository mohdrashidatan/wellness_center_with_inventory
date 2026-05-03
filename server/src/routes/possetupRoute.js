const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT coyname, addr1, addr2, addr3, coyemail, coycontactnumber FROM possetup ORDER BY setupid LIMIT 1"
    );
    res.json(rows.length ? rows[0] : {});
  } catch {
    res.json({ coyname: "" });
  }
});

module.exports = router;
