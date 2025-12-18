const sql=require('../config/db.js')
// add schedule
exports.addSchedule = async (req, res) => {
    try {
        const {
            CompanyID,
            ZoneID,
            VehicleID,
            DriverID,
            CollectorID,
            DayOfWeek,
            StartTime,
            EndTime
        } = req.body;

        if (!CompanyID || !ZoneID || !DayOfWeek) {
            return res.status(400).json({
                message: 'CompanyID, ZoneID and DayOfWeek are required'
            });
        }

        const request = new sql.Request();

        await request
            .input('CompanyID', CompanyID)
            .input('ZoneID', ZoneID)
            .input('VehicleID', VehicleID)
            .input('DriverID', DriverID)
            .input('CollectorID', CollectorID)
            .input('DayOfWeek', DayOfWeek)
            .input('StartTime', StartTime)
            .input('EndTime', EndTime)
            .query(`
                INSERT INTO Schedules
                (
                    CompanyID,
                    ZoneID,
                    VehicleID,
                    DriverID,
                    CollectorID,
                    DayOfWeek,
                    StartTime,
                    EndTime,
                    Active
                )
                VALUES
                (
                    @CompanyID,
                    @ZoneID,
                    @VehicleID,
                    @DriverID,
                    @CollectorID,
                    @DayOfWeek,
                    @StartTime,
                    @EndTime,
                    1
                )
            `);

        res.status(201).json({
            message: 'Schedule added successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};
