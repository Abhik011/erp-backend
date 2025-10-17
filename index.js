const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require('path')
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL ||  "http://localhost:3000";

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/yourdbname", {
  
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// CORS middleware - important for session cookies to work with frontend
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // allows session cookie to be sent
  })
);

// Body parser
app.use(bodyParser.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/yourdbname",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // use true in production with HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day session
    },
  })
);

// Import Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const franchiseRoutes = require("./routes/franchise");
const roleRoutes = require("./routes/role");
const enquiryRoutes = require("./routes/enquiry")
const lsqRoutes = require("./routes/lsqEnquiryRoutes")
const admissionRoutes = require("./routes/admissions");
const Graduationnamechangeconfirmation = require("./routes/Graduationnamechangeconfirmation");

const inventoryRoutes = require("./routes/inventory")
const staffRoutes = require("./routes/staff")
const transferRoutes = require("./routes/transfer")
const deposit = require("./routes/deposit")
const attendanceRoutes = require("./routes/attendance");
const teachingSubjectRoutes = require("./routes/teachingSubjects");
const exchangeOrderRoutes = require("./routes/exchangeOrders");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
const supplierRoutes = require("./routes/supplierRoutes");

const courseRoutes = require("./routes/courseRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const uploadRoute = require("./routes/uploadRoute");
const transferFundRoutes = require("./routes/transferfunds");
const Account = require("./routes/Account"); 


app.use("/api/Account", Account);
app.use("/api/transferfunds", transferFundRoutes);
app.use("/api/upload", uploadRoute);
app.use("/api/courses", courseRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/profile", profileRoutes);

app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/exchange-orders", exchangeOrderRoutes);
app.use("/api/teaching-subjects", teachingSubjectRoutes);
app.use("/api/deposit", deposit);
app.use("/api/transfers", transferRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/inventory", inventoryRoutes);


// Use Routes
app.use("/api", authRoutes);
app.use("/api/profile", profileRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("🎉 Welcome to the backend API");
});
// routes/franchise.js
app.use("/api/franchises", franchiseRoutes); 
app.use("/api/roles", roleRoutes);      

app.use("/api/lsq-enquiries", lsqRoutes);
app.use("/api", enquiryRoutes);


app.use("/api/admissions", admissionRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/Graduationnamechangeconfirmation', Graduationnamechangeconfirmation);
app.use("/api/attendance", attendanceRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at  http://localhost:${PORT}`);
});
