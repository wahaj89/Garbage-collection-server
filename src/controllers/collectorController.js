const sql =require('../config/db.js')
// add collector
exports.addCollector = async (req, res) => {
    try {
        const { CompanyID, FullName, Phone } = req.body;

        if (!CompanyID || !FullName) {
            return res.status(400).json({
                message: 'CompanyID and FullName are required'
            });
        }

        const request = new sql.Request();

        await request
            .input('CompanyID', CompanyID)
            .input('FullName', FullName)
            .input('Phone', Phone)
            .query(`
                INSERT INTO Collectors
                (CompanyID, FullName, Phone, IsActive)
                VALUES
                (@CompanyID, @FullName, @Phone, 1)
            `);

        res.status(201).json({
            message: 'Collector added successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// view collectors
exports.viewCollectors = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT CollectorID, CompanyID, FullName, Phone
            FROM Collectors
            WHERE IsActive = 1
        `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

