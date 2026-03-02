const express=require('express');
const router=express.Router();
const authmiddleWare=require('../middlewares/auth.middleware');
const userController=require('../controllers/usersController');
router.post('/register',userController.registerUser);
router.post('/login',userController.loginUser);
router.get('/userPickupDriver', userController.viewUserPickupDriver);
router.post('/addComplaint',userController.addComplaint);
router.get('/viewComplaints',userController.viewUserComplaints);
router.get('/viewSubscribedUsers',authmiddleWare,userController.viewCompanySubscribers);

module.exports=router;