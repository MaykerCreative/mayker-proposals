'use client';

import React, { useState, useEffect } from 'react';

export default function ProposalGenerator() {
  const [proposals, setProposals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const PROPOSALS_API_URL = 'https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec';
  const PRODUCT_SHEET_ID = '116B97xSSUIDDdDLP6vWch4_BIxbEwPLdLO9FtBQZheU';

  const loadProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(PROPOSALS_API_URL);
      const data = await response.json();
      setProposals(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${PRODUCT_SHEET_ID}/gviz/tq?tqx=out:json`
      );
      const text = await response.text();
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[1]);
        const rows = json.table.rows;
        const productList = rows
          .map(row => ({
            name: row.c[0]?.v || '',
            category: row.c[1]?.v || '',
            price: parseFloat(row.c[2]?.v) || 0,
          }))
          .filter(p => p.name && p.category !== 'Fees' && p.name !== 'Product Name');
        setProducts(productList);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  useEffect(() => {
    loadProposals();
    loadProducts();
  }, []);

  const parseSectionsText = (text) => {
    if (!text) return [];
    const sections = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let currentSection = null;
    
    for (const line of lines) {
      if (!line.startsWith('-')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { name: line, products: [] };
      } else if (currentSection) {
        const productLine = line.substring(1).trim();
        const [name, qtyStr] = productLine.split(',').map(s => s.trim());
        if (name && qtyStr) {
          currentSection.products.push({ name, quantity: parseInt(qtyStr) || 1 });
        }
      }
    }
    if (currentSection) sections.push(currentSection);
    return sections;
  };

  const calculateRentalDuration = (start, end) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  };

  const getRentalMultiplier = (days) => {
    if (days <= 1) return 1;
    if (days <= 6) return 0.1 * days + 1;
    if (days <= 14) return 2;
    if (days <= 21) return 3;
    return 4;
  };

  const calculateProposalTotals = (proposal) => {
    const sections = parseSectionsText(proposal.sectionsText);
    let productSubtotal = 0;

    sections.forEach(section => {
      section.products.forEach(item => {
        const product = products.find(p => p.name === item.name);
        if (product) {
          productSubtotal += product.price * item.quantity;
        }
      });
    });

    const days = calculateRentalDuration(proposal.startDate, proposal.endDate);
    const multiplier = getRentalMultiplier(days);
    const extendedRental = productSubtotal * (multiplier - 1);
    const discount = productSubtotal * (proposal.discountPercent / 100);
    const productsAfterDiscount = extendedRental - discount;

    const productCare = productSubtotal * 0.1;
    const deliveryFee = parseFloat(proposal.deliveryFee) || 0;
    const serviceFeeBase = productsAfterDiscount + productCare + deliveryFee;
    const serviceFee = serviceFeeBase * 0.05;

    const subtotal = productsAfterDiscount + productCare + deliveryFee + serviceFee;
    const tax = subtotal * 0.0975;
    const total = subtotal + tax;

    return { productSubtotal, extendedRental, discount, productsAfterDiscount, productCare, deliveryFee, serviceFee, subtotal, tax, total, days };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (selectedProposal) {
    const totals = calculateProposalTotals(selectedProposal);
    const sections = parseSectionsText(selectedProposal.sectionsText);

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
        <button onClick={() => setSelectedProposal(null)} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>

        <div style={{ backgroundColor: '#545142', color: 'white', padding: '60px 40px', textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ margin: '0 0 20px 0', fontSize: '48px', fontWeight: 'bold', letterSpacing: '8px' }}>MAYKER EVENTS</h1>
          <p style={{ margin: 0, fontSize: '18px', letterSpacing: '2px' }}>PROPOSAL</p>
        </div>

        <div style={{ padding: '40px', borderBottom: '1px solid #e5e5e5', marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Client</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{selectedProposal.clientName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Location</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{selectedProposal.venueName}, {selectedProposal.city}, {selectedProposal.state}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Event Dates</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{formatDate(selectedProposal.startDate)} - {formatDate(selectedProposal.endDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Duration</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{totals.days} days</div>
            </div>
          </div>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} style={{ padding: '40px', borderBottom: '1px solid #e5e5e5', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '16px', fontFamily: 'Georgia, serif', marginBottom: '30px', color: '#545142', margin: '0 0 30px 0' }}>
              {section.name}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
              {section.products.map((item, pIdx) => {
                const product = products.find(p => p.name === item.name);
                return (
                  <div key={pIdx}>
                    <div style={{ backgroundColor: '#f5f5f5', height: '250px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                      [Product Image]
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Qty: {item.quantity}</div>
                    <div style={{ fontSize: '12px', fontWeight: '500' }}>${((product?.price || 0) * item.quantity).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ padding: '40px', maxWidth: '600px', marginLeft: 'auto' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Product Subtotal</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>${totals.productSubtotal.toFixed(2)}</span>
          </div>
          {totals.extendedRental > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px' }}>Extended Rental ({totals.days} days)</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>${totals.extendedRental.toFixed(2)}</span>
            </div>
          )}
          {totals.discount > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
              <span style={{ fontSize: '13px' }}>{selectedProposal.discountName || 'Discount'} ({selectedProposal.discountPercent}% off)</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>-${totals.discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Rental Total</span>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>${totals.productsAfterDiscount.toFixed(2)}</span>
          </div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Product Care (10%)</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>${totals.productCare.toFixed(2)}</span>
          </div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Service Fee (5%)</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>${totals.serviceFee.toFixed(2)}</span>
          </div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Delivery</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>${totals.deliveryFee.toFixed(2)}</span>
          </div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
            <span style={{ fontSize: '13px' }}>Subtotal</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Tax (9.75%)</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>${totals.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #545142', paddingTop: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700' }}>TOTAL</span>
            <span style={{ fontSize: '14px', fontWeight: '700' }}>${totals.total.toFixed(2)}</span>
          </div>
        </div>

        <button onClick={() => window.print()} style={{ marginTop: '40px', width: '100%', padding: '15px', fontSize: '16px', backgroundColor: '#545142', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          Print / Export as PDF
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '300' }}>Proposal Generator</h1>
        <button 
          onClick={loadProposals}
          disabled={loading}
          style={{ padding: '12px 24px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, backgroundColor: '#545142', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee', color: '#c00', padding: '15px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #fcc' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {proposals.length === 0 ? (
        <p style={{ color: '#666', fontSize: '16px' }}>No proposals found. Submit a form through Fillout and click Refresh to load proposals.</p>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Client</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Venue</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Dates</th>
                <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Total</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p, idx) => {
                const totals = calculateProposalTotals(p);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px' }}>{p.clientName}</td>
                    <td style={{ padding: '15px' }}>{p.venueName}</td>
                    <td style={{ padding: '15px', fontSize: '14px', color: '#666' }}>
                      {formatDate(p.startDate)} - {formatDate(p.endDate)}
                    </td>
                    <td style={{ padding: '15px', fontWeight: '600' }}>${totals.total.toFixed(2)}</td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedProposal(p)}
                        style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#545142', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
