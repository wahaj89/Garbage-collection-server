const sql = require('../config/db');
const QRCodeLib = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// add bag (with QR generation )
exports.addBag = async (req, res) => {
    try {
        let {
            UserID,
            CompanyID,
            SubscriptionID = null,
            QRCode,           
            BagType = null,
            WeightLimit = null
        } = req.body;

        if (!UserID || !CompanyID) {
            return res.status(400).json({
                message: 'UserID and CompanyID are required'
            });
        }

        
        if (!QRCode) {
         
            QRCode = `${CompanyID}-${UserID}-${Date.now()}-${uuidv4().slice(0,8)}`;
        }

        
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            const checkReq = new sql.Request();
            const dup = await checkReq
                .input('QRCode', QRCode)
                .query(`SELECT 1 AS existsFlag FROM Bags WHERE QRCode = @QRCode`);

            if (dup.recordset.length === 0) {
                isUnique = true;
            } else {
            
                QRCode = `${CompanyID}-${UserID}-${Date.now()}-${uuidv4().slice(0,8)}`;
                attempts++;
            }
        }

        if (!isUnique) {
            return res.status(500).json({ message: 'Failed to generate unique QR code, try again' });
        }

       
        const insertReq = new sql.Request();
        insertReq
            .input('UserID', UserID)
            .input('CompanyID', CompanyID)
            .input('SubscriptionID', SubscriptionID)
            .input('QRCode', QRCode)
            .input('BagType', BagType)
            .input('WeightLimit', WeightLimit);

        const insertQuery = `
            INSERT INTO Bags (UserID, CompanyID, SubscriptionID, QRCode, BagType, WeightLimit, IsActive)
            OUTPUT INSERTED.BagID
            VALUES (@UserID, @CompanyID, @SubscriptionID, @QRCode, @BagType, @WeightLimit, 1)
        `;

        const insertResult = await insertReq.query(insertQuery);
        return res.status(201).json({
            message: 'Bag added successfully',
        });

    } catch (err) {
        if (err && err.message && err.message.includes('UNIQUE') || err.message.includes('Violation')) {
            return res.status(409).json({ message: 'QR code already exists. Try again.' });
        }

        return res.status(500).json({
            message: 'Server Error',
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
