const express = require("express");
const router = express.Router();
const pool = require("../db");

// List donors
router.get("/", async (req, res) => {
  const message = req.query.msg || null;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM donors ORDER BY donor_id DESC"
    );
    res.render("donors", { donors: rows, message });
  } catch (err) {
    res.status(500).send("Error fetching donors: " + err.message);
  }
});

// Add donor form
router.get("/add", (req, res) => {
  res.render("add-donor", { error: null, form: {} });
});

// Add donor submit
router.post("/add", async (req, res) => {
  const { name, blood_group, phone, city } = req.body;
  try {
    await pool.query(
      "INSERT INTO donors (name, blood_group, phone, city) VALUES (?, ?, ?, ?)",
      [name, blood_group, phone, city]
    );
    res.redirect("/donors?msg=Donor%20added%20successfully");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.render("add-donor", {
        error: "Phone number already exists.",
        form: req.body,
      });
    }
    res.status(500).send("Error adding donor: " + err.message);
  }
});

// Edit donor form
router.get("/edit/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM donors WHERE donor_id = ?", [
      id,
    ]);
    if (!rows.length) return res.redirect("/donors?msg=Donor%20not%20found");
    res.render("edit-donor", { donor: rows[0], error: null });
  } catch (err) {
    res.status(500).send("Error fetching donor: " + err.message);
  }
});

// Edit donor submit
router.post("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, city } = req.body; // blood_group is not editable
  try {
    await pool.query(
      "UPDATE donors SET name = ?, phone = ?, city = ? WHERE donor_id = ?",
      [name, phone, city, id]
    );
    res.redirect("/donors?msg=Donor%20updated");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      // Re-render with error and original donor data
      const [rows] = await pool.query(
        "SELECT * FROM donors WHERE donor_id = ?",
        [id]
      );
      return res.render("edit-donor", {
        donor: rows[0],
        error: "Phone number already exists.",
      });
    }
    res.status(500).send("Error updating donor: " + err.message);
  }
});

// Delete donor with dependency check
router.post("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM blood_stock WHERE donor_id = ?",
      [id]
    );
    const { cnt } = countRows[0];
    if (cnt > 0) {
      return res.redirect(
        "/donors?msg=Cannot%20delete:%20donor%20has%20stock%20records"
      );
    }
    await pool.query("DELETE FROM donors WHERE donor_id = ?", [id]);
    res.redirect("/donors?msg=Donor%20deleted");
  } catch (err) {
    res.status(500).send("Error deleting donor: " + err.message);
  }
});

module.exports = router;
