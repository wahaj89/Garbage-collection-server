const express=require('express');
const router=express.Router();
const collectorController=require('../controllers/collectorController');
router.post('/addCollector',collectorController.addCollector);
router.get('/viewCollector',collectorController.viewCollectors);
router.post('/login',collectorController.loginCollector);
module.exports=router;