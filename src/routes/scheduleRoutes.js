const express=require('express');
const router=express.Router();
const sql=require('../config/db');

//subsciptionroutes
const subscriptionController=require('../controllers/scheduleController');
router.post('/addSchedule',scheduleController.addSchedule);
module.exports=router;