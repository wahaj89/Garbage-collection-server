const sql = require("mssql");

// Config for your local SQL Server
const config = {
    user: "sa",      // e.g., 'sa'
    password: "123",  // e.g., '12345'
    server: "localhost",           // or IP address
    database: "GarbageCollectionDB",      // e.g., 'FYP_DB'
    options: {
        encrypt: false,           // use true if using Azure
        trustServerCertificate: true // important for local dev
    }
};

// Test connection
sql.connect(config).then(() => {
    console.log("Connected to SQL Server!");
}).catch(err => {
    console.log("Database Connection Failed!", err);
});

module.exports = sql;
