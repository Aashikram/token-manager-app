import { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FaIdBadge, FaUser, FaUsers, FaLock, FaExclamationCircle } from "react-icons/fa";

const teams = ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6", "Team 7"];

function SignUp() {
  const [empCode, setEmpCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [team, setTeam] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Check storage availability
  const checkStorageAvailability = () => {
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!checkStorageAvailability()) {
      setError("Local storage is disabled. Please enable it to use this application.");
      return;
    }

    // Validation
    if (!/^\d{6}$/.test(empCode)) {
      setError("Employee code must be exactly 6 digits.");
      return;
    }
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (!password.trim()) {
      setError("Password cannot be empty.");
      return;
    }
    if (!teams.includes(team)) {
      setError("Please select a valid team.");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("emp_code", "==", empCode));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setError("This employee code is already registered.");
        return;
      }

      // Add new user
      await addDoc(usersRef, {
        emp_code: empCode,
        name,
        password, // For production, hash this!
        team,
        role: ["129196", "129182", "129184", "996519", "134348", "128238", "135816", "136024", "996521", "996511", "996518", "134414", "996476", "134400"].includes(empCode) ? "captain" : "user",
        tokens: 100,
      });

      // Create token tracker document for the user
      const tokenTrackerRef = collection(db, "token_tracker");
      await addDoc(tokenTrackerRef, {
        emp_code: empCode,
        team: team,
        name: name,
        token_left: 100,
        token_spent: 0,
        games_played: 0
      });

      // Create attendance record
      const attendanceRef = doc(db, "attendance", empCode);
      await setDoc(attendanceRef, {
        emp_code: empCode,
        name: name,
        team: team,
        status: false,
        marked_by: "",
        timestamp: null
      });

      setSuccess("Sign up successful! You can now log in.");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (error) {
      console.error("Sign up error:", error);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-image">
          <img src="/logo.png" alt="Asian Paints Logo" />
        </div>
        <div className="login-form-box">
          <h2>Sign Up</h2>
          {error && (
            <div className="error-message">
              <FaExclamationCircle className="error-icon" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="success-message">
              <span>{success}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon"><FaIdBadge /></div>
              <input
                type="text"
                value={empCode}
                onChange={(e) => {
                  setEmpCode(e.target.value);
                  setError("");
                }}
                placeholder="Enter employee code"
                required
              />
            </div>
            <div className="form-group">
              <div className="input-icon"><FaUser /></div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Enter nickname"
                required
              />
            </div>
            <div className="form-group">
              <div className="input-icon"><FaLock /></div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="form-group">
              <div className="input-icon"><FaUsers /></div>
              <select
                value={team}
                onChange={(e) => {
                  setTeam(e.target.value);
                  setError("");
                }}
                required
                style={{ color: team === "" ? "#888888" : "#000000" }}
              >
                <option value="">Select a team</option>
                {teams.map((teamName) => (
                  <option key={teamName} value={teamName}>
                    {teamName}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="submit-button">Sign Up</button>
          </form>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            Already have an account?{" "}
            <span
              style={{ color: "#007bff", cursor: "pointer" }}
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp; 