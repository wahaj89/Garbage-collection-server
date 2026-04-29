const sql=require('../config/db.js')
// add vehicle
exports.addVehicle = async (req, res) => {
    try {
        const {  PlateNumber, Model, Capacity } = req.body;
const { CompanyID } = req.query;
        if (!CompanyID || !PlateNumber) {
            return res.status(400).json({
                message: 'CompanyID and PlateNumber are required'
            });
        }

        const request = new sql.Request();

        await request
            .input('CompanyID', CompanyID)
            .input('PlateNumber', PlateNumber)
            .input('Model', Model)
            .input('Capacity', Capacity)
            .query(`
                INSERT INTO Vehicles
                (CompanyID, PlateNumber, Model, Capacity, IsActive)
                VALUES
                (@CompanyID, @PlateNumber, @Model, @Capacity, 1)
            `);

        res.status(201).json({
            message: 'Vehicle added successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
// view all vehicles
exports.viewVehicles = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                VehicleID,
                CompanyID,
                PlateNumber,
                Model,
                Capacity
            FROM Vehicles
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
// view vehicles by company
exports.viewCompanyVehicles = async (req, res) => {
    try {
        const { CompanyID } = req.query;

        const request = new sql.Request();

        const result = await request
            .input('CompanyID', CompanyID)
            .query(`
                SELECT 
                    VehicleID,
                    PlateNumber,
                    Model,
                    Capacity
                FROM Vehicles
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
// remove vehicle
exports.removeVehicle = async (req, res) => {
    try {
        const { VehicleID } = req.params;

        if (!VehicleID) {
            return res.status(400).json({
                message: 'VehicleID is required'
            });
        }

        const request = new sql.Request();

        const result = await request
            .input('VehicleID', VehicleID)
            .query(`
                UPDATE Vehicles
                SET IsActive = 0
                WHERE VehicleID = @VehicleID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            message: 'Vehicle removed successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
