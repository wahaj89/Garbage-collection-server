const sql = require('../config/db.js');
const turf = require('@turf/turf');
// add driver
const bcrypt = require('bcrypt');


exports.addDriver = async (req, res) => {
    try {
        const saltRounds = 10;
        const { FullName, Phone, LicenseNo, VehicleID, Password ,collectorID} = req.body;
        const { CompanyID } = req.query;

        if (!CompanyID || !FullName || !Password) {
            return res.status(400).json({
                message: 'CompanyID, FullName and Password are required'
            });
        }

        // 🔐 Hash password
        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        const request = new sql.Request();

        await request
            .input('CompanyID', CompanyID)
            .input('FullName', FullName)
            .input('Phone', Phone)
            .input('LicenseNo', LicenseNo)
            .input('VehicleID', VehicleID)
            .input('Password', hashedPassword) // encrypted password
            .input('collectorID', collectorID)
            .query(`
                INSERT INTO Drivers
                (CompanyID, FullName, Phone, LicenseNo, VehicleID, IsActive, Password, collectorID)
                VALUES
                (@CompanyID, @FullName, @Phone, @LicenseNo, @VehicleID, 1, @Password, @collectorID)
            `);

        res.status(201).json({
            message: 'Driver added successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

//login driver
exports.loginDriver = async (req, res) => {
    try {
        const { Phone, Password } = req.body;   
        if (!Phone || !Password) {
            return res.status(400).json({
                message: 'Phone and Password are required'
            });
        }
        const request = new sql.Request();
        const result = await request

            .input('Phone', Phone)
            .query(`
                SELECT DriverID, CompanyID, FullName, Phone, LicenseNo, VehicleID, Password
                FROM Drivers
                WHERE Phone = @Phone AND IsActive = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                message: 'Invalid phone number or password'
            });
        }   
        const driver = result.recordset[0];
        const passwordMatch = await bcrypt.compare(Password, driver.Password);

        if (!passwordMatch) {   
            return res.status(401).json({
                message: 'Invalid phone number or password'
            });
        }

        res.status(200).json({
            message: 'Login successful',
            driver: {
                DriverID: driver.DriverID,
                CompanyID: driver.CompanyID,
                FullName: driver.FullName,
                Phone: driver.Phone,
                LicenseNo: driver.LicenseNo,
                VehicleID: driver.VehicleID
            }
        }); 
    } catch (err) {
        res.status(500).json({
            message: 'Server Error',    
            error: err.message
        });
    }
};

// view all drivers
exports.viewDrivers = async (req, res) => {
    try {
        const request = new sql.Request();

        const result = await request.query(`
            SELECT 
                DriverID,
                CompanyID,
                FullName,
                Phone,
                LicenseNo,
                VehicleID
            FROM Drivers
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
// view drivers by company
exports.viewCompanyDrivers = async (req, res) => {
    try {
      const { CompanyID } = req.user;

        const request = new sql.Request();

        const result = await request
            .input('CompanyID', CompanyID)
            .query(`
                SELECT 
                    DriverID,
                    FullName,
                    Phone,
                    LicenseNo,
                    VehicleID
                FROM Drivers
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
// remove (disable) driver
exports.removeDriver = async (req, res) => {
    try {
        const { DriverID } = req.params;

        if (!DriverID) {
            return res.status(400).json({
                message: 'DriverID is required'
            });
        }

        const request = new sql.Request();

        const result = await request
            .input('DriverID', DriverID)
            .query(`
                UPDATE Drivers
                SET IsActive = 0
                WHERE DriverID = @DriverID
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                message: 'Driver not found'
            });
        }

        res.status(200).json({
            message: 'Driver removed successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// update driver location
exports.updateDriverLocation = async (req, res) => {
    try {
        const { DriverID } = req.query;
        const {  Latitude, Longitude } = req.body;

        await new sql.Request()
            .input('DriverID', DriverID)
            .input('Latitude', Latitude)
            .input('Longitude', Longitude)
            .query(`
                UPDATE DriverLocationLogs
                SET Latitude = @Latitude,
                    Longitude = @Longitude
                WHERE DriverID = @DriverID
            `);

        res.status(200).json({ message: "Location updated" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
// get latest driver location
exports.getDriverLocation = async (req, res) => {
    try {
        const { DriverID } = req.params;

        const request = new sql.Request();

        const result = await request
            .input('DriverID', DriverID)
            .query(`
                SELECT TOP 1
                    Latitude,
                    Longitude,
                    RecordedAt
                FROM DriverLocationLogs
                WHERE DriverID = @DriverID
                ORDER BY RecordedAt DESC
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'Location not found'
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
exports.getTodaySchedule = async (req, res) => {
    try {       
        const { DriverID } = req.query;

        const days = [
            "Sunday","Monday","Tuesday","Wednesday",
            "Thursday","Friday","Saturday"
        ];

        const todayName = days[new Date().getDay()];

        const request = new sql.Request();
        const result = await request
            .input('DayOfWeek', todayName) // ✅ string now
            .input('DriverID', DriverID)
            .query(`      
            SELECT
                s.SlotID,
                s.DayOfWeek,
                s.StartTime,
                s.EndTime,
                z.Name AS ZoneName,
                sch.DriverID
            FROM Schedules sch  
            INNER JOIN Slots s ON sch.SlotID = s.SlotID
            INNER JOIN Zones z ON s.ZoneID = z.ZoneID
            WHERE sch.DriverID = @DriverID
            AND s.DayOfWeek = @DayOfWeek
            AND sch.Active = 1
        `);
                
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }   
};


exports.getDriverPickupPoints = async (req, res) => {
  try {
    const { DriverID } = req.query;
    const request = new sql.Request();

    // 1️⃣ Get ALL zones of driver
    const zoneResult = await request
      .input("DriverID", sql.Int, DriverID)
      .query(`
        SELECT z.ZoneID, z.GeoJSON
        FROM Schedules s
        JOIN Slots sl ON s.SlotID = sl.SlotID
        JOIN Zones z ON sl.ZoneID = z.ZoneID
        WHERE s.DriverID = @DriverID AND s.Active = 1
    `);

    if (zoneResult.recordset.length === 0) {
      return res.status(404).json({ message: "No active schedule found" });
    }

    // 2️⃣ Get users
    const usersResult = await request.query(`
        SELECT UserID, FullName, latlng
        FROM Users
        WHERE latlng IS NOT NULL
    `);

    let filteredUsers = [];

    // 3️⃣ LOOP ALL ZONES 🔥
    for (let zone of zoneResult.recordset) {
      let polygon;

      try {
        polygon = JSON.parse(zone.GeoJSON);
      } catch {
        continue;
      }

      let coords = polygon.coordinates[0];

      // close polygon
      const first = coords[0];
      const last = coords[coords.length - 1];

      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push(first);
      }

      const shape = turf.polygon([coords]);

      // 4️⃣ LOOP USERS
      for (let user of usersResult.recordset) {
        try {
          if (!user.latlng) continue;

          const [latStr, lngStr] = user.latlng.split(",");

          const lat = Number(latStr.trim());
          const lng = Number(lngStr.trim());

          if (isNaN(lat) || isNaN(lng)) continue;

          const point = turf.point([lng, lat]);

          const inside = turf.booleanPointInPolygon(point, shape);

          if (inside) {
            filteredUsers.push({
              UserID: user.UserID,
              Name: user.FullName, // 🔥 FIXED
              Latitude: lat,
              Longitude: lng,
            });
          }
        } catch (err) {
          console.log("USER ERROR:", err.message);
        }
      }
    }

    // 5️⃣ REMOVE DUPLICATES 🔥🔥
    const uniqueUsers = [
      ...new Map(filteredUsers.map(u => [u.UserID, u])).values(),
    ];

    return res.json({
      message: "Pickup points found",
      total: uniqueUsers.length,
      data: uniqueUsers,
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
