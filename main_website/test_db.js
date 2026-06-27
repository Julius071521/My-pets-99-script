const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Basic dotenv parser to load .env manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found in current directory!');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  });
}

loadEnv();

console.log('🔍 Database Diagnostic Test Started...');
console.log('--------------------------------------------------');
console.log(`Host:     ${process.env.DB_HOST}`);
console.log(`Port:     ${process.env.DB_PORT || 3306}`);
console.log(`User:     ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log('--------------------------------------------------');

async function testConnection() {
  try {
    console.log('⏳ Attempting to connect to MySQL database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connection Successful!');
    
    console.log('⏳ Running basic database privileges query...');
    const [rows] = await connection.query('SHOW TABLES');
    console.log(`✅ Success! Found ${rows.length} existing tables in database.`);
    
    await connection.end();
    console.log('--------------------------------------------------');
    console.log('🎉 Your database connection is 100% working!');
    console.log('🚀 You are ready to run the main server.');
  } catch (error) {
    console.log('--------------------------------------------------');
    console.error('❌ Connection Failed!');
    console.error(`Error Code:    ${error.code}`);
    console.error(`Error Message: ${error.message}`);
    console.log('--------------------------------------------------');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 DIAGNOSIS: Access Denied Error.');
      console.log('This means MySQL rejected the connection. Possible causes:');
      console.log('1. Typo in DB_USER or DB_PASSWORD inside .env file.');
      console.log('2. The DB User exists but hasn\'t been ADDED/ASSOCIATED to the DB in cPanel.');
      console.log('3. The DB User doesn\'t have "ALL PRIVILEGES" checked in cPanel MySQL Databases.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 DIAGNOSIS: Bad Database Error.');
      console.log('This means the database name specified in DB_NAME does not exist.');
      console.log('Please check your cPanel MySQL page and verify the exact database name.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('💡 DIAGNOSIS: Server Unreachable.');
      console.log('This means the database host could not be reached.');
      console.log('Since you are on Namecheap, DB_HOST must be "localhost".');
    }
    
    console.log('\n🔧 ACTION PLAN FOR YOU:');
    console.log('1. Open your cPanel dashboard.');
    console.log('2. Go to "MySQL® Databases".');
    console.log('3. Scroll to "Add User To Database", choose user and database, and click "Add".');
    console.log('4. Tick "ALL PRIVILEGES" and save.');
  }
}

testConnection();
