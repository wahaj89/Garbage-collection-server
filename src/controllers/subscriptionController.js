const sql = require('../config/db.js');

//add a new plan
exports.addPlan = async (req, res) => {
    try {
        const {
            CompanyID,
            Name,
            BagsperDay,
            MonthlyPrice,
            Description,
            isActive
        } = req.body;
        const request = new sql.Request();
        request.input('CompanyID', CompanyID);
        request.input('Name', Name);
        request.input('BagsperDay', BagsperDay);
        request.input('MonthlyPrice', MonthlyPrice);
        request.input('Description', Description);
        request.input('isActive', isActive);
        await request.query(`INSERT INTO SubscriptionPlans (CompanyID,Name,BagsperDay,MonthlyPrice,Description,isActive)
                              VALUES (@CompanyID,@Name,@BagsperDay,@MonthlyPrice,@Description,@isActive)`);
        return res.status(200).json({ message: "Plan added successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
};
//view all Plans
exports.viewPlans = async (req, res) => {
    try {
        const request = new sql.Request();
        const { CompanyID } = req.body;
        request.input('CompanyID', CompanyID);
        const response = await request.query("Select * from SubscriptionPlans where CompanyId=@CompanyID");
        return res.status(200).json({ response });
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
};
//Buy Subscription
exports.buySubscription = async (req, res) => {
    try {
        const { UserID, CompanyID, PlanID } = req.body;

        
        if (!UserID || !CompanyID || !PlanID) {
            return res.status(400).json({
                message: "UserID, CompanyID and PlanID are required"
            });
        }

        const StartDate = new Date();
        const EndDate = new Date();
        EndDate.setMonth(EndDate.getMonth() + 1);

        const request = new sql.Request();

      
        const check = await request
            .input('UserID', UserID)
            .input('CompanyID', CompanyID)
            .query(`
                SELECT * FROM Subscriptions 
                WHERE UserID=@UserID 
                AND CompanyID=@CompanyID 
                AND Status='Active'
            `);

        if (check.recordset.length > 0) {
            return res.status(409).json({
                message: "Active subscription already exists"
            });
        }

      
        await request
            .input('PlanID', PlanID)
            .input('StartDate', StartDate)
            .input('EndDate', EndDate)
            .query(`
                INSERT INTO Subscriptions
                (UserID, CompanyID, PlanID, StartDate, EndDate, Status)
                VALUES
                (@UserID, @CompanyID, @PlanID, @StartDate, @EndDate, 'Active')
            `);

        return res.status(201).json({
            message: "Subscription purchased successfully"
        });

    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message
        });
    }
};
// Update Subscription (change plan)
exports.updateSubscription = async (req, res) => {
    try {
        const { SubscriptionID, PlanID, CompanyID } = req.body;
        const UserID = req.user.UserID; // JWT se

        if (!SubscriptionID || !PlanID || !CompanyID) {
            return res.status(400).json({
                message: 'SubscriptionID, PlanID and CompanyID are required'
            });
        }

        const request = new sql.Request();

        const check = await request
            .input('SubscriptionID', SubscriptionID)
            .input('UserID', UserID)
            .input('CompanyID', CompanyID)
            .query(`
                SELECT *
                FROM Subscriptions
                WHERE SubscriptionID = @SubscriptionID
                AND UserID = @UserID
                AND CompanyID = @CompanyID
                AND Status = 'Active'
            `);

        if (check.recordset.length === 0) {
            return res.status(404).json({
                message: 'Active subscription not found'
            });
        }

        await request
            .input('PlanID', PlanID)
            .query(`
                UPDATE Subscriptions
                SET PlanID = @PlanID
                WHERE SubscriptionID = @SubscriptionID
            `);

        return res.status(200).json({
            message: 'Subscription updated successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};

// Cancel Subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const { SubscriptionID, CompanyID } = req.body;
        const UserID = req.user.UserID;

        if (!SubscriptionID || !CompanyID) {
            return res.status(400).json({
                message: 'SubscriptionID and CompanyID are required'
            });
        }

        const request = new sql.Request();

        const check = await request
            .input('SubscriptionID', SubscriptionID)
            .input('UserID', UserID)
            .input('CompanyID', CompanyID)
            .query(`
                SELECT 1
                FROM Subscriptions
                WHERE SubscriptionID = @SubscriptionID
                AND UserID = @UserID
                AND CompanyID = @CompanyID
                AND Status = 'Active'
            `);

        if (check.recordset.length === 0) {
            return res.status(404).json({
                message: 'Active subscription not found'
            });
        }


        await request
            .input('EndDate', new Date()) 
            .query(`
                UPDATE Subscriptions
                SET 
                    Status = 'Cancelled',
                    EndDate = @EndDate
                WHERE SubscriptionID = @SubscriptionID
            `);

        return res.status(200).json({
            message: 'Subscription cancelled successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};

// Renew Subscription
exports.renewSubscription = async (req, res) => {
    try {
        const { SubscriptionID, PlanID, CompanyID } = req.body;
        const UserID = req.user.UserID;

        if (!SubscriptionID || !PlanID || !CompanyID) {
            return res.status(400).json({
                message: 'SubscriptionID, PlanID and CompanyID are required'
            });
        }

        const request = new sql.Request();

        const subCheck = await request
            .input('SubscriptionID', SubscriptionID)
            .input('UserID', UserID)
            .input('CompanyID', CompanyID)
            .query(`
                SELECT *
                FROM Subscriptions
                WHERE SubscriptionID = @SubscriptionID
                AND UserID = @UserID
                AND CompanyID = @CompanyID
                AND Status IN ('Expired', 'Cancelled')
            `);

        if (subCheck.recordset.length === 0) {
            return res.status(404).json({
                message: 'Subscription is not eligible for renewal'
            });
        }

        const planResult = await request
            .input('PlanID', PlanID)
            .query(`
                SELECT DurationInDays
                FROM SubscriptionPlans
                WHERE PlanID = @PlanID
                AND CompanyID = @CompanyID
                AND IsActive = 1
            `);

        if (planResult.recordset.length === 0) {
            return res.status(404).json({
                message: 'Invalid plan selected'
            });
        }

        const duration = planResult.recordset[0].DurationInDays;

      
        await request
            .input('StartDate', new Date())
            .input('EndDate', new Date(Date.now() + duration * 24 * 60 * 60 * 1000))
            .query(`
                UPDATE Subscriptions
                SET 
                    PlanID = @PlanID,
                    Status = 'Active',
                    StartDate = @StartDate,
                    EndDate = @EndDate
                WHERE SubscriptionID = @SubscriptionID
            `);

        return res.status(200).json({
            message: 'Subscription renewed successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};

