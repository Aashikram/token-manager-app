import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import "./Profile.css";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamPoints, setTeamPoints] = useState(0);
  const [tokenStats, setTokenStats] = useState({
    games_played: 0,
    token_spent: 0,
    token_left: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const empCode = localStorage.getItem("emp_code");
        if (!empCode) {
          setError("Employee code not found");
          setLoading(false);
          return;
        }

        const db = getFirestore();
        
        // Fetch token tracker data
        const trackerRef = collection(db, "token_tracker");
        const trackerQ = query(trackerRef, where("emp_code", "==", empCode));
        const trackerSnap = await getDocs(trackerQ);
        
        if (!trackerSnap.empty) {
          const trackerData = trackerSnap.docs[0].data();
          setTokenStats({
            games_played: trackerData.games_played || 0,
            token_spent: trackerData.token_spent || 0,
            token_left: trackerData.token_left || 0
          });
        } else {
          // If no tracker data exists, fetch from users collection
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("emp_code", "==", empCode));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const data = userDoc.data();
            setTokenStats({
              games_played: 0,
              token_spent: 0,
              token_left: data.tokens || 0
            });
          }
        }

        // Continue with existing user data fetch
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("emp_code", "==", empCode));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const data = userDoc.data();

          if (data.tokens !== undefined) {
            localStorage.setItem("tokens", data.tokens.toString());
          }

          setUserData({
            name: data.name || "Unknown User",
            team: data.team || "No Team",
            role: data.role || "Player",
            tokens: tokenStats.token_left || 0,
            points: data.points ?? 0,
          });

          // Fetch team name and points from teams collection
          if (data.team) {
            const teamDocRef = doc(db, "teams", data.team);
            const teamDocSnap = await getDoc(teamDocRef);
            if (teamDocSnap.exists()) {
              const teamDoc = teamDocSnap.data();
              setTeamName(teamDoc.name || data.team);
              setTeamPoints(teamDoc.Points || 0);
              console.log('Team doc snapshot:', { id: teamDocSnap.id, ...teamDoc });
            } else {
              setTeamName(data.team);
              setTeamPoints(0);
              setError("Your team was not found in the teams collection. Please contact admin.");
              setLoading(false);
              return;
            }
          } else {
            setTeamName("");
            setTeamPoints(0);
          }
        } else {
          setUserData({ 
            name: "Unknown User", 
            team: "No Team", 
            role: "Player", 
            tokens: 0, 
            points: 0,
          });
          setTeamName("");
          setTeamPoints(0);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        const empCode = localStorage.getItem("emp_code");
        if (!empCode) return;

        const db = getFirestore();
        const gamesRef = collection(db, "games");
        const q = query(gamesRef, where("emp_code", "==", empCode));
        const querySnapshot = await getDocs(q);

        const games = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            organisingTeam: data.organising_team,
            timestamp: data.timestamp?.toDate(),
            tokensSpent: data.tokens_spent
          };
        });
        // Sort games in descending order by timestamp (latest first)
        games.sort((a, b) => (b.timestamp?.getTime?.() || 0) - (a.timestamp?.getTime?.() || 0));
        setGameHistory(games);
      } catch (err) {
        console.error("Error fetching game history:", err);
      }
    };

    fetchGameHistory();
  }, []);

  const getInitials = (name) => {
    if (!name || name === "Unknown User") return "?";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getProgressColor = (value, max = 100) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "#10b981"; // Green
    if (percentage >= 50) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  if (loading) {
    return (
      <div className="profile-container" style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        minHeight: "400px"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            border: "4px solid rgba(102, 126, 234, 0.2)",
            borderTop: "4px solid #667eea",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>Loading your profile...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "1rem"
      }}>
        <div style={{ fontSize: "4rem" }}>⚠️</div>
        <h2 style={{ color: "#ef4444", marginBottom: "0.5rem" }}>Error</h2>
        <p style={{ color: "#6b7280" }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "50px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.3s ease"
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-container">
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👤</div>
        <h2 style={{ color: "#6b7280" }}>User not found</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      gap: "1.5rem", 
      padding: "1.5rem",
      maxWidth: "1600px",
      margin: "0 auto",
      height: "calc(100vh - 80px)",
      flexDirection: window.innerWidth <= 1024 ? "column" : "row",
      overflow: "hidden",
      position: "fixed",
      top: "80px",
      left: "0",
      right: "0",
      bottom: "0"
    }}>
      {/* Profile Section */}
      <div className="profile-container" style={{ 
        flex: 1,
        position: "relative",
        overflowY: "auto",
        maxWidth: window.innerWidth <= 1024 ? "100%" : "50%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        height: "100%",
        minHeight: 0,
        padding: "1rem",
        background: "linear-gradient(135deg, #fff7ae 0%, #ffb347 60%, #ff9800 100%)"
      }}>
        <div style={{width: "100%", maxWidth: "600px", margin: "0 auto"}}>
          <div className="profile-header" style={{
            marginBottom: "1.5rem",
            marginTop: "2.5rem",
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span style={{
              fontSize: "2.2rem",
              marginRight: "0.5rem",
              display: "inline-block",
              animation: "bounce 2s infinite"
            }}>👤</span> 
            <span style={{
              fontSize: "2.2rem",
              fontWeight: "800",
              background: "linear-gradient(135deg, #d6241f 0%, #ff9800 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "left"
            }}>My Profile</span>
          </div>
          {/* User Initial Circle Icon */}
          <div className="profile-avatar" style={{
            width: "90px",
            height: "90px",
            margin: "0 auto 2.5rem auto",
            background: "linear-gradient(135deg, #fff7ae 0%, #ffb347 60%, #ff9800 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: "700",
            color: "#d6241f",
            boxShadow: "0 8px 20px rgba(255, 152, 0, 0.2)",
            border: "4px solid white",
            transition: "transform 0.3s ease",
            cursor: "pointer"
          }}>
            {getInitials(userData.name)}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            width: "100%"
          }}>
            <div className="profile-item" style={{
              background: "white",
              padding: "1.2rem",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0
            }}>
              <strong style={{ 
                color: "#d6241f",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}>👋 Name</strong>
              <span style={{ 
                fontWeight: "600", 
                color: "#d6241f",
                fontSize: "1.1rem",
                wordBreak: "break-word"
              }}>{userData.name}</span>
            </div>
            <div className="profile-item" style={{
              background: "white",
              padding: "1.2rem",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0
            }}>
              <strong style={{ 
                color: "#d6241f",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}>🏢 Team</strong>
              <span style={{ 
                fontWeight: "600", 
                color: "#d6241f",
                fontSize: "1.1rem",
                wordBreak: "break-word"
              }}>{teamName || userData.team}</span>
            </div>
            <div className="profile-item" style={{
              background: "white",
              padding: "1.2rem",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0
            }}>
              <strong style={{ 
                color: "#d6241f",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}>🎯 Role</strong>
              <span className="badge" style={{
                display: "inline-block",
                padding: "0.4rem 0.8rem",
                background: "linear-gradient(135deg, #fff7ae 0%, #ffb347 60%, #ff9800 100%)",
                borderRadius: "2rem",
                color: "#d6241f",
                fontWeight: "600",
                fontSize: "0.9rem"
              }}>{userData.role}</span>
            </div>
            <div className="profile-item" style={{
              background: "white",
              padding: "1.2rem",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0
            }}>
              <strong style={{ 
                color: "#d6241f",
                fontSize: "1rem",
                marginBottom: "0.5rem"
              }}>🪙 Tokens</strong>
              <span className="badge" style={{
                display: "inline-block",
                padding: "0.4rem 0.8rem",
                background: `linear-gradient(135deg, ${getProgressColor(tokenStats.token_left)} 0%, ${getProgressColor(tokenStats.token_left)}dd 100%)`,
                borderRadius: "2rem",
                color: "white",
                fontWeight: "600",
                fontSize: "0.9rem"
              }}>{formatNumber(tokenStats.token_left)}</span>
            </div>
          </div>
          {/* Achievement section */}
          <div style={{
            marginTop: "1.5rem",
            padding: "1.2rem",
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(255, 152, 0, 0.1)",
            width: "100%"
          }}>
            <h3 style={{
              margin: "0 0 1rem 0",
              color: "#d6241f",
              fontSize: "1.1rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              🏆 Quick Stats
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              textAlign: "center"
            }}>
              <div style={{
                padding: "0.75rem",
                background: "linear-gradient(135deg, #fff7ae 0%, #ffb347 60%, #ff9800 100%)",
                borderRadius: "1rem",
                transition: "transform 0.2s ease",
                cursor: "pointer"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#d6241f" }}>
                  {tokenStats.games_played}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#d6241f", fontWeight: "500" }}>Games Played</div>
              </div>
              <div style={{
                padding: "0.75rem",
                background: "linear-gradient(135deg, #fff7ae 0%, #ffb347 60%, #ff9800 100%)",
                borderRadius: "1rem",
                transition: "transform 0.2s ease",
                cursor: "pointer"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#d6241f" }}>
                  {teamPoints}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#d6241f", fontWeight: "500" }}>Team Tokens</div>
              </div>
              <div style={{
                padding: "0.75rem",
                background: "linear-gradient(135deg, #fff7ae 0%, #ffb347 60%, #ff9800 100%)",
                borderRadius: "1rem",
                transition: "transform 0.2s ease",
                cursor: "pointer"
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#d6241f" }}>
                  {tokenStats.token_spent}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#d6241f", fontWeight: "500" }}>Tokens Spent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game History Section */}
      <div className="profile-container" style={{ 
        flex: 1,
        position: "relative",
        overflow: "hidden",
        maxWidth: window.innerWidth <= 1024 ? "100%" : "50%",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        height: "100%"
      }}>
        <div className="profile-header" style={{
          marginBottom: "1.5rem",
          position: "relative"
        }}>
          <span style={{
            fontSize: "2.2rem",
            marginRight: "0.5rem",
            display: "inline-block",
            animation: "bounce 2s infinite"
          }}>🎮</span> 
          <span style={{
            fontSize: "2.2rem",
            fontWeight: "800",
            background: "linear-gradient(135deg, #d6241f 0%, #ff9800 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Game History</span>
        </div>
        
        <div style={{ 
          flex: 1,
          overflowY: "auto",
          padding: "0.5rem",
          scrollbarWidth: "thin",
          scrollbarColor: "#ff9800 #f0f0f0",
          display: "grid",
          gridTemplateColumns: window.innerWidth <= 768 ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "0.75rem",
          alignContent: "start"
        }}>
          {gameHistory.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              color: "#666",
              padding: "3rem 2rem",
              background: "white",
              borderRadius: "1rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              gridColumn: "1 / -1"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎮</div>
              <h3 style={{ 
                color: "#d6241f",
                marginBottom: "0.5rem",
                fontSize: "1.2rem"
              }}>No Games Yet</h3>
              <p style={{ color: "#666" }}>Start playing to see your game history here!</p>
            </div>
          ) : (
            gameHistory.map((game, index) => (
              <div key={index} style={{
                background: "white",
                padding: "1.2rem",
                borderRadius: "1rem",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }} onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 8px 15px rgba(0, 0, 0, 0.1)";
              }} 
                 onMouseLeave={(e) => {
                   e.target.style.transform = "translateY(0)";
                   e.target.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
                 }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.1)"
                }}>
                  <strong style={{ color: "#666", fontSize: "0.9rem" }}>Team</strong>
                  <span style={{ 
                    color: "#d6241f",
                    fontWeight: "600",
                    fontSize: "1.1rem"
                  }}>{game.organisingTeam}</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.1)"
                }}>
                  <strong style={{ color: "#666", fontSize: "0.9rem" }}>Time</strong>
                  <span style={{ 
                    color: "#d6241f",
                    fontWeight: "600",
                    fontSize: "1.1rem"
                  }}>{game.timestamp?.toLocaleTimeString()}</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between"
                }}>
                  <strong style={{ color: "#666", fontSize: "0.9rem" }}>Tokens</strong>
                  <span style={{ 
                    color: "#d6241f",
                    fontWeight: "600",
                    fontSize: "1.1rem"
                  }}>{game.tokensSpent}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

export default Profile;