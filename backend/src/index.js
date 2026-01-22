// import dotenv from 'dotenv';
// dotenv.config({
//     path: './.env'
// });

// import app from './app.js';
// import db from './models/index.js';

// const PORT = process.env.PORT || 3000;

// try {
//   await db.sequelize.authenticate();
//   console.log('✅ DB connected successfully.');

//   await db.sequelize.sync({ alter: true });
//   console.log('✅ Models synced with database.');

//   app.listen(PORT, () => {
//     console.log(`🚀 Server is running at http://localhost:${PORT}`);
//   });
// } catch (err) {
//   console.error('❌ Unable to connect to the database:', err);
// }


import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});

import app from './app.js';
import db from './models/index.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ DB connected successfully.');

    // Sync models with existing database structure (no alter)
    const modelsToSync = Object.values(db).filter(model => 
      model !== db.Message && 
      model !== db.Session && 
      model !== db.videoSent && 
      model !== db.imageSent && 
      model.getTableName &&
      typeof model.sync === 'function'
    );
    
    // Use force: false and alter: false to work with existing database
    await Promise.all(modelsToSync.map(model => model.sync({ force: false, alter: false })));
    console.log('✅ Models synced with existing PostgreSQL database.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Unable to connect to the database:', err);
    process.exit(1);
  }
}

startServer();