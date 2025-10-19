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
      const response = await fetch('https://script.google.com/macros/s/AKfycbz327RAdHGdwXmwyHVygb78JtzQ09819Kih3zvJ3wVpiHbDV6jpgYZDz8q6x0acS1r6/exec');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        const testData = [{
          clientName: "Sample Sally",
          venueName: "Blackberry Farm",
          city: "Walland",
          state: "TN",
          eventDate: "Oct 27, 2025",
          startDate: "2025-10-27",
          endDate: "2025-10-30",
          deliveryFee: "500",
          discount: "15",
          discountName: "Mayker Reserve",
          clientFolderURL: "",
          sectionsJSON: JSON.stringify([
            {
              name: "BAR",
              products: [
                { name: "CONCRETE BAR", quantity: 1, price: 575, imageUrl: "https://drive.google.com/thumbnail?id=1DZj6TRzoW1L0du03SDmc2tUdr57iRwrc&sz=w400" }
              ]
            },
            {
              name: "LOUNGE",
              products: [
                { name: "AURORA SWIVEL CHAIR (SAGE)", quantity: 2, price: 225, imageUrl: "https://drive.google.com/thumbnail?id=18n_hygMqd0co2YrV-uqpcHPzO0FsTPDl&sz=w400" },
                { name: "COOPER END TABLE", quantity: 2, price: 125, imageUrl: "https://drive.google.com/thumbnail?id=1Obl9i2evfji2W0vK02rJjGp_7w3-be6W&sz=w400" }
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
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Date</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
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
                    ${calculateTotal(proposal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
  const brandTaupe = '#545142';
  const brandCharcoal = '#2C2C2C';
  
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
        
        @media print {
          .no-print { display: none !important; }
          .print-break-after { page-break-after: always; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          @page {
            size: letter;
            margin: 0;
          }
        }
      ` }} />

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
              fontSize: '14px'
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

      <div className="print-break-after" style={{
        backgroundColor: brandTaupe,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
        position: 'relative',
        marginTop: '60px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src="/mayker_wordmark-events-whisper.svg"
              alt="MAYKER EVENTS"
              style={{
                height: '32px',
                marginBottom: '24px'
              }}
            />
            
            <div style={{
              width: '60px',
              height: '0.5px',
              backgroundColor: 'rgba(255,255,255,0.4)',
              marginBottom: '24px'
            }}></div>
            
            <p style={{
              fontSize: '14px',
              color: 'white',
              letterSpacing: '0.2em',
              marginBottom: '16px',
              fontFamily: "'Neue Haas Unica', 'Inter', sans-serif",
              textTransform: 'uppercase'
            }}>Product Selections</p>
            
            <p style={{
              fontSize: '18px',
              color: 'white',
              marginBottom: '6px',
              fontWeight: '300',
              fontFamily: "'Domaine Text', serif"
            }}>{proposal.clientName}</p>
            
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '4px',
              fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
            }}>{proposal.venueName}</p>
            
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
            }}>{formatDateRange(proposal)}</p>
          </div>
          
          <img 
            src="/mayker_icon-whisper.svg"
            alt="Mayker Events"
            style={{
              width: '60px',
              height: '60px'
            }}
          />
        </div>
      </div>

      {sections.map((section, sectionIndex) => {
        const pageNum = sectionIndex + 2;
        return (
          <div key={sectionIndex} className="print-break-after" style={{ 
            minHeight: '100vh',
            padding: '30px 60px 40px',
            position: 'relative'
          }}>
            <div style={{
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <img 
                  src="/mayker_wordmark-events-black.svg" 
                  alt="Mayker Events"
                  style={{ height: '22px', marginTop: '4px' }}
                />
                
                <div style={{
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '20px'
                }}>
                  <div style={{
                    fontSize: '9px',
                    color: '#666',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif",
                    lineHeight: '1.4',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <div>{proposal.clientName}</div>
                    <div>{formatDateRange(proposal)}</div>
                    <div>{proposal.venueName}</div>
                  </div>
                  <img 
                    src="/mayker_icon-black.svg" 
                    alt="M"
                    style={{ height: '38px' }}
                  />
                </div>
              </div>
            </div>
            
            <h2 style={{
              fontSize: '18px',
              fontWeight: '400',
              color: brandCharcoal,
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: "'Domaine Text', serif"
            }}>
              {section.name}
            </h2>
            
            <div style={{
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
                    color: '#999',
                    overflow: 'hidden',
                    borderRadius: '2px'
                  }}>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      '[Product Image]'
                    )}
                  </div>
                  <h3 style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    color: brandCharcoal,
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>
                    {product.name}
                  </h3>
                  <p style={{
                    fontSize: '10px',
                    color: '#666',
                    marginBottom: '4px',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>Quantity: {product.quantity}</p>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: '400',
                    color: brandCharcoal,
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
            
            <div style={{
              position: 'absolute',
              bottom: '30px',
              right: '60px',
              fontSize: '10px',
              color: '#999',
              fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
            }}>{pageNum}</div>
          </div>
        );
      })}

      <div style={{ 
        minHeight: '100vh',
        padding: '30px 60px 40px',
        position: 'relative'
      }}>
        <div style={{
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <img 
              src="/mayker_wordmark-events-black.svg" 
              alt="Mayker Events"
              style={{ height: '22px', marginTop: '4px' }}
            />
            
            <div style={{
              textAlign: 'right',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{
                fontSize: '9px',
                color: '#666',
                fontFamily: "'Neue Haas Unica', 'Inter', sans-serif",
                lineHeight: '1.4',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div>{proposal.clientName}</div>
                <div>{formatDateRange(proposal)}</div>
                <div>{proposal.venueName}</div>
              </div>
              <img 
                src="/mayker_icon-black.svg" 
                alt="M"
                style={{ height: '38px' }}
              />
            </div>
          </div>
        </div>
        
        <h2 style={{
          fontSize: '18px',
          fontWeight: '400',
          color: brandCharcoal,
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'center',
          fontFamily: "'Domaine Text', serif"
        }}>Estimate</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ 
                padding: '8px 0', 
                fontSize: '9px', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#666',
                textAlign: 'left',
                fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
              }}>Section</th>
              <th style={{ 
                padding: '8px 0', 
                fontSize: '9px', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#666',
                textAlign: 'left',
                fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
              }}>Product</th>
              <th style={{ 
                padding: '8px 0', 
                fontSize: '9px', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#666',
                textAlign: 'center',
                fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
              }}>Qty</th>
              <th style={{ 
                padding: '8px 0', 
                fontSize: '9px', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#666',
                textAlign: 'right',
                fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
              }}>Unit Price</th>
              <th style={{ 
                padding: '8px 0', 
                fontSize: '9px', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#666',
                textAlign: 'right',
                fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
              }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sectionIndex) => (
              section.products.map((product, productIndex) => (
                <tr key={`${sectionIndex}-${productIndex}`} style={{ borderBottom: '1px solid #f8f8f8' }}>
                  <td style={{ 
                    padding: '10px 0', 
                    fontSize: '11px', 
                    color: '#888',
                    fontStyle: 'italic',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>
                    {productIndex === 0 ? section.name : ''}
                  </td>
                  <td style={{ 
                    padding: '10px 0', 
                    fontSize: '11px', 
                    color: brandCharcoal,
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>
                    {product.name}
                  </td>
                  <td style={{ 
                    padding: '10px 0', 
                    fontSize: '11px', 
                    color: brandCharcoal,
                    textAlign: 'center',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>
                    {product.quantity}
                  </td>
                  <td style={{ 
                    padding: '10px 0', 
                    fontSize: '11px', 
                    color: brandCharcoal,
                    textAlign: 'right',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>
                    ${formatNumber(product.price)}
                  </td>
                  <td style={{ 
                    padding: '10px 0', 
                    fontSize: '11px', 
                    color: brandCharcoal,
                    textAlign: 'right',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>
                    ${formatNumber(product.price * product.quantity)}
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ width: '350px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Product Subtotal
                </td>
                <td style={{ padding: '8px 0 8px 60px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.productSubtotal)}
                </td>
              </tr>
              
              {totals.standardRateDiscount > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', fontSize: '11px', color: '#059669', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    {proposal.discountName || 'Discount'} ({proposal.discount}% off)
                  </td>
                  <td style={{ padding: '8px 0 8px 60px', fontSize: '11px', color: '#059669', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    -${formatNumber(totals.standardRateDiscount)}
                  </td>
                </tr>
              )}
              
              {totals.extendedRental > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    Extended Rental
                  </td>
                  <td style={{ padding: '8px 0 8px 60px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    ${formatNumber(totals.extendedRental)}
                  </td>
                </tr>
              )}
              
              <tr style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Rental Total
                </td>
                <td style={{ padding: '10px 0 10px 60px', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.rentalTotal)}
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Product Care (10%)
                </td>
                <td style={{ padding: '8px 0 8px 60px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.productCare)}
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Service Fee (5%)
                </td>
                <td style={{ padding: '8px 0 8px 60px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.serviceFee)}
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Delivery
                </td>
                <td style={{ padding: '8px 0 8px 60px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.delivery)}
                </td>
              </tr>
              
              <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Subtotal
                </td>
                <td style={{ padding: '10px 0 10px 60px', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.subtotal)}
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Tax (9.75%)
                </td>
                <td style={{ padding: '8px 0 8px 60px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.tax)}
                </td>
              </tr>
              
              <tr style={{ borderTop: '2px solid ' + brandCharcoal }}>
                <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  TOTAL
                </td>
                <td style={{ padding: '14px 0 14px 60px', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  ${formatNumber(totals.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '30px',
          right: '60px',
          fontSize: '10px',
          color: '#999',
          fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
        }}>{sections.length + 2}</div>
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
  const rentalMultiplier = getRentalMultiplier(duration);
  
  const discountPercent = parseFloat(proposal.discount) || 0;
  const standardRateDiscount = productSubtotal * (discountPercent / 100);
  const standardRateAfterDiscount = productSubtotal - standardRateDiscount;
  const extendedRental = productSubtotal * (rentalMultiplier - 1);
  const rentalTotal = standardRateAfterDiscount + extendedRental;
  
  const productCare = productSubtotal * 0.10;
  const serviceFee = rentalTotal * 0.05;
  const delivery = parseFloat(proposal.deliveryFee) || 0;
  
  const subtotal = rentalTotal + productCare + serviceFee + delivery;
  const tax = subtotal * 0.0975;
  const total = subtotal + tax;
  
  return {
    productSubtotal,
    standardRateDiscount,
    extendedRental,
    rentalTotal,
    productCare,
    serviceFee,
    delivery,
    subtotal,
    tax,
    total
  };
}

function getRentalMultiplier(duration) {
  if (duration <= 1) return 1.0;
  if (duration === 2) return 1.1;
  if (duration === 3) return 1.2;
  if (duration === 4) return 1.3;
  if (duration === 5) return 1.4;
  if (duration === 6) return 1.5;
  if (duration >= 7 && duration <= 14) return 2.0;
  if (duration >= 15 && duration <= 21) return 3.0;
  if (duration >= 22 && duration <= 28) return 4.0;
  return 4.0;
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
