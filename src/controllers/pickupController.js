const sql = require('../config/db');

exports.scanBagAndPickup = async (req, res) => {
    try {
        const { QRCode, DriverID, CollectorID, VehicleID, Latitude, Longitude } = req.body;

        const request = new sql.Request();

        const bag = await request
            .input('QRCode', QRCode)
            .query(`SELECT * FROM Bags WHERE QRCode = @QRCode AND IsActive = 1`);

        if (bag.recordset.length === 0) {
            return res.status(404).json({ message: 'Invalid or inactive bag' });
        }

        const BagID = bag.recordset[0].BagID;
        const CompanyID = bag.recordset[0].CompanyID;

        await request
            .input('BagID', BagID)
            .input('CompanyID', CompanyID)
            .input('DriverID', DriverID)
            .input('CollectorID', CollectorID)
            .input('VehicleID', VehicleID)
            .input('Latitude', Latitude)
            .input('Longitude', Longitude)
            .query(`
                INSERT INTO Pickups
                (BagID, CompanyID, DriverID, CollectorID, VehicleID, Latitude, Longitude, Status)
                VALUES
                (@BagID, @CompanyID, @DriverID, @CollectorID, @VehicleID, @Latitude, @Longitude, 'Collected')
            `);

        res.status(200).json({ message: 'Pickup confirmed successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// view all pickups
exports.viewUserPickups = async (req, res) => {
    try {
        const { UserID } = req.query;
        const request = new sql.Request();

        const result = await request
            .input('UserID', UserID)
            .query(`
                SELECT 
                    p.PickupID,
                    p.ScannedAt,
                    p.Status,
                    b.QRCode
                FROM Pickups p
                INNER JOIN Bags b ON p.BagID = b.BagID
                WHERE b.UserID = @UserID
                ORDER BY p.ScannedAt DESC
            `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

