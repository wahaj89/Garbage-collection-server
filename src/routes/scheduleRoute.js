const express=require('express');
const router=express.Router();
const scheduleController=require('../controllers/scheduleController');
router.post('/addSchedule',scheduleController.addSchedule);
module.exports=router;