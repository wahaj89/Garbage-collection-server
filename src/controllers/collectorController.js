const sql =require('../config/db.js')
// add collector
exports.addCollector = async (req, res) => {
    try {
        const { CompanyID, FullName, Phone,Password } = req.body;
        console.log(req.body);

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
            .input('Password', Password)
            .query(`
                INSERT INTO Collectors
                (CompanyID, FullName, Phone, IsActive,Password)
                VALUES
                (@CompanyID, @FullName, @Phone, 1,@Password)
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
        const { CompanyID } = req.query;
        const request = new sql.Request();

        const result = await request
        .input('CompanyID', CompanyID)
        .query(`
            SELECT CollectorID, CompanyID, FullName, Phone
            FROM Collectors
            WHERE CompanyID=@CompanyID AND IsActive = 1
        `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
//login collector
exports.loginCollector = async (req, res) => {
  try {
    const { Phone, Password } = req.body;   
    if (!Phone || !Password) {
        return res.status(400).json({
            message: 'Phone and Password are required'
        });
    }
    const request = new sql.Request();
    const result = await request
        .input('Phone', Phone)
        .query(`
            SELECT CollectorID, CompanyID, FullName, Phone, Password
            FROM Collectors
            WHERE Phone = @Phone AND IsActive = 1
        `); 
    if (result.recordset.length === 0) {
        return res.status(401).json({
            message: 'Invalid phone number or password'
        });
    }           
    const collector = result.recordset[0];
    if (Password !== collector.Password) {
        return res.status(401).json({
            message: 'Invalid phone number or password'
        });
    }
    res.status(200).json({
        message: 'Login successful',


        collector: {
            CollectorID: collector.CollectorID,
            CompanyID: collector.CompanyID,
            FullName: collector.FullName,       
            Phone: collector.Phone
        }
    });
} catch (err) {
    res.status(500).json({
        message: 'Server Error',
        error: err.message
    });
  } 
};

