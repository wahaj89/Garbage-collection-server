const express=require('express');
const sql=require('../config/db.js');
// Add Company 
exports.addCompany = async (req, res) => {
    try {
        const {
            Name,
            Email,
            Phone,
            Address,
            RegistrationNumber
        } = req.body;

        const UserID = req.user.UserID; 

        if (!Name || !Email) {
            return res.status(400).json({
                message: 'Company name and email are required'
            });
        }

        const request = new sql.Request();
        const check = await request
            .input('UserID', UserID)
            .query(`
                SELECT *
                FROM Companies
                WHERE CreatedByUserID = @UserID
            `);

        if (check.recordset.length > 0) {
            return res.status(400).json({
                message: 'You have already registered a company'
            });
        }
        await request
            .input('Name', Name)
            .input('Email', Email)
            .input('Phone', Phone)
            .input('Address', Address)
            .input('RegistrationNumber', RegistrationNumber)
            .input('CreatedByUserID', UserID)
            .query(`
                INSERT INTO Companies
                (
                    Name,
                    Email,
                    Phone,
                    Address,
                    RegistrationNumber,
                    Status,
                    CreatedByUserID
                )
                VALUES
                (
                    @Name,
                    @Email,
                    @Phone,
                    @Address,
                    @RegistrationNumber,
                    'Pending',
                    @CreatedByUserID
                )
            `);

        return res.status(201).json({
            message: 'Company registration request submitted. Waiting for admin approval.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// view all companies (simple)
exports.viewCompanies = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                CompanyID,
                Name,
                Email,
                Phone,
                Address,
                Status
            FROM Companies
        `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};


// Add Company Service
exports.addCompanyService = async (req, res) => {
    try {
        const { Name, Description, BasePrice } = req.body;
        const UserID = req.user.UserID;

        if (!Name) {
            return res.status(400).json({
                message: 'Service name is required'
            });
        }

        const request = new sql.Request();
        const company = await request
            .input('UserID', UserID)
            .query(`
                SELECT CompanyID
                FROM Companies
                WHERE CreatedByUserID = @UserID
                AND Status = 'Approved'
            `);

        if (company.recordset.length === 0) {
            return res.status(403).json({
                message: 'Company not approved or not found'
            });
        }

        const CompanyID = company.recordset[0].CompanyID;

        const duplicate = await request
            .input('CompanyID', CompanyID)
            .input('Name', Name)
            .query(`
                SELECT *
                FROM CompanyServices
                WHERE CompanyID = @CompanyID
                AND Name = @Name
            `);

        if (duplicate.recordset.length > 0) {
            return res.status(400).json({
                message: 'Service already exists'
            });
        }
        await request
            .input('CompanyID', CompanyID)
            .input('Name', Name)
            .input('Description', Description)
            .input('BasePrice', BasePrice || 0)
            .query(`
                INSERT INTO CompanyServices
                (CompanyID, Name, Description, BasePrice)
                VALUES
                (@CompanyID, @Name, @Description, @BasePrice)
            `);

        return res.status(201).json({
            message: 'Service added successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// Update Company Service
exports.updateCompanyService = async (req, res) => {
    try {
        const {
            ServiceID,
            Name,
            Description,
            BasePrice,
            IsActive
        } = req.body;

        const UserID = req.user.UserID;

        if (!ServiceID) {
            return res.status(400).json({
                message: 'ServiceID is required'
            });
        }

        const request = new sql.Request();

        const check = await request
            .input('ServiceID', ServiceID)
            .input('UserID', UserID)
            .query(`
                SELECT cs.ServiceID
                FROM CompanyServices cs
                JOIN Companies c ON cs.CompanyID = c.CompanyID
                WHERE cs.ServiceID = @ServiceID
                AND c.CreatedByUserID = @UserID
                AND c.Status = 'Approved'
            `);

        if (check.recordset.length === 0) {
            return res.status(403).json({
                message: 'Unauthorized or company not approved'
            });
        }


        await request
            .input('Name', Name)
            .input('Description', Description)
            .input('BasePrice', BasePrice)
            .input('IsActive', IsActive)
            .query(`
                UPDATE CompanyServices
                SET
                    Name = COALESCE(@Name, Name),
                    Description = COALESCE(@Description, Description),
                    BasePrice = COALESCE(@BasePrice, BasePrice),
                    IsActive = COALESCE(@IsActive, IsActive)
                WHERE ServiceID = @ServiceID
            `);

        return res.status(200).json({
            message: 'Service updated successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};

//view Company Services
// view all services
exports.viewServices = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                ServiceID,
                CompanyID,
                Name,
                Description,
                BasePrice,
                IsActive
            FROM CompanyServices
        `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// view company complaints
exports.viewCompanyComplaints = async (req, res) => {
    try {
        const { CompanyID } = req.query;

        const request = new sql.Request();

        const result = await request
            .input('CompanyID', CompanyID)
            .query(`
                SELECT 
                    c.ComplaintID,
                    u.FullName AS UserName,
                    c.Subject,
                    c.Description,
                    c.Status,
                    c.CreatedAt
                FROM Complaints c
                INNER JOIN Users u ON c.UserID = u.UserID
                WHERE c.CompanyID = @CompanyID
                ORDER BY c.CreatedAt DESC
            `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// update complaint status
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { ComplaintID, Status } = req.body;
        const AdminID = req.user.UserID; 

        if (!ComplaintID || !Status) {
            return res.status(400).json({
                message: 'ComplaintID and Status are required'
            });
        }

        const request = new sql.Request();

        await request
            .input('ComplaintID', ComplaintID)
            .input('Status', Status)
            .input('AdminID', AdminID)
            .query(`
                UPDATE Complaints
                SET 
                    Status = @Status,
                    ResolvedAt = GETDATE(),
                    AssignedToUserID = @AdminID
                WHERE ComplaintID = @ComplaintID
            `);

        res.status(200).json({
            message: 'Complaint status updated'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

