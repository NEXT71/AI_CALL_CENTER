require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ComplianceRule = require('../models/ComplianceRule');
const config = require('../config/config');

// Sample users
const users = [
  {
    name: 'Admin User',
    email: 'admin@nextel.com',
    password: 'Admin123!',
    role: 'Admin',
    department: 'IT',
  },
  {
    name: 'QA Manager',
    email: 'qa.manager@nextel.com',
    password: 'QA123!',
    role: 'User',
    department: 'Quality Assurance',
  },
  {
    name: 'QA Analyst 1',
    email: 'qa1@nextel.com',
    password: 'QA123!',
    role: 'User',
    department: 'Quality Assurance',
  },
  {
    name: 'QA Analyst 2',
    email: 'qa2@nextel.com',
    password: 'QA123!',
    role: 'User',
    department: 'Quality Assurance',
  },
  {
    name: 'Operations Manager',
    email: 'ops@nextel.com',
    password: 'Ops123!',
    role: 'User',
    department: 'Operations',
  },
];

// Sample compliance rules
const complianceRules = [
  // Sales Campaign - Mandatory
  {
    campaign: 'Sales',
    ruleType: 'mandatory',
    phrase: 'thank you for calling',
    description: 'Greeting phrase',
    weight: 2,
  },
  {
    campaign: 'Sales',
    ruleType: 'mandatory',
    phrase: 'can i have your name please',
    description: 'Customer identification',
    weight: 1,
  },
  {
    campaign: 'Sales',
    ruleType: 'mandatory',
    phrase: 'terms and conditions apply',
    description: 'Legal disclaimer',
    weight: 3,
  },
  {
    campaign: 'Sales',
    ruleType: 'mandatory',
    phrase: 'is there anything else i can help you with',
    description: 'Additional assistance offer',
    weight: 1,
  },
  {
    campaign: 'Sales',
    ruleType: 'mandatory',
    phrase: 'have a great day',
    description: 'Closing phrase',
    weight: 1,
  },
  
  // Sales Campaign - Forbidden
  {
    campaign: 'Sales',
    ruleType: 'forbidden',
    phrase: 'i dont know',
    description: 'Shows uncertainty',
    weight: 2,
  },
  {
    campaign: 'Sales',
    ruleType: 'forbidden',
    phrase: 'thats not my job',
    description: 'Unprofessional',
    weight: 3,
  },
  {
    campaign: 'Sales',
    ruleType: 'forbidden',
    phrase: 'you should have',
    description: 'Blaming customer',
    weight: 2,
  },
  
  // Customer Service Campaign - Mandatory
  {
    campaign: 'Customer Service',
    ruleType: 'mandatory',
    phrase: 'thank you for calling',
    description: 'Greeting phrase',
    weight: 2,
  },
  {
    campaign: 'Customer Service',
    ruleType: 'mandatory',
    phrase: 'i apologize for the inconvenience',
    description: 'Empathy statement',
    weight: 2,
  },
  {
    campaign: 'Customer Service',
    ruleType: 'mandatory',
    phrase: 'i understand',
    description: 'Empathy acknowledgment',
    weight: 1,
  },
  {
    campaign: 'Customer Service',
    ruleType: 'mandatory',
    phrase: 'let me help you with that',
    description: 'Service commitment',
    weight: 2,
  },
  {
    campaign: 'Customer Service',
    ruleType: 'mandatory',
    phrase: 'is there anything else',
    description: 'Additional assistance',
    weight: 1,
  },
  
  // Customer Service Campaign - Forbidden
  {
    campaign: 'Customer Service',
    ruleType: 'forbidden',
    phrase: 'its not our fault',
    description: 'Deflecting responsibility',
    weight: 3,
  },
  {
    campaign: 'Customer Service',
    ruleType: 'forbidden',
    phrase: 'calm down',
    description: 'Dismissive',
    weight: 2,
  },
  {
    campaign: 'Customer Service',
    ruleType: 'forbidden',
    phrase: 'theres nothing i can do',
    description: 'Unhelpful',
    weight: 3,
  },
  
  // Collections Campaign - Mandatory
  {
    campaign: 'Collections',
    ruleType: 'mandatory',
    phrase: 'this call may be recorded',
    description: 'Legal requirement',
    weight: 3,
  },
  {
    campaign: 'Collections',
    ruleType: 'mandatory',
    phrase: 'verify your identity',
    description: 'Security compliance',
    weight: 3,
  },
  {
    campaign: 'Collections',
    ruleType: 'mandatory',
    phrase: 'payment arrangement',
    description: 'Collections offer',
    weight: 2,
  },
  
  // Collections Campaign - Forbidden
  {
    campaign: 'Collections',
    ruleType: 'forbidden',
    phrase: 'you will be arrested',
    description: 'Illegal threat',
    weight: 5,
  },
  {
    campaign: 'Collections',
    ruleType: 'forbidden',
    phrase: 'we will sue you',
    description: 'Threatening language',
    weight: 4,
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await ComplianceRule.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Get admin user for createdBy field
    const adminUser = createdUsers.find(u => u.role === 'Admin');

    // Add createdBy to compliance rules
    const rulesWithCreator = complianceRules.map(rule => ({
      ...rule,
      createdBy: adminUser._id,
    }));

    // Insert compliance rules
    const createdRules = await ComplianceRule.insertMany(rulesWithCreator);
    console.log(`✅ Created ${createdRules.length} compliance rules`);

    console.log('\n📋 Seed Data Summary:');
    console.log('='.repeat(50));
    console.log('\n👥 Users:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    console.log('\n📏 Compliance Rules by Campaign:');
    const campaigns = [...new Set(complianceRules.map(r => r.campaign))];
    campaigns.forEach(campaign => {
      const mandatory = createdRules.filter(r => r.campaign === campaign && r.ruleType === 'mandatory').length;
      const forbidden = createdRules.filter(r => r.campaign === campaign && r.ruleType === 'forbidden').length;
      console.log(`  - ${campaign}: ${mandatory} mandatory, ${forbidden} forbidden`);
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('  Admin:   admin@nextel.com / Admin123!');
    console.log('  User:    qa.manager@nextel.com / QA123!');
    console.log('  User:    qa1@nextel.com / QA123!');
    console.log('  User:    qa2@nextel.com / QA123!');
    console.log('  User:    ops@nextel.com / Ops123!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
