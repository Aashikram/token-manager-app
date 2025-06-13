const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.resetAttendanceAtMidnight = functions.pubsub
  .schedule("0 0 * * *") // Runs at midnight UTC
  .timeZone("UTC") // Adjust to your timezone (e.g., "Asia/Kolkata")
  .onRun(async (context) => {
    try {
      const attendanceRef = admin.firestore().collection("attendance");
      const snapshot = await attendanceRef.get();
      const batch = admin.firestore().batch();

      snapshot.forEach((doc) => {
        batch.update(doc.ref, { 
          status: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(), // Optional: Update timestamp
          marked_by: null // Optional: Clear marked_by
        });
      });

      await batch.commit();
      console.log("✅ Attendance reset at midnight.");
    } catch (error) {
      console.error("❌ Error resetting attendance:", error);
    }
  });
