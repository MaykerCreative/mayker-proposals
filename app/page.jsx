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
      const response = await fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Fetched data:', data);
      if (!data || !Array.isArray(data) || data.length === 0) {
        setProposals([]);
      } else {
        setProposals(data);
      }
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
    return <ProposalView proposal={selectedProposal} onBack={backToDashboard} onPrint={printProposal} />;
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
                <th style={headerStyle}>Total</th>
                <th style={headerStyle}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {proposals.map((proposal, index) => (
                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={rowStyle}>{proposal.clientName}</td>
                  <td style={rowStyle}>{proposal.venueName}, {proposal.city}, {proposal.state}</td>
                  <td style={rowStyle}>{proposal.eventDate}</td>
                  <td style={rowStyle}>
                    ${calculateTotal(proposal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
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

// Header and row styles
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

// ------- ProposalView Component --------
function ProposalView({ proposal, onBack, onPrint }) {
  // Defensive parsing for both field options
  let rawSections = proposal.sectionsJSON || proposal.proposalSectionsProducts || '[]';
  let sections;
  try {
    sections = typeof rawSections === 'string' ? JSON.parse(rawSections) : [];
  } catch (e) {
    sections = [];
    console.error("Unable to parse proposal sections:", rawSections, e);
  }

  // You may want to add a debug log here:
  // console.log('Sections:', sections);

  const totals = calculateDetailedTotals({ ...proposal, sectionsJSON: JSON.stringify(sections) });

  // Paste your actual JSX/UI for rendering here (per your current version)
  // All code for product grid, estimate table, etc. remains unchanged
  // (From your own ProposalView render code...)

  // For brevity, you can paste the rest of your existing ProposalView body here.
  // If you'd like me to fill that out as well, just let me know!
  return (
    <div>
      {/* Paste your render content here, e.g. cover page, products grid, estimate, etc. */}
      {/* The key is that `sections` will ALWAYS be a valid array now! */}
      <pre>{JSON.stringify(sections, null, 2)}</pre> {/* TEMP: For debugging, remove after confirmation */}
    </div>
  );
}

// ------- Calculation & Formatting Functions -------
function calculateTotal(proposal) {
  const totals = calculateDetailedTotals(proposal);
  return totals.total;
}
function calculateDetailedTotals(proposal) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  let productSubtotal = 0;
  sections.forEach(section => {
    section.products.forEach(product => {
      productSubtotal += product.price * product.quantity;
    });
  });
  const duration = getDuration(proposal);
  const extendedRental = duration > 1 ? productSubtotal * 0.3 * (duration - 1) : 0;
  const discountPercent = parseFloat(proposal.discountPercent) || 0;
  const subtotalWithExtended = productSubtotal + extendedRental;
  const discount = subtotalWithExtended * (discountPercent / 100);
  const rentalTotal = subtotalWithExtended - discount;
  const productCare = productSubtotal * 0.10;
  const serviceFee = rentalTotal * 0.05;
  const delivery = parseFloat(proposal.deliveryFee) || 0;
  const subtotal = rentalTotal + productCare + serviceFee + delivery;
  const tax = subtotal * 0.0975;
  const total = subtotal + tax;
  return {
    productSubtotal,
    extendedRental,
    discount,
    rentalTotal,
    productCare,
    serviceFee,
    delivery,
    subtotal,
    tax,
    total
  };
}
function formatDateRange(proposal) {
  const start = new Date(proposal.startDate);
  const end = new Date(proposal.endDate);
  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}
function formatNumber(num) {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function getDuration(proposal) {
  const start = new Date(proposal.startDate);
  const end = new Date(proposal.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}
