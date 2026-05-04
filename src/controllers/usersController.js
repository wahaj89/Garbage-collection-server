const bcrypt = require("bcrypt");
const sql = require("../config/db.js");
const jwt = require("jsonwebtoken");
const turf = require("@turf/turf");

// register user
exports.registerUser = async (req, res) => {
  try {
    const { FullName, Email, Password, Phone, latlng } = req.body;

    if (!FullName || !Email || !Password) {
      return res.status(400).json({
        message: "FullName, Email and Password are required",
      });
    }

    const request = new sql.Request();
    const check = await request
      .input("Email", Email)
      .query(`SELECT UserID FROM Users WHERE Email = @Email`);

    if (check.recordset.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const Rounds = 10;

    const hashedPassword = await bcrypt.hash(Password, Rounds);

    await request
      .input("FullName", FullName)
      .input("PasswordHash", hashedPassword)
      .input("Phone", Phone)
      .input("latlng", latlng).query(`
                INSERT INTO Users 
                (FullName, Email, PasswordHash, Phone, latlng, Role)
                VALUES 
                (@FullName, @Email, @PasswordHash, @Phone, @latlng, 'User')
            `);

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

// login user
exports.loginUser = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }
    const request = new sql.Request();

    const result = await request.input("Email", Email).query(`
                SELECT UserID, FullName, Email, PasswordHash
                FROM Users
                WHERE Email = @Email
            `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.recordset[0];

    const isMatch = await bcrypt.compare(Password, user.PasswordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        UserID: user.UserID,
        UserName: user.FullName,
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        UserID: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
      
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
//login b
exports.login = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }
    const request = new sql.Request();

    const result = await request.input("Email", Email).query(`
                SELECT UserID, FullName, Email, PasswordHash, Role
                FROM Users
                WHERE Email = @Email
            `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.recordset[0];

    const isMatch = await bcrypt.compare(Password, user.PasswordHash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

 

    res.status(200).json({
      message: "Login successful",
      user: {
        UserID: user.UserID,
        FullName: user.FullName,  
        Email: user.Email,
        Role: user.Role,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
// user sees which driver is coming for pickup
exports.viewUserPickupDriver = async (req, res) => {
  try {
    const { UserID } = req.query;

    const request = new sql.Request();

    const result = await request.input("UserID", UserID).query(`
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
        message: "No pickup information found",
      });
    }

    res.status(200).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
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
        message: "CompanyID and Subject are required",
      });
    }

    const request = new sql.Request();

    await request
      .input("UserID", UserID)
      .input("CompanyID", CompanyID)
      .input("Subject", Subject)
      .input("Description", Description).query(`
                INSERT INTO Complaints
                (UserID, CompanyID, Subject, Description, Status)
                VALUES
                (@UserID, @CompanyID, @Subject, @Description, 'Open')
            `);

    res.status(201).json({
      message: "Complaint submitted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
// view user complaints
exports.viewUserComplaints = async (req, res) => {
  try {
    const { CompanyID } = req.query;
    

    const request = new sql.Request();
           
    const result = await request.
input("CompanyID", CompanyID)
    
    .query(`
                SELECT 
                    ComplaintID,
                    Subject,
                    Description,
                    Status,
                    CreatedAt
                FROM Complaints
                WHERE CompanyID = @CompanyID
                ORDER BY CreatedAt DESC
            `);

    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
// view all users with subscription from a specific company
exports.viewCompanySubscribers = async (req, res) => {
  try {
    const { CompanyID } = req.user;

    if (!CompanyID) {
      return res.status(400).json({
        message: "CompanyID is required",
      });
    }
    const request = new sql.Request();

    const result = await request.input("CompanyID", CompanyID).query(`
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
    var response = res.status(200).json(result.recordset);
    if (response) {
      console.log("Subscribers retrieved successfully");
    }
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
//is user subscribed to a company
exports.isSubscribed = async (req, res) => {
  try {
    const UserID = req.user.UserID;
    const request = new sql.Request();

    const result = await request.input("UserID", UserID).query(`    
                SELECT TOP 1 CompanyID
                FROM Subscriptions
                WHERE UserID = @UserID 
                AND Status = 'Active'
            `);

    const isSubscribed = result.recordset.length > 0;

    return res.status(200).json({
      isSubscribed,
      CompanyID: isSubscribed ? result.recordset[0].CompanyID : null,
    });
  } catch (err) {
    console.error("Error in isSubscribed:", err.message);
    return res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
// subscription status
exports.subscriptionStatus = async (req, res) => {
  try {
    const UserID = req.user.UserID;
    const request = new sql.Request();
    const result = await request.input("UserID", UserID).query(`
                SELECT TOP 1 CompanyID, PlanID, StartDate, EndDate, Status,SubscriptionID
                FROM Subscriptions
                WHERE UserID = @UserID
                AND Status = 'Active'
            `);
    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "No active subscription found",
      });
    }
    return res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error("Error in subscriptionStatus:", err.message);

    return res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
//user details
exports.getUserDetails = async (req, res) => {
  try {
    const UserID = req.user.UserID;
    const request = new sql.Request();
    const result = await request.input("UserID", UserID).query(`
      SELECT 
        u.UserID, 
        u.FullName, 
        u.Email, 
        u.Phone, 
        u.latlng,
        s.SubscriptionID,
        s.PlanID,
        s.StartDate,
        s.EndDate,
        s.Status AS SubscriptionStatus
      FROM Users u
      LEFT JOIN Subscriptions s 
        ON u.UserID = s.UserID 
        AND s.Status = 'Active'
      WHERE u.UserID = @UserID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const row = result.recordset[0];

    return res.status(200).json({
      UserID: row.UserID,
      FullName: row.FullName,
      Email: row.Email,
      Phone: row.Phone,
      latlng: row.latlng,
      Subscription: row.SubscriptionID
        ? {
            SubscriptionID: row.SubscriptionID,
            PlanID: row.PlanID,
            StartDate: row.StartDate,
            EndDate: row.EndDate,
            Status: row.SubscriptionStatus,
          }
        : null,
    });
  } catch (err) {
    console.error("Error in getUserDetails:", err.message);
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};
// get companies by user location

exports.getCompaniesByLocation = async (req, res) => {
  try {
    const UserID = req.user.UserID;

    const request = new sql.Request();

    // 1️⃣ Get user location (DB format: "lat,lng")
    const userResult = await request.input("UserID", sql.Int, UserID).query(`
                SELECT latlng 
                FROM Users 
                WHERE UserID = @UserID
            `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const latlng = userResult.recordset[0].latlng;

    if (!latlng) {
      return res.status(400).json({ message: "User location not set" });
    }

    // 2️⃣ Parse user location safely
    const [latStr, lngStr] = latlng.split(",");

    const lat = Number(latStr.trim());
    const lng = Number(lngStr.trim());

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid location format" });
    }

    // 🔥 FIX: Turf needs [lng, lat]
    const userPoint = turf.point([lng, lat]);

    console.log("👤 USER POINT:", userPoint.geometry.coordinates);

    // 3️⃣ Get zones + companies
    const zonesResult = await request.query(`
            SELECT 
                z.ZoneID,
                z.GeoJSON,
                c.CompanyID,
                c.Name AS CompanyName,
                c.email AS CompanyDescription
            FROM Zones z
            INNER JOIN Companies c ON z.CompanyID = c.CompanyID
            WHERE z.IsActive = 1
        `);

    const matchedCompanies = [];

    // 4️⃣ Process zones safely
    zonesResult.recordset.forEach((zone) => {
      try {
        const polygon = JSON.parse(zone.GeoJSON);

        let coords = polygon.coordinates[0];

        // 🔥 FIX 1: Ensure polygon is closed (1006 error fix)
        const first = coords[0];
        const last = coords[coords.length - 1];

        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push(first);
        }

        // 🔥 FIX 2: Build safe turf polygon
        const shape = turf.polygon([coords]);

        const inside = turf.booleanPointInPolygon(userPoint, shape);

        console.log("ZONE:", zone.ZoneID);
        console.log("INSIDE:", inside);

        if (inside) {
          matchedCompanies.push({
            CompanyID: zone.CompanyID,
            Name: zone.CompanyName,
            Description: zone.CompanyDescription,
          });
        }
      } catch (err) {
        console.log("❌ ERROR ZONE:", zone.ZoneID, err.message);
      }
    });

    // 5️⃣ Remove duplicates
    const uniqueCompanies = [
      ...new Map(matchedCompanies.map((c) => [c.CompanyID, c])).values(),
    ];

    // 6️⃣ Response
    if (uniqueCompanies.length === 0) {
      return res.json({
        message: "No companies available in your area",
        data: [],
        debug: {
          userPoint: userPoint.geometry.coordinates,
        },
      });
    }

    return res.json({
      message: "Companies found",
      data: uniqueCompanies,
      debug: {
        userPoint: userPoint.geometry.coordinates,
      },
    });
  } catch (err) {
    console.log("💥 SERVER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// company by user

exports.getUserCompany = async (req, res) => {
  try {
    const UserID = req.user.UserID;

    if (!UserID) {
      return res.status(400).json({
        message: "UserID is required",
      });
    }

    const request = new sql.Request();

    const result = await request.input("UserID", sql.Int, UserID).query(`
                SELECT TOP 1 CompanyID
                FROM Subscriptions
                WHERE UserID = @UserID
                ORDER BY SubscriptionID DESC
            `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "No subscription found",
      });
    }

    res.status(200).json({
      CompanyID: result.recordset[0].CompanyID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
// submit complaint against company
exports.submitComplaint = async (req, res) => {
  try {
    const UserID = req.user.UserID; // JWT se aayega
    const { Subject, Description } = req.body;

    if (!Subject || !Description) {
      return res.status(400).json({
        message: "Subject and Description are required",
      });
    }

    const request = new sql.Request();

    // 🔥 STEP 1: CompanyID auto fetch
    const companyResult = await request.input("UserID", sql.Int, UserID).query(`
                SELECT TOP 1 CompanyID
                FROM Subscriptions
                WHERE UserID = @UserID AND Status = 'Active'
            `);

    if (companyResult.recordset.length === 0) {
      return res.status(404).json({
        message: "No active subscription found",
      });
    }

    const CompanyID = companyResult.recordset[0].CompanyID;

    // 🔥 STEP 2: Insert Complaint
    await new sql.Request()
      .input("UserID", sql.Int, UserID)
      .input("CompanyID", sql.Int, CompanyID)
      .input("Subject", sql.NVarChar, Subject)
      .input("Description", sql.NVarChar, Description).query(`
                INSERT INTO Complaints (UserID, CompanyID, Subject, Description, CreatedAt)
                VALUES (@UserID, @CompanyID, @Subject, @Description, GETDATE())
            `);

    res.status(200).json({
      message: "Complaint submitted successfully",
      CompanyID: CompanyID, // optional (debug ke liye)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

exports.requestExtraPickup = async (req, res) => {
  try {
    const UserID = req.user.UserID; // JWT se
    const { BagsRequested } = req.body;

    if (!BagsRequested) {
      return res.status(400).json({
        message: "BagsRequested is required",
      });
    }

    // 🔥 STEP 1: CompanyID + SubscriptionID fetch karo
    const subResult = await new sql.Request()
    .input("UserID", sql.Int, UserID)
      .query(`
                SELECT TOP 1 CompanyID, SubscriptionID
                FROM Subscriptions
                WHERE UserID = @UserID AND Status = 'Active'
            `);

    if (subResult.recordset.length === 0) {
      return res.status(404).json({
        message: "No active subscription found",
      });
    }

    const CompanyID = subResult.recordset[0].CompanyID;
    const SubscriptionID = subResult.recordset[0].SubscriptionID;
    const Type=subResult.recordset[0].Type;

    // 🔥 STEP 2: Insert Request
    await new sql.Request()
      .input("UserID", sql.Int, UserID)
      .input("CompanyID", sql.Int, CompanyID)
      .input("SubscriptionID", sql.Int, SubscriptionID)
      .input("BagsRequested", sql.Int, BagsRequested)
      .input("Status", sql.NVarChar, "Pending")
      .input("Type", sql.NVarChar, Type)
      .query(`
                INSERT INTO ExtraPickupRequests
                (UserID, CompanyID, SubscriptionID, BagsRequested, Status, RequestedAt,Type)
                VALUES
                (@UserID, @CompanyID, @SubscriptionID, @BagsRequested, @Status, GETDATE(),@Type)
            `);

    res.status(200).json({
      message: "Extra pickup request submitted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
exports.viewPastPickups = async (req, res) => {
  try {
    const UserID = req.user.UserID;
    const request = new sql.Request();
    const result = await request
      .input("UserID", sql.Int, UserID)
      .query(`
        SELECT 
            p.PickupID,
            p.ScannedAt,
            p.Latitude,
            p.Longitude,
            p.Status,
            b.BagID,
            b.BagType,
            c.CollectorID,
            c.FullName AS CollectorName,
            c.Phone AS CollectorPhone
        FROM Pickups p
        INNER JOIN Bags b ON p.BagID = b.BagID
        LEFT JOIN Collectors c ON p.CollectorID = c.CollectorID
        WHERE b.UserID = @UserID
        ORDER BY p.ScannedAt DESC
      `);

    res.status(200).json({
      pickups: result.recordset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
//track driver

exports.getDriverLiveLocation = async (req, res) => {
  try {
    const UserID = req.user.UserID;

    // ================= 1. USER LOCATION =================
    const req1 = new sql.Request();
    const userRes = await req1
      .input("UserID", sql.Int, UserID)
      .query(`SELECT latlng FROM Users WHERE UserID = @UserID`);

    if (userRes.recordset.length === 0)
      return res.status(404).json({ message: "User not found" });

    const latlng = userRes.recordset[0].latlng;
    if (!latlng)
      return res.status(400).json({ message: "User location not set" });

    const [latStr, lngStr] = latlng.split(",");
    const lat = Number(latStr.trim());
    const lng = Number(lngStr.trim());

    if (isNaN(lat) || isNaN(lng))
      return res.status(400).json({ message: "Invalid location format" });

    const userPoint = turf.point([lng, lat]);

    // ================= 2. GET ZONES =================
    const req2 = new sql.Request();
    const zonesRes = await req2.query(
      `SELECT ZoneID, GeoJSON FROM Zones WHERE IsActive = 1`
    );

    let matchedZoneId = null;

    for (const zone of zonesRes.recordset) {
      try {
        const polygon = JSON.parse(zone.GeoJSON);
        let coords = polygon.coordinates[0];
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);

        const shape = turf.polygon([coords]);
        if (turf.booleanPointInPolygon(userPoint, shape)) {
          matchedZoneId = zone.ZoneID;
          break;
        }
      } catch (err) {
        console.log("Zone parse error:", err.message);
      }
    }

    if (!matchedZoneId)
      return res.status(404).json({ message: "User not in any service zone" });

    // ================= 3. FIND DRIVER BY ZONE ONLY =================
    const req3 = new sql.Request();
    const driverRes = await req3
      .input("ZoneID", sql.Int, matchedZoneId)
      .query(`
        SELECT TOP 1 d.DriverID
        FROM Drivers d
        JOIN Schedules s ON d.DriverID = s.DriverID
        JOIN Slots sl ON s.SlotID = sl.SlotID
        WHERE s.Active = 1
          AND sl.ZoneID = @ZoneID
      `);

    if (driverRes.recordset.length === 0)
      return res.status(404).json({ message: "No driver found for your zone" });

    const driverId = driverRes.recordset[0].DriverID;

    // ================= 4. DRIVER LOCATION =================
    const req4 = new sql.Request();
    const locRes = await req4
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1 Latitude, Longitude, RecordedAt
        FROM DriverLocationLogs
        WHERE DriverID = @DriverID
        ORDER BY RecordedAt DESC
      `);

    if (locRes.recordset.length === 0)
      return res.status(404).json({ message: "Driver location not available" });

    // ================= FINAL RESPONSE =================
    res.json({
      DriverID: driverId,
      ZoneID: matchedZoneId,
      Latitude: locRes.recordset[0].Latitude,
      Longitude: locRes.recordset[0].Longitude,
      RecordedAt: locRes.recordset[0].RecordedAt,
    });

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
//scheduled pickup
exports.getScheduledPickup = async (req, res) => {
  try {
    const UserID = req.user.UserID;

    // ================= 1. USER LOCATION =================
    const req1 = new sql.Request();
    const userRes = await req1
      .input("UserID", sql.Int, UserID)
      .query(`SELECT latlng FROM Users WHERE UserID = @UserID`);


    if (userRes.recordset.length === 0)
      return res.status(404).json({ message: "User not found" });

    const latlng = userRes.recordset[0].latlng;
    if (!latlng)
      return res.status(400).json({ message: "User location not set" });

    const [latStr, lngStr] = latlng.split(",");
    const lat = Number(latStr.trim());
    const lng = Number(lngStr.trim());

    if (isNaN(lat) || isNaN(lng))
      return res.status(400).json({ message: "Invalid location format" });

    const userPoint = turf.point([lng, lat]);

    // ================= 2. GET ZONES =================
    const req2 = new sql.Request();
    const zonesRes = await req2.query(
      `SELECT ZoneID, GeoJSON FROM Zones WHERE IsActive = 1`
    );

    let matchedZoneId = null;
    for (const zone of zonesRes.recordset) {
      try {
        const polygon = JSON.parse(zone.GeoJSON);
        let coords = polygon.coordinates[0];
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
        const shape = turf.polygon([coords]);
        if (turf.booleanPointInPolygon(userPoint, shape)) {
          matchedZoneId = zone.ZoneID;
          break;
        }
      } catch (err) {
        console.log("Zone parse error:", err.message);
      }
    }

    if (!matchedZoneId)
      return res.status(404).json({ message: "User not in any service zone" });

    // ================= 3. GET TODAY'S SLOT FOR USER'S ZONE =================
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[new Date().getDay()];

    const req3 = new sql.Request();
    const slotRes = await req3
      .input("ZoneID", sql.Int, matchedZoneId)
      .input("DayOfWeek", sql.VarChar, todayDay)
      .query(`
        SELECT TOP 1
            sc.ScheduleID,
            sc.DriverID,
            sc.Active,
            sl.SlotID,
            sl.StartTime,
            sl.EndTime,
            sl.DayOfWeek,
            sl.ZoneID
        FROM Schedules sc
        INNER JOIN Slots sl ON sc.SlotID = sl.SlotID
        WHERE sc.Active = 1
          AND sl.IsActive = 1
          AND sl.ZoneID = @ZoneID
          AND sl.DayOfWeek = @DayOfWeek
        ORDER BY sl.StartTime ASC
      `);

    if (slotRes.recordset.length === 0)
      return res.status(404).json({ message: "No pickup scheduled for your zone today" });

    // ================= FINAL RESPONSE =================
    const slot = slotRes.recordset[0];
    res.status(200).json({
      pickup: {
        ScheduleID: slot.ScheduleID,
        DriverID:   slot.DriverID,
        SlotID:     slot.SlotID,
        StartTime:  slot.StartTime,
        EndTime:    slot.EndTime,
        DayOfWeek:  slot.DayOfWeek,
        ZoneID:     slot.ZoneID,
      },
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};