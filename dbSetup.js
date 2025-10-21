const pool = require('./db');

function toMysqlDate(d) {
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function resetAndSeed() {
  const conn = await pool.getConnection();
  try {
    console.log('[DB] Resetting schema...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DROP TABLE IF EXISTS blood_stock');
    await conn.query('DROP TABLE IF EXISTS donors');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS donors (
        donor_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        blood_group VARCHAR(5) NOT NULL,
        phone VARCHAR(20) UNIQUE,
        city VARCHAR(100) NOT NULL,
        last_donation_date DATE NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS blood_stock (
        bag_id INT PRIMARY KEY AUTO_INCREMENT,
        donor_id INT,
        blood_group VARCHAR(5) NOT NULL,
        donation_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Available',
        CONSTRAINT fk_blood_stock_donor FOREIGN KEY (donor_id) REFERENCES donors(donor_id)
          ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('[DB] Seeding data...');
    const donors = [
      { name: 'Alice Johnson', blood_group: 'O+', phone: '555-0001', city: 'Springfield', last_donation_date: '2025-07-01' },
      { name: 'Bob Smith', blood_group: 'A-', phone: '555-0002', city: 'Riverdale', last_donation_date: null },
      { name: 'Carla Gomez', blood_group: 'B+', phone: '555-0003', city: 'Hill Valley', last_donation_date: '2025-08-15' },
      { name: 'David Lee', blood_group: 'AB-', phone: '555-0004', city: 'Star City', last_donation_date: null },
      { name: 'Eve Patel', blood_group: 'A+', phone: '555-0005', city: 'Central City', last_donation_date: '2025-06-20' }
    ];

    for (const d of donors) {
      await conn.query(
        'INSERT INTO donors (name, blood_group, phone, city, last_donation_date) VALUES (?, ?, ?, ?, ?)',
        [d.name, d.blood_group, d.phone, d.city, d.last_donation_date]
      );
    }

    // Map donors by phone to get ids and blood groups
    const [donorRows] = await conn.query('SELECT donor_id, phone, blood_group FROM donors');
    const donorByPhone = new Map(donorRows.map(r => [r.phone, r]));

    // Seed a few blood bags
    const stockSeeds = [
      { phone: '555-0001', donation_date: '2025-09-10', status: 'Available' },
      { phone: '555-0003', donation_date: '2025-09-25', status: 'Available' },
      { phone: '555-0005', donation_date: '2025-07-01', status: 'Issued' }
    ];

    for (const s of stockSeeds) {
      const donor = donorByPhone.get(s.phone);
      if (!donor) continue;
      const dDate = new Date(s.donation_date);
      const expiry = new Date(dDate);
      expiry.setDate(expiry.getDate() + 42);
      await conn.query(
        'INSERT INTO blood_stock (donor_id, blood_group, donation_date, expiry_date, status) VALUES (?, ?, ?, ?, ?)',
        [donor.donor_id, donor.blood_group, toMysqlDate(dDate), toMysqlDate(expiry), s.status]
      );
    }

    console.log('[DB] Reset and seed complete.');
  } finally {
    conn.release();
  }
}

module.exports = { resetAndSeed };
