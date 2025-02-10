// frontend/src/pages/CreateRaffle.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateRaffle = ({ wallet }) => {
  const [raffleType, setRaffleType] = useState('KAS');
  const [tokenTicker, setTokenTicker] = useState('');
  const [timeFrame, setTimeFrame] = useState('');
  const [creditConversion, setCreditConversion] = useState('');
  const [prizeType, setPrizeType] = useState('KAS');
  const [prizeTicker, setPrizeTicker] = useState(''); // for KRC20 prize
  const [prizeAmount, setPrizeAmount] = useState('');
  // New state for winners count – only allow numbers.
  const [winnersCount, setWinnersCount] = useState(1);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Treasury wallet from environment variable
  const treasuryWallet = process.env.REACT_APP_TREASURY_WALLET;

  // Check the host's balance before initiating the prize transaction.
  const checkPrizeBalance = async () => {
    if (prizeType === 'KAS') {
      try {
        const balance = await window.kasware.getBalance();
        // Multiply prizeAmount (in plain KAS) by 1e8 to get required sompi.
        const required = parseFloat(prizeAmount) * 1e8;
        if (balance.total < required) {
          setConfirmError('Insufficient KAS balance in your wallet.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking KAS balance:', err);
        setConfirmError('Error checking KAS balance.');
        return false;
      }
    } else {
      try {
        const tokenBalances = await window.kasware.getKRC20Balance();
        const tokenObj = tokenBalances.find(
          (token) => token.tick.toUpperCase() === prizeTicker.trim().toUpperCase()
        );
        if (!tokenObj) {
          setConfirmError(`Token ${prizeTicker.trim().toUpperCase()} not found in your wallet.`);
          return false;
        }
        const dec = parseInt(tokenObj.dec, 10);
        const required = parseFloat(prizeAmount) * Math.pow(10, dec);
        if (parseInt(tokenObj.balance, 10) < required) {
          setConfirmError('Insufficient token balance in your wallet.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking token balance:', err);
        setConfirmError('Error checking token balance.');
        return false;
      }
    }
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();
    const minTime = new Date(now + 24 * 60 * 60 * 1000);
    const maxTime = new Date(now + 5 * 24 * 60 * 60 * 1000);
    const selectedTime = new Date(timeFrame);

    if (selectedTime < minTime) {
      setConfirmError("Raffle must last at least 24 hours from now.");
      return;
    }
    if (selectedTime > maxTime) {
      setConfirmError("Raffle duration must not exceed 5 days.");
      return;
    }

    if (!timeFrame || !creditConversion || !prizeAmount) {
      setConfirmError('Please fill all required fields.');
      return;
    }
    if (raffleType === 'KRC20' && !tokenTicker) {
      setConfirmError('Please provide a token ticker for the raffle deposit.');
      return;
    }
    if (prizeType === 'KRC20' && !prizeTicker) {
      setConfirmError('Please provide a token ticker for the prize.');
      return;
    }
    // Validate winnersCount input: ensure it is a positive number and does not exceed 5.
    if (!winnersCount || isNaN(winnersCount) || winnersCount < 1) {
      setConfirmError('Please enter a valid number of winners (must be at least 1).');
      return;
    }
    if (winnersCount > 5) {
      setConfirmError('Maximum allowed winners is 5.');
      return;
    }
    // Check funds before proceeding.
    const hasFunds = await checkPrizeBalance();
    if (!hasFunds) return;

    setConfirmError('');
    setShowConfirmModal(true);
  };

  // Handle prize confirmation using KasWare.
  const handleConfirmPrize = async () => {
    setConfirmError('');
    const hasFunds = await checkPrizeBalance();
    if (!hasFunds) return;
    
    setConfirming(true);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    let txid;
    try {
      if (prizeType === 'KAS') {
        txid = await window.kasware.sendKaspa(treasuryWallet, parseFloat(prizeAmount) * 1e8);
      } else if (prizeType === 'KRC20') {
        const transferJson = JSON.stringify({
          p: "KRC-20",
          op: "transfer",
          tick: prizeTicker.trim().toUpperCase(),
          amt: (parseFloat(prizeAmount) * 1e8).toString(),
          to: treasuryWallet,
        });
        txid = await window.kasware.signKRC20Transaction(transferJson, 4, treasuryWallet);
      }
      if (!txid) {
        setConfirmError("Transaction was cancelled or failed. Raffle not created.");
        setConfirming(false);
        return;
      }
      console.log("Prize transaction sent, txid:", txid);
      // Create the raffle on the backend with the prize TXID.
      const payload = {
        type: raffleType,
        timeFrame: new Date(timeFrame).toISOString(),
        creditConversion,
        prizeType,
        prizeAmount,
        creator: wallet.address,
        treasuryAddress: treasuryWallet,
        tokenTicker: raffleType === 'KRC20' ? tokenTicker.trim().toUpperCase() : undefined,
        prizeTicker: prizeType === 'KRC20' ? prizeTicker.trim().toUpperCase() : undefined,
        prizeTransactionId: txid,
        winnersCount: parseInt(winnersCount, 10)  // send the winners count
      };
      const res = await axios.post(`${apiUrl}/raffles/create`, payload);
      if (res.data.success) {
        setShowConfirmModal(false);
        setSuccessMessage("Raffle created successfully!");
        navigate(`/raffle/${res.data.raffleId}`);
      } else {
        setConfirmError("Prize confirmation failed.");
      }
    } catch (e) {
      console.error(e);
      setConfirmError("Transaction failed. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setConfirmError('');
  };

  return (
    <div className="create-raffle-page page-container">
      <h1 className="global-heading">Create a Raffle</h1>
      <form onSubmit={handleSubmit} className="frosted-form">
        <div>
          <label>Raffle Type:</label>
          <div>
            <label>
              <input
                type="radio"
                value="KAS"
                checked={raffleType === 'KAS'}
                onChange={() => setRaffleType('KAS')}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={raffleType === 'KRC20'}
                onChange={() => setRaffleType('KRC20')}
              />
              KRC20
            </label>
          </div>
        </div>
        {raffleType === 'KRC20' && (
          <div>
            <label>Raffle Token Ticker:</label>
            <input
              type="text"
              value={tokenTicker}
              onChange={(e) => setTokenTicker(e.target.value)}
            />
          </div>
        )}
        <div>
          <label>Time Frame (end date/time):</label>
          <input
            type="datetime-local"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
          />
        </div>
        <div>
          <label>Credit Conversion (tokens per entry):</label>
          <input
            type="number"
            value={creditConversion}
            onChange={(e) => setCreditConversion(e.target.value)}
          />
        </div>
        <div>
          <label>Prize Type:</label>
          <div>
            <label>
              <input
                type="radio"
                value="KAS"
                checked={prizeType === 'KAS'}
                onChange={() => setPrizeType('KAS')}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={prizeType === 'KRC20'}
                onChange={() => setPrizeType('KRC20')}
              />
              KRC20
            </label>
          </div>
        </div>
        {prizeType === 'KRC20' && (
          <div>
            <label>Prize Token Ticker:</label>
            <input
              type="text"
              value={prizeTicker}
              onChange={(e) => setPrizeTicker(e.target.value)}
            />
          </div>
        )}
        <div>
          <label>Prize Amount:</label>
          <input
            type="number"
            value={prizeAmount}
            onChange={(e) => setPrizeAmount(e.target.value)}
          />
        </div>
        {/* New Winners input */}
        <div>
          <label>Winners:</label>
          <input
            type="number"
            min="1"
            value={winnersCount}
            onChange={(e) => setWinnersCount(e.target.value)}
          />
        </div>
        <button type="submit">Create Raffle</button>
      </form>

      {confirmError && !showConfirmModal && (
        <div className="message error" style={{ marginTop: '1rem', textAlign: 'center' }}>
          {confirmError}
          <button className="close-button" onClick={() => setConfirmError('')} style={{ marginLeft: '1rem' }}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="message success" style={{ marginTop: '1rem', textAlign: 'center' }}>
          {successMessage}
          <button className="close-button" onClick={() => setSuccessMessage('')} style={{ marginLeft: '1rem' }}>×</button>
        </div>
      )}

      {showConfirmModal && (
        <div className="processing-modal">
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <button className="close-button" onClick={handleCloseModal}>×</button>
          </div>
          {confirmError ? (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <p className="message error" style={{ color: 'red' }}>{confirmError}</p>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
          ) : (
            <>
              {!confirming && <div className="spinner"></div>}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p>
                  Please send {prizeAmount} {prizeType === "KAS" ? "KAS" : prizeTicker.trim().toUpperCase()} to begin the raffle:
                </p>
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Note: KASPER takes 5% of the generated tokens.
                </p>
              </div>
              <button onClick={handleConfirmPrize} disabled={confirming}>
                {confirming ? "Confirming..." : "Confirm Prize"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateRaffle;
