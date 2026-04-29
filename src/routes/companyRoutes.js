const authMiddleware = require('../middlewares/auth.middleware');
const express=require('express');
const router=express.Router();


const companyController=require('../controllers/companyController');
router.post('/addCompany',companyController.addCompany);
router.post('/addService',companyController.addCompanyService);
router.patch('/updateService',companyController.updateCompanyService);
router.get('/viewCompanies',companyController.viewCompanies);
router.get('/viewServices',companyController.viewServices);
router.get('/viewCompanyComplaints',companyController.viewCompanyComplaints);
router.patch('/updateComplaintStatus',companyController.updateComplaintStatus);
router.post('/login',companyController.loginCompany);
router.get('/viewSubscribedUsers',companyController.viewSubscribers);
router.get('/viewExtraRequests',companyController.viewExtraRequests);
router.post('/createSlot',companyController.createSlot);
router.get('/getDriversWithVehicles',companyController.getDriversWithVehicles);
router.get('/getCompanySchedule',companyController.getSchedules);
module.exports=router;