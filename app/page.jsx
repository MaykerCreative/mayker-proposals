'use client';

import React, { useState, useEffect } from 'react';

export default function ProposalApp() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalog, setCatalog] = useState({});

  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    if (Object.keys(catalog).length > 0) {
      fetchProposals();
    }
  }, [catalog]);

  const fetchCatalog = async () => {
    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/116B97xSSUIDDdDLP6vWch4_BIxbEwPLdLO9FtBQZheU/export?format=csv');
      const csv = await response.text();
      const lines = csv.split('\n');
      const catalogMap = {};
      
      // Skip header row and build product -> price map
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // CSV parsing - handle quotes and commas
        const parsed = parseCSVLine(line);
        if (parsed.length >= 2) {
          const productName = parsed[0].trim().toUpperCase();
          const price = parseFloat(parsed[1]);
          if (!isNaN(price)) {
            catalogMap[productName] = price;
          }
        }
      }
      
      setCatalog(catalogMap);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      setCatalog({});
    }
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec');
      
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
          discountPercent: "15",
          discountName: "Mayker Reserve",
          clientFolderURL: "",
          sectionsAndProducts: `Cocktail Hour
- Concrete Bar, 1
Dinner
- Aurora Swivel Chair (Sage), 2
- Cooper End Table, 2`
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
    return <ProposalView proposal={selectedProposal} onBack={backToDashboard} onPrint={printProposal} catalog={catalog} />;
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

function parseProductsFromText(productText, catalog = {}) {
  if (!productText || typeof productText !== 'string') {
    return [];
  }

  const lines = productText.split('\n').map(line => line.trim()).filter(line => line);
  const sections = [];
  let currentSection = null;

  lines.forEach(line => {
    if (line.startsWith('- ')) {
      // This is a product line
      if (currentSection) {
        const productLine = line.substring(2); // Remove "- "
        
        // Parse "Product Name, Quantity" format
        const lastCommaIndex = productLine.lastIndexOf(',');
        if (lastCommaIndex !== -1) {
          const name = productLine.substring(0, lastCommaIndex).trim();
          const quantity = parseInt(productLine.substring(lastCommaIndex + 1).trim(), 10);
          
          if (!isNaN(quantity)) {
            // Look up price from catalog
            const productKey = name.toUpperCase();
            const price = catalog[productKey] || 0;
            
            currentSection.products.push({
              name: name,
              quantity: quantity,
              price: price
            });
          }
        }
      }
    } else {
      // This is a section header
      currentSection = {
        name: line,
        products: []
      };
      sections.push(currentSection);
    }
  });

  return sections;
}

function ProposalView({ proposal, onBack, onPrint, catalog }) {
  const sections = parseProductsFromText(proposal.sectionsAndProducts || '', catalog);
  const totals = calculateDetailedTotals(proposal, sections);
  
  // Mayker brand colors
  const brandTaupe = '#545142';
  const brandCharcoal = '#2C2C2C';
  
  // Calculate total pages
  const totalPages = 2 + sections.length + 2; // Cover + Info + Product sections + Itemized + Pricing
  
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

      {/* Page 1: Cover Page */}
      <div className="print-break-after" style={{
        backgroundColor: brandTaupe,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '60px 48px',
        position: 'relative'
      }}>
        {/* Top section with logo and text */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '-60px'
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
        
        {/* Bottom section with logo mark */}
        <img 
          src="/mayker_icon-whisper.svg"
          alt="Mayker Events"
          style={{
            width: '60px',
            height: '60px',
            marginBottom: '20px'
          }}
        />
      </div>

      {/* Page 2 onwards: Product Section Pages with integrated header */}
      {sections.map((section, sectionIndex) => {
        const pageNum = sectionIndex + 2; // Starting from page 2
        return (
          <div key={sectionIndex} className="print-break-after" style={{ 
            minHeight: '100vh',
            padding: '30px 60px 40px',
            position: 'relative'
          }}>
            {/* Compact Header with stacked info */}
            <div style={{
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {/* Top row: Logo and stacked event info */}
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
                
                {/* Stacked info on right */}
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
            
            {/* Section Title */}
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
            
            {/* Products Grid */}
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
                    color: '#999'
                  }}>
                    [Product Image]
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
                  }}>$0.00</p>
                </div>
              ))}
            </div>
            
            {/* Page number */}
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

      {/* Combined Estimate Page - Itemized List + Pricing */}
      <div style={{ 
        minHeight: '100vh',
        padding: '30px 60px 40px',
        position: 'relative'
      }}>
        {/* Compact Header with stacked info */}
        <div style={{
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {/* Top row: Logo and stacked event info */}
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
            
            {/* Stacked info on right */}
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
        
        {/* Itemized Products Table */}
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
                    $0.00
                  </td>
                  <td style={{ 
                    padding: '10px 0', 
                    fontSize: '11px', 
                    color: brandCharcoal,
                    textAlign: 'right',
                    fontFamily: "'Neue Haas Unica', 'Inter', sans-serif"
                  }}>
                    $0.00
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
        
        {/* Pricing Breakdown - Right aligned */}
        <div style={{ maxWidth: '350px', marginLeft: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Product Subtotal
                </td>
                <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
              
              {totals.extendedRental > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    Extended Rental ({getDuration(proposal)} days)
                  </td>
                  <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    $0.00
                  </td>
                </tr>
              )}
              
              {totals.discount > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', fontSize: '11px', color: '#059669', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    {proposal.discountName || 'Discount'} ({proposal.discountPercent}% off)
                  </td>
                  <td style={{ padding: '8px 0', fontSize: '11px', color: '#059669', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    -$0.00
                  </td>
                </tr>
              )}
              
              <tr style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Rental Total
                </td>
                <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Product Care (10%)
                </td>
                <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Service Fee (5%)
                </td>
                <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Delivery
                </td>
                <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
              
              <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Subtotal
                </td>
                <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  Tax (9.75%)
                </td>
                <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
              
              <tr style={{ borderTop: '2px solid ' + brandCharcoal }}>
                <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  TOTAL
                </td>
                <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                  $0.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Page number */}
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

function parseProductsFromText(productText) {
  if (!productText || typeof productText !== 'string') {
    return [];
  }

  const lines = productText.split('\n').map(line => line.trim()).filter(line => line);
  const sections = [];
  let currentSection = null;

  lines.forEach(line => {
    if (line.startsWith('- ')) {
      // This is a product line
      if (currentSection) {
        const productLine = line.substring(2); // Remove "- "
        
        // Parse "Product Name, Quantity" format
        const lastCommaIndex = productLine.lastIndexOf(',');
        if (lastCommaIndex !== -1) {
          const name = productLine.substring(0, lastCommaIndex).trim();
          const quantity = parseInt(productLine.substring(lastCommaIndex + 1).trim(), 10);
          
          if (!isNaN(quantity)) {
            // Look up price from catalog
            const productKey = name.toUpperCase();
            const price = catalog[productKey] || 0;
            
            currentSection.products.push({
              name: name,
              quantity: quantity,
              price: price
            });
          }
        }
      }
    } else {
      // This is a section header
      currentSection = {
        name: line,
        products: []
      };
      sections.push(currentSection);
    }
  });

  return sections;
}

function calculateTotal(proposal) {
  const sections = parseProductsFromText(proposal.sectionsAndProducts || '', {});
  const totals = calculateDetailedTotals(proposal, sections);
  return totals.total;
}

function calculateDetailedTotals(proposal, sections) {
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
