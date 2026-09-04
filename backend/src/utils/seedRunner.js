const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function fixUserPasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Subhash@8729',
    database: process.env.DB_NAME || 'metrix_r76'
  });

  const users = [
    { email: 'admin@metrix.gov.in', pwd: 'Admin@123' },
    { email: 'officer@metrix.gov.in', pwd: 'Officer@123' },
    { email: 'reviewer@metrix.gov.in', pwd: 'Reviewer@123' },
    { email: 'approver@metrix.gov.in', pwd: 'Approver@123' },
    { email: 'viewer@metrix.gov.in', pwd: 'Viewer@123' }
  ];

  console.log('Synchronizing user passwords with bcryptjs...');
  for (const u of users) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(u.pwd, salt);
    await connection.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, u.email]);
    console.log(`Updated ${u.email} -> hash generated.`);
  }

  await connection.end();
  console.log('All user passwords successfully synchronized!');
}

if (require.main === module) {
  fixUserPasswords().catch(console.error);
}

module.exports = { fixUserPasswords };
