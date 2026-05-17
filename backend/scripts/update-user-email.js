/**
 * Update an existing user's email in MongoDB.
 *
 * Usage:
 *   node scripts/update-user-email.js <old-email> <new-email>
 *
 * Example:
 *   node scripts/update-user-email.js testing@gmail.com nk4164605@gmail.com
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const [oldEmail, newEmail] = process.argv.slice(2);
  if (!oldEmail || !newEmail) {
    console.error('Usage: node scripts/update-user-email.js <old-email> <new-email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email: oldEmail });
  if (!user) {
    console.error(`No user with email ${oldEmail}`);
    process.exit(1);
  }

  user.email = newEmail;
  await user.save();
  console.log(`Updated user email: ${oldEmail} → ${newEmail}`);
  console.log('You may need to login again with the new email.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
