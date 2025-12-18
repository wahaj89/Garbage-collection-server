require('dotenv').config();
const express=require('express');
const router=express.Router();
const sql=require('./config/db.js');
const app=express();
const subscriptionRoutes=require('./routes/subscriptionRoutes');
const userRoutes=require('./routes/userRoutes');
const driverRoutes=require('./routes/driverRoutes');
const companyRoutes=require('./routes/companyRoutes.js');
const vehicleRoutes=require('./routes/vehicleRoutes.js');
const collectorRoutes=require('./routes/collectorRoute.js');
const zoneRoutes=require('./routes/zonesRoutes.js')
const scheduleRoutes=require('./routes/scheduleRoute.js')

app.use(express.json());
app.use('/api',subscriptionRoutes);
app.use('/api',userRoutes);
app.use('/api',driverRoutes);
app.use('/api',companyRoutes);
app.use('/api',vehicleRoutes);
app.use('/api',collectorRoutes);
app.use('/api',zoneRoutes);
app.use('/api',scheduleRoutes);

const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
})