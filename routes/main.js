const express = require('express');
const router = express.Router();
const pool = require('../db');

function toMysqlDate(d) {
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Dashboard
router.get('/', async (req, res) => {
  const message = req.query.message || null;
  try {
    const [rows] = await pool.query(
      "SELECT blood_group, COUNT(*) AS unit_count FROM blood_stock WHERE status = 'Available' GROUP BY blood_group"
    );
    res.render('index', { groups: rows, message });
  } catch (err) {
    res.status(500).send('Error loading dashboard: ' + err.message);
  }
});

// Inventory list with optional filter
router.get('/inventory', async (req, res) => {
  const { blood_group } = req.query;
  try {
    let sql =
      'SELECT b.*, d.name AS donor_name FROM blood_stock b LEFT JOIN donors d ON b.donor_id = d.donor_id';
    const params = [];
    if (blood_group) {
      sql += ' WHERE b.blood_group = ?';
      params.push(blood_group);
    }
    sql += ' ORDER BY b.bag_id DESC';
    const [rows] = await pool.query(sql, params);
    res.render('inventory', { stock: rows, selectedGroup: blood_group || '', message: null });
  } catch (err) {
    res.status(500).send('Error loading inventory: ' + err.message);
  }
});

// Donate form
router.get('/inventory/donate', async (req, res) => {
  const message = req.query.msg || null;
  try {
    const [donors] = await pool.query('SELECT donor_id, name, blood_group FROM donors ORDER BY name ASC');
    res.render('donate', { donors, error: null, message, form: {} });
  } catch (err) {
    res.status(500).send('Error loading donate form: ' + err.message);
  }
});

// Donate submit with 3-month rule
router.post('/inventory/donate', async (req, res) => {
  const { donor_id, donation_date } = req.body;
  try {
    const donorId = parseInt(donor_id, 10);
    // Fetch donor info
    const [donorRows] = await pool.query('SELECT blood_group, last_donation_date FROM donors WHERE donor_id = ?', [donorId]);
    if (!donorRows.length) return res.redirect('/inventory/donate?msg=Donor%20not%20found');
    const donor = donorRows[0];

    const newDate = new Date(donation_date);
    if (isNaN(newDate.getTime())) {
      const [donors] = await pool.query('SELECT donor_id, name, blood_group FROM donors ORDER BY name ASC');
      return res.render('donate', { donors, error: 'Invalid donation date.', message: null, form: req.body });
    }

    if (donor.last_donation_date) {
      const last = new Date(donor.last_donation_date);
      const diffMs = newDate - last;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays < 90) {
        const [donors] = await pool.query('SELECT donor_id, name, blood_group FROM donors ORDER BY name ASC');
        return res.render('donate', {
          donors,
          error: 'Donation rejected: less than 3 months since last donation.',
          message: null,
          form: req.body,
        });
      }
    }

    // Insert into blood_stock; expiry = donation_date + 42 days
    const expiry = new Date(newDate);
    expiry.setDate(expiry.getDate() + 42);
    await pool.query(
      'INSERT INTO blood_stock (donor_id, blood_group, donation_date, expiry_date, status) VALUES (?, ?, ?, ?, "Available")',
      [donorId, donor.blood_group, toMysqlDate(newDate), toMysqlDate(expiry)]
    );

    // Update donor last_donation_date
    await pool.query('UPDATE donors SET last_donation_date = ? WHERE donor_id = ?', [toMysqlDate(newDate), donorId]);

    res.redirect('/inventory');
  } catch (err) {
    res.status(500).send('Error recording donation: ' + err.message);
  }
});

// Issue form
router.get('/inventory/issue', async (req, res) => {
  try {
    const [bags] = await pool.query(
      "SELECT bag_id, blood_group, donation_date, expiry_date FROM blood_stock WHERE status = 'Available' ORDER BY donation_date DESC"
    );
    res.render('issue', { bags, error: null });
  } catch (err) {
    res.status(500).send('Error loading issue form: ' + err.message);
  }
});

// Issue submit
router.post('/inventory/issue', async (req, res) => {
  const { bag_id } = req.body;
  try {
    await pool.query('UPDATE blood_stock SET status = "Issued" WHERE bag_id = ?', [bag_id]);
    res.redirect('/inventory');
  } catch (err) {
    res.status(500).send('Error issuing blood bag: ' + err.message);
  }
});

// Delete inventory item (only if not issued)
router.post('/inventory/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT status FROM blood_stock WHERE bag_id = ?', [id]);
    if (!rows.length) return res.redirect('/inventory');
    if (rows[0].status === 'Issued') {
      return res.redirect('/inventory?msg=Cannot%20delete%20issued%20blood%20bag');
    }
    await pool.query('DELETE FROM blood_stock WHERE bag_id = ?', [id]);
    res.redirect('/inventory');
  } catch (err) {
    res.status(500).send('Error deleting blood bag: ' + err.message);
  }
});

module.exports = router;
