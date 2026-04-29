const express = require('express');
const router = express.Router();
const bagController = require('../controllers/bagsController');


router.post('/add', bagController.generateBags);
router.get('/viewBag',bagController.viewUserBags)
router.patch('/disableBag', bagController.disableBag);

module.exports = router;
