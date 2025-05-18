const cron = require('node-cron');
const Dose = require('../models/Dose');
const Medication = require('../models/Medication');

class ReminderService {
  constructor() {
    // Check for upcoming doses every minute
    this.scheduler = cron.schedule('* * * * *', this.checkUpcomingDoses.bind(this));
  }

  async checkUpcomingDoses() {
    try {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);

      // Find doses scheduled in the next 15 minutes
      const upcomingDoses = await Dose.find({
        scheduledTime: {
          $gte: now,
          $lte: fifteenMinutesFromNow
        },
        status: 'scheduled'
      })
      .populate('medication')
      .populate('user');

      for (const dose of upcomingDoses) {
        // Here you would implement the actual notification logic
        // For example, sending push notifications, emails, or SMS
        console.log(`Reminder: ${dose.user.name} needs to take ${dose.medication.name} at ${dose.scheduledTime}`);
        
        // TODO: Implement actual notification sending
        // await this.sendNotification(dose);
      }
    } catch (error) {
      console.error('Error checking upcoming doses:', error);
    }
  }

  // Method to send notifications (to be implemented based on notification preferences)
  async sendNotification(dose) {
    // This is a placeholder for the actual notification implementation
    // You could integrate with:
    // - Push notification services (Firebase, OneSignal, etc.)
    // - Email services (SendGrid, AWS SES, etc.)
    // - SMS services (Twilio, etc.)
    // - Calendar integration (Google Calendar API)
  }

  // Method to schedule a new dose
  async scheduleDose(medication, scheduledTime) {
    try {
      const dose = new Dose({
        user: medication.user,
        medication: medication._id,
        scheduledTime,
        status: 'scheduled'
      });

      await dose.save();
      return dose;
    } catch (error) {
      console.error('Error scheduling dose:', error);
      throw error;
    }
  }

  // Method to schedule all doses for a new medication
  async scheduleMedicationDoses(medication) {
    try {
      const doses = [];
      const currentDate = new Date(medication.startDate);
      const endDateTime = new Date(medication.endDate);

      while (currentDate <= endDateTime) {
        for (const time of medication.frequency.times) {
          const [hours, minutes] = time.split(':');
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          if (scheduledTime >= new Date(medication.startDate) && scheduledTime <= endDateTime) {
            doses.push({
              user: medication.user,
              medication: medication._id,
              scheduledTime,
              status: 'scheduled'
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      await Dose.insertMany(doses);
    } catch (error) {
      console.error('Error scheduling medication doses:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const reminderService = new ReminderService();

// Function to update dose statuses
const updateDoseStatuses = async () => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000); // 30 minutes ago

    // Find all scheduled doses that are past their time and not already marked as taken/late/missed
    const doses = await Dose.find({
      status: 'scheduled',
      scheduledTime: { $lt: now }
    }).populate('medication');

    let updatedCount = 0;
    for (const dose of doses) {
      const scheduledTime = new Date(dose.scheduledTime);
      const timeDiff = now - scheduledTime;
      const minutesLate = Math.floor(timeDiff / (1000 * 60));

      // If the dose is more than 30 minutes late, mark it as missed
      if (minutesLate > 30) {
        dose.status = 'missed';
        await dose.save();
        updatedCount++;
        console.log(`Marked dose as missed: ${dose.medication.name} scheduled for ${scheduledTime.toLocaleTimeString()}, ${minutesLate} minutes late`);
      } else {
        // If it's within 30 minutes, mark it as late
        dose.status = 'late';
        await dose.save();
        updatedCount++;
        console.log(`Marked dose as late: ${dose.medication.name} scheduled for ${scheduledTime.toLocaleTimeString()}, ${minutesLate} minutes late`);
      }
    }

    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} dose statuses`);
    }
  } catch (error) {
    console.error('Error updating dose statuses:', error);
  }
};

// Run the update every minute
setInterval(updateDoseStatuses, 60000);

module.exports = {
  reminderService,
  updateDoseStatuses
}; 