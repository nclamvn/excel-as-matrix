// =============================================================================
// LANDING PAGE — AI Suite Landing Page
// =============================================================================

import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="landing-page">
      {/* Background Pattern */}
      <div className="bg-pattern">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
            </pattern>
            <pattern id="circuit" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="2" fill="#d1d5db"/>
              <path d="M 60 0 L 60 58 M 0 60 L 58 60 M 62 60 L 120 60 M 60 62 L 60 120" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <circle cx="60" cy="30" r="1.5" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <circle cx="30" cy="60" r="1.5" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <circle cx="90" cy="60" r="1.5" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
              <circle cx="60" cy="90" r="1.5" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>AI Suite</span>
        </div>
        <div className="nav-links">
          <a href="#products">Products</a>
          <a href="#features">Features</a>
          <a href="#" className="active">ExcelAI Dashboard</a>
        </div>
        <button className="nav-cta" onClick={onEnterApp}>Get Started</button>
      </nav>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero">
          {/* Floating Icons */}
          <div className="floating-icons">
            <div className="floating-icon word">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.17 3.25q.33 0 .59.25.24.24.24.58v15.84q0 .34-.24.58-.26.25-.59.25H7.83q-.33 0-.59-.25-.24-.24-.24-.58V17H2.83q-.33 0-.59-.24-.24-.25-.24-.59V7.83q0-.33.24-.59.26-.24.59-.24H7V4.08q0-.34.24-.58.26-.25.59-.25h13.34M7 13.06l1.18 2.22h1.79L8 12.06l1.93-3.17H8.22l-1.18 2.17-1.18-2.17H4.07l1.93 3.17-1.96 3.22h1.79l1.17-2.22m8 4.94V17h-4v1h4m5-1V17h-4v1h4m-9-5V11h-4v1h4m9-1V11h-4v1h4m-9-5V5h-4v1h4m9-1V5h-4v1h4"/></svg>
            </div>
            <div className="floating-icon excel">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.17 3.25q.33 0 .59.25.24.24.24.58v15.84q0 .34-.24.58-.26.25-.59.25H7.83q-.33 0-.59-.25-.24-.24-.24-.58V17H2.83q-.33 0-.59-.24-.24-.25-.24-.59V7.83q0-.33.24-.59.26-.24.59-.24H7V4.08q0-.34.24-.58.26-.25.59-.25h13.34M7 13.06l1.18 2.22h1.79L8 12.06l1.93-3.17H8.22l-1.18 2.17-1.18-2.17H4.07l1.93 3.17-1.96 3.22h1.79l1.17-2.22M19 11h-5v1h5v-1m0-4h-5v1h5V7m0 8h-5v1h5v-1"/></svg>
            </div>
            <div className="floating-icon slide">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/></svg>
            </div>
            <div className="floating-icon excel">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-4h7v4zm0-6H5V7h7v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z"/></svg>
            </div>
            <div className="floating-icon word">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
            </div>
            <div className="floating-icon slide">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 8v8l5-4-5-4zm11-5H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>
            </div>
            <div className="floating-icon word">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5v14h18V5H3zm16 12H5V7h14v10z"/></svg>
            </div>
            <div className="floating-icon excel">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8-4-4L2 17l1.5 1.5z"/></svg>
            </div>
          </div>

          {/* Product Icons */}
          <div className="product-icons">
            <div className="product-icon word-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>
            </div>
            <div className="product-icon excel-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-4h7v4zm0-6H5V7h7v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z"/></svg>
            </div>
            <div className="product-icon slide-icon">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 8v8l5-4-5-4zm11-5H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>
            </div>
          </div>

          {/* Headline */}
          <h1>Supercharge Your Productivity,<br/><span>AI-Powered</span> Office Suite</h1>
          <p>Transform documents, spreadsheets, and presentations with intelligent AI. Work smarter, not harder.</p>

          {/* CTA Buttons */}
          <div className="cta-buttons">
            <button className="cta-primary" onClick={onEnterApp}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              Try ExcelAI Free
            </button>
            <a href="#products" className="cta-secondary">
              View All Products
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
            </a>
          </div>
        </section>

        {/* Dashboard Preview */}
        <div className="dashboard-preview">
          <div className="preview-container">
            {/* Sidebar */}
            <div className="preview-sidebar">
              <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-4h7v4zm0-6H5V7h7v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z"/></svg>
                </div>
                <span>ExcelAI</span>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-section-title">Dashboards</div>
                <div className="sidebar-item active">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Dashboard
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Templates
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  AI Features
                </div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Collaborate
                </div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-section-title">Analytics</div>
                <div className="sidebar-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  Overview
                </div>
                <div className="sidebar-sub-item active">
                  Data Insights
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="preview-main">
              <div className="preview-header">
                <div className="preview-user">
                  <div className="preview-avatar">L</div>
                  <div className="preview-greeting">
                    <h3>Hey, User</h3>
                    <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="preview-toolbar">
                  <div className="preview-search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Search
                    <kbd>/</kbd>
                  </div>
                  <div className="toolbar-icons">
                    <div className="toolbar-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </div>
                    <div className="toolbar-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="preview-cards">
                {/* Chart Card */}
                <div className="preview-card">
                  <div className="card-header">
                    <div className="card-icon excel-card">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-4h7v4zm0-6H5V7h7v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z"/></svg>
                    </div>
                    <div className="card-value">
                      <span className="number">1,247</span>
                      <span className="unit">Sheets</span>
                    </div>
                    <div className="card-dots">...</div>
                  </div>
                  <div className="chart-container">
                    {[30, 50, 45, 70, 60, 85, 75, 90, 65, 80].map((height, i) => (
                      <div key={i} className="chart-bar" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>

                {/* Stats Card */}
                <div className="preview-card stats-card">
                  <div className="stats-header">
                    <div className="stats-brand">
                      <div className="stats-brand-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      </div>
                      <div className="stats-brand-info">
                        <h4>AI Suite Pro</h4>
                        <p>This month +32.4% productivity</p>
                      </div>
                    </div>
                    <div className="stats-balance">
                      <div className="wallet">Active Projects</div>
                      <div className="amount">47</div>
                      <div className="label">Projects</div>
                    </div>
                  </div>
                  <div className="stats-chart">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                      <div key={day} className="stats-bar-group">
                        <div className="stats-bar" style={{ height: `${[45, 60, 35, 55, 70, 25, 40][i]}px` }} />
                        <div className="stats-bar-value">{day}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <section className="products-section" id="products">
          <h2>Complete AI Office Suite</h2>
          <p>Three powerful AI-driven applications to revolutionize how you work with documents, data, and presentations.</p>

          <div className="products-grid">
            {/* WordAI */}
            <div className="product-card coming-soon">
              <span className="coming-soon-badge">Coming Soon</span>
              <div className="product-card-icon word">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>
              </div>
              <h3>WordAI</h3>
              <p>Intelligent document creation with AI-powered writing, editing, and formatting. Create professional documents in seconds.</p>
              <ul className="product-features">
                <li><CheckIcon /> AI-powered writing assistant</li>
                <li><CheckIcon /> Smart formatting & templates</li>
                <li><CheckIcon /> Real-time collaboration</li>
                <li><CheckIcon /> Grammar & style correction</li>
              </ul>
              <button className="product-card-btn disabled">Notify Me</button>
            </div>

            {/* ExcelAI (Featured) */}
            <div className="product-card featured">
              <span className="featured-badge">Available Now</span>
              <div className="product-card-icon excel">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5v-4h7v4zm0-6H5V7h7v4zm7 6h-5v-4h5v4zm0-6h-5V7h5v4z"/></svg>
              </div>
              <h3>ExcelAI</h3>
              <p>Next-generation spreadsheet with AI-native features. Natural language formulas, auto-visualization, intelligent data cleaning.</p>
              <ul className="product-features">
                <li><CheckIcon /> Natural Language Formulas</li>
                <li><CheckIcon /> Proactive AI Suggestions</li>
                <li><CheckIcon /> One-click Data Cleaning</li>
                <li><CheckIcon /> Smart Auto-Visualization</li>
                <li><CheckIcon /> AI Macros & Automation</li>
              </ul>
              <button className="product-card-btn primary" onClick={onEnterApp}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Start Free Trial
              </button>
            </div>

            {/* SlideAI */}
            <div className="product-card coming-soon">
              <span className="coming-soon-badge">Coming Soon</span>
              <div className="product-card-icon slide">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 8v8l5-4-5-4zm11-5H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>
              </div>
              <h3>SlideAI</h3>
              <p>Create stunning presentations with AI. Generate slides from text, auto-design layouts, and add smart animations instantly.</p>
              <ul className="product-features">
                <li><CheckIcon /> AI slide generation</li>
                <li><CheckIcon /> Smart layout suggestions</li>
                <li><CheckIcon /> Auto-animations</li>
                <li><CheckIcon /> Presenter AI coach</li>
              </ul>
              <button className="product-card-btn disabled">Notify Me</button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="footer-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span>AI Suite</span>
          </div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Blog</a>
            <a href="#">Support</a>
          </div>
          <div className="footer-copy">© 2025 AI Suite. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default LandingPage;
