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
      const response = await fetch('https://script.google.com/macros/s/AKfycbxI5yUBaFt9dvrPKnEZo4aKH0g8YMDSXMBCrDx5s8W8nxZfgCaafvEGsIcjOmOpZ-hM/exec');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      // If data is empty or not an array, use test data
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No data from API, using test data');
        // Test data for development
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
  
  // Mayker brand colors
  const brandTaupe = '#8B7B6B';
  const brandCharcoal = '#2C2C2C';
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        @media print {
          .no-print { display: none !important; }
          .print-break-after { page-break-after: always; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          .proposal-cover { 
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #8B7B6B !important;
          }
          .product-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 40px !important;
          }
        }
        
        @page {
          size: letter;
          margin: 0;
        }
      ` }} />

      {/* Navigation Bar */}
      <div className="no-print" style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        zIndex: 50,
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

      {/* Cover Page */}
      <div className="proposal-cover print-break-after" style={{
        backgroundColor: brandTaupe,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Logo Mark - Circular M */}
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: 'white',
            borderRadius: '50%',
            margin: '0 auto 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '60px',
              fontWeight: '300',
              color: brandTaupe,
              fontFamily: "'Playfair Display', serif"
            }}>M</span>
          </div>
          
          <h1 style={{
            fontSize: '72px',
            fontWeight: '300',
            color: 'white',
            marginBottom: '24px',
            letterSpacing: '0.2em',
            fontFamily: "'Inter', sans-serif"
          }}>MAYKER EVENTS</h1>
          
          <div style={{
            width: '120px',
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.4)',
            margin: '0 auto 32px'
          }}></div>
          
          <p style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.3em',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '300'
          }}>PROPOSAL</p>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          width: '100%',
          maxWidth: '600px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '32px',
            textAlign: 'left'
          }}>
            <div>
              <p style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '8px',
                fontFamily: "'Inter', sans-serif"
              }}>Client</p>
              <p style={{
                fontSize: '18px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontWeight: '400'
              }}>{proposal.clientName}</p>
            </div>
            <div>
              <p style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '8px',
                fontFamily: "'Inter', sans-serif"
              }}>Location</p>
              <p style={{
                fontSize: '18px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontWeight: '400'
              }}>{proposal.venueName}, {proposal.city}, {proposal.state}</p>
            </div>
            <div>
              <p style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '8px',
                fontFamily: "'Inter', sans-serif"
              }}>Event Dates</p>
              <p style={{
                fontSize: '18px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontWeight: '400'
              }}>{formatDateRange(proposal)}</p>
            </div>
            <div>
              <p style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '8px',
                fontFamily: "'Inter', sans-serif"
              }}>Duration</p>
              <p style={{
                fontSize: '18px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontWeight: '400'
              }}>{getDuration(proposal)} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Pages */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 40px' }}>
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} style={{ marginTop: sectionIndex > 0 ? '80px' : '0' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '300',
              color: brandCharcoal,
              marginBottom: '40px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              borderBottom: `1px solid ${brandTaupe}`,
              paddingBottom: '16px',
              fontFamily: "'Inter', sans-serif"
            }}>
              {section.name}
            </h2>
            
            <div className="product-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '40px'
            }}>
              {section.products.map((product, productIndex) => (
                <div key={productIndex} style={{ textAlign: 'center' }}>
                  <div style={{
                    aspectRatio: '1',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e5e7eb'
                  }}>
                    <span style={{
                      color: '#9ca3af',
                      fontSize: '13px',
                      fontFamily: "'Inter', sans-serif"
                    }}>[Product Image]</span>
                  </div>
                  <h3 style={{
                    fontWeight: '500',
                    color: brandCharcoal,
                    textTransform: 'uppercase',
                    fontSize: '13px',
                    marginBottom: '4px',
                    letterSpacing: '0.05em',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {product.name}
                  </h3>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '13px',
                    marginBottom: '8px',
                    fontFamily: "'Inter', sans-serif"
                  }}>Qty: {product.quantity}</p>
                  <p style={{
                    color: brandCharcoal,
                    fontWeight: '500',
                    fontSize: '15px',
                    fontFamily: "'Inter', sans-serif"
                  }}>${product.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Pricing Table */}
        <div style={{
          marginTop: '100px',
          borderTop: `1px solid ${brandTaupe}`,
          paddingTop: '48px'
        }}>
          <div style={{ maxWidth: '500px', marginLeft: 'auto' }}>
            <div style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0'
              }}>
                <span style={{ color: '#4b5563' }}>Product Subtotal</span>
                <span style={{ color: brandCharcoal }}>${totals.productSubtotal.toFixed(2)}</span>
              </div>
              
              {totals.extendedRental > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0'
                }}>
                  <span style={{ color: '#4b5563' }}>Extended Rental ({getDuration(proposal)} days)</span>
                  <span style={{ color: brandCharcoal }}>${totals.extendedRental.toFixed(2)}</span>
                </div>
              )}
              
              {totals.discount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0'
                }}>
                  <span style={{ color: '#059669' }}>
                    {proposal.discountName || 'Discount'} ({proposal.discountPercent}% off)
                  </span>
                  <span style={{ color: '#059669' }}>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: `1px solid ${brandTaupe}`,
                borderBottom: `1px solid ${brandTaupe}`,
                fontWeight: '500',
                marginTop: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ color: brandCharcoal }}>Rental Total</span>
                <span style={{ color: brandCharcoal }}>${totals.rentalTotal.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0'
              }}>
                <span style={{ color: '#4b5563' }}>Product Care (10%)</span>
                <span style={{ color: brandCharcoal }}>${totals.productCare.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0'
              }}>
                <span style={{ color: '#4b5563' }}>Service Fee (5%)</span>
                <span style={{ color: brandCharcoal }}>${totals.serviceFee.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0'
              }}>
                <span style={{ color: '#4b5563' }}>Delivery</span>
                <span style={{ color: brandCharcoal }}>${totals.delivery.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: `1px solid ${brandTaupe}`,
                fontWeight: '500',
                marginTop: '8px'
              }}>
                <span style={{ color: brandCharcoal }}>Subtotal</span>
                <span style={{ color: brandCharcoal }}>${totals.subtotal.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0'
              }}>
                <span style={{ color: '#4b5563' }}>Tax (9.75%)</span>
                <span style={{ color: brandCharcoal }}>${totals.tax.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px 0',
                borderTop: `2px solid ${brandCharcoal}`,
                marginTop: '12px'
              }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: brandCharcoal,
                  fontFamily: "'Inter', sans-serif"
                }}>TOTAL</span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: brandCharcoal,
                  fontFamily: "'Inter', sans-serif"
                }}>${totals.total.toFixed(2)}</span>
              </div>
            </div>
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
  
  // Calculate product subtotal
  let productSubtotal = 0;
  sections.forEach(section => {
    section.products.forEach(product => {
      productSubtotal += product.price * product.quantity;
    });
  });
  
  // Calculate extended rental (30% per additional day after first day)
  const duration = getDuration(proposal);
  const extendedRental = duration > 1 ? productSubtotal * 0.3 * (duration - 1) : 0;
  
  // Calculate discount
  const discountPercent = parseFloat(proposal.discountPercent) || 0;
  const subtotalWithExtended = productSubtotal + extendedRental;
  const discount = subtotalWithExtended * (discountPercent / 100);
  
  // Calculate rental total
  const rentalTotal = subtotalWithExtended - discount;
  
  // Calculate fees
  const productCare = productSubtotal * 0.10;
  const serviceFee = rentalTotal * 0.05;
  const delivery = parseFloat(proposal.deliveryFee) || 0;
  
  // Calculate subtotal
  const subtotal = rentalTotal + productCare + serviceFee + delivery;
  
  // Calculate tax
  const tax = subtotal * 0.0975;
  
  // Calculate total
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
