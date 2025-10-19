'use client';

import React, { useState, useEffect } from 'react';

export default function ProposalApp() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec'
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProposals(data && Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch proposals: ${err.message}`);
      setLoading(false);
    }
  };

  const viewProposal = (proposal) => setSelectedProposal(proposal);
  const backToDashboard = () => setSelectedProposal(null);
  const printProposal = () => window.print();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #1f2937',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading proposals...</p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <button 
            onClick={fetchProposals}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (selectedProposal) {
    return (
      <ProposalView
        proposal={selectedProposal}
        onBack={backToDashboard}
        onPrint={printProposal}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>Mayker Proposals</h1>
          <p style={{ marginTop: '8px', color: '#6b7280' }}>Manage and view all proposals</p>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={fetchProposals}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Refresh
          </button>
        </div>
        <div style={{ backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={headerStyle}>Client</th>
                <th style={headerStyle}>Location</th>
                <th style={headerStyle}>Event Date</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {proposals.map((proposal, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={rowStyle}>{proposal.clientName}</td>
                  <td style={rowStyle}>{proposal.venueName}, {proposal.city}, {proposal.state}</td>
                  <td style={rowStyle}>{proposal.startDate} - {proposal.endDate}</td>
                  <td style={rowStyle}>
                    <button
                      onClick={() => viewProposal(proposal)}
                      style={{
                        color: '#2563eb',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const headerStyle = {
  padding: '12px 24px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '500',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const rowStyle = {
  padding: '16px 24px',
  fontSize: '14px',
  color: '#111827'
};

function ProposalView({ proposal, onBack, onPrint }) {
  const productSummary = proposal.sectionsJSON || "";

  // Your site styling/branding as you wish for header, etc.

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', padding: '32px' }}>
      {/* Nav bar or header */}
      <div className="no-print" style={{
        marginBottom: "16px"
      }}>
        <button onClick={onBack} style={{
          color: '#6b7280',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          ← Back to Dashboard
        </button>
        <button
          onClick={onPrint}
          style={{
            marginLeft: "16px",
            padding: '8px 20px',
            backgroundColor: "#2C2C2C",
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Print / Export as PDF
        </button>
      </div>

      {/* Proposal Info */}
      <h2 style={{ marginBottom: "16px", color: "#545142" }}>{proposal.clientName} — {proposal.venueName}</h2>
      <p style={{ marginBottom: "24px", color: "#6b7280" }}>
        {proposal.city}, {proposal.state} <br />
        {proposal.startDate} to {proposal.endDate}
      </p>
      <h3 style={{ marginTop: "24px", marginBottom: "8px", color: "#2C2C2C" }}>Product Selections</h3>
      <div style={{
        backgroundColor: "#e0f2f1",
        borderRadius: "8px",
        padding: "24px",
        margin: "16px 0 32px 0",
        fontFamily: "'Inter', 'sans-serif'",
        fontSize: "16px",
        whiteSpace: "pre-line"
      }}>
        {productSummary}
      </div>
      {/* Add any additional sections you like (pricing, notes, etc.) here */}
    </div>
  );
}
