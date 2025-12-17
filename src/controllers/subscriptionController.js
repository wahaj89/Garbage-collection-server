const express = require('express');
const router = express.Router();
const sql = require('../config/db');

//buy subscription
function getSubscriptionDetails(type) {
    switch (type) {
        case "Monthly":
            return { months: 1, amount: 3000 };
        case "Quarterly":
            return { months: 3, amount: 8000 };
        case "Yearly":
            return { months: 12, amount: 30000 };
        default:
            return null;
    }
}
exports.buySubscription = async (req, res) => {
    try {
        const { UserID, CompanyID, type } = req.body;
        if (!UserID || !CompanyID || !type) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const subscriptionDetails = getSubscriptionDetails(type);

        const request = new sql.Request();
        const existing = await request
            .input("UserID", UserID)
            .input("CompanyID", CompanyID)
            .query(`
        SELECT 1 FROM Subscriptions
        WHERE UserID = @UserID
        AND CompanyID = @CompanyID
        AND Status = 'Active'
        AND EndDate >= GETDATE()
      `);

        if (existing.recordset.length > 0) {
            return res.status(409).json({
                message: "Active subscription already exists"
            });
        }
        if (!subscriptionDetails) {
            return res.status(400).json({ message: "Invalid subscription type" });
        }
        request.input('UserID', UserID);
        request.input('CompanyID', CompanyID);
        request.input('Type', type);
        request.input('Amount', subscriptionDetails.amount);
        request.input('StartDate', new Date());
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + subscriptionDetails.months);
        request.input('EndDate', endDate);
        await request.query(`INSERT INTO Subscriptions (UserID, CompanyID,  StartDate, EndDate,type, amount)
    VALUES (@UserID, @CompanyID, @StartDate, @EndDate ,@Type, @Amount)`);
        res.status(201).json({ message: "Subscription purchased successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
//renew subscription
exports.renewSubscription = async (req, res) => {
    try {
        const { SubscriptionID } = req.body;
        if (!SubscriptionID) {
            return res.status(400).json({ message: "SubscriptionID is required" });
        }
        const request = new sql.Request();
        const result = await request.input('SubscriptionID', SubscriptionID).query(`SELECT * FROM Subscriptions WHERE SubscriptionID=@SubscriptionID`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Subscription not found" });
        }
        const subscription = result.recordset[0];
        const subscriptionDetails = getSubscriptionDetails(subscription.type);
        if (!subscriptionDetails) {
            return res.status(400).json({ message: "Invalid subscription type" });
        }
        const newEndDate = new Date(subscription.EndDate);
        newEndDate.setMonth(newEndDate.getMonth() + subscriptionDetails.months);
        await request
            .input('NewEndDate', newEndDate)
            .input('amount', subscriptionDetails.amount)
            .query(`UPDATE Subscriptions SET EndDate=@NewEndDate,status='Active' ,amount=amount + @Amount WHERE SubscriptionID=@SubscriptionID`);
        res.status(200).json({ message: "Subscription renewed successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
};
//cancel Subscription
exports.cancelSubscription = async (req, res) => {
    try {
        const { SubscriptionID } = req.body;

        if (!SubscriptionID) {
            return res.status(400).json({
                message: "SubscriptionID is required"
            });
        }

        const checkRequest = new sql.Request();
        const result = await checkRequest
            .input("SubscriptionID", SubscriptionID)
            .query(`
        SELECT Status 
        FROM Subscriptions 
        WHERE SubscriptionID = @SubscriptionID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        if (result.recordset[0].Status === "Expired") {
            return res.status(400).json({
                message: "Subscription already cancelled"
            });
        }


        const updateRequest = new sql.Request();
        await updateRequest
            .input("SubscriptionID", SubscriptionID)
            .query(`
        UPDATE Subscriptions
        SET Status = 'Expired'
        WHERE SubscriptionID = @SubscriptionID
      `);

        res.status(200).json({
            message: "Subscription cancelled successfully"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error",
            error: err.message
        });
    }
};
// Upgrade or downgrade subscription plan
exports.updateSubscription = async (req, res) => {
    try {
        const { UserID, SubscriptionID, type } = req.body;
        if (!UserID || !SubscriptionID || !TargetType) {
            return res.status(400).json({ message: 'UserID, SubscriptionID, and type are required' });
        }

        const request = new sql.Request();
        const result = await request
            .input('SubscriptionID', SubscriptionID)
            .input('UserID', UserID)
            .query(`SELECT * FROM Subscriptions WHERE SubscriptionID=@SubscriptionID AND UserID=@UserID`);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const subscription = result.recordset[0];
        const subscriptionDetails = getSubscriptionDetails(type);

        if (!subscriptionDetails) {
            return res.status(400).json({ message: 'Invalid subscription type' });
        }

        const newEndDate = new Date(subscription.EndDate);
        newEndDate.setMonth(newEndDate.getMonth() + subscriptionDetails.months);

        await request
            .input('NewEndDate', newEndDate)
            .input('type', type)
            .input('AdditionalAmount', subscriptionDetails.amount)
            .query(`UPDATE Subscriptions SET EndDate=@NewEndDate, type=@type, amount=amount + @AdditionalAmount WHERE SubscriptionID=@SubscriptionID`);

        return res.status(200).json({ message: 'Subscription updated successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
//get subscription details
exports.getSubscriptionDetails=async(req,res)=>{
    try{
        const {UserID,CompanyID}=req.body;
        if(!UserID || !CompanyID){
            return res.status(400).json({message:'UserID and CompanyID are required'});
        }
        const request=new sql.Request();
        const result=await request
        .input('UserID',UserID)
        .input('CompanyID',CompanyID)
        .query(`SELECT * FROM Subscriptions WHERE UserID=@UserID AND CompanyID=@CompanyID ORDER BY StartDate DESC`);
        return res.status(200).json({subscriptions:result.recordset});
    }catch(err){
        return res.status(500).json({message:'Server Error',error:err.message});
    }
};

