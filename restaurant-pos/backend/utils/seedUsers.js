// Run with: npm run seed:users
// Creates/updates the two demo login accounts with correctly hashed passwords.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function run() {
  const password = 'Password123';
  const hash = await bcrypt.hash(password, 10);

  const users = [
    { name: 'Restaurant Owner', email: 'admin@restaurant.com', role: 'ADMIN' },
    { name: 'Cashier One', email: 'cashier@restaurant.com', role: 'CASHIER' },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [u.name, u.email, hash, u.role]
    );
    console.log(`Seeded ${u.role} -> ${u.email} / ${password}`);
  }
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
