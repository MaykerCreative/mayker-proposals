'use client';

import React, { useState, useEffect } from 'react';

export default function ProposalApp() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProposals = () => {
    setLoading(true);
    fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec')
      .then(r => r.json())
      .then(data => {
        console.log('Raw data from API:', data, 'Is array?', Array.isArray(data));
        
        if (!Array.isArray(data)) {
          console.error('Data is not an array!', typeof data);
          setProposals([]);
          setLoading(false);
          return;
        }

        const parsed = data.map(p => {
          try {
            // Only parse if it looks like JSON (contains [ and {)
            if (typeof p.proposalSectionsProducts === 'string' && p.proposalSectionsProducts.trim().startsWith('[')) {
              p.sections = JSON.parse(p.proposalSectionsProducts.trim());
            } else {
              p.sections = [];
            }
          } catch (e) {
            console.error('Parse error for', p.clientName, ':', e);
            p.sections = [];
          }
          if (p.startDate && p.endDate) {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            p.duration = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
          }
          return p;
        }).filter(p => p.sections && p.sections.length > 0); // Only include proposals with valid sections
        console.log('Parsed proposals:', parsed.length);
        setProposals(parsed);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProposals();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading proposals...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedProposal ? (
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Mayker Proposals</h1>
            <button 
              onClick={loadProposals}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          {proposals.length === 0 ? (
            <p className="text-gray-600">No proposals found</p>
          ) : (
            <div className="space-y-3">
              {proposals.map((p, i) => (
                <div 
                  key={i}
                  onClick={() => setSelectedProposal(p)}
                  className="p-4 bg-white border border-gray-200 rounded cursor-pointer hover:shadow-md transition"
                >
                  <div className="font-semibold text-lg">{p.clientName}</div>
                  <div className="text-sm text-gray-600">{p.venueName} • {p.city}, {p.state}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ProposalView proposal={selectedProposal} onBack={() => setSelectedProposal(null)} />
      )}
    </div>
  );
}

function ProposalView({ proposal, onBack }) {
  const calcPricing = () => {
    let productSubtotal = 0;
    
    if (proposal.sections && Array.isArray(proposal.sections)) {
      proposal.sections.forEach(section => {
        if (section.products && Array.isArray(section.products)) {
          section.products.forEach(product => {
            productSubtotal += (product.price || 0) * (product.qty || 1);
          });
        }
      });
    }

    const duration = proposal.duration || 1;
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
  };

  const pricing = calcPricing();

  return (
    <div className="min-h-screen bg-white">
      <button 
        onClick={onBack}
        className="sticky top-0 left-0 p-4 text-blue-600 hover:underline bg-white z-10"
      >
        ← Back
      </button>

      {/* Cover Page */}
      <div className="min-h-screen bg-gradient-to-br from-[#8B8B7F] to-[#A9A99E] flex flex-col justify-center items-center text-white p-8 page-break">
        <div className="text-center">
          <h1 className="text-6xl font-light mb-4">MAYKER</h1>
          <p className="text-2xl tracking-wide">STAGING + EVENTS</p>
        </div>
      </div>

      {/* Product Sections */}
      {Array.isArray(proposal.sections) && proposal.sections.length > 0 ? (
        proposal.sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="min-h-screen p-12 page-break">
            <h2 className="text-3xl font-light mb-8 pb-4 border-b border-gray-300">
              {section.placement}
            </h2>
            
            {section.products && section.products.length > 0 ? (
              <div className="grid grid-cols-2 gap-8">
                {section.products.map((product, prodIdx) => (
                  <div key={prodIdx} className="flex flex-col">
                    <div className="bg-gray-100 aspect-square rounded mb-4 flex items-center justify-center overflow-hidden">
                      <span className="text-gray-400 text-center px-4">Product Image</span>
                    </div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm mt-2">Qty: {product.qty}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No products in this section</p>
            )}
          </div>
        ))
      ) : (
        <div className="min-h-screen p-12 flex items-center justify-center">
          <p className="text-gray-500">No product sections configured</p>
        </div>
      )}

      {/* Estimate Page */}
      <div className="min-h-screen p-12 page-break">
        <h2 className="text-3xl font-light mb-8 pb-4 border-b border-gray-300">Estimate</h2>
        
        <div className="max-w-2xl">
          <table className="w-full text-sm mb-8">
            <tbody>
              <tr className="border-b">
                <td className="py-2">Product Subtotal</td>
                <td className="text-right font-semibold">${pricing.productSubtotal.toFixed(2)}</td>
              </tr>
              {pricing.extendedRental > 0 && (
                <tr className="border-b">
                  <td className="py-2">Extended Rental ({proposal.duration - 1} days @ 30%)</td>
                  <td className="text-right">${pricing.extendedRental.toFixed(2)}</td>
                </tr>
              )}
              {pricing.discount > 0 && (
                <tr className="border-b">
                  <td className="py-2">{proposal.discountName || 'Discount'} ({proposal.discountPercent}%)</td>
                  <td className="text-right text-red-600">-${pricing.discount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="border-b-2 border-gray-400 font-semibold">
                <td className="py-3">Rental Total</td>
                <td className="text-right py-3">${pricing.rentalTotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Product Care (10%)</td>
                <td className="text-right">${pricing.productCare.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Service Fee (5%)</td>
                <td className="text-right">${pricing.serviceFee.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Delivery</td>
                <td className="text-right">${pricing.delivery.toFixed(2)}</td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="py-2">Subtotal</td>
                <td className="text-right">${pricing.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Tax (9.75%)</td>
                <td className="text-right">${pricing.tax.toFixed(2)}</td>
              </tr>
              <tr className="font-semibold text-lg">
                <td className="py-4">Total</td>
                <td className="text-right py-4 text-xl">${pricing.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Print / Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
