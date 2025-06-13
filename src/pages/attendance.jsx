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
} from "firebase/firestore";
import { db } from "../firebase";
import "./attendance.css";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function Attendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const user = {
    name: localStorage.getItem("name"),
    emp_code: localStorage.getItem("emp_code"),
    team: localStorage.getItem("team"),
    role: localStorage.getItem("role"),
  };

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("team", "==", user.team)
        );
        const querySnapshot = await getDocs(q);
        const members = [];
        querySnapshot.forEach((doc) => {
          members.push({ id: doc.id, ...doc.data() });
        });
        setTeamMembers(members);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching team members:", error);
        setError("Failed to load team members");
        setLoading(false);
      }
    };

    if (user.role === "captain") {
      fetchTeamMembers();
    } else {
      navigate("/dashboard");
    }
  }, [user.role, user.team, navigate]);

  const handleSelectMember = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleMarkAttendance = async () => {
    if (selectedMembers.length === 0) {
      setError("Please select at least one team member");
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);

      selectedMembers.forEach((memberId) => {
        const member = teamMembers.find((m) => m.id === memberId);
        const attendanceRef = doc(db, "attendance", memberId);
        batch.set(attendanceRef, {
          emp_code: memberId,
          name: member.name,
          team: member.team,
          status: true,
          timestamp: Timestamp.now(),
          marked_by: user.emp_code,
        });
      });

      await batch.commit();
      setSuccess(true);
      setSelectedMembers([]);
      setError("");
      setLoading(false);
    } catch (error) {
      console.error("Error marking attendance:", error);
      setError("Failed to mark attendance");
      setLoading(false);
    }
  };

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
            <span>Attendance marked successfully for {selectedMembers.length} members!</span>
          </div>
        )}

        <div className="team-members-list">
          <h3>Team: {user.team}</h3>
          <table className="members-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Name</th>
                <th>Employee Code</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleSelectMember(member.id)}
                    />
                  </td>
                  <td>{member.name}</td>
                  <td>{member.emp_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="attendance-actions">
          <button
            onClick={handleMarkAttendance}
            disabled={selectedMembers.length === 0 || loading}
          >
            {loading ? "Processing..." : "Mark Attendance for Selected"}
          </button>
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
} 