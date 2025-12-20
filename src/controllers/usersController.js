const bcrypt = require('bcrypt');
const sql = require('../config/db.js'); 
const jwt = require('jsonwebtoken');

// register user
exports.registerUser = async (req, res) => {
    try {
        const { FullName, Email, Password, Phone, Address } = req.body;

        if (!FullName || !Email || !Password) {
            return res.status(400).json({
                message: 'FullName, Email and Password are required'
            });
        }

        const request = new sql.Request();
        const check = await request
            .input('Email', Email)
            .query(`SELECT UserID FROM Users WHERE Email = @Email`);

        if (check.recordset.length > 0) {
            return res.status(400).json({
                message: 'Email already exists'
            });
        }

        const Rounds = 10;
        const hashedPassword = await bcrypt.hash(Password, Rounds);

    
        await request
            .input('FullName', FullName)
            .input('PasswordHash', hashedPassword) 
            .input('Phone', Phone)
            .input('Address', Address)
            .query(`
                INSERT INTO Users 
                (FullName, Email, PasswordHash, Phone, Address, Role)
                VALUES 
                (@FullName, @Email, @PasswordHash, @Phone, @Address, 'User')
            `);

        res.status(201).json({
            message: 'User registered successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// login user
exports.loginUser = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        if (!Email || !Password) {
            return res.status(400).json({
                message: 'Email and Password are required'
            });
        }

        const request = new sql.Request();

        const result = await request
            .input('Email', Email)
            .query(`
                SELECT UserID, FullName, Email, PasswordHash, Role
                FROM Users
                WHERE Email = @Email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = result.recordset[0];

    
        const isMatch = await bcrypt.compare(Password, user.PasswordHash);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

       
        const token = jwt.sign(
            {
                UserID: user.UserID,
                Role: user.Role
            },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '1d' }
        );

      
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                UserID: user.UserID,
                FullName: user.FullName,
                Email: user.Email,
                Role: user.Role
            }
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// user sees which driver is coming for pickup
exports.viewUserPickupDriver = async (req, res) => {
    try {
        const { UserID } = req.query;

        const request = new sql.Request();

        const result = await request
            .input('UserID', UserID)
            .query(`
                SELECT TOP 1
                    d.DriverID,
                    d.FullName AS DriverName,
                    d.Phone AS DriverPhone,

                    v.VehicleID,
                    v.PlateNumber,
                    v.Model,

                    p.PickupID,
                    p.Status AS PickupStatus,
                    p.ScannedAt,

                    dl.Latitude,
                    dl.Longitude,
                    dl.RecordedAt
                FROM Bags b
                INNER JOIN Pickups p ON b.BagID = p.BagID
                INNER JOIN Drivers d ON p.DriverID = d.DriverID
                LEFT JOIN Vehicles v ON p.VehicleID = v.VehicleID
                LEFT JOIN DriverLocationLogs dl ON d.DriverID = dl.DriverID
                WHERE b.UserID = @UserID
                ORDER BY p.ScannedAt DESC
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'No pickup information found'
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
