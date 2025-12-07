import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="modern-footer">
      <div className="footer-container">
        
        <div className="footer-grid">
          
          {/* Brand */}
          <div className="footer-brand">
            <div className="brand-logo">
              <div className="logo-circle">
                <i className="fa-solid fa-droplet" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <h2 className="brand-name">Nirogya</h2>
            </div>
            <p className="brand-tagline">
              AI-powered water quality monitoring and proactive healthcare surveillance.
            </p>
            <div className="social-links">
              <a href="#" className="social-icon" aria-label="Twitter">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
              <a href="#" className="social-icon" aria-label="LinkedIn">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
              <a href="#" className="social-icon" aria-label="Facebook">
                <i className="fa-brands fa-facebook"></i>
              </a>
              <a href="#" className="social-icon" aria-label="GitHub">
                <i className="fa-brands fa-github"></i>
              </a>
            </div>
          </div>

          {/* Column 2 */}
          <div className="footer-section">
            <h3 className="section-title">Platform</h3>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Technology</a></li>
              <li><a href="#">Case Studies</a></li>
              <li><a href="#">Impact</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="footer-section">
            <h3 className="section-title">Resources</h3>
            <ul className="footer-links">
              <li><a href="#">Docs</a></li>
              <li><a href="#">API</a></li>
              <li><a href="#">Help</a></li>
              <li><a href="#">Partners</a></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div className="footer-section">
            <h3 className="section-title">Contact</h3>
            <div className="contact-info">
              <div className="contact-item">
                <i className="fa-regular fa-envelope"></i>
                <span>contact@nirogya.org</span>
              </div>
              <div className="contact-item">
                <i className="fa-solid fa-phone"></i>
                <span>+91-361-294-XXXX</span>
              </div>
              
              <a href="tel:108" className="emergency-card">
                <div className="emergency-icon-box">
                  <i className="fa-solid fa-phone-volume"></i>
                </div>
                <div className="emergency-content">
                  <span className="emergency-label">Emergency</span>
                  <span className="emergency-numbers">108 &middot; 1916 &middot; 1078</span>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="copyright">
            &copy; 2025 Nirogya Inc.
          </div>
          <div className="legal-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>

      </div>
      
      {/* Chat Widget */}
      <div className="chat-widget">
        <i className="fa-regular fa-message"></i>
      </div>
    </footer>
  );
};

export default Footer;