'use client';

import React, { useState, useEffect } from 'react';

// Fuzzy string matching for typo tolerance
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[len2][len1];
}

function findClosestMatch(productName, catalog) {
  const searchName = productName.toLowerCase().trim();
  let closestMatch = null;
  let minDistance = Infinity;

  catalog.forEach(item => {
    const distance = levenshteinDistance(searchName, item.name.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = item;
    }
  });

  return minDistance <= 3 ? closestMatch : null;
}

function getProductData(productName, catalog) {
  let product = catalog.find(p => p.name.toLowerCase() === productName.toLowerCase().trim());
  
  if (!product) {
    product = findClosestMatch(productName, catalog);
  }

  return product || { name: productName, imageUrl: null, price: 0 };
}

export default function ProposalApp() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [catalog, setCatalog] = useState([]);

  // Fetch product catalog from Vercel API
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch('/api/catalog');
        const data = await response.json();
        if (Array.isArray(data)) {
          setCatalog(data);
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      }
    };

    fetchCatalog();
  }, []);

  // Fetch proposals from Google Apps Script
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/proposals');
        const data = await response.json();
        
        const parsedProposals = data.map(proposal => {
          try {
            if (proposal.proposalSectionsProducts && typeof proposal.proposalSectionsProducts === 'string') {
              proposal.sections = JSON.parse(proposal.proposalSectionsProducts);
            } else if (Array.isArray(proposal.proposalSectionsProducts)) {
              proposal.sections = proposal.proposalSectionsProducts;
            } else {
              proposal.sections = [];
            }
          } catch (e) {
            console.error('Error parsing sections:', e);
            proposal.sections = [];
          }
          
          if (proposal.startDate && proposal.endDate) {
            const start = new Date(proposal.startDate);
            const end = new Date(proposal.endDate);
            const diffTime = Math.abs(end - start);
            proposal.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          } else {
            proposal.duration = 1;
          }
          
          return proposal;
        });
        
        setProposals(parsedProposals);
      } catch (err) {
        setError(err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

      try {
        setLoading(true);
        const response = await fetch('/api/proposals');
      const data = await response.json();
      
      const parsedProposals = data.map(proposal => {
        try {
          if (proposal.proposalSectionsProducts && typeof proposal.proposalSectionsProducts === 'string') {
            proposal.sections = JSON.parse(proposal.proposalSectionsProducts);
          } else if (Array.isArray(proposal.proposalSectionsProducts)) {
            proposal.sections = proposal.proposalSectionsProducts;
          } else {
            proposal.sections = [];
          }
        } catch (e) {
          proposal.sections = [];
        }
        
        if (proposal.startDate && proposal.endDate) {
          const start = new Date(proposal.startDate);
          const end = new Date(proposal.endDate);
          const diffTime = Math.abs(end - start);
          proposal.duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        } else {
          proposal.duration = 1;
        }
        
        return proposal;
      });
      
      setProposals(parsedProposals);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading proposals...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedProposal ? (
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Mayker Proposals</h1>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>

          {proposals.length === 0 ? (
            <div className="text-gray-600">No proposals yet</div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedProposal(proposal)}
                  className="p-4 bg-white border rounded cursor-pointer hover:shadow-lg transition"
                >
                  <div className="font-semibold">{proposal.clientName}</div>
                  <div className="text-sm text-gray-600">{proposal.venueName} • {proposal.city}, {proposal.state}</div>
                  <button className="mt-2 text-blue-600 hover:underline">View Proposal</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ProposalView
          proposal={selectedProposal}
          catalog={catalog}
          onBack={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
}

function ProposalView({ proposal, catalog, onBack }) {
  const calculatePricing = () => {
    let productSubtotal = 0;

    if (proposal.sections && Array.isArray(proposal.sections)) {
      proposal.sections.forEach(section => {
        if (section.products && Array.isArray(section.products)) {
          section.products.forEach(product => {
            const productData = getProductData(product.name, catalog);
            productSubtotal += productData.price * (product.qty || 1);
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

    return { productSubtotal, extendedRental, discount, rentalTotal, productCare, serviceFee, delivery, subtotal, tax, total };
  };

  const pricing = calculatePricing();

  return (
    <div className="min-h-screen bg-white">
      <button
        onClick={onBack}
        className="p-4 text-blue-600 hover:underline"
      >
        ← Back
      </button>

      {/* Cover Page */}
      <div className="min-h-screen bg-gradient-to-br from-[#8B8B7F] to-[#A9A99E] flex flex-col justify-center items-center text-white p-8 page-break">
        <div className="text-center">
          <div className="mb-8">
            <svg width="80" height="80" viewBox="0 0 100 100" className="mx-auto">
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" />
              <text x="50" y="60" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">MK</text>
            </svg>
          </div>
          <h1 className="text-5xl font-light mb-2">MAYKER</h1>
          <p className="text-xl tracking-wide">STAGING + EVENTS</p>
        </div>
      </div>

      {/* Product Sections */}
      {proposal.sections && proposal.sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="min-h-screen p-12 page-break">
          <h2 className="text-3xl font-light mb-8 pb-4 border-b border-gray-300">{section.placement}</h2>
          
          <div className="grid grid-cols-2 gap-8">
            {section.products && section.products.map((product, prodIdx) => {
              const productData = getProductData(product.name, catalog);
              return (
                <div key={prodIdx} className="flex flex-col">
                  <div className="bg-gray-100 aspect-square rounded mb-4 overflow-hidden flex items-center justify-center">
                    {productData.imageUrl ? (
                      <img src={productData.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <span className="text-gray-400">No image available</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-gray-600">Qty: {product.qty}</p>
                  {productData.price > 0 && (
                    <p className="text-gray-800 font-medium">${(productData.price * product.qty).toFixed(2)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Estimate Page */}
      <div className="min-h-screen p-12 page-break">
        <h2 className="text-3xl font-light mb-8 pb-4 border-b border-gray-300">Estimate</h2>
        
        <div className="mb-8">
          <table className="w-full text-sm mb-6">
            <tbody>
              <tr className="border-b">
                <td className="py-2">Product Subtotal</td>
                <td className="text-right font-semibold">${pricing.productSubtotal.toFixed(2)}</td>
              </tr>
              {pricing.extendedRental > 0 && (
                <tr className="border-b">
                  <td className="py-2">Extended Rental</td>
                  <td className="text-right">${pricing.extendedRental.toFixed(2)}</td>
                </tr>
              )}
              {pricing.discount > 0 && (
                <tr className="border-b">
                  <td className="py-2">{proposal.discountName || 'Discount'}</td>
                  <td className="text-right">-${pricing.discount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="border-b font-semibold">
                <td className="py-2">Rental Total</td>
                <td className="text-right">${pricing.rentalTotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Product Care</td>
                <td className="text-right">${pricing.productCare.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Service Fee</td>
                <td className="text-right">${pricing.serviceFee.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Delivery</td>
                <td className="text-right">${pricing.delivery.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Subtotal</td>
                <td className="text-right">${pricing.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Tax (9.75%)</td>
                <td className="text-right">${pricing.tax.toFixed(2)}</td>
              </tr>
              <tr className="font-semibold text-lg">
                <td className="py-4">Total</td>
                <td className="text-right py-4">${pricing.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Print / Download PDF
        </button>
      </div>
    </div>
  );
}
