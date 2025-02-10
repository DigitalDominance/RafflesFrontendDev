// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [myRaffles, setMyRaffles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rafflesPerPage = 6;
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const getConnectedAddress = async () => {
    try {
      const accounts = await window.kasware.getAccounts();
      return accounts[0];
    } catch (error) {
      console.error('Error fetching connected account:', error);
      return null;
    }
  };

  const fetchMyRaffles = async () => {
    try {
      const currentAddress = await getConnectedAddress();
      if (!currentAddress) return;
      
      const res = await axios.get(`${apiUrl}/raffles?creator=${currentAddress}`);
      if (res.data.success) {
        const live = res.data.raffles.filter(r => r.status === 'live');
        const completed = res.data.raffles.filter(r => r.status !== 'live');

        live.sort((a, b) => new Date(a.timeFrame) - new Date(b.timeFrame));
        completed.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        const sortedRaffles = [...live, ...completed];
        setMyRaffles(sortedRaffles);
      }
    } catch (err) {
      console.error('Error fetching user raffles:', err);
    }
  };

  useEffect(() => {
    fetchMyRaffles();
  }, [apiUrl]);

  const indexOfLast = currentPage * rafflesPerPage;
  const indexOfFirst = indexOfLast - rafflesPerPage;
  const currentRaffles = myRaffles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(myRaffles.length / rafflesPerPage);

  return (
    <div className="profile-page page-container">
      <h1 className="global-heading">My Raffles</h1>
      {myRaffles.length === 0 ? (
        <p>You haven't created any raffles yet.</p>
      ) : (
        <>
          <div className="raffles-grid">
            {currentRaffles.map((raffle) => (
              <Link
                key={raffle.raffleId}
                to={`/raffle/${raffle.raffleId}`}
                className={`profile-raffle-card ${raffle.status === "completed" ? "completed" : ""}`}
              >
                <h3>{raffle.prizeDisplay}</h3>
                {raffle.status === "live" ? (
                  <>
                    <p>Entries: {raffle.currentEntries.toFixed(2)}</p>
                    <p>Winners: {raffle.winnersCount}</p>
                    <p>Time Left: {new Date(raffle.timeFrame).toLocaleString()}</p>
                  </>
                ) : (
                  <>
                    {raffle.winnersCount > 1 ? (
                      <p>Winners: View Here</p>
                    ) : (
                      <p>Winner: {raffle.winner ? raffle.winner : "No Entries"}</p>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
