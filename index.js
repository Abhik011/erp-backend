// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ---------- MongoDB Connection ----------
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/erp";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true, // fixes Render TLS handshake issue
    serverSelectionTimeoutMS: 20000, // wait up to 20s before timeout
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:");
    console.error(err.message);
  });

// ---------- CORS Configuration ----------
const allowedOrigins = [
  "http://localhost:3000",
  "https://erp-demo-pi.vercel.app",
   "https://erp-backend-ed55.onrender.com",// 👈 your Vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ---------- Body Parser ----------
app.use(bodyParser.json());

// ---------- Session Configuration ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ✅ secure only in prod (HTTPS)
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);


// ---------- Import Routes ----------
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const franchiseRoutes = require("./routes/franchise");
const roleRoutes = require("./routes/role");
const enquiryRoutes = require("./routes/enquiry");
const lsqRoutes = require("./routes/lsqEnquiryRoutes");
const admissionRoutes = require("./routes/admissions");
const graduationNameChangeRoutes = require("./routes/Graduationnamechangeconfirmation");
const inventoryRoutes = require("./routes/inventory");
const staffRoutes = require("./routes/staff");
const transferFundRoutes = require("./routes/transferfunds");
const depositRoutes = require("./routes/deposit");
const attendanceRoutes = require("./routes/attendance");
const teachingSubjectRoutes = require("./routes/teachingSubjects");
const exchangeOrderRoutes = require("./routes/exchangeOrders");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const courseRoutes = require("./routes/courseRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const uploadRoute = require("./routes/uploadRoute");
const accountRoutes = require("./routes/Account");

// ---------- Use Routes ----------
app.use("/api/Account", accountRoutes);
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
app.use("/api/deposit", depositRoutes);
app.use("/api/transfers", transferFundRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api", authRoutes);
app.use("/api/franchises", franchiseRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/lsq-enquiries", lsqRoutes);
app.use("/api", enquiryRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/Graduationnamechangeconfirmation", graduationNameChangeRoutes);
app.use("/api/attendance", attendanceRoutes);

// ---------- Static Uploads ----------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- Root Route ----------
app.get("/", (_req, res) => {
  res.send("🎉 Welcome to the backend API");
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
