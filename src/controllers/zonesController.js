const express = require('express');
const sql = require('../config/db.js');
// Add Zone
exports.addZone = async (req, res) => {
    try {
        const { CompanyID, Name, Description, GeoJSON } = req.body;

        if (!CompanyID || !Name) {
            return res.status(400).json({
                message: 'CompanyID and Zone Name are required'
            });
        }

        const request = new sql.Request();

        await request
            .input('CompanyID', CompanyID)
            .input('Name', Name)
            .input('Description', Description)
            .input(
                'GeoJSON',
                GeoJSON ? JSON.stringify(GeoJSON) : null
            )
            .query(`
                INSERT INTO Zones (CompanyID, Name, Description, GeoJSON)
                VALUES (@CompanyID, @Name, @Description, @GeoJSON)
            `);

        res.status(201).json({
            message: 'Zone added successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// view all zones (GeoJSON parsed)
exports.viewZones = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                ZoneID,
                CompanyID,
                Name,
                Description,
                GeoJSON
            FROM Zones
        `);
        const zones = result.recordset.map(zone => ({
            ...zone,
            GeoJSON: zone.GeoJSON ? JSON.parse(zone.GeoJSON) : null
        }));

        res.status(200).json(zones);

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// view zones by company (GeoJSON parsed)
exports.viewCompanyZones = async (req, res) => {
    try {
        const { CompanyID } = req.params;
        const request = new sql.Request();

        const result = await request
            .input('CompanyID', CompanyID)
            .query(`
                SELECT 
                    ZoneID,
                    Name,
                    Description,
                    GeoJSON
                FROM Zones
                WHERE CompanyID = @CompanyID
            `);

        const zones = result.recordset.map(zone => ({
            ...zone,
            GeoJSON: zone.GeoJSON ? JSON.parse(zone.GeoJSON) : null
        }));

        res.status(200).json(zones);

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// remove (disable) zone
exports.removeZone = async (req, res) => {
    try {
        const { ZoneID } = req.params;

        if (!ZoneID) {
            return res.status(400).json({
                message: 'ZoneID is required'
            });
        }

        const request = new sql.Request();

        const result = await request
            .input('ZoneID', ZoneID)
            .query(`
                UPDATE Zones
                SET IsActive = 0
                WHERE ZoneID = @ZoneID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Zone not found'
            });
        }

        res.status(200).json({
            message: 'Zone removed (disabled) successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// view active zones
exports.viewActiveZones = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                ZoneID,
                CompanyID,
                Name,
                Description,
                GeoJSON
            FROM Zones
            WHERE IsActive = 1
        `);

        const zones = result.recordset.map(zone => ({
            ...zone,
            GeoJSON: zone.GeoJSON ? JSON.parse(zone.GeoJSON) : null
        }));

        res.status(200).json(zones);

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
// view active zones by company
exports.viewActiveCompanyZones = async (req, res) => {
    try {
        const { CompanyID } = req.params;
        const request = new sql.Request();

        const result = await request
            .input('CompanyID', CompanyID)
            .query(`
                SELECT 
                    ZoneID,
                    Name,
                    Description,
                    GeoJSON
                FROM Zones
                WHERE CompanyID = @CompanyID
                AND IsActive = 1
            `);

        const zones = result.recordset.map(zone => ({
            ...zone,
            GeoJSON: zone.GeoJSON ? JSON.parse(zone.GeoJSON) : null
        }));

        res.status(200).json(zones);

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};
//Assign User to Zone 
exports.assignUserToZone = async (req, res) => {
    try {
        const { UserID, ZoneID } = req.body;

        if (!UserID || !ZoneID) {
            return res.status(400).json({
                message: 'UserID and ZoneID are required'
            });
        }

        const request = new sql.Request();
        const check = await request
            .input('UserID', UserID)
            .input('ZoneID', ZoneID)
            .query(`
                SELECT * FROM UserZones
                WHERE UserID = @UserID AND ZoneID = @ZoneID
            `);

        if (check.recordset.length > 0) {
            return res.status(409).json({
                message: 'User already assigned to this zone'
            });
        }

        await request
            .query(`
                INSERT INTO UserZones (UserID, ZoneID)
                VALUES (@UserID, @ZoneID)
            `);

        res.status(201).json({
            message: 'User assigned to zone successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
//view user's in zone

exports.viewUsersInZone = async (req, res) => {
    try {
       
        const { ZoneID } = req.query;

        const request = new sql.Request();

        const result = await request
            .input('ZoneID', ZoneID)
            .query(`
                SELECT 
                    u.UserID,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Address
                FROM UserZones uz
                INNER JOIN Users u ON uz.UserID = u.UserID
                WHERE uz.ZoneID = @ZoneID
            `);
      
        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
//view user's zone
exports.viewUserZones = async (req, res) => {
    try {
        const { UserID } = req.query;

        const request = new sql.Request();

        const result = await request
            .input('UserID', UserID)
            .query(`
                SELECT 
                    z.ZoneID,
                    z.Name AS ZoneName,
                    z.Description
                FROM UserZones uz
                INNER JOIN Zones z ON uz.ZoneID = z.ZoneID
                WHERE uz.UserID = @UserID
            `);

        res.status(200).json(result.recordset);

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};



