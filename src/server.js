const express=require('express');
const router=express.Router();
const sql=require('./config/db.js');
const app=express();
const subscriptionRoutes=require('./routes/subscriptionRoutes');
const scheduleRoutes=require('./routes/scheduleRoutes');
app.use(express.json());
app.use('/api',subscriptionRoutes);
app.use('/api', scheduleRoutes);
const port=3000;
app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
})