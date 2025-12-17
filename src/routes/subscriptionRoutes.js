const express=require('express');
const router=express.Router();
const sql=require('../config/db');

//subsciptionroutes
const subscriptionController=require('../controllers/subscriptionController');
router.post('/buySubscription',subscriptionController.buySubscription);
router.post('/renewSubscription',subscriptionController.renewSubscription);
router.post('/cancelSubscription',subscriptionController.cancelSubscription);
router.post('/updateSubscription',subscriptionController.updateSubscription);
router.get('/getSubscriptionDetails',subscriptionController.getSubscriptionDetails);
module.exports=router;