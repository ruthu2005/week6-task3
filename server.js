import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to Database and start listening
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Role-Based Authorization Server Running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🔐 Admin Dashboard: http://localhost:${PORT}/api/admin/dashboard`);
      console.log(`🔑 Auth Endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
