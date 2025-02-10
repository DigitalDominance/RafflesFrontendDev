// frontend/src/components/WalletConnectLanding.jsx
import React from 'react';
import '../styles.css';
import Footer from './Footer';

const WalletConnectLanding = ({ onConnect }) => {
  const handleConnect = async () => {
    if (window.kasware) {
      try {
        const accounts = await window.kasware.requestAccounts();
        console.log("Connected wallet:", accounts[0]);
        onConnect({ address: accounts[0] });
      } catch (err) {
        console.error('Error connecting wallet:', err);
      }
    } else {
      alert('Please install KasWare Wallet');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1 className="landing-heading">KASPA RAFFLES</h1>
        <h3 className="landing-subheading">Connect wallet to login</h3>
      </div>
      <div className="landing-middle">
        <button className="landing-button" onClick={handleConnect}>
          Connect Wallet
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default WalletConnectLanding;
