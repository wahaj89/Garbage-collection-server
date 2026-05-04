const sql = require('../config/db');

const { v4: uuidv4 } = require('uuid');

// add bag 
exports.generateBags = async (req, res) => {

    try {

        let {
            UserID,
            CompanyID,
            Quantity,
            BagType ,
            WeightLimit 
        } = req.body;

        if (!UserID || !CompanyID || !Quantity) {
            return res.status(400).json({
                message: "UserID, CompanyID and Quantity are required"
            });
        }

       
        const subReq = new sql.Request();

        const subResult = await subReq
            .input('UserID', sql.Int, UserID)
            .query(`
                SELECT TOP 1 SubscriptionID
                FROM Subscriptions
                WHERE UserID = @UserID
                AND Status = 'Active'
            `);

        if (subResult.recordset.length === 0) {
            return res.status(400).json({
                message: "No active subscription found for this user"
            });
        }

        const SubscriptionID = subResult.recordset[0].SubscriptionID;

        let generatedQRs = [];
        for (let i = 0; i < Quantity*30; i++) {

            let QRCode = `${CompanyID}-${UserID}-${Date.now()}-${uuidv4().slice(0,8)}`;

            const insertReq = new sql.Request();

            await insertReq
                .input('UserID', sql.Int, UserID)
                .input('QRCode', sql.VarChar, QRCode)
                .input('BagType', sql.VarChar, BagType)
                .input('WeightLimit', sql.Decimal, WeightLimit)
                .query(`
                    INSERT INTO Bags
                    (UserID, QRCode, BagType, IsActive, CreatedAt,WeightLimit)
                    VALUES
                    (@UserID, @QRCode, @BagType, 1, GETDATE(), @WeightLimit)
                `);

            generatedQRs.push(QRCode);
        }

        return res.status(201).json({
            message: "Bags generated successfully",
            subscription: SubscriptionID,
            total: generatedQRs.length,
            qrCodes: generatedQRs
        });

    } catch (err) {

        return res.status(500).json({
            message: "Server Error",
            error: err.message
        });

    }

};
//extra pickup request
exports.extraBags = async (req, res) => {

    try {

        let {
            UserID,
            CompanyID,
            Quantity,
            BagType = null,
            WeightLimit = null
        } = req.body;

        if (!UserID || !CompanyID || !Quantity) {
            return res.status(400).json({
                message: "UserID, CompanyID and Quantity are required"
            });
        }

       
        const subReq = new sql.Request();

        const subResult = await subReq
            .input('UserID', sql.Int, UserID)
            .query(`
                SELECT TOP 1 SubscriptionID
                FROM Subscriptions
                WHERE UserID = @UserID
                AND Status = 'Active'
            `);

        if (subResult.recordset.length === 0) {
            return res.status(400).json({
                message: "No active subscription found for this user"
            });
        }

        const SubscriptionID = subResult.recordset[0].SubscriptionID;

        let generatedQRs = [];
        for (let i = 0; i < Quantity; i++) {

            let QRCode = `${CompanyID}-${UserID}-${Date.now()}-${uuidv4().slice(0,8)}`;

            const insertReq = new sql.Request();

            await insertReq
                .input('UserID', sql.Int, UserID)
                .input('QRCode', sql.VarChar, QRCode)
                .input('BagType', sql.VarChar, BagType)
                .input('WeightLimit', sql.Decimal, WeightLimit)
                .query(`
                    INSERT INTO Bags
                    (UserID, QRCode, BagType, IsActive, CreatedAt,WeightLimit)
                    VALUES
                    (@UserID, @QRCode, @BagType, 1, GETDATE(), @WeightLimit)
                `);

            generatedQRs.push(QRCode);
        }

        return res.status(201).json({
            message: "Bags generated successfully",
            subscription: SubscriptionID,
            total: generatedQRs.length,
            qrCodes: generatedQRs
        });

    } catch (err) {

        return res.status(500).json({
            message: "Server Error",
            error: err.message
        });

    }

};
//view bags
exports.viewUserBags = async (req, res) => {
    try {
        const { UserID } = req.query;
        const request = new sql.Request();

        const result = await request
            .input('UserID', UserID)
            .query(`
                SELECT 
                    BagID,
                    QRCode,
                    BagType,
                    WeightLimit,
                    IsActive
                FROM Bags
                WHERE UserID = @UserID
            `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
//disable bag
exports.disableBag = async (req, res) => {
    try {
        const { BagID } = req.query;
        const request = new sql.Request();

        await request
            .input('BagID', BagID)
            .query(`
                UPDATE Bags
                SET IsActive = 0
                WHERE BagID = @BagID
            `);

        res.status(200).json({ message: 'Bag disabled successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
