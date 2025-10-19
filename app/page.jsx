'use client';

import React, { useState, useEffect } from 'react';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz327RAdHGdwXmwyHVygb78JtzQ09819Kih3zvJ3wVpiHbDV6jpgYZDz8q6x0acS1r6/exec';

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
      setLoading(true);
      const response = await fetch(APPS_SCRIPT_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setProposals(Array.isArray(data) ? data : []);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch proposals: ${err.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid #e5e7eb', borderTop: '3px solid #1f2937', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading proposals...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchProposals} style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  if (selectedProposal) {
    return <ProposalView proposal={selectedProposal} onBack={() => setSelectedProposal(null)} onPrint={() => window.print()} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Mayker Proposals</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>Manage and view all proposals</p>
        <button onClick={fetchProposals} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '24px' }}>Refresh</button>
        {proposals.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', textAlign: 'center', color: '#6b7280' }}>No proposals found.</div>
        ) : (
          <div style={{ backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Client</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Event Date</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Total</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal, index) => (
                  <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{proposal.clientName}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{proposal.venueName}, {proposal.city}, {proposal.state}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{formatDateRange(proposal)}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>${calculateTotal(proposal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '16px 24px' }}><button onClick={() => setSelectedProposal(proposal)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        @font-face { font-family: 'Neue Haas Unica'; src: url('/NeueHaasUnica-Regular.ttf') format('truetype'); }
        @font-face { font-family: 'Domaine Text'; src: url('/TestDomaineText-Light.otf') format('opentype'); }
        body { font-family: 'Neue Haas Unica', 'Inter', sans-serif; }
        @media print { .no-print { display: none !important; } .print-break-after { page-break-after: always; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: letter; margin: 0; } }
      ` }} />
      <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', zIndex: 1000, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>← Back</button>
          <button onClick={onPrint} style={{ padding: '8px 20px', backgroundColor: brandCharcoal, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print PDF</button>
        </div>
      </div>
      <div className="print-break-after" style={{ backgroundColor: brandTaupe, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 48px', marginTop: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '24px', fontFamily: "'Neue Haas Unica'" }}>MAYKER EVENTS</div>
          <div style={{ width: '60px', height: '0.5px', backgroundColor: 'rgba(255,255,255,0.4)', margin: '0 auto 24px' }}></div>
          <p style={{ fontSize: '14px', color: 'white', textTransform: 'uppercase', marginBottom: '16px' }}>Product Selections</p>
          <p style={{ fontSize: '24px', color: 'white', marginBottom: '6px', fontFamily: "'Domaine Text'" }}>{proposal.clientName}</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{proposal.venueName}</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{formatDateRange(proposal)}</p>
        </div>
      </div>
      {sections.map((section, idx) => (
        <div key={idx} className="print-break-after" style={{ minHeight: '100vh', padding: '30px 60px 40px', position: 'relative' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: brandCharcoal, marginBottom: '30px' }}>MAYKER EVENTS</h1>
          <h2 style={{ fontSize: '18px', color: brandCharcoal, textTransform: 'uppercase', marginBottom: '20px' }}>{section.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {section.products.map((product, pidx) => (
              <div key={pidx} style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                <div style={{ aspectRatio: '1', backgroundColor: '#e5e5e5', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '2px' }}>
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} /> : <span style={{ color: '#999' }}>[No Image]</span>}
                </div>
                <h3 style={{ fontSize: '11px', fontWeight: '500', color: brandCharcoal, textTransform: 'uppercase', marginBottom: '4px' }}>{product.name}</h3>
                <p style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Qty: {product.quantity}</p>
                <p style={{ fontSize: '13px', fontWeight: '400', color: brandCharcoal }}>${product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: '30px', right: '60px', fontSize: '10px', color: '#999' }}>{idx + 2}</div>
        </div>
      ))}
      <div style={{ minHeight: '100vh', padding: '30px 60px 40px', position: 'relative' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: brandCharcoal, marginBottom: '30px' }}>MAYKER EVENTS</h1>
        <h2 style={{ fontSize: '18px', color: brandCharcoal, textTransform: 'uppercase', textAlign: 'center', marginBottom: '30px' }}>Estimate</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', color: '#666', textAlign: 'left' }}>Section</th>
              <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', color: '#666', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', color: '#666', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', color: '#666', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', color: '#666', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sidx) => section.products.map((product, pidx) => (
              <tr key={`${sidx}-${pidx}`} style={{ borderBottom: '1px solid #f8f8f8' }}>
                <td style={{ padding: '10px 0', fontSize: '11px', color: '#888' }}>{pidx === 0 ? section.name : ''}</td>
                <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal }}>{product.name}</td>
                <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'center' }}>{product.quantity}</td>
                <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right' }}>${product.price.toFixed(2)}</td>
                <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right' }}>${(product.price * product.quantity).toFixed(2)}</td>
              </tr>
            )))}
          </tbody>
        </table>
        <div style={{ maxWidth: '350px', marginLeft: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '8px 0', fontSize: '11px', color: '#666' }}>Product Subtotal</td><td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontWeight: '500' }}>${totals.productSubtotal.toFixed(2)}</td></tr>
              {totals.standardRateDiscount > 0 && <tr><td style={{ padding: '8px 0', fontSize: '11px', color: '#059669' }}>Discount ({proposal.discount}%)</td><td style={{ padding: '8px 0', fontSize: '11px', color: '#059669', textAlign: 'right', fontWeight: '500' }}>-${totals.standardRateDiscount.toFixed(2)}</td></tr>}
              {totals.extendedRental > 0 && <tr><td style={{ padding: '8px 0', fontSize: '11px', color: '#666' }}>Extended Rental</td><td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontWeight: '500' }}>${totals.extendedRental.toFixed(2)}</td></tr>}
              <tr style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal }}>Rental Total</td><td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right' }}>${totals.rentalTotal.toFixed(2)}</td></tr>
              <tr><td style={{ padding: '8px 0', fontSize: '11px', color: '#666' }}>Product Care (10%)</td><td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontWeight: '500' }}>${totals.productCare.toFixed(2)}</td></tr>
              <tr><td style={{ padding: '8px 0', fontSize: '11px', color: '#666' }}>Service Fee (5%)</td><td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontWeight: '500' }}>${totals.serviceFee.toFixed(2)}</td></tr>
              <tr><td style={{ padding: '8px 0', fontSize: '11px', color: '#666' }}>Delivery</td><td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontWeight: '500' }}>${totals.delivery.toFixed(2)}</td></tr>
              <tr style={{ borderTop: '1px solid #e5e7eb' }}><td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal }}>Subtotal</td><td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right' }}>${totals.subtotal.toFixed(2)}</td></tr>
              <tr><td style={{ padding: '8px 0', fontSize: '11px', color: '#666' }}>Tax (9.75%)</td><td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontWeight: '500' }}>${totals.tax.toFixed(2)}</td></tr>
              <tr style={{ borderTop: '2px solid ' + brandCharcoal }}><td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal }}>TOTAL</td><td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right' }}>${totals.total.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function calculateTotal(proposal) {
  return calculateDetailedTotals(proposal).total;
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

  return { productSubtotal, standardRateDiscount, extendedRental, rentalTotal, productCare, serviceFee, delivery, subtotal, tax, total };
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
  if (duration >= 22) return 4.0;
  return 1.0;
}

function formatDateRange(proposal) {
  const start = new Date(proposal.startDate);
  const end = new Date(proposal.endDate);
  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();
  return startMonth === endMonth ? `${startMonth} ${startDay}-${endDay}, ${year}` : `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

function getDuration(proposal) {
  const start = new Date(proposal.startDate);
  const end = new Date(proposal.endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}
