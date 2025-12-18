const authMiddleware = require('../middlewares/auth.middleware');
const express=require('express');
const router=express.Router();


const companyController=require('../controllers/companyController');
router.post('/addCompany',authMiddleware,companyController.addCompany);
router.post('/addService',companyController.addCompanyService);
router.patch('/updateService',companyController.updateCompanyService);
router.get('/viewCompanies',companyController.viewCompanies);
router.get('/viewServices',companyController.viewServices);
module.exports=router;