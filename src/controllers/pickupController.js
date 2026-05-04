const sql = require('../config/db');

exports.scanBagAndPickup = async (req, res) => {
    try {
        const { QRCode, CollectorID, Latitude, Longitude } = req.body;

        console.log("Incoming:", req.body);

        // 1. Get Bag
        const bagResult = await new sql.Request()
            .input('QRCode', QRCode)
            .query(`SELECT * FROM Bags WHERE QRCode = @QRCode AND IsActive = 1`);

        if (bagResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Invalid or already collected bag' });
        }

        const BagID = bagResult.recordset[0].BagID;

        // 2. Check duplicate
        const checkPickup = await new sql.Request()
            .input('BagID', BagID)
            .query(`SELECT * FROM Pickups WHERE BagID = @BagID`);

        if (checkPickup.recordset.length > 0) {
            return res.status(400).json({ message: 'Bag already collected' });
        }

        // 3. Insert pickup
        await new sql.Request()
            .input('BagID', BagID)
            .input('CollectorID', CollectorID)
            .input('Latitude', Latitude)
            .input('Longitude', Longitude)
            .query(`
                INSERT INTO Pickups
                (BagID, CollectorID, Latitude, Longitude, Status, ScannedAt)
                VALUES
                (@BagID, @CollectorID, @Latitude, @Longitude, 'Collected', GETDATE())
            `);

        // 4. Deactivate bag
        await new sql.Request()
            .input('BagID', BagID)
            .query(`UPDATE Bags SET IsActive = 0 WHERE BagID = @BagID`);

        res.status(200).json({ message: 'Pickup successful' });

    } catch (err) {
        console.error("ERROR:", err);
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

