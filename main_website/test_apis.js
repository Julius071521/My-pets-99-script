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

console.log('==================================================');
console.log('🛡️ APEXBOOST DEPLOYMENT DIAGNOSTIC SUITE');
console.log('==================================================\n');

async function runDiagnostics() {
  // Test 1: MySQL Database connection
  console.log('1️⃣ TESTING DATABASE CONNECTION...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('   ✅ MySQL database connection: SUCCESSFUL!');
    const [rows] = await connection.query('SHOW TABLES');
    console.log(`   ✅ DB access permission verified! Found ${rows.length} active tables.`);
    await connection.end();
  } catch (error) {
    console.log(`   ❌ MySQL connection: FAILED (${error.code})`);
    console.log(`      Error: ${error.message}`);
    console.log('   💡 TIP: If you see "Access denied", you MUST link the DB User to the DB in cPanel and grant ALL PRIVILEGES.');
  }
  
  console.log('\n--------------------------------------------------');

  // Test 2: RKD Panel API Key
  console.log('2️⃣ TESTING RKD PANEL SMM API KEY...');
  if (!process.env.RKD_API_KEY) {
    console.log('   ❌ FAILED: RKD_API_KEY is not defined in .env!');
  } else {
    try {
      const bodyParams = new URLSearchParams();
      bodyParams.append('key', process.env.RKD_API_KEY);
      bodyParams.append('action', 'services');

      const response = await fetch('https://rkdpanel.com/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString()
      });

      if (!response.ok) {
        console.log(`   ❌ RKD API request FAILED with HTTP ${response.status}`);
      } else {
        const data = await response.json();
        if (data.error) {
          console.log(`   ❌ RKD Key REJECTED by Provider: "${data.error}"`);
        } else if (Array.isArray(data)) {
          console.log(`   ✅ SMM RKD Key verified! Successfully synced ${data.length} live services.`);
        } else {
          console.log('   ❓ RKD Response is not a valid list. Unknown response format.');
        }
      }
    } catch (error) {
      console.log(`   ❌ RKD API request: FAILED (${error.message})`);
    }
  }

  console.log('\n--------------------------------------------------');

  // Test 3: DeepSeek AI API Key
  console.log('3️⃣ TESTING DEEPSEEK AI INTEGRATION...');
  if (!process.env.DEEPSEEK_API_KEY) {
    console.log('   ❌ FAILED: DEEPSEEK_API_KEY is not defined in .env!');
  } else {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'respond only with the word success' }],
          max_tokens: 5
        })
      });

      if (!response.ok) {
        console.log(`   ❌ DeepSeek API key FAILED with HTTP ${response.status}`);
        const text = await response.text();
        console.log(`      Server Response: ${text}`);
      } else {
        const data = await response.json();
        const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
        console.log(`   ✅ DeepSeek AI connection: SUCCESSFUL! AI response: "${content.trim()}"`);
      }
    } catch (error) {
      console.log(`   ❌ DeepSeek connection: FAILED (${error.message})`);
    }
  }

  console.log('\n==================================================');
  console.log('🔚 END OF APEXBOOST DIAGNOSTIC SUITE');
  console.log('==================================================');
}

runDiagnostics();
