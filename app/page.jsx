'use client';

import React, { useState, useEffect } from 'react';

export default function ProposalApp() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec')
      .then(r => r.json())
      .then(data => {
        const parsed = data.map(p => {
          try {
            p.sections = typeof p.proposalSectionsProducts === 'string' 
              ? JSON.parse(p.proposalSectionsProducts) 
              : [];
          } catch (e) {
            p.sections = [];
          }
          const start = new Date(p.startDate);
          const end = new Date(p.endDate);
          p.duration = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
          return p;
        });
        setProposals(parsed);
        setLoading(false);
      })
      .catch(e => console.error(e));
  }, []);

  if (loading) return <div className="p-8">Loading proposals...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedProposal ? (
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Mayker Proposals</h1>
            <button onClick={() => location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">Refresh</button>
          </div>
          <div className="space-y-4">
            {proposals.map((p, i) => (
              <div key={i} onClick={() => setSelectedProposal(p)} className="p-4 bg-white border rounded cursor-pointer hover:shadow-lg">
                <div className="font-semibold">{p.clientName}</div>
                <div className="text-sm text-gray-600">{p.venueName} • {p.city}, {p.state}</div>
                <button className="mt-2 text-blue-600 hover:underline">View</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ProposalView proposal={selectedProposal} onBack={() => setSelectedProposal(null)} />
      )}
    </div>
  );
}

function ProposalView({ proposal, onBack }) {
  const pricing = (() => {
    let subtotal = 0;
    proposal.sections?.forEach(s => {
      s.products?.forEach(p => {
        subtotal += (p.price || 0) * (p.qty || 1);
      });
    });
    const extended = proposal.duration > 1 ? subtotal * 0.3 * (proposal.duration - 1) : 0;
    const discount = (subtotal + extended) * ((proposal.discountPercent || 0) / 100);
    const rental = subtotal + extended - discount;
    const care = subtotal * 0.1;
    const service = rental * 0.05;
    const delivery = parseFloat(proposal.deliveryFee) || 0;
    const total = rental + care + service + delivery;
    const tax = total * 0.0975;
    return { subtotal, extended, discount, rental, care, service, delivery, total: total + tax, tax };
  })();

  return (
    <div className="min-h-screen bg-white">
      <button onClick={onBack} className="p-4 text-blue-600 hover:underline">← Back</button>
      
      <div className="min-h-screen bg-gradient-to-br from-[#8B8B7F] to-[#A9A99E] flex flex-col justify-center items-center text-white p-8">
        <div className="text-center">
          <h1 className="text-5xl font-light mb-2">MAYKER</h1>
          <p className="text-xl tracking-wide">STAGING + EVENTS</p>
        </div>
      </div>

      {proposal.sections?.map((s, i) => (
        <div key={i} className="min-h-screen p-12">
          <h2 className="text-3xl font-light mb-8 pb-4 border-b">{s.placement}</h2>
          <div className="grid grid-cols-2 gap-8">
            {s.products?.map((p, j) => (
              <div key={j}>
                <div className="bg-gray-100 aspect-square rounded mb-4"></div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-gray-600">Qty: {p.qty}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="min-h-screen p-12">
        <h2 className="text-3xl font-light mb-8 pb-4 border-b">Estimate</h2>
        <table className="w-full text-sm mb-6">
          <tbody>
            <tr className="border-b"><td className="py-2">Product Subtotal</td><td className="text-right">${pricing.subtotal.toFixed(2)}</td></tr>
            {pricing.extended > 0 && <tr className="border-b"><td className="py-2">Extended Rental</td><td className="text-right">${pricing.extended.toFixed(2)}</td></tr>}
            {pricing.discount > 0 && <tr className="border-b"><td className="py-2">{proposal.discountName || 'Discount'}</td><td className="text-right">-${pricing.discount.toFixed(2)}</td></tr>}
            <tr className="border-b font-semibold"><td className="py-2">Rental Total</td><td className="text-right">${pricing.rental.toFixed(2)}</td></tr>
            <tr className="border-b"><td className="py-2">Product Care</td><td className="text-right">${pricing.care.toFixed(2)}</td></tr>
            <tr className="border-b"><td className="py-2">Service Fee</td><td className="text-right">${pricing.service.toFixed(2)}</td></tr>
            <tr className="border-b"><td className="py-2">Delivery</td><td className="text-right">${pricing.delivery.toFixed(2)}</td></tr>
            <tr className="border-b"><td className="py-2">Subtotal</td><td className="text-right">${(pricing.rental + pricing.care + pricing.service + pricing.delivery).toFixed(2)}</td></tr>
            <tr className="border-b"><td className="py-2">Tax</td><td className="text-right">${pricing.tax.toFixed(2)}</td></tr>
            <tr className="font-semibold text-lg"><td className="py-4">Total</td><td className="text-right py-4">${pricing.total.toFixed(2)}</td></tr>
          </tbody>
        </table>
        <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded">Print PDF</button>
      </div>
    </div>
  );
}
