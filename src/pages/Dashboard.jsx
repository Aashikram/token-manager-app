import "./dashboard.css";
import { useState, useEffect } from "react";
import { FaTrophy, FaUsers, FaUserAlt, FaMedal } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // Adjust this path if needed

function LeaderboardCard({ rank, name, points, team, type }) {
  const rankIcons = ["🥇", "🥈", "🥉"];
  const colorClasses = ["gold", "silver", "bronze"];

  return (
    <div className={`leaderboard-entry ${colorClasses[rank - 1] || ""}`}>
      <div className="rank-tag">
        {rank <= 3 ? (
          <FaMedal className={`medal-icon ${colorClasses[rank - 1]}`} />
        ) : (
          <span className="rank-number">#{rank}</span>
        )}
      </div>
      <div className="leaderboard-details">
        <strong>{name}</strong>
        {type === "individual" && <span className="team-name"> {team}</span>}
      </div>
      <div className="points">
        {points} <span>Tokens</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [teamLeaderboard, setTeamLeaderboard] = useState([]);
  const [individualLeaderboard, setIndividualLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch team leaderboard
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const teamsRef = collection(db, "teams");
        const snapshot = await getDocs(teamsRef);
        const teamsArray = snapshot.docs.map((doc) => ({
          team: doc.id,
          points: doc.data().Points || 0,
        }));
        teamsArray.sort((a, b) => b.points - a.points);
        setTeamLeaderboard(teamsArray);
      } catch (error) {
        console.error("Error fetching team leaderboard:", error);
      }
    };

    fetchTeamData();
  }, []);

  // Fetch individual leaderboard
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const tokenTrackerRef = collection(db, "token_tracker");
        const snapshot = await getDocs(tokenTrackerRef);
        const usersArray = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            name: data.name,
            team: data.team_number,
            points: data.token_spent || 0,
          };
        });
        usersArray.sort((a, b) => b.points - a.points);
        setIndividualLeaderboard(usersArray);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching individual leaderboard:", error);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-spinner">Loading leaderboards...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1 className="dashboard-heading">
          <FaTrophy className="trophy-icon" />
          Aarohan Scoreboard
        </h1>
        <p className="subheading">Track your team's performance and individual achievements</p>
      </div>

      <div className="leaderboards">
        <div className="leaderboard-section">
          <div className="section-header">
            <h2>
              <FaUsers className="section-icon" /> Team Leaderboard
            </h2>
            <span className="total-count">{teamLeaderboard.length} Teams</span>
          </div>
          <div className="leaderboard-container">
            <div className="leaderboard-box">
              {teamLeaderboard.map((team, idx) => (
                <LeaderboardCard
                  key={team.team}
                  rank={idx + 1}
                  name={team.team}
                  points={team.points}
                  type="team"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="leaderboard-section">
          <div className="section-header">
            <h2>
              <FaUserAlt className="section-icon" /> Individual Leaderboard
            </h2>
            <span className="total-count">{individualLeaderboard.length} Players</span>
          </div>
          <div className="leaderboard-container">
            <div className="leaderboard-box">
              {individualLeaderboard.map((person, idx) => (
                <LeaderboardCard
                  key={person.name + person.team}
                  rank={idx + 1}
                  name={person.name}
                  team={person.team}
                  points={person.points}
                  type="individual"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <div className="stat-box violet">
          <div className="stat-content">
            <p>Total Teams</p>
            <strong>{teamLeaderboard.length}</strong>
          </div>
          <FaUsers className="stat-icon" />
        </div>
        <div className="stat-box green">
          <div className="stat-content">
            <p>Total Players</p>
            <strong>{individualLeaderboard.length}</strong>
          </div>
          <FaUserAlt className="stat-icon" />
        </div>
        <div className="stat-box orange">
          <div className="stat-content">
            <p>Highest Score</p>
            <strong>
              {teamLeaderboard.length > 0 ? teamLeaderboard[0].points : 0}
            </strong>
          </div>
          <FaTrophy className="stat-icon" />
        </div>
      </div>
    </div>
  );
}
