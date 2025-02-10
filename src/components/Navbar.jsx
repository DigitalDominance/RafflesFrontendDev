// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Navbar = ({ wallet, onDisconnect }) => {
  const handleDisconnect = async () => {
    try {
      const origin = window.location.origin;
      await window.kasware.disconnect(origin);
      onDisconnect();
      console.log('Wallet disconnected');
    } catch (e) {
      console.error('Error disconnecting wallet:', e);
    }
  };

  return (
    <nav className="navbar">
      <div>
        <Link to="/">KASPA RAFFLES</Link>
      </div>
      <div>
        <Link to="/profile">My Raffles</Link>
        <Link to="/create">Create Raffle</Link>
        <button onClick={handleDisconnect}>Disconnect Wallet</button>
      </div>
    </nav>
  );
};

export default Navbar;
