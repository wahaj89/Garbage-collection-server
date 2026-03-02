const sql = require('../config/db.js');
// add driver
exports.addDriver = async (req, res) => {
    try {
        const { FullName, Phone, LicenseNo, VehicleID } = req.body;
        const { CompanyID } = req.user;

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
            .input('LicenseNo', LicenseNo)
            .input('VehicleID', VehicleID)
            .query(`
                INSERT INTO Drivers
                (CompanyID, FullName, Phone, LicenseNo, VehicleID, IsActive)
                VALUES
                (@CompanyID, @FullName, @Phone, @LicenseNo, @VehicleID, 1)
            `);

        res.status(201).json({
            message: 'Driver added successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// view all drivers
exports.viewDrivers = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                DriverID,
                CompanyID,
                FullName,
                Phone,
                LicenseNo,
                VehicleID
            FROM Drivers
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
// view drivers by company
exports.viewCompanyDrivers = async (req, res) => {
    try {
      const { CompanyID } = req.user;

        const request = new sql.Request();

        const result = await request
            .input('CompanyID', CompanyID)
            .query(`
                SELECT 
                    DriverID,
                    FullName,
                    Phone,
                    LicenseNo,
                    VehicleID
                FROM Drivers
                WHERE CompanyID = @CompanyID
                AND IsActive = 1
            `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// remove (disable) driver
exports.removeDriver = async (req, res) => {
    try {
        const { DriverID } = req.params;

        if (!DriverID) {
            return res.status(400).json({
                message: 'DriverID is required'
            });
        }

        const request = new sql.Request();

        const result = await request
            .input('DriverID', DriverID)
            .query(`
                UPDATE Drivers
                SET IsActive = 0
                WHERE DriverID = @DriverID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Driver not found'
            });
        }

        res.status(200).json({
            message: 'Driver removed successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// update driver location
exports.updateDriverLocation = async (req, res) => {
    try {
        const { DriverID, Latitude, Longitude } = req.body;

        if (!DriverID || !Latitude || !Longitude) {
            return res.status(400).json({
                message: 'DriverID, Latitude and Longitude are required'
            });
        }

        const request = new sql.Request();

        await request
            .input('DriverID', DriverID)
            .input('Latitude', Latitude)
            .input('Longitude', Longitude)
            .query(`
                INSERT INTO DriverLocationLogs
                (DriverID, Latitude, Longitude)
                VALUES
                (@DriverID, @Latitude, @Longitude)
            `);

        res.status(200).json({
            message: 'Driver location updated successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// get latest driver location
exports.getDriverLocation = async (req, res) => {
    try {
        const { DriverID } = req.params;

        const request = new sql.Request();

        const result = await request
            .input('DriverID', DriverID)
            .query(`
                SELECT TOP 1
                    Latitude,
                    Longitude,
                    RecordedAt
                FROM DriverLocationLogs
                WHERE DriverID = @DriverID
                ORDER BY RecordedAt DESC
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'Location not found'
            });
        }

        res.status(200).json(result.recordset[0]);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
