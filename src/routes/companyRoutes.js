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
module.exports=router;