import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { FaIdBadge, FaUser, FaUsers, FaExclamationCircle, FaLock } from "react-icons/fa";

// ✅ Declare team list
const teams = ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6", "Team 7"];

function Login({ onLogin }) {
  const [empCode, setEmpCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // ✅ Auto-login if session exists
  useEffect(() => {
    if (!checkStorageAvailability()) {
      setError("Local storage is disabled. Please enable it to use this application.");
      return;
    }

    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    setIsLoading(true);

    if (!checkStorageAvailability()) {
      setError("Local storage is disabled. Please enable it to use this application.");
      setIsLoading(false);
      return;
    }

    // Basic validation
    if (!/^\d{6}$/.test(empCode)) {
      setError("Employee code must be exactly 6 digits.");
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError("Password cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("emp_code", "==", empCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("Employee code not found. Please sign up.");
        setIsLoading(false);
        return;
      }

      const user = snapshot.docs[0].data();
      if (user.password !== password) {
        setError("Incorrect password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful login - store data safely
      try {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("emp_code", empCode);
        localStorage.setItem("name", user.name);
        localStorage.setItem("team", user.team);
        localStorage.setItem("role", user.role);
        if (onLogin) onLogin();
        navigate("/dashboard", { replace: true });
      } catch (storageError) {
        console.error("Storage error:", storageError);
        setError("Failed to save login information. Please check your browser settings.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-image">
          <img src="/logo.png" alt="Asian Paints Logo" />
        </div>

        <div className="login-form-box">
          <h2>Login</h2>
          {error && (
            <div className="error-message">
              <FaExclamationCircle className="error-icon" />
              <span>{error}</span>
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
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                "Login"
              )}
            </button>
          </form>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            Don't have an account?{" "}
            <span
              style={{ color: "#007bff", cursor: "pointer" }}
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
