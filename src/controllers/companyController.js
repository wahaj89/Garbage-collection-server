const express = require("express");
const sql = require("../config/db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Add Company
exports.addCompany = async (req, res) => {
  try {
    const { Name, Email, Phone, Address, RegistrationNumber, password } =
      req.body;
    if (!Name || !Email) {
      return res.status(400).json({
        message: "Company name and email are required",
      });
    }

    const Rounds = 10;

    const passwordHash = await bcrypt.hash(password, Rounds);

    const request = new sql.Request();

    await request
      .input("Name", Name)
      .input("Email", Email)
      .input("Phone", Phone)
      .input("Address", Address)
      .input("RegistrationNumber", RegistrationNumber)
      .input("passwordhash", passwordHash).query(`
                INSERT INTO Companies
                (
                    Name,
                    Email,
                    Phone,
                    Address,
                    RegistrationNumber,
                    Status,
                    passwordhash

                )
                VALUES
                (
                    @Name,
                    @Email,
                    @Phone,
                    @Address,
                    @RegistrationNumber,
                    'Pending',
                    @passwordhash
                )
            `);

    return res.status(201).json({
      message:
        "Company registration request submitted. Waiting for admin approval.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
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
      message: "Server error",
      error: err.message,
    });
  }
};

//login company

exports.loginCompany = async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const request = new sql.Request();
    const result = await request.input("Email", Email).query(`
                SELECT CompanyID, Name, Email, PasswordHash, Status
                FROM Companies
                WHERE Email = @Email
            `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const company = result.recordset[0];

    if (company.Status !== "Approved") {
      return res.status(403).json({
        message: "Company not approved yet",
      });
    }

    const isMatch = await bcrypt.compare(Password, company.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        CompanyID: company.CompanyID,
        Email: company.Email,
        Name: company.Name,
        role: "Company",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      CompanyID: company.CompanyID,
      Name: company.Name,
      Email: company.Email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
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
        message: "Service name is required",
      });
    }

    const request = new sql.Request();
    const company = await request.input("UserID", UserID).query(`
                SELECT CompanyID
                FROM Companies
                WHERE CreatedByUserID = @UserID
                AND Status = 'Approved'
            `);

    if (company.recordset.length === 0) {
      return res.status(403).json({
        message: "Company not approved or not found",
      });
    }

    const CompanyID = company.recordset[0].CompanyID;

    const duplicate = await request
      .input("CompanyID", CompanyID)
      .input("Name", Name).query(`
                SELECT *
                FROM CompanyServices
                WHERE CompanyID = @CompanyID
                AND Name = @Name
            `);

    if (duplicate.recordset.length > 0) {
      return res.status(400).json({
        message: "Service already exists",
      });
    }
    await request
      .input("CompanyID", CompanyID)
      .input("Name", Name)
      .input("Description", Description)
      .input("BasePrice", BasePrice || 0).query(`
                INSERT INTO CompanyServices
                (CompanyID, Name, Description, BasePrice)
                VALUES
                (@CompanyID, @Name, @Description, @BasePrice)
            `);

    return res.status(201).json({
      message: "Service added successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
// Update Company Service
exports.updateCompanyService = async (req, res) => {
  try {
    const { ServiceID, Name, Description, BasePrice, IsActive } = req.body;

    const UserID = req.user.UserID;

    if (!ServiceID) {
      return res.status(400).json({
        message: "ServiceID is required",
      });
    }

    const request = new sql.Request();

    const check = await request
      .input("ServiceID", ServiceID)
      .input("UserID", UserID).query(`
                SELECT cs.ServiceID
                FROM CompanyServices cs
                JOIN Companies c ON cs.CompanyID = c.CompanyID
                WHERE cs.ServiceID = @ServiceID
                AND c.CreatedByUserID = @UserID
                AND c.Status = 'Approved'
            `);

    if (check.recordset.length === 0) {
      return res.status(403).json({
        message: "Unauthorized or company not approved",
      });
    }

    await request
      .input("Name", Name)
      .input("Description", Description)
      .input("BasePrice", BasePrice)
      .input("IsActive", IsActive).query(`
                UPDATE CompanyServices
                SET
                    Name = COALESCE(@Name, Name),
                    Description = COALESCE(@Description, Description),
                    BasePrice = COALESCE(@BasePrice, BasePrice),
                    IsActive = COALESCE(@IsActive, IsActive)
                WHERE ServiceID = @ServiceID
            `);

    return res.status(200).json({
      message: "Service updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// view all services
exports.viewServices = async (req, res) => {
  try {
    const { CompanyID } = req.query;
    console.log("Query params:", req.query);
    const request = new sql.Request();

    const result = await request.input("CompanyID", CompanyID).query(`
            SELECT 
                ServiceID,
                CompanyID,
                Name,
                Description,
                BasePrice,
                IsActive
            FROM CompanyServices
            where CompanyID = @CompanyID
        `);

    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
// view company complaints
exports.viewCompanyComplaints = async (req, res) => {
  try {
    const { CompanyID } = req.query;

    const request = new sql.Request();

    const result = await request.input("CompanyID", CompanyID).query(`
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
      message: "Server Error",
      error: err.message,
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
        message: "ComplaintID and Status are required",
      });
    }

    const request = new sql.Request();

    await request
      .input("ComplaintID", ComplaintID)
      .input("Status", Status)
      .input("AdminID", AdminID).query(`
                UPDATE Complaints
                SET 
                    Status = @Status,
                    ResolvedAt = GETDATE(),
                    AssignedToUserID = @AdminID
                WHERE ComplaintID = @ComplaintID
            `);

    res.status(200).json({
      message: "Complaint status updated",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
//view all subscribers of a company
exports.viewSubscribers = async (req, res) => {
  try {
    const { CompanyID } = req.query;

    if (!CompanyID) {
      return res.status(400).json({
        message: "CompanyID is required",
      });
    }

    const request = new sql.Request();

    const result = await request.input("CompanyID", CompanyID).query(`
              SELECT      
    s.SubscriptionID,
    s.UserID, -- ✅ add this
    u.FullName AS UserName,
    u.Email AS UserEmail,   
    p.Name AS PlanName,
    p.BagsPerDay, -- ✅ add this
    s.StartDate,
    s.EndDate,  
    s.Status,
    p.Type
FROM Subscriptions s
INNER JOIN Users u ON s.UserID = u.UserID       
INNER JOIN SubscriptionPlans p ON s.PlanID = p.PlanID
WHERE s.CompanyID = @CompanyID
            `);

    const subscribers = result.recordset;

    // 🔥 Split logic
    const activeSubscribers = subscribers.filter(
      (sub) => sub.Status === "Active",
    );

    const inactiveSubscribers = subscribers.filter(
      (sub) => sub.Status === "Cancelled" || sub.Status === "Expired",
    );

    res.status(200).json({
      active: activeSubscribers,
      inactive: inactiveSubscribers,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

// View Extra Pickup Requests (Company Side)
exports.viewExtraRequests = async (req, res) => {
  try {
    const { CompanyID } = req.query; // 🔥 token se aa raha hai

    const request = new sql.Request();

    const result = await request
    .input("CompanyID", sql.Int, CompanyID)
    .query(`
                SELECT 
                    RequestID,
                    UserID,
                    BagsRequested,
                    Status,
                    RequestedAt,
                    Type
                FROM ExtraPickupRequests
                WHERE CompanyID = @CompanyID
                ORDER BY RequestedAt DESC
            `);

    res.status(200).json({
      requests: result.recordset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
//create slot (weekly system)
exports.createSlot = async (req, res) => {
  try {
    const { ZoneID, DayOfWeek, StartTime, EndTime, DriverID } = req.body;

    const request = new sql.Request();

    // 🔥 1. Conflict check (time overlap + same driver)
    const conflict = await request
      .input("DriverID", DriverID)
      .input("StartTime", StartTime)
      .input("EndTime", EndTime)
      .query(`
        SELECT s.*
        FROM Schedules sch
        JOIN Slots s ON sch.SlotID = s.SlotID
        WHERE sch.DriverID = @DriverID
        AND (
          @StartTime < s.EndTime
          AND @EndTime > s.StartTime
        )
      `);

    if (conflict.recordset.length > 0) {
      return res.status(400).json({
        message: "Driver already assigned in this time slot",
      });
    }

    // 🔥 2. Get Vehicle
    const driver = await request
      .input("DriverID2", DriverID)
      .query(`
        SELECT VehicleID 
        FROM Drivers 
        WHERE DriverID = @DriverID2
      `);

    if (!driver.recordset.length) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const VehicleID = driver.recordset[0].VehicleID;

    // 🔥 3. Handle SlotDate safely (IMPORTANT FIX)
    const finalSlotDate = SlotDate || null;

    // 🔥 4. Create Slot
    const slot = await new sql.Request()
      .input("ZoneID", ZoneID)
      .input("SlotDate", finalSlotDate)
      .input("DayOfWeek", DayOfWeek || null)
      .input("StartTime", StartTime)
      .input("EndTime", EndTime)
      .query(`
        INSERT INTO Slots
        (ZoneID,  StartTime, EndTime, IsActive, CreatedAt, DayOfWeek)
        OUTPUT INSERTED.SlotID
        VALUES (@ZoneID,  @StartTime, @EndTime, 1, GETDATE(), @DayOfWeek)
      `);

    const SlotID = slot.recordset[0].SlotID;

    // 🔥 5. Insert Schedule
    await new sql.Request()
      .input("SlotID", SlotID)
      .input("DriverID", DriverID)
      .query(`
        INSERT INTO Schedules (SlotID, DriverID, Active)
        VALUES (@SlotID, @DriverID,  1)
      `);

    return res.json({
      message: "Slot created successfully",
      SlotID
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
//getdriverwithvechile
exports.getDriversWithVehicles = async (req, res) => {
  try {
    const {CompanyID} = req.query;

    const request = new sql.Request();

    const result = await request
    .input("CompanyID", CompanyID)
    .query(`
        SELECT 
          d.DriverID,
          d.FullName,
          v.VehicleID,
          v.PlateNumber,
          v.Model
        FROM Drivers d
        LEFT JOIN Vehicles v ON d.VehicleID = v.VehicleID
        WHERE d.CompanyID = @CompanyID 
        
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//get company schedule
exports.getSchedules = async (req, res) => {
  try {
    const {CompanyID} = req.query;
    console.log("CompanyID from query:", CompanyID); // Debug log

    const request = new sql.Request();

    const result = await request
    .input("CompanyID", CompanyID)
    .query(`
      SELECT 
        sch.ScheduleID,
        sch.Active,

        s.SlotID,
        s.DayOfWeek,
        s.StartTime,
        s.EndTime,

        d.DriverID,
        d.FullName AS DriverName,

        v.VehicleID,
        v.PlateNumber,

        z.ZoneID,
        z.Name

      FROM Schedules sch
      INNER JOIN Slots s ON sch.SlotID = s.SlotID
      INNER JOIN Drivers d ON sch.DriverID = d.DriverID
      LEFT JOIN Vehicles v ON d.VehicleID = v.VehicleID
      LEFT JOIN Zones z ON s.ZoneID = z.ZoneID

      WHERE d.CompanyID = @CompanyID
    `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
