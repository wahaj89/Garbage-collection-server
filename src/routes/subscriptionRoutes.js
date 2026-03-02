const express=require('express');
const router=express.Router();
const sql=require('../config/db');
const authMiddleware = require('../middlewares/auth.middleware'); // Import the authentication middleware

//subsciptionroutes
const subscriptionController=require('../controllers/subscriptionController');
router.post('/addPlan',authMiddleware,subscriptionController.addPlan);
router.get('/viewPlans',subscriptionController.viewPlans);
router.post('/buySubscription',authMiddleware,subscriptionController.buySubscription);
router.patch('/updateSubscription',subscriptionController.updateSubscription);
router.patch('/cancelSubscription',subscriptionController.cancelSubscription);
router.patch('/renewSubscription',subscriptionController.renewSubscription);
 
module.exports=router;