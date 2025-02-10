import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <a href="https://www.kaspercoin.net" target="_blank" rel="noopener noreferrer">
        <img src="/assets/KasperLogo.png" alt="Kasper Logo" className="footer-logo" />
      </a>
    </footer>
  );
};

export default Footer;
