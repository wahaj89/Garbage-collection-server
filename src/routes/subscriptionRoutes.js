const express=require('express');
const router=express.Router();
const sql=require('../config/db');

//subsciptionroutes
const subscriptionController=require('../controllers/subscriptionController');
router.post('/addPlan',subscriptionController.addPlan);
router.get('/viewPlans',subscriptionController.viewPlans);
router.post('/buySubscription',subscriptionController.buySubscription);
router.patch('/updateSubscription',subscriptionController.updateSubscription);
router.patch('/cancelSubscription',subscriptionController.cancelSubscription);
router.patch('/renewSubscription',subscriptionController.renewSubscription);
 
module.exports=router;