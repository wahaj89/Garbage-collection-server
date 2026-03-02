const express=require('express');
const router=express.Router();
const driverController=require('../controllers/driverController');
const authMiddleware = require('../middlewares/auth.middleware'); // Import the authentication middleware
router.post('/addDriver',driverController.addDriver);
router.get('/viewDrivers',driverController.viewDrivers);
router.get('/viewCompanyDrivers',authMiddleware,driverController.viewCompanyDrivers);
router.patch('/removeDriver',driverController.removeDriver);
router.post('/updatelocation', driverController.updateDriverLocation);
router.get('/location/:DriverID',driverController.getDriverLocation);
module.exports=router;