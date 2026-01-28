require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Call = require('../models/Call');
const config = require('../config/config');

async function migrateCallsToAddCompany() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);

    console.log('✅ Connected to MongoDB');

    // Find all calls that don't have a company field
    const callsWithoutCompany = await Call.find({
      $or: [
        { company: { $exists: false } },
        { company: '' },
        { company: null }
      ]
    });

    console.log(`📞 Found ${callsWithoutCompany.length} calls without company field`);

    let updatedCount = 0;

    for (const call of callsWithoutCompany) {
      try {
        // Find the user who uploaded this call
        const uploader = await User.findById(call.uploadedBy);
        if (uploader && uploader.company) {
          await Call.findByIdAndUpdate(call._id, {
            company: uploader.company
          });
          updatedCount++;
          console.log(`✅ Updated call ${call.callId} with company: ${uploader.company}`);
        } else {
          console.log(`⚠️  Could not find uploader or company for call ${call.callId}`);
        }
      } catch (error) {
        console.error(`❌ Error updating call ${call.callId}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration completed! Updated ${updatedCount} calls with company information.`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateCallsToAddCompany();