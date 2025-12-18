const sql = require("mssql");
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUSTED_CONNECTION === 'true'
    }
};

// Connect to DB
sql.connect(config)
    .then(() => console.log("✅ Connected to SQL Server"))
    .catch(err => console.error("❌ Database Connection Failed:", err));

module.exports = sql;
