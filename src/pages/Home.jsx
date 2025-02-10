// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [raffles, setRaffles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rafflesPerPage = 6;
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchRaffles = async () => {
    try {
      const res = await axios.get(`${apiUrl}/raffles`);
      if (res.data.success) {
        // Sort by currentEntries descending (or adjust as needed)
        const sorted = res.data.raffles.sort((a, b) => b.currentEntries - a.currentEntries);
        setRaffles(sorted);
      }
    } catch (err) {
      console.error('Error fetching raffles:', err);
    }
  };

  useEffect(() => {
    fetchRaffles();
    const interval = setInterval(fetchRaffles, 1000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const indexOfLast = currentPage * rafflesPerPage;
  const indexOfFirst = indexOfLast - rafflesPerPage;
  const currentRaffles = raffles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(raffles.length / rafflesPerPage);

  const getTimeLeft = (timeFrame, status) => {
    if (status === "completed") return "Completed";
    const diff = new Date(timeFrame) - new Date();
    if (diff <= 0) return "Completed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="home page-container">
      <h1 className="global-heading">Popular Raffles</h1>
      <div className="raffles-grid">
        {currentRaffles.map((raffle) => (
          <Link
            key={raffle.raffleId}
            to={`/raffle/${raffle.raffleId}`}
            className={`home-raffle-card ${raffle.status === "completed" ? "completed" : ""}`}
          >
            <h3>{raffle.prizeDisplay}</h3>
            {raffle.status === "live" ? (
              <>
                <p>Entries: {raffle.currentEntries.toFixed(2)}</p>
                <p>Winner Amount: {raffle.winnersCount}</p>
                <p>Time Remaining: {getTimeLeft(raffle.timeFrame, raffle.status)}</p>
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
    </div>
  );
};

export default Home;
