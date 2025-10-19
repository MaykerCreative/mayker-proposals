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
      console.log('Fetching proposals...');
      const response = await fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No data from API, using test data');
        const testData = [{
          clientName: "Sample Sally",
          venueName: "Blackberry Farm",
          city: "Walland",
          state: "TN",
          eventDate: "Oct 27, 2025",
          startDate: "2025-10-27",
          endDate: "2025-10-30",
          deliveryFee: "500",
          discountPercent: "15",
          discountName: "Mayker Reserve",
          clientFolderURL: "",
          sectionsJSON: JSON.stringify([
            {
              name: "BAR",
              products: [
                { name: "CONCRETE BAR", quantity: 1, price: 575 }
              ]
            },
            {
              name: "LOUNGE",
              products: [
                { name: "AURORA SWIVEL CHAIR (SAGE)", quantity: 2, price: 225 },
                { name: "COOPER END TABLE", quantity: 2, price: 125 }
              ]
            }
          ])
        }];
        setProposals(testData);
      } else {
        setProposals(data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(`Failed to fetch proposals: ${err.message}`);
      setLoading(false);
    }
  };

  const viewProposal = (proposal) => {
    setSelectedProposal(proposal);
  };

  const backToDashboard = () => {
    setSelectedProposal(null);
  };

  const printProposal = () => {
    window.print();
  };

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
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Client
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Location
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Event Date
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {proposals.map((proposal, index) => (
                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    {proposal.clientName}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    {proposal.venueName}, {proposal.city}, {proposal.state}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    {proposal.eventDate}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                    ${calculateTotal(proposal).toFixed(2)}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px' }}>
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

function ProposalView({ proposal, onBack, onPrint }) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  const totals = calculateDetailedTotals(proposal);
  
  // Mayker brand colors - using the exact taupe from your Hunter example
  const brandTaupe = '#6B6055';
  const brandCharcoal = '#2C2C2C';
  const brandWhite = '#FFFFFF';
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        @font-face {
          font-family: 'Domaine Text';
          src: url('/TestDomaineText-Light.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('/NeueHaasUnica-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Neue Haas Unica', 'Inter', sans-serif;
        }
        
        h1, h2, h3 {
          font-family: 'Domaine Text', 'Playfair Display', serif;
        }
        
        @media print {
          .no-print { display: none !important; }
          .print-break-after { page-break-after: always; }
          .print-break-before { page-break-before: always; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          .proposal-cover { 
            height: 100vh !important;
            page-break-after: always;
          }
          .product-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 20px !important;
          }
        }
        
        @page {
          size: letter;
          margin: 0;
        }
      ` }} />

      {/* Navigation Bar - Only shows on screen */}
      <div className="no-print" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 1000,
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={onBack}
            style={{
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={onPrint}
            style={{
              padding: '8px 20px',
              backgroundColor: brandCharcoal,
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
      </div>

      {/* Cover Page - Full taupe background like Hunter example */}
      <div className="proposal-cover print-break-after" style={{
        backgroundColor: brandTaupe,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        paddingTop: '60px'
      }}>
        {/* White circular logo with whisper version */}
        <img 
          src="/mayker_icon-whisper.svg"
          alt="Mayker Events"
          style={{
            width: '160px',
            height: '160px',
            marginBottom: '60px'
          }}
        />
        
        {/* MAYKER EVENTS text using wordmark */}
        <img 
          src="/mayker_wordmark-events-whisper.svg"
          alt="MAYKER EVENTS"
          style={{
            height: '60px',
            marginBottom: '40px'
          }}
        />
        
        {/* Divider line */}
        <div style={{
          width: '100px',
          height: '1px',
          backgroundColor: brandWhite,
          opacity: 0.5,
          marginBottom: '40px'
        }}></div>
        
        {/* PRODUCT SELECTIONS text */}
        <p style={{
          fontSize: '18px',
          color: brandWhite,
          letterSpacing: '0.2em',
          marginBottom: '20px'
        }}>PRODUCT SELECTIONS</p>
        
        {/* Event name */}
        <p style={{
          fontSize: '24px',
          color: brandWhite,
          marginBottom: '10px',
          fontWeight: '300'
        }}>{proposal.clientName}</p>
        
        {/* Location */}
        <p style={{
          fontSize: '16px',
          color: brandWhite,
          opacity: 0.9,
          marginBottom: '10px'
        }}>{proposal.venueName}</p>
        
        {/* Dates */}
        <p style={{
          fontSize: '16px',
          color: brandWhite,
          opacity: 0.9
        }}>{formatDateRange(proposal)}</p>
      </div>

      {/* Interior Pages - White background with products */}
      <div style={{ backgroundColor: 'white' }}>
        {/* Header for interior pages */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '40px 60px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <img 
            src="/mayker_wordmark-events-black.svg" 
            alt="Mayker Events"
            style={{ height: '35px' }}
          />
          <img 
            src="/mayker_icon-black.svg" 
            alt="M"
            style={{ height: '35px' }}
          />
        </div>

        {/* Event Info Section */}
        <div style={{ padding: '40px 60px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '30px',
            marginBottom: '40px',
            paddingBottom: '40px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div>
              <p style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#888',
                marginBottom: '6px'
              }}>CLIENT</p>
              <p style={{
                fontSize: '16px',
                color: brandCharcoal
              }}>{proposal.clientName}</p>
            </div>
            <div>
              <p style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#888',
                marginBottom: '6px'
              }}>LOCATION</p>
              <p style={{
                fontSize: '16px',
                color: brandCharcoal
              }}>{proposal.venueName}, {proposal.city}, {proposal.state}</p>
            </div>
            <div>
              <p style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#888',
                marginBottom: '6px'
              }}>EVENT DATES</p>
              <p style={{
                fontSize: '16px',
                color: brandCharcoal
              }}>{formatDateRange(proposal)}</p>
            </div>
            <div>
              <p style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#888',
                marginBottom: '6px'
              }}>DURATION</p>
              <p style={{
                fontSize: '16px',
                color: brandCharcoal
              }}>{getDuration(proposal)} days</p>
            </div>
          </div>
        </div>

        {/* Products Sections */}
        <div style={{ padding: '0 60px 60px' }}>
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ 
              marginBottom: '60px',
              pageBreakInside: 'avoid'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: brandCharcoal,
                marginBottom: '30px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                {section.name}
              </h2>
              
              <div className="product-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px'
              }}>
                {section.products.map((product, productIndex) => (
                  <div key={productIndex} style={{ 
                    backgroundColor: '#f9f9f9',
                    padding: '15px',
                    borderRadius: '4px'
                  }}>
                    <div style={{
                      aspectRatio: '1',
                      backgroundColor: '#e5e5e5',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: '#999'
                    }}>
                      [Product Image]
                    </div>
                    <h3 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: brandCharcoal,
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>
                      {product.name}
                    </h3>
                    <p style={{
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '4px'
                    }}>Quantity: {product.quantity}</p>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: brandCharcoal
                    }}>${product.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Table Page */}
        <div style={{ 
          padding: '60px',
          pageBreakBefore: 'always',
          minHeight: '100vh'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: brandCharcoal,
            marginBottom: '40px',
            textAlign: 'center'
          }}>PRICING BREAKDOWN</h2>
          
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>Product Subtotal</td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.productSubtotal.toFixed(2)}
                  </td>
                </tr>
                
                {totals.extendedRental > 0 && (
                  <tr>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>
                      Extended Rental ({getDuration(proposal)} days)
                    </td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: brandCharcoal, textAlign: 'right' }}>
                      ${totals.extendedRental.toFixed(2)}
                    </td>
                  </tr>
                )}
                
                {totals.discount > 0 && (
                  <tr>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#059669' }}>
                      {proposal.discountName || 'Discount'} ({proposal.discountPercent}% off)
                    </td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#059669', textAlign: 'right' }}>
                      -${totals.discount.toFixed(2)}
                    </td>
                  </tr>
                )}
                
                <tr style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal }}>
                    Rental Total
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.rentalTotal.toFixed(2)}
                  </td>
                </tr>
                
                <tr>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>Product Care (10%)</td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.productCare.toFixed(2)}
                  </td>
                </tr>
                
                <tr>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>Service Fee (5%)</td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.serviceFee.toFixed(2)}
                  </td>
                </tr>
                
                <tr>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>Delivery</td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.delivery.toFixed(2)}
                  </td>
                </tr>
                
                <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal }}>
                    Subtotal
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.subtotal.toFixed(2)}
                  </td>
                </tr>
                
                <tr>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>Tax (9.75%)</td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.tax.toFixed(2)}
                  </td>
                </tr>
                
                <tr style={{ borderTop: '2px solid ' + brandCharcoal }}>
                  <td style={{ padding: '20px 0', fontSize: '20px', fontWeight: '600', color: brandCharcoal }}>
                    TOTAL
                  </td>
                  <td style={{ padding: '20px 0', fontSize: '20px', fontWeight: '600', color: brandCharcoal, textAlign: 'right' }}>
                    ${totals.total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  return `${startStr} - ${endStr}`;
}

function getDuration(proposal) {
  const start = new Date(proposal.startDate);
  const end = new Date(proposal.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}
