const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const instrumentRoutes = require('./routes/instrumentRoutes');
const testProjectRoutes = require('./routes/testProjectRoutes');
const testExecutionRoutes = require('./routes/testExecutionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ruleAdminRoutes = require('./routes/ruleAdminRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const auditRoutes = require('./routes/auditRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/prototype; frontend can connect
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file hosting for uploaded evidence & generated reports
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'METRIX-R76 NAWI Legal Metrology Compliance Engine',
    organization: 'Department of Consumer Affairs (DoCA)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/test-projects', testProjectRoutes);
app.use('/api/tests', testExecutionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/rules', ruleAdminRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/audit-logs', auditRoutes);

// Centralized Error Handling
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  METRIX-R76 Server listening on port ${PORT}`);
    console.log(`  OIML R-76 NAWI Compliance & Test Report Generator`);
    console.log(`  Connected to MySQL Database: ${process.env.DB_NAME || 'metrix_r76'}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
