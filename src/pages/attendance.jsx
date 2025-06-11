import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import "./attendance.css";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";

export default function Attendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isTimeValid, setIsTimeValid] = useState(false);
  const [hasMarkedAttendance, setHasMarkedAttendance] = useState(false);

  const user = {
    name: localStorage.getItem("name"),
    emp_code: localStorage.getItem("emp_code"),
    team: localStorage.getItem("team"),
  };

  // Check if current time is between 1:30 PM and 10:30 PM
  const checkTimeValidity = () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Convert to 24-hour format for comparison
      const startTime = 13.5; // 1:30 PM
      const endTime = 22.5;   // 10:30 PM
      const currentTime = currentHour + (currentMinute / 60);

      return currentTime >= startTime && currentTime <= endTime;
    } catch (error) {
      console.error("Error checking time validity:", error);
      return false;
    }
  };

  // Check if user has already marked attendance today
  const checkExistingAttendance = async () => {
    try {
      if (!user.emp_code) {
        console.error("No employee code found");
        return false;
      }

      // Get the user's attendance document
      const attendanceDocRef = doc(db, "attendance", user.emp_code);
      const attendanceDoc = await getDoc(attendanceDocRef);

      if (attendanceDoc.exists()) {
        const data = attendanceDoc.data();
        // Check if the status is true and the date is today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendanceDate = data.date.toDate();
        attendanceDate.setHours(0, 0, 0, 0);

        // If the date is not today, we can mark attendance
        if (attendanceDate.getTime() !== today.getTime()) {
          // Update the document with new date and status
          await setDoc(attendanceDocRef, {
            ...data,
            date: Timestamp.now(),
            status: false
          });
          return false;
        }

        return data.status;
      }

      return false;
    } catch (error) {
      console.error("Error checking existing attendance:", error);
      setError("Failed to check attendance status. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    const validateAttendance = async () => {
      try {
        console.log("Starting attendance validation...");
        const timeValid = checkTimeValidity();
        console.log("Time validity:", timeValid);
        setIsTimeValid(timeValid);

        const hasAttended = await checkExistingAttendance();
        console.log("Has attended:", hasAttended);
        setHasMarkedAttendance(hasAttended);

        if (hasAttended) {
          setError("You have already marked your attendance for today.");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in validateAttendance:", error);
        setError("Failed to load attendance information. Please try again.");
        setLoading(false);
      }
    };

    validateAttendance();
  }, []);

  // Countdown effect for redirect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate("/dashboard");
    }
  }, [success, countdown, navigate]);

  const handleMarkAttendance = async () => {
    if (!isTimeValid) {
      setError("Attendance can only be marked between 1:30 PM and 10:30 PM.");
      return;
    }

    if (hasMarkedAttendance) {
      setError("You have already marked your attendance for today.");
      return;
    }

    try {
      console.log("Starting attendance marking process...");
      
      // Create or update the user's attendance document
      const attendanceDocRef = doc(db, "attendance", user.emp_code);
      const attendanceData = {
        emp_code: user.emp_code,
        name: user.name,
        team: user.team,
        timestamp: Timestamp.now(),
        date: Timestamp.now(),
        status: true
      };

      console.log("Setting attendance record:", attendanceData);
      await setDoc(attendanceDocRef, attendanceData);
      console.log("Attendance marked successfully");

      setSuccess(true);
      setCountdown(10);
    } catch (error) {
      console.error("Detailed error marking attendance:", error);
      setError(`Failed to mark attendance: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading attendance info...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="attendance-page">
        <h2>📝 Daily Attendance</h2>
        
        {error && (
          <div className="error-message">
            <FaExclamationCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <>
            <div className="success-message">
              <FaCheckCircle className="success-icon" />
              <div className="success-content">
                <h3>Attendance Marked Successfully!</h3>
                <p>Thank you for marking your attendance.</p>
              </div>
            </div>
            <div className="redirect-message">
              <FaInfoCircle className="info-icon" />
              <span>Redirecting to dashboard in {countdown} seconds...</span>
            </div>
          </>
        )}

        {!success && (
          <>
            <div className="attendance-info">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Employee Code:</strong> {user.emp_code}</p>
              <p><strong>Team:</strong> {user.team}</p>
              <p><strong>Status:</strong> {hasMarkedAttendance ? "Already marked" : "Not marked"}</p>
              <p><strong>Time Window:</strong> 1:30 PM - 10:30 PM</p>
            </div>

            <div className="attendance-actions">
              <button 
                onClick={handleMarkAttendance}
                disabled={!isTimeValid || hasMarkedAttendance}
                style={{
                  opacity: (!isTimeValid || hasMarkedAttendance) ? 0.5 : 1,
                  cursor: (!isTimeValid || hasMarkedAttendance) ? "not-allowed" : "pointer",
                  backgroundColor: hasMarkedAttendance ? "#6c757d" : "#28a745"
                }}
              >
                {hasMarkedAttendance ? "Already Marked" : "Mark Attendance"}
              </button>
              <button 
                onClick={() => navigate("/dashboard")}
                style={{ background: "#eee", color: "#d6241f", border: "1px solid #d6241f" }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 