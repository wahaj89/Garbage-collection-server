const express = require('express');
const router = express.Router();
const zonesController = require('../controllers/zonesController');


router.post('/addZone', zonesController.addZone);
router.get('/viewZones', zonesController.viewZones);
router.get('/viewCompanyZones/:CompanyID', zonesController.viewCompanyZones);
router.get('/viewActiveCompanyZones/:CompanyID', zonesController.viewActiveCompanyZones);
router.get('/viewActiveZones', zonesController.viewActiveZones);
router.patch('/deleteZone/:ZoneID', zonesController.removeZone);
router.post('/addUserToZone', zonesController.assignUserToZone);
router.get('/viewZoneUsers', zonesController.viewUsersInZone);
router.get('/viewUserZones', zonesController.viewUserZones);

module.exports = router;
