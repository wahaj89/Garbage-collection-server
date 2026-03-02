require('dotenv').config();
const express=require('express');
const router=express.Router();
const app=express();
const subscriptionRoutes=require('./routes/subscriptionRoutes');
const userRoutes=require('./routes/userRoutes');
const driverRoutes=require('./routes/driverRoutes');
const companyRoutes=require('./routes/companyRoutes.js');
const vehicleRoutes=require('./routes/vehicleRoutes.js');
const collectorRoutes=require('./routes/collectorRoute.js');
const zoneRoutes=require('./routes/zonesRoutes.js');
const scheduleRoutes=require('./routes/scheduleRoute.js');
const pickupRoutes=require('./routes/pickupRoutes.js');
const bagRoutes=require('./routes/bagRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const cors=require('cors');
app.use(cors());

app.use(express.json());
app.use('/api/subscriptions',subscriptionRoutes);
app.use('/api/users',userRoutes);
app.use('/api/drivers',driverRoutes);
app.use('/api/company',companyRoutes);
app.use('/api/vehicle',vehicleRoutes);
app.use('/api/collector',collectorRoutes);
app.use('/api/zones',zoneRoutes);
app.use('/api/schedule',scheduleRoutes);
app.use('/api/pickup',pickupRoutes);
app.use('/api/bags',bagRoutes);
app.use('/api/admin', adminRoutes);
app.get('/test', (req, res) => {
  res.json({ message: "API working on IP" });
});


const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
