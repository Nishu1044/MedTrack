const Dose = require('../models/Dose');
const Medication = require('../models/Medication');

class DoseTrackingService {
  /**
   * Generate all scheduled doses for a medication between start and end date
   * @param {Object} medication - The medication object
   * @returns {Array} Array of scheduled dose objects
   */
  async generateScheduledDoses(medication) {
    const scheduledDoses = [];
    const currentDate = new Date(medication.startDate);
    const endDateTime = new Date(medication.endDate);

    while (currentDate <= endDateTime) {
      for (const time of medication.frequency.times) {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (scheduledTime >= new Date(medication.startDate) && scheduledTime <= endDateTime) {
          scheduledDoses.push({
            user: medication.user,
            medication: medication._id,
            scheduledTime,
            status: 'scheduled'
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return scheduledDoses;
  }

  /**
   * Check if a dose was taken within the allowed window
   * @param {Date} scheduledTime - The scheduled time for the dose
   * @param {Date} takenTime - The actual time the dose was taken
   * @param {number} windowHours - The allowed window in hours (default: 4)
   * @returns {boolean} Whether the dose was taken within the window
   */
  isDoseTakenWithinWindow(scheduledTime, takenTime, windowHours = 4) {
    if (!takenTime) return false;
    
    const windowStart = new Date(scheduledTime);
    windowStart.setHours(scheduledTime.getHours() - windowHours);
    
    const windowEnd = new Date(scheduledTime);
    windowEnd.setHours(scheduledTime.getHours() + windowHours);
    
    return takenTime >= windowStart && takenTime <= windowEnd;
  }

  /**
   * Calculate missed doses for a medication
   * @param {string} medicationId - The ID of the medication
   * @param {string} userId - The ID of the user
   * @returns {Object} Object containing missed dose statistics
   */
  async calculateMissedDoses(medicationId, userId) {
    try {
      // Get the medication
      const medication = await Medication.findOne({ _id: medicationId, user: userId });
      if (!medication) {
        throw new Error('Medication not found');
      }

      // Get all actual logged doses for this medication
      const loggedDoses = await Dose.find({
        medication: medicationId,
        user: userId
      }).sort({ scheduledTime: 1 });

      // Generate all scheduled doses
      const scheduledDoses = await this.generateScheduledDoses(medication);

      // Initialize statistics
      const stats = {
        totalScheduled: scheduledDoses.length,
        totalMissed: 0,
        missedByDay: {},
        adherenceRate: 0
      };

      // Process each scheduled dose
      for (const scheduledDose of scheduledDoses) {
        const scheduledDate = scheduledDose.scheduledTime.toISOString().split('T')[0];
        
        // Find if there's a logged dose for this scheduled time
        const loggedDose = loggedDoses.find(dose => 
          this.isDoseTakenWithinWindow(scheduledDose.scheduledTime, dose.takenTime)
        );

        if (!loggedDose) {
          // Count as missed
          stats.totalMissed++;
          stats.missedByDay[scheduledDate] = (stats.missedByDay[scheduledDate] || 0) + 1;
        }
      }

      // Calculate adherence rate
      stats.adherenceRate = ((stats.totalScheduled - stats.totalMissed) / stats.totalScheduled) * 100;

      return stats;
    } catch (error) {
      console.error('Error calculating missed doses:', error);
      throw error;
    }
  }

  /**
   * Get missed doses for all medications of a user
   * @param {string} userId - The ID of the user
   * @returns {Object} Object containing missed dose statistics for all medications
   */
  async getAllMissedDoses(userId) {
    try {
      const medications = await Medication.find({ user: userId });
      const results = {
        totalMissed: 0,
        medications: {}
      };

      for (const medication of medications) {
        const stats = await this.calculateMissedDoses(medication._id, userId);
        results.medications[medication.name] = stats;
        results.totalMissed += stats.totalMissed;
      }

      return results;
    } catch (error) {
      console.error('Error getting all missed doses:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const doseTrackingService = new DoseTrackingService();

module.exports = doseTrackingService; 