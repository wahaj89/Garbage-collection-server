const bcrypt = require('bcrypt');
const sql = require('../config/db.js'); 
const jwt = require('jsonwebtoken');

// register user
exports.registerUser = async (req, res) => {
    try {
        const { FullName, Email, Password, Phone, latlng } = req.body;

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
            .input('latlng', latlng)
            .query(`
                INSERT INTO Users 
                (FullName, Email, PasswordHash, Phone, latlng, Role)
                VALUES 
                (@FullName, @Email, @PasswordHash, @Phone, @latlng, 'User')
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
                UserName:user.FullName,
                Role: user.Role
            },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
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
// add complaint 
exports.addComplaint = async (req, res) => {
    try {
        const { CompanyID, Subject, Description } = req.body;
        const UserID = req.user.UserID; // JWT se

        if (!CompanyID || !Subject) {
            return res.status(400).json({
                message: 'CompanyID and Subject are required'
            });
        }

        const request = new sql.Request();

        await request
            .input('UserID', UserID)
            .input('CompanyID', CompanyID)
            .input('Subject', Subject)
            .input('Description', Description)
            .query(`
                INSERT INTO Complaints
                (UserID, CompanyID, Subject, Description, Status)
                VALUES
                (@UserID, @CompanyID, @Subject, @Description, 'Open')
            `);

        res.status(201).json({
            message: 'Complaint submitted successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// view user complaints
exports.viewUserComplaints = async (req, res) => {
    try {
        const UserID = req.user.UserID;

        const request = new sql.Request();

        const result = await request
            .input('UserID', UserID)
            .query(`
                SELECT 
                    ComplaintID,
                    Subject,
                    Description,
                    Status,
                    CreatedAt
                FROM Complaints
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC
            `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// view all users with subscription from a specific company 
exports.viewCompanySubscribers = async (req, res) => {
    try{
        const { CompanyID } = req.user;

        if (!CompanyID) {
            return res.status(400).json({
                message: 'CompanyID is required'
            });
        }
        const request = new sql.Request();

        const result = await request
            .input('CompanyID', CompanyID)
            .query(`
                SELECT
                    u.UserID,
                    u.FullName,
                    u.Email,            

                    s.StartDate,
                    s.EndDate,
                    s.Status                                            

                FROM Users u
                INNER JOIN Subscriptions s ON u.UserID = s.UserID
                WHERE s.CompanyID = @CompanyID
                AND s.Status = 'Active'
            `);
         var response=   res.status(200).json(result.recordset);
         if(response){
            console.log("Subscribers retrieved successfully");
         }

    }catch(err){
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        }); 
    }
}