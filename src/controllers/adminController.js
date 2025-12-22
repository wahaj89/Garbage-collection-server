const sql=require('../config/db.js');

// view pending companies
exports.viewPendingCompanies = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                CompanyID,
                Name,
                Email,
                Phone,
                RegistrationNumber,
                CreatedByUserID,
                Status,
                CreatedAt
            FROM Companies
            WHERE Status = 'Pending'
        `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// approve company
exports.approveCompany = async (req, res) => {
    try {
        const { CompanyID } = req.body;

        if (!CompanyID) {
            return res.status(400).json({
                message: 'CompanyID is required'
            });
        }

        const request = new sql.Request();
        await request
            .input('CompanyID', CompanyID)
            .query(`
                UPDATE Companies
                SET 
                    Status = 'Approved',
                    CompanyAdminUserID = CreatedByUserID
                WHERE CompanyID = @CompanyID
            `);
        await request.query(`
            UPDATE Users
            SET Role = 'CompanyAdmin'
            WHERE UserID = (
                SELECT CreatedByUserID 
                FROM Companies 
                WHERE CompanyID = @CompanyID
            )
        `);

        res.status(200).json({
            message: 'Company approved successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// reject company
exports.rejectCompany = async (req, res) => {
    try {
        const { CompanyID } = req.body;

        const request = new sql.Request();

        await request
            .input('CompanyID', CompanyID)
            .query(`
                UPDATE Companies
                SET Status = 'Rejected'
                WHERE CompanyID = @CompanyID
            `);

        res.status(200).json({
            message: 'Company rejected'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};


