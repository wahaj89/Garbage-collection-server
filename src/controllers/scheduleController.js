const express = require('express');
const sql = require('../config/db.js');
const router = express.Router();

//add new Schedule
exports.addSchedule = async (req, res) => {
    const { VehicleID, ZoneID,PickupDay,PickupTime } = req.body;
    try {
        const request=new sql.Request()
        .input('VehicleID', sql.Int, VehicleID)
        .input('ZoneID', sql.Int, ZoneID)
        .input('PickupDay', sql.VarChar(50), PickupDay)
        .input('PickupTime', sql.VarChar(50), PickupTime);
        await request.query(`INSERT INTO Schedules (VehicleID, ZoneID, PickupDay, PickupTime) 
                             VALUES (@VehicleID, @ZoneID, @PickupDay, @PickupTime)`);
        return res.status(200).json({ message: "Schedule added successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    };
}