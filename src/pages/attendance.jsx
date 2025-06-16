import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import "./attendance.css";
import { FaCheckCircle, FaExclamationCircle, FaUserCheck, FaUserTimes } from "react-icons/fa";

export default function Attendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [presentCount, setPresentCount] = useState(0);

  const user = {
    name: localStorage.getItem("name"),
    emp_code: localStorage.getItem("emp_code"),
    team: localStorage.getItem("team"),
    role: localStorage.getItem("role"),
  };

  const fetchTeamMembers = async () => {
    try {
      // 1. Get all users in the captain's team
      const usersQuery = query(
        collection(db, "users"),
        where("team", "==", user.team)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const teamEmpCodes = usersSnapshot.docs.map(doc => doc.data().emp_code);
      
      // 2. Get attendance records for these users
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("emp_code", "in", teamEmpCodes)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      // 3. Filter and count
      const members = [];
      let present = 0;
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        const attendanceDoc = attendanceSnapshot.docs.find(doc => doc.data().emp_code === userData.emp_code);
        
        if (attendanceDoc?.data()?.status === true) {
          present++;
        } else if (!attendanceDoc || attendanceDoc.data().status === false) {
          members.push({ 
            id: userDoc.id, 
            ...userData 
          });
        }
      });
      
      setTeamMembers(members);
      setPresentCount(present);
    } catch (error) {
      setError("Failed to load team members");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === "captain" || user.role === "admin") {
      fetchTeamMembers();
    } else {
      navigate("/dashboard");
    }
  }, [user.role, user.team]);

  const handleMarkAttendance = async (memberId) => {
    try {
      setLoading(true);
      const member = teamMembers.find((m) => m.id === memberId);
      
      const attendanceRef = doc(db, "attendance", member.emp_code);
      await setDoc(attendanceRef, {
        emp_code: member.emp_code,
        name: member.name,
        team: member.team,
        status: true,
        timestamp: Timestamp.now(),
        marked_by: user.emp_code,
      }, { merge: true });

      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      setPresentCount(prev => prev + 1);
      setSuccess(true);
    } catch (error) {
      setError("Failed to mark attendance");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const absentCount = teamMembers.length;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="attendance-page">
        <h2>📝 Team Attendance</h2>

        {error && (
          <div className="error-message">
            <FaExclamationCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <FaCheckCircle className="success-icon" />
            <span>Attendance marked successfully!</span>
          </div>
        )}

        <div className="status-cards">
          <div className="status-card present">
            <FaUserCheck className="status-icon" />
            <span>Present: {presentCount}</span>
          </div>
          <div className="status-card absent">
            <FaUserTimes className="status-icon" />
            <span>Absent: {absentCount}</span>
          </div>
        </div>

        <div className="table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee Code</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.emp_code}</td>
                  <td>
                    <button 
                      onClick={() => handleMarkAttendance(member.id)}
                      disabled={loading}
                      className="mark-button"
                    >
                      {loading ? "Processing..." : "Mark Attendance"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="attendance-actions">
          <button 
            onClick={() => navigate("/dashboard")}
            className="back-button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 