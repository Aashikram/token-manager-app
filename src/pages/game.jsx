import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";
import "./game.css";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";

export default function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const organisingTeam = queryParams.get("team");

  const user = {
    name: localStorage.getItem("name"),
    emp_code: localStorage.getItem("emp_code"),
    team: localStorage.getItem("team"),
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [tokenCost, setTokenCost] = useState(10);
  const [tokenLeft, setTokenLeft] = useState(null);
  const TOKEN_COST = 10;

  // Clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!organisingTeam || !user.emp_code) return;

    const fetchPreviousGames = async () => {
      const trackerRef = collection(db, "token_tracker");
      const trackerQ = query(trackerRef, where("emp_code", "==", user.emp_code));
      const trackerSnap = await getDocs(trackerQ);
      if (!trackerSnap.empty) {
        const trackerData = trackerSnap.docs[0].data();
        setTokenLeft(parseInt(trackerData.token_left));
      } else {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("emp_code", "==", user.emp_code));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setTokenLeft(parseInt(userData.tokens) || 0);
        }
      }
      setLoading(false);
    };

    fetchPreviousGames();
  }, [organisingTeam, user.emp_code, navigate]);

  // Countdown effect
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

  const handleCancel = () => {
    navigate("/dashboard");
  };

  const handleSubmit = async () => {
    if (!organisingTeam) {
      setError("Organising team not specified in the QR code.");
      return;
    }

    if (user.team === organisingTeam) {
      setError("You cannot play against your own team!");
      return;
    }

    if (tokenLeft === null || tokenLeft < tokenCost) {
      setError(`Insufficient tokens. You need ${tokenCost} tokens to play this game.`);
      return;
    }

    try {
      const trackerRef = collection(db, "token_tracker");
      const trackerQ = query(trackerRef, where("emp_code", "==", user.emp_code));
      const trackerSnap = await getDocs(trackerQ);
      
      if (trackerSnap.empty) {
        setError("User token tracker not found. Please contact support.");
        return;
      }

      const trackerDoc = trackerSnap.docs[0];
      const trackerData = trackerDoc.data();
      const currentTokenLeft = parseInt(trackerData.token_left) || 0;
      
      if (currentTokenLeft < tokenCost) {
        setError(`Insufficient tokens. You only have ${currentTokenLeft} left.`);
        return;
      }

      await updateDoc(trackerDoc.ref, {
        games_played: (trackerData.games_played || 0) + 1,
        token_spent: (parseInt(trackerData.token_spent) || 0) + tokenCost,
        token_left: currentTokenLeft - tokenCost
      });
      setTokenLeft(currentTokenLeft - tokenCost);

      await addDoc(collection(db, "games"), {
        emp_code: user.emp_code,
        name: user.name,
        playing_team: user.team,
        organising_team: organisingTeam,
        tokens_spent: tokenCost,
        timestamp: Timestamp.now(),
        points: 0,
        approved: false
      });

      // Update the organising team's Points in the teams collection
      const organisingTeamDocRef = doc(db, "teams", organisingTeam);
      const organisingTeamDocSnap = await getDoc(organisingTeamDocRef);
      if (organisingTeamDocSnap.exists()) {
        const currentPoints = organisingTeamDocSnap.data().Points || 0;
        await updateDoc(organisingTeamDocRef, {
          Points: currentPoints + tokenCost
        });
      } else {
        await setDoc(organisingTeamDocRef, {
          Points: tokenCost
        });
      }

      setSuccessData({
        tokensDeducted: tokenCost,
        remainingBalance: (currentTokenLeft - tokenCost),
        team: organisingTeam
      });
      setSuccess(true);
      setCountdown(10);

    } catch (error) {
      console.error("Error submitting game:", error);
      setError("Failed to submit game. Please try again.");
    }
  };

  if (loading) return <div className="loading">Loading game info...</div>;

  return (
    <div className="game-page">
      <h2>🎮 Game Submission</h2>
      
      {error && (
        <div className="error-message">
          <FaExclamationCircle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {success && successData && (
        <>
          <div className="success-message">
            <FaCheckCircle className="success-icon" />
            <div className="success-content">
              <h3>Game Submitted Successfully!</h3>
              <p>Tokens deducted: {successData.tokensDeducted}</p>
              <p>Remaining balance: {successData.remainingBalance}</p>
              <p>Playing against: {successData.team}</p>
            </div>
          </div>
          <div className="redirect-message">
            <FaInfoCircle className="info-icon" />
            <span>Please do not refresh. Redirecting to dashboard in {countdown} seconds...</span>
          </div>
        </>
      )}

      {!success && (
        <>
          <div className="game-info">
            <p><strong>My Team:</strong> {user.team}</p>
            <p><strong>Organising Team:</strong> {organisingTeam || "Not specified"}</p>
            <p><strong>Remaining Tokens:</strong> {tokenLeft !== null ? tokenLeft : (localStorage.getItem("tokens") || "?")}</p>
            <p><strong>Token Cost:</strong> {tokenCost}</p>
          </div>

          <div style={{ margin: "1rem 0" }}>
            <label htmlFor="token-cost-select"><strong>Select Token Cost:</strong> </label>
            <select
              id="token-cost-select"
              value={tokenCost}
              onChange={e => setTokenCost(Number(e.target.value))}
              style={{ marginLeft: 8, padding: 4, color: "black" }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={handleSubmit}>Submit Game</button>
            <button onClick={handleCancel} style={{ background: "#eee", color: "#d6241f", border: "1px solid #d6241f" }}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
