'use client';

import React, { useState, useEffect } from 'react';

// ============================================
// HELPER FUNCTIONS - Date & Timezone Fixes
// ============================================

// Parse date string (YYYY-MM-DD) in a timezone-safe way
function parseDateSafely(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const dateMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const day = parseInt(dateMatch[3], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

// Get timezone from state code
function getTimezoneFromState(stateCode) {
  const STATE_TIMEZONES = {
    'AL': 'America/Chicago', 'AK': 'America/Anchorage', 'AZ': 'America/Phoenix',
    'AR': 'America/Chicago', 'CA': 'America/Los_Angeles', 'CO': 'America/Denver',
    'CT': 'America/New_York', 'DC': 'America/New_York', 'DE': 'America/New_York',
    'FL': 'America/New_York', 'GA': 'America/New_York', 'HI': 'Pacific/Honolulu',
    'ID': 'America/Denver', 'IL': 'America/Chicago', 'IN': 'America/Indiana/Indianapolis',
    'IA': 'America/Chicago', 'KS': 'America/Chicago', 'KY': 'America/New_York',
    'LA': 'America/Chicago', 'ME': 'America/New_York', 'MD': 'America/New_York',
    'MA': 'America/New_York', 'MI': 'America/Detroit', 'MN': 'America/Chicago',
    'MS': 'America/Chicago', 'MO': 'America/Chicago', 'MT': 'America/Denver',
      'NE': 'America/Chicago', 'NV': 'America/Los_Angeles', 'NH': 'America/New_York',
    'NJ': 'America/New_York', 'NM': 'America/Denver', 'NY': 'America/New_York',
    'NC': 'America/New_York', 'ND': 'America/Chicago', 'OH': 'America/New_York',
    'OK': 'America/Chicago', 'OR': 'America/Los_Angeles', 'PA': 'America/New_York',
    'RI': 'America/New_York', 'SC': 'America/New_York', 'SD': 'America/Chicago',
    'TN': 'America/Chicago', 'TX': 'America/Chicago', 'UT': 'America/Denver',
    'VT': 'America/New_York', 'VA': 'America/New_York', 'WA': 'America/Los_Angeles',
    'WV': 'America/New_York', 'WI': 'America/Chicago', 'WY': 'America/Denver'
  };
  return STATE_TIMEZONES[stateCode?.toUpperCase()] || 'America/Chicago';
}

// ============================================
// FIXED: formatDateRange
// ============================================
function formatDateRange(proposal) {
  const start = parseDateSafely(proposal.startDate);
  const end = parseDateSafely(proposal.endDate);
  if (!start || !end) return '';
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();
  
  if (startMonth === endMonth && startDay === endDay) {
    return `${startMonth} ${startDay}, ${year}`;
  } else if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

// ============================================
// FIXED: parseDateTime (now timezone-aware)
// ============================================
function parseDateTime(dateStr, timeStr, timezone = 'America/Chicago') {
  const dateObj = parseDateSafely(dateStr);
  if (!dateObj) return new Date();
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  
  const [time] = timeStr.split(' ');
  const [hours, minutes] = time.split(':');
  const isPM = timeStr.includes('PM');
  let hour = parseInt(hours);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  
  return new Date(year, month, day, hour, parseInt(minutes), 0);
}

// ============================================
// FIXED: getDuration (CRITICAL for pricing)
// ============================================
function getDuration(proposal) {
  const timezone = proposal.timezone || getTimezoneFromState(proposal.state) || 'America/Chicago';
  
  if (proposal.deliveryTime && proposal.strikeTime) {
    const deliveryDateTime = parseDateTime(proposal.startDate, proposal.deliveryTime, timezone);
    const strikeDateTime = parseDateTime(proposal.endDate, proposal.strikeTime, timezone);
    const diffTime = strikeDateTime - deliveryDateTime;
    const diffHours = diffTime / (1000 * 60 * 60);
    return Math.ceil(diffHours / 24);
  }
  
  const start = parseDateSafely(proposal.startDate);
  const end = parseDateSafely(proposal.endDate);
  if (!start || !end) return 1;
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

// ============================================
// FIXED: calculateDetailedTotals
// ============================================
function calculateDetailedTotals(proposal) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  const duration = getDuration(proposal); // Now uses fixed getDuration
  
  // Check for custom rental multiplier (stored in discountName as "MULT:2.0|..." or in dedicated field)
  let rentalMultiplier = null;
  
  // First check dedicated field
  let customMultiplierValue = proposal.customRentalMultiplier;
  
  // If not found, check discountName field (format: "MULT:2.0|..." or "TYPE:dollar|MULT:2.0|...")
  if ((!customMultiplierValue || String(customMultiplierValue).trim() === '') && proposal.discountName && proposal.discountName.includes('MULT:')) {
    const multMatch = proposal.discountName.match(/MULT:([\d.]+)/);
    if (multMatch) {
      customMultiplierValue = multMatch[1];
    }
  }
  
  if (customMultiplierValue && String(customMultiplierValue).trim() !== '') {
    const parsed = parseFloat(customMultiplierValue);
    if (!isNaN(parsed) && parsed > 0) {
      rentalMultiplier = parsed;
    }
  }
  
  // Use custom multiplier if provided, otherwise calculate from duration
  if (!rentalMultiplier || isNaN(rentalMultiplier) || rentalMultiplier <= 0) {
    rentalMultiplier = getRentalMultiplier(duration);
  }
  
  let baseProductTotal = 0;
  sections.forEach(section => {
    section.products.forEach(product => {
      baseProductTotal += product.price * product.quantity;
    });
  });
  
  const extendedProductTotal = baseProductTotal * rentalMultiplier;
  
  // Support both percentage and dollar value discounts
  // Extract discountType from discountName if stored there (format: "TYPE:dollar|Discount Name")
  let discountType = proposal.discountType || 'percentage';
  if (!proposal.discountType && proposal.discountName && proposal.discountName.startsWith('TYPE:')) {
    const match = proposal.discountName.match(/^TYPE:(\w+)(?:\|(.+))?$/);
    if (match) {
      discountType = match[1];
    }
  }
  const discountValue = parseFloat(proposal.discountValue || proposal.discount || 0) || 0;
  
  let standardRateDiscount = 0;
  if (discountType === 'dollar') {
    // Direct dollar amount discount
    standardRateDiscount = discountValue;
  } else {
    // Percentage discount (default/legacy behavior)
    standardRateDiscount = extendedProductTotal * (discountValue / 100);
  }
  
  const rentalTotal = extendedProductTotal - standardRateDiscount;
  
  // Check if fees are waived - check proposal fields first, then extract from discountName
  let waiveProductCare = proposal.waiveProductCare === true || proposal.waiveProductCare === 'true' || String(proposal.waiveProductCare || '').toLowerCase() === 'true';
  let waiveServiceFee = proposal.waiveServiceFee === true || proposal.waiveServiceFee === 'true' || String(proposal.waiveServiceFee || '').toLowerCase() === 'true';
  
  // Extract waiver flags from discountName if stored there (format: "WAIVE:PC,SF|..." or "TYPE:dollar|WAIVE:PC|...")
  if (proposal.discountName && proposal.discountName.includes('WAIVE:')) {
    const waiveMatch = proposal.discountName.match(/WAIVE:([^|]+)/);
    if (waiveMatch) {
      const waivedItems = waiveMatch[1].split(',');
      waiveProductCare = waiveProductCare || waivedItems.includes('PC');
      waiveServiceFee = waiveServiceFee || waivedItems.includes('SF');
    }
  }
  
  // Calculate what the fees would have been (for display when waived)
  const productCareAmount = extendedProductTotal * 0.10;
  const productCare = waiveProductCare ? 0 : productCareAmount;
  
  const delivery = parseFloat(proposal.deliveryFee) || 0;
  
  // Calculate service fee - use actual productCare for calculation (which might be 0 if waived)
  const serviceFee = waiveServiceFee ? 0 : (rentalTotal + productCare + delivery) * 0.05;
  // For display when waived, calculate what service fee would have been if not waived
  // Use actual productCare value (which reflects if it was waived) for accurate calculation
  const serviceFeeAmount = (rentalTotal + productCare + delivery) * 0.05;
  
  const subtotal = rentalTotal + productCare + serviceFee + delivery;
  // Check if tax exempt - handle boolean, string 'true'/'false', or undefined
  const taxExempt = proposal.taxExempt === true || proposal.taxExempt === 'true' || String(proposal.taxExempt || '').toLowerCase() === 'true';
  console.log('Tax Exempt Debug:', { taxExempt, proposalTaxExempt: proposal.taxExempt, proposalKeys: Object.keys(proposal) });
  const tax = taxExempt ? 0 : subtotal * 0.0975;
  const total = subtotal + tax;
  
  return {
    rentalMultiplier, // Include the multiplier so it can be used in display
    productSubtotal: extendedProductTotal,
    standardRateDiscount,
    rentalTotal,
    productCare,
    productCareAmount, // Original amount before waiver
    serviceFee,
    serviceFeeAmount, // Original amount before waiver
    delivery,
    subtotal,
    tax,
    total,
    rentalMultiplier,
    waiveProductCare,
    waiveServiceFee,
    taxExempt
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

function calculateTotal(proposal) {
  const totals = calculateDetailedTotals(proposal);
  return totals.total;
}

// Helper function to calculate profitability for a proposal
function calculateProposalProfitability(proposal) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  let totalOOP = 0;
  let totalRevenue = 0;
  
  sections.forEach(section => {
    if (section.products && Array.isArray(section.products)) {
      section.products.forEach(product => {
        const quantity = parseFloat(product.quantity) || 0;
        const price = parseFloat(product.price) || 0;
        const revenue = quantity * price;
        totalRevenue += revenue;
        
        const needsPurchase = product.needsPurchase === true || product.needsPurchase === 'true';
        if (needsPurchase) {
          const purchaseQuantity = parseFloat(product.purchaseQuantity) || 0;
          const oopCost = parseFloat(product.oopCost) || 0;
          totalOOP += purchaseQuantity * oopCost;
        }
      });
    }
  });
  
  // Add Product Care Fee and Service Fee to Total Revenue
  const totals = calculateDetailedTotals(proposal);
  const productCareFee = totals.waiveProductCare ? 0 : (totals.productCare || 0);
  const serviceFee = totals.waiveServiceFee ? 0 : (totals.serviceFee || 0);
  totalRevenue += productCareFee + serviceFee;
  
  const freight = totalOOP * 0.15;
  const totalCOGS = totalOOP + freight;
  const profit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
  return {
    totalCOGS,
    profitMargin
  };
}

// Helper function to extract exceptions from a proposal
function getProposalExceptions(proposal) {
  const exceptions = [];
  
  // Check for waived fees
  let waiveProductCare = proposal.waiveProductCare === true || proposal.waiveProductCare === 'true' || String(proposal.waiveProductCare || '').toLowerCase() === 'true';
  let waiveServiceFee = proposal.waiveServiceFee === true || proposal.waiveServiceFee === 'true' || String(proposal.waiveServiceFee || '').toLowerCase() === 'true';
  
  // Extract from discountName if stored there
  if (proposal.discountName && proposal.discountName.includes('WAIVE:')) {
    const waiveMatch = proposal.discountName.match(/WAIVE:([^|]+)/);
    if (waiveMatch) {
      const waivedItems = waiveMatch[1].split(',');
      waiveProductCare = waiveProductCare || waivedItems.includes('PC');
      waiveServiceFee = waiveServiceFee || waivedItems.includes('SF');
    }
  }
  
  if (waiveProductCare) {
    exceptions.push('Waived product care fee');
  }
  if (waiveServiceFee) {
    exceptions.push('Waived service fee');
  }
  
  // Check for custom rental multiplier
  const duration = getDuration(proposal);
  const standardMultiplier = getRentalMultiplier(duration);
  
  let customMultiplier = null;
  if (proposal.customRentalMultiplier && proposal.customRentalMultiplier.trim() !== '') {
    customMultiplier = parseFloat(proposal.customRentalMultiplier);
  } else if (proposal.discountName && proposal.discountName.includes('MULT:')) {
    const multMatch = proposal.discountName.match(/MULT:([\d.]+)/);
    if (multMatch) {
      customMultiplier = parseFloat(multMatch[1]);
    }
  }
  
  if (customMultiplier && !isNaN(customMultiplier) && customMultiplier > 0 && customMultiplier !== standardMultiplier) {
    exceptions.push(`Custom rental: ${customMultiplier}x (standard: ${standardMultiplier}x)`);
  }
  
  return exceptions;
}

// Helper function to get discount amount/percentage for display
function getDiscountApplied(proposal) {
  // Extract discountType from discountName if stored there
  let discountType = proposal.discountType || 'percentage';
  if (!proposal.discountType && proposal.discountName && proposal.discountName.startsWith('TYPE:')) {
    const match = proposal.discountName.match(/^TYPE:(\w+)(?:\|(.+))?$/);
    if (match) {
      discountType = match[1];
    }
  }
  
  const discountValue = parseFloat(proposal.discountValue || proposal.discount || 0) || 0;
  
  if (discountValue === 0) {
    return '-';
  }
  
  if (discountType === 'dollar') {
    return `$${discountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `${discountValue}%`;
  }
}

function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) {
    return '0.00';
  }
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ProposalApp() {
  const [proposals, setProposals] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [filters, setFilters] = useState({
    clientName: '',
    salesLead: '',
    status: '',
    location: ''
  });

  useEffect(() => {
    fetchProposals();
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'create') {
      setIsCreatingNew(true);
    }
  }, []);

  const fetchProposals = async (updateSelected = false) => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (!data || !data.proposals || !Array.isArray(data.proposals) || data.proposals.length === 0) {
        setProposals([]);
        setCatalog([]);
      } else {
        const sortedProposals = data.proposals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setProposals(sortedProposals);
        setCatalog(data.catalog || []);
        
        // If we have a selected proposal, update it with the fresh data
        if (updateSelected && selectedProposal) {
          const updatedProposal = sortedProposals.find(p => 
            p.projectNumber === selectedProposal.projectNumber && 
            p.version === selectedProposal.version
          );
          if (updatedProposal) {
            setSelectedProposal(updatedProposal);
          }
        }
      }
      setLoading(false);
    } catch (err) {
      setError(`Failed to fetch proposals: ${err.message}`);
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      proposal.clientName.toLowerCase().includes(searchLower) ||
      proposal.venueName.toLowerCase().includes(searchLower) ||
      proposal.city.toLowerCase().includes(searchLower) ||
      proposal.state.toLowerCase().includes(searchLower)
    );

    const matchesClientName = !filters.clientName || proposal.clientName.toLowerCase().includes(filters.clientName.toLowerCase());
    const matchesSalesLead = !filters.salesLead || (proposal.salesLead && proposal.salesLead.toLowerCase().includes(filters.salesLead.toLowerCase()));
    const matchesStatus = !filters.status || proposal.status === filters.status;
    const matchesLocation = !filters.location || `${proposal.venueName}, ${proposal.city}, ${proposal.state}`.toLowerCase().includes(filters.location.toLowerCase());

    return matchesSearch && matchesClientName && matchesSalesLead && matchesStatus && matchesLocation;
  });

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>;
  if (error) return <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#dc2626' }}>{error}</p></div>;
  
  if (isCreatingNew) {
    return <CreateProposalView 
      catalog={catalog} 
      onSave={async (formData) => {
        try {
          const saveResponse = await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(formData),
            mode: 'cors'
          });
          const saveResult = await saveResponse.json();
          if (saveResult.success === false) {
            throw new Error(saveResult.error || 'Failed to save proposal');
          }
          alert('Proposal created successfully!');
          setIsCreatingNew(false);
          fetchProposals();
        } catch (err) {
          alert('Error creating proposal: ' + err.message);
        }
      }}
      onCancel={() => {
        setIsCreatingNew(false);
        if (window.location.search.includes('page=create')) {
          window.history.pushState({}, '', window.location.pathname);
        }
      }}
    />;
  }
  
  if (selectedProposal) {
    const handleRefresh = async () => {
      await fetchProposals();
      // After fetching, update selectedProposal with fresh data
      const response = await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      const data = await response.json();
      if (data && data.proposals) {
        const updatedProposal = data.proposals.find(p => 
          p.projectNumber === selectedProposal.projectNumber && 
          p.version === selectedProposal.version
        );
        if (updatedProposal) {
          console.log('Updating selectedProposal with fresh data, customRentalMultiplier:', updatedProposal.customRentalMultiplier);
          setSelectedProposal(updatedProposal);
        }
      }
    };
    return <ProposalView proposal={selectedProposal} catalog={catalog} onBack={() => setSelectedProposal(null)} onPrint={() => window.print()} onRefresh={handleRefresh} onRefreshProposalsList={fetchProposals} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf8', padding: '32px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); 
        
        /* Font loading with fallbacks - fonts will fall back to system fonts if files aren't found */
        /* Custom fonts - using WOFF2 for optimal web performance */
        /* WOFF2 is 30-50% smaller than OTF and loads faster */
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/NeueHaasUnica-Regular.woff2') format('woff2'),
               url('/assets/NeueHaasUnica-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/NeueHaasUnica-Medium.woff2') format('woff2'),
               url('/assets/NeueHaasUnica-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Domaine Text';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/test-domaine-text-light.woff2') format('woff2'),
               url('/assets/test-domaine-text-light.woff2') format('woff2');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        /* Fallback font stacks - will use system fonts if custom fonts fail to load */
        .font-neue-haas {
          font-family: 'Neue Haas Unica', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        .font-domaine {
          font-family: 'Domaine Text', Georgia, 'Times New Roman', 'Palatino', serif;
        }
        
        /* Ensure fallbacks are used if fonts don't load */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; } 
        body { font-family: 'Inter', sans-serif; } 
        @media print { 
          .no-print { display: none !important; } 
          .print-break-after { page-break-after: always; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
          @page { size: letter; margin: 0; } 
        }
      ` }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/mayker_icon-black.svg" alt="Mayker" style={{ height: '40px' }} />
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#2C2C2C', margin: '0' }}>Mayker Proposals</h1>
            <p style={{ marginTop: '4px', color: '#888888', fontSize: '13px', margin: '0' }}>Manage and view all event proposals</p>
          </div>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchProposals} style={{ padding: '10px 20px', backgroundColor: '#2C2C2C', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            ↻ Refresh
          </button>
          <button onClick={() => setIsCreatingNew(true)} style={{ padding: '10px 20px', backgroundColor: '#545142', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            + Create New Proposal
          </button>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <input type="text" placeholder="Search by client, venue, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }} />
          </div>
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ padding: '10px 14px', backgroundColor: '#f0ede5', color: '#888888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Clear</button>}
        </div>

        <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', backgroundColor: 'white', padding: '16px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Name</label>
            <input type="text" placeholder="Filter..." value={filters.clientName} onChange={(e) => setFilters({...filters, clientName: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sales Lead</label>
            <input type="text" placeholder="Filter..." value={filters.salesLead} onChange={(e) => setFilters({...filters, salesLead: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</label>
            <input type="text" placeholder="Filter..." value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '4px', overflowX: 'auto', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto', minWidth: '1400px' }}>
            <thead style={{ backgroundColor: '#f8f7f4' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Client</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Venue</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>City, State</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Event Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Project #</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Version</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Sales Lead</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Discount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', minWidth: '200px', width: '200px' }}>Exceptions</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Last Edited</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>COGS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Profit Margin</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.map((proposal, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0ede5', backgroundColor: index % 2 === 0 ? 'white' : '#fafaf8' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setSelectedProposal(proposal)} style={{ color: '#545142', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontWeight: '500', padding: '0' }}>
                        View
                      </button>
                      <span style={{ color: '#d1d5db' }}>|</span>
                      <button onClick={() => setSelectedProposal({ ...proposal, _isEditing: true })} style={{ color: '#545142', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px', fontWeight: '500', padding: '0' }}>
                        Edit
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.clientName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.venueName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.city}, {proposal.state}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.eventDate}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.projectNumber || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.version ? `V${proposal.version}` : '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.salesLead || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '3px', fontSize: '11px', fontWeight: '600', backgroundColor: proposal.status === 'Pending' ? '#f5f1e6' : proposal.status === 'Approved' ? '#e8f5e9' : '#ffebee', color: proposal.status === 'Pending' ? '#b8860b' : proposal.status === 'Approved' ? '#2e7d32' : '#c62828' }}>
                      {proposal.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{getDiscountApplied(proposal)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666', lineHeight: '1.6', minWidth: '200px', width: '200px' }}>
                    {(() => {
                      const exceptions = getProposalExceptions(proposal);
                      if (exceptions.length === 0) {
                        return <span style={{ color: '#999', fontStyle: 'italic' }}>None</span>;
                      }
                      return (
                        <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                          {exceptions.map((exc, idx) => (
                            <li key={idx} style={{ marginBottom: '4px', fontSize: '12px', paddingLeft: '4px' }}>{exc}</li>
                          ))}
                        </ul>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#888888' }}>{proposal.lastUpdated || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C', fontWeight: '500' }}>${calculateTotal(proposal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  {(() => {
                    const profitability = calculateProposalProfitability(proposal);
                    return (
                      <>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#92400e', fontWeight: '500', textAlign: 'right' }}>
                          ${profitability.totalCOGS.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: profitability.profitMargin >= 0 ? '#2563eb' : '#dc2626', fontWeight: '500', textAlign: 'right' }}>
                          {profitability.profitMargin.toFixed(2)}%
                        </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreateProposalView({ catalog, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    venueName: '',
    city: '',
    state: '',
    startDate: '',
    endDate: '',
    deliveryTime: '',
    strikeTime: '',
    deliveryFee: '0',
    discount: '0',
    discountType: 'percentage', // 'percentage' or 'dollar'
    discountValue: '0',
    discountName: '',
    waiveProductCare: false,
    waiveServiceFee: false,
    customRentalMultiplier: '', // Optional custom multiplier override
    clientFolderURL: '',
    salesLead: '',
    status: 'Pending',
    projectNumber: '',
    taxExempt: false
  });
  const [sections, setSections] = useState([{ name: '', products: [], type: 'products' }]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Handle checkboxes differently - use checked instead of value
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
  };

  const handleAddSection = () => {
    setSections([...sections, { name: '', products: [], type: 'products' }]);
  };

  const handleRemoveSection = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const handleSectionNameChange = (idx, newName) => {
    const newSections = [...sections];
    newSections[idx].name = newName;
    setSections(newSections);
  };

  const handleAddProduct = (sectionIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.push({ name: '', quantity: 1, price: 0, imageUrl: '', dimensions: '', note: '', needsPurchase: false, purchaseQuantity: 0, oopCost: 0, supplier: '', productUrl: '' });
    setSections(newSections);
  };

  const handleProductSelect = (sectionIdx, productIdx, selectedProduct) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    const existingProduct = newSections[sectionIdx].products[productIdx];
    // Preserve existing note and quantity when selecting a new product
    // IMPORTANT: Only update if the product name actually changed to avoid overwriting notes
    if (existingProduct?.name === selectedProduct.name) {
      // Same product selected - don't overwrite, just ensure catalog properties are up to date
      newSections[sectionIdx].products[productIdx] = {
        ...existingProduct,
        ...selectedProduct, // Update catalog properties (price, imageUrl, dimensions)
        quantity: existingProduct.quantity || 1,
        note: existingProduct.note || '', // Keep existing note
        needsPurchase: existingProduct.needsPurchase || false,
        purchaseQuantity: existingProduct.purchaseQuantity || 0,
        oopCost: existingProduct.oopCost || 0,
        supplier: existingProduct.supplier || '',
        productUrl: existingProduct.productUrl || ''
      };
    } else {
      // Different product - preserve note and profitability fields from existing product
      newSections[sectionIdx].products[productIdx] = { 
        ...selectedProduct,
        quantity: existingProduct?.quantity || 1,
        note: existingProduct?.note || '', // Preserve note if it exists
        needsPurchase: existingProduct?.needsPurchase || false,
        purchaseQuantity: existingProduct?.purchaseQuantity || 0,
        oopCost: existingProduct?.oopCost || 0,
        supplier: existingProduct?.supplier || '',
        productUrl: existingProduct?.productUrl || ''
      };
    }
    setSections(newSections);
  };

  const handleProductQuantityChange = (sectionIdx, productIdx, newQuantity) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products[productIdx].quantity = parseInt(newQuantity) || 1;
    setSections(newSections);
  };

  const handleProductNoteChange = (sectionIdx, productIdx, newNote) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    // Ensure the product exists and update note
    if (newSections[sectionIdx] && newSections[sectionIdx].products && newSections[sectionIdx].products[productIdx]) {
      newSections[sectionIdx].products[productIdx] = {
        ...newSections[sectionIdx].products[productIdx],
        note: newNote || ''
      };
      console.log('Note changed (CreateProposalView):', { sectionIdx, productIdx, newNote, product: newSections[sectionIdx].products[productIdx] });
      setSections(newSections);
    }
  };
  
  const handleProductPurchaseChange = (sectionIdx, productIdx, field, value) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    if (newSections[sectionIdx] && newSections[sectionIdx].products && newSections[sectionIdx].products[productIdx]) {
      newSections[sectionIdx].products[productIdx] = {
        ...newSections[sectionIdx].products[productIdx],
        [field]: field === 'needsPurchase' ? value : (field === 'purchaseQuantity' || field === 'oopCost' ? parseFloat(value) || 0 : value)
      };
      setSections(newSections);
    }
  };

  const handleRemoveProduct = (sectionIdx, productIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.splice(productIdx, 1);
    setSections(newSections);
  };

  const handleSaveClick = async () => {
    if (!formData.clientName.trim()) {
      alert('Client name is required');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('Start and end dates are required');
      return;
    }

    setSaving(true);
    
    const convertTimeFormat = (time24) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const finalData = {
      ...formData,
      deliveryTime: convertTimeFormat(formData.deliveryTime),
      strikeTime: convertTimeFormat(formData.strikeTime),
      sectionsJSON: JSON.stringify(sections),
      // Sync discountValue to discount for backward compatibility
      discount: formData.discountValue || formData.discount || '0',
      discountType: formData.discountType || 'percentage',
      discountValue: formData.discountValue || formData.discount || '0',
      // Store discountType, waiver flags, and custom multiplier in discountName for persistence
      // Format: "TYPE:dollar|WAIVE:PC,SF|MULT:2.0|Discount Name" or variations
      discountName: (() => {
        let name = formData.discountName || '';
        let prefix = '';
        
        // Add discount type prefix if not percentage
        if (formData.discountType && formData.discountType !== 'percentage') {
          prefix += `TYPE:${formData.discountType}|`;
        }
        
        // Add waiver flags if any are waived
        const waivers = [];
        if (formData.waiveProductCare) waivers.push('PC');
        if (formData.waiveServiceFee) waivers.push('SF');
        if (waivers.length > 0) {
          prefix += `WAIVE:${waivers.join(',')}|`;
        }
        
        // Add custom rental multiplier if provided
        if (formData.customRentalMultiplier && formData.customRentalMultiplier.trim() !== '') {
          prefix += `MULT:${formData.customRentalMultiplier}|`;
        }
        
        return prefix ? `${prefix}${name}`.replace(/\|$/, '') : name;
      })(),
      // Explicitly include waiver flags for immediate use
      waiveProductCare: formData.waiveProductCare || false,
      waiveServiceFee: formData.waiveServiceFee || false,
      taxExempt: formData.taxExempt || false
    };
    
    // Debug: Log the customRentalMultiplier being saved
    console.log('CreateProposalView - Saving customRentalMultiplier in discountName:', finalData.discountName, 'from formData:', formData.customRentalMultiplier);
    console.log('CreateProposalView - Full finalData keys:', Object.keys(finalData));
    console.log('CreateProposalView - finalData.customRentalMultiplier value:', finalData.customRentalMultiplier, 'type:', typeof finalData.customRentalMultiplier);
    
    if (!finalData.projectNumber || finalData.projectNumber.trim() === '') {
      delete finalData.projectNumber;
    }

    try {
      await onSave(finalData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px 24px' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); * { font-family: 'Inter', sans-serif; }` }} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#111827', margin: '0' }}>Create New Proposal</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Fill in the details to create a new event proposal</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onCancel} disabled={saving} style={{ padding: '10px 24px', backgroundColor: '#e5e7eb', color: '#111827', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              Cancel
            </button>
            <button onClick={handleSaveClick} disabled={saving} style={{ padding: '10px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Proposal Details</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Client Name *</label>
              <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder="Enter client name" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Sales Lead</label>
              <input type="text" name="salesLead" value={formData.salesLead} onChange={handleInputChange} placeholder="Enter sales lead name" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Venue Name</label>
              <input type="text" name="venueName" value={formData.venueName} onChange={handleInputChange} placeholder="Enter venue name" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="TN" maxLength="2" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', textTransform: 'uppercase' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Delivery Time</label>
              <input type="time" name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Strike Time</label>
              <input type="time" name="strikeTime" value={formData.strikeTime} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Delivery Fee ($)</label>
              <input type="number" name="deliveryFee" value={formData.deliveryFee} onChange={handleInputChange} placeholder="0" step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Discount Type</label>
              <select name="discountType" value={formData.discountType || 'percentage'} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="dollar">Dollar Amount ($)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                {formData.discountType === 'dollar' ? 'Discount Amount ($)' : 'Discount (%)'}
              </label>
              <input 
                type="number" 
                name="discountValue" 
                value={formData.discountValue || formData.discount || '0'} 
                onChange={handleInputChange} 
                placeholder="0" 
                min="0" 
                max={formData.discountType === 'percentage' ? '100' : undefined}
                step={formData.discountType === 'dollar' ? '0.01' : '1'}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Discount Name</label>
              <input type="text" name="discountName" value={formData.discountName} onChange={handleInputChange} placeholder="e.g., Industry Discount" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Product Care Fee</label>
              <select name="waiveProductCare" value={formData.waiveProductCare ? 'true' : 'false'} onChange={(e) => handleInputChange({ target: { name: 'waiveProductCare', value: e.target.value === 'true' } })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="false">Apply (10%)</option>
                <option value="true">Waive</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Service Fee</label>
              <select name="waiveServiceFee" value={formData.waiveServiceFee ? 'true' : 'false'} onChange={(e) => handleInputChange({ target: { name: 'waiveServiceFee', value: e.target.value === 'true' } })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="false">Apply (5%)</option>
                <option value="true">Waive</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px' }}>
              <input 
                type="checkbox" 
                name="taxExempt" 
                checked={formData.taxExempt === true || formData.taxExempt === 'true'} 
                onChange={handleInputChange}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>
                Tax Exempt
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Custom Rental Multiplier</label>
              <select 
                name="customRentalMultiplier" 
                value={formData.customRentalMultiplier || ''} 
                onChange={handleInputChange} 
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
              >
                <option value="">Auto-calculated from duration</option>
                <option value="1.0">1.0</option>
                <option value="1.1">1.1</option>
                <option value="1.2">1.2</option>
                <option value="1.3">1.3</option>
                <option value="1.4">1.4</option>
                <option value="1.5">1.5</option>
                <option value="2.0">2.0</option>
                <option value="2.5">2.5</option>
                <option value="3.0">3.0</option>
                <option value="3.5">3.5</option>
                <option value="4.0">4.0</option>
                <option value="4.5">4.5</option>
                <option value="5.0">5.0</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Client Folder URL</label>
              <input type="text" name="clientFolderURL" value={formData.clientFolderURL} onChange={handleInputChange} placeholder="Google Drive folder link" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Products by Section</h2>
          
          {sections.map((section, sectionIdx) => (
            <div key={sectionIdx} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>Section Name</label>
                  <input type="text" value={section.name} onChange={(e) => handleSectionNameChange(sectionIdx, e.target.value)} placeholder="e.g., BAR, LOUNGE, DINING" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                {sections.length > 1 && (
                  <button onClick={() => handleRemoveSection(sectionIdx)} style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', marginTop: '20px' }}>
                    Remove Section
                  </button>
                )}
              </div>
              
              {section.products.map((product, productIdx) => (
                <div key={productIdx} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '8px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>Product</label>
                      <select value={product.name} onChange={(e) => {
                        const selected = catalog.find(p => p.name === e.target.value);
                        if (selected) handleProductSelect(sectionIdx, productIdx, selected);
                      }} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                        <option value="">Select product...</option>
                        {catalog.map((p, idx) => (
                          <option key={idx} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>Qty</label>
                      <input type="number" min="1" value={product.quantity} onChange={(e) => handleProductQuantityChange(sectionIdx, productIdx, e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>Price</label>
                      <input type="text" value={`$${product.price.toFixed(2)}`} disabled style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f3f4f6', color: '#6b7280' }} />
                    </div>
                    <button onClick={() => handleRemoveProduct(sectionIdx, productIdx)} style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      Remove
                    </button>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>Note</label>
                    <input 
                      type="text" 
                      value={product.note || ''} 
                      onChange={(e) => handleProductNoteChange(sectionIdx, productIdx, e.target.value)} 
                      placeholder="Optional note..."
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                    />
                  </div>
                  {/* Purchase Tracking Fields */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={product.needsPurchase === true || product.needsPurchase === 'true'}
                        onChange={(e) => {
                          const newSections = JSON.parse(JSON.stringify(sections));
                          newSections[sectionIdx].products[productIdx].needsPurchase = e.target.checked;
                          setSections(newSections);
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}>
                        Needs Purchase
                      </label>
                    </div>
                    {(product.needsPurchase === true || product.needsPurchase === 'true') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Purchase Qty</label>
                            <input 
                              type="number" 
                              min="0" 
                              value={product.purchaseQuantity || 0} 
                              onChange={(e) => {
                                const newSections = JSON.parse(JSON.stringify(sections));
                                newSections[sectionIdx].products[productIdx].purchaseQuantity = parseFloat(e.target.value) || 0;
                                setSections(newSections);
                              }}
                              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: '#111827', fontFamily: "'Inter', sans-serif", MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>OOP Cost (per unit)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              value={product.oopCost || 0} 
                              onChange={(e) => {
                                const newSections = JSON.parse(JSON.stringify(sections));
                                newSections[sectionIdx].products[productIdx].oopCost = parseFloat(e.target.value) || 0;
                                setSections(newSections);
                              }}
                              placeholder="$0.00"
                              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: '#111827', fontFamily: "'Inter', sans-serif", MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }} 
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Supplier</label>
                          <input 
                            type="text" 
                            value={product.supplier || ''} 
                            onChange={(e) => {
                              const newSections = JSON.parse(JSON.stringify(sections));
                              newSections[sectionIdx].products[productIdx].supplier = e.target.value;
                              setSections(newSections);
                            }}
                            placeholder="e.g., Amazon, Wayfair, etc."
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: '#111827', fontFamily: "'Inter', sans-serif" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Product URL</label>
                          <input 
                            type="url" 
                            value={product.productUrl || ''} 
                            onChange={(e) => {
                              const newSections = JSON.parse(JSON.stringify(sections));
                              newSections[sectionIdx].products[productIdx].productUrl = e.target.value;
                              setSections(newSections);
                            }}
                            placeholder="https://..."
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: '#111827', fontFamily: "'Inter', sans-serif" }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button onClick={() => handleAddProduct(sectionIdx)} style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                + Add Product
              </button>
            </div>
          ))}

          <button onClick={handleAddSection} style={{ padding: '12px 24px', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            + Add Section
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalView({ proposal, catalog, onBack, onPrint, onRefresh, onRefreshProposalsList }) {
  const [isEditing, setIsEditing] = useState(proposal._isEditing || false);
  const [editData, setEditData] = useState(null);
  const [showProfitability, setShowProfitability] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEditData(JSON.parse(JSON.stringify(proposal)));
    }
  }, [isEditing, proposal]);

  const handleSave = async (finalData) => {
    setSaving(true);
    try {
      let pdfBase64 = null;
      
      const payload = {
        ...finalData,
        generatePDF: false,
        pdfBase64: null
      };
      
      const saveResponse = await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      
      const saveResult = await saveResponse.json();
      if (saveResult.success === false) {
        throw new Error(saveResult.error || 'Failed to save proposal');
      }
      
      const successMsg = 'Proposal saved successfully. Use the "Print / Export as PDF" button to download the PDF.';
      alert(successMsg);
      setIsEditing(false);
      // Refresh proposals list but don't auto-select the proposal
      if (onRefreshProposalsList) {
        onRefreshProposalsList();
      }
    } catch (err) {
      alert('Error saving proposal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && editData) {
    return (
      <>
        <EditProposalView proposal={editData} catalog={catalog} onSave={handleSave} onCancel={() => setIsEditing(false)} saving={saving} />
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '816px', zIndex: -1, pointerEvents: 'none' }}>
          <ViewProposalView 
            proposal={{ ...proposal, ...editData }} 
            onBack={() => {}} 
            onPrint={() => {}} 
            onEdit={() => {}} 
            onViewProfitability={() => {}}
          />
        </div>
      </>
    );
  }

  if (showProfitability) {
    return <ProfitabilityView proposal={proposal} onBack={() => setShowProfitability(false)} />;
  }

  return <ViewProposalView proposal={proposal} onBack={onBack} onPrint={onPrint} onEdit={() => setIsEditing(true)} onViewProfitability={() => setShowProfitability(true)} />;
}

function ViewProposalView({ proposal, onBack, onPrint, onEdit, onViewProfitability }) {
  // Debug: Check if customRentalMultiplier is in the proposal
  console.log('ViewProposalView - proposal.customRentalMultiplier:', proposal.customRentalMultiplier);
  console.log('ViewProposalView - All proposal keys:', Object.keys(proposal));
  
  const rawSections = JSON.parse(proposal.sectionsJSON || '[]');
  
  // Ensure all products have note and purchase fields for backward compatibility
  const sections = rawSections.map(section => {
    if (section.products && Array.isArray(section.products)) {
      return {
        ...section,
        products: section.products.map(product => ({
          ...product,
          note: product.note || '',
          needsPurchase: product.needsPurchase || false,
          purchaseQuantity: product.purchaseQuantity || 0,
          oopCost: product.oopCost || 0
        }))
      };
    }
    return section;
  });
  
  // Debug: log sections when viewing
  console.log('ViewProposalView - Loaded sections:', sections.length);
  const allProducts = sections.flatMap(s => s.products || []);
  console.log('ViewProposalView - Total products:', allProducts.length);
  console.log('ViewProposalView - Sample products (first 3):', allProducts.slice(0, 3).map(p => ({ 
    name: p.name, 
    hasNoteField: 'note' in p, 
    noteValue: p.note, 
    noteType: typeof p.note,
    allKeys: Object.keys(p)
  })));
  const productsWithNotes = allProducts.filter(p => p.note && p.note.trim());
  console.log('ViewProposalView - Products with notes:', productsWithNotes.length);
  if (productsWithNotes.length > 0) {
    console.log('ViewProposalView - Sample products with notes:', productsWithNotes.slice(0, 3).map(p => ({ name: p.name, note: p.note })));
  }
  const imagePages = sections.filter(s => (s.type === 'image' || (!s.products || s.products.length === 0)) && (s.imageDriveId || s.imageData || s.imageUrl));
  console.log('ViewProposalView - Image pages found:', imagePages.length);
  if (imagePages.length > 0) {
    console.log('ViewProposalView - Image page details:', imagePages.map(ip => ({
      type: ip.type,
      hasImageDriveId: !!ip.imageDriveId,
      imageDriveId: ip.imageDriveId || 'none',
      hasImageUrl: !!ip.imageUrl,
      imageUrl: ip.imageUrl ? ip.imageUrl.substring(0, 50) + '...' : 'none',
      hasImageData: !!ip.imageData,
      imageDataLength: ip.imageData ? ip.imageData.length : 0,
      imageDataPreview: ip.imageData ? ip.imageData.substring(0, 50) + '...' : 'none'
    })));
  }
  
  const totals = calculateDetailedTotals(proposal);
  const brandTaupe = '#545142';
  const brandCharcoal = '#2C2C2C';
  
  const productsPerPage = 9;
  
  const handlePrintDownload = () => {
    window.print();
  };
  
  // Calculate profitability metrics
  const calculateProfitability = () => {
    const sections = JSON.parse(proposal.sectionsJSON || '[]');
    let totalOOP = 0;
    let totalRevenue = 0;
    const productsNeedingPurchase = [];
    
    sections.forEach(section => {
      if (section.products && Array.isArray(section.products)) {
        section.products.forEach(product => {
          const quantity = parseFloat(product.quantity) || 0;
          const price = parseFloat(product.price) || 0;
          const revenue = quantity * price;
          totalRevenue += revenue;
          
          // Check if product needs purchase
          const needsPurchase = product.needsPurchase === true || product.needsPurchase === 'true';
          if (needsPurchase) {
            const purchaseQuantity = parseFloat(product.purchaseQuantity) || 0;
            const oopCost = parseFloat(product.oopCost) || 0;
            const oopTotal = purchaseQuantity * oopCost;
            totalOOP += oopTotal;
            
            productsNeedingPurchase.push({
              sectionName: section.name || '',
              productName: product.name || '',
              quantity: quantity,
              purchaseQuantity: purchaseQuantity,
              oopCost: oopCost,
              oopTotal: oopTotal,
              rentalPrice: price,
              revenue: revenue
            });
          }
        });
      }
    });
    
    // Add Product Care Fee and Service Fee to Total Revenue
    const productCareFee = totals.waiveProductCare ? 0 : (totals.productCare || 0);
    const serviceFee = totals.waiveServiceFee ? 0 : (totals.serviceFee || 0);
    totalRevenue += productCareFee + serviceFee;
    
    const freight = totalOOP * 0.15;
    const totalCOGS = totalOOP + freight;
    const profit = totalRevenue - totalCOGS;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    return {
      totalOOP,
      freight,
      totalCOGS,
      totalRevenue,
      profit,
      profitMargin,
      productsNeedingPurchase
    };
  };
  
  const profitability = calculateProfitability();
  
  // Generate profitability log (CSV format matching their spreadsheet)
  const generateProfitabilityLog = () => {
    const sections = JSON.parse(proposal.sectionsJSON || '[]');
    const formatDateRange = (proposal) => {
      const start = parseDateSafely(proposal.startDate);
      const end = parseDateSafely(proposal.endDate);
      if (!start || !end) return '';
      const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
      const startDay = start.getDate();
      const endDay = end.getDate();
      const year = start.getFullYear();
      if (startMonth === endMonth && startDay === endDay) {
        return `${startMonth} ${startDay}, ${year}`;
      } else if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}, ${year}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
      }
    };
    
    // Build CSV content
    let csv = 'EVENTS PRODUCT PLAN\n';
    csv += '\n';
    csv += 'Instructions:\n';
    csv += 'Columns or fields in yellow should be populated by the CST member.\n';
    csv += 'Columns or fields in blue are auto-calculated. Do NOT touch.\n';
    csv += '\n';
    
    // Header section
    csv += `Client Name,${proposal.clientName || ''}\n`;
    csv += `Project Date(s),${formatDateRange(proposal)}\n`;
    csv += `Project Location,${proposal.venueName || ''}\n`;
    csv += '\n';
    
    // COGS Summary
    csv += 'Product COGS,$' + profitability.totalOOP.toFixed(2) + '\n';
    csv += 'Freight,$' + profitability.freight.toFixed(2) + '\n';
    csv += 'Delivery,\n';
    csv += 'Total COGS,$' + profitability.totalCOGS.toFixed(2) + '\n';
    csv += '\n';
    
    // Standard Total Summary
    csv += 'Product Total,$' + profitability.totalRevenue.toFixed(2) + '\n';
    csv += 'Product Maintenance,$' + (totals.productCare || 0).toFixed(2) + '\n';
    csv += 'Delivery,$' + (totals.delivery || 0).toFixed(2) + '\n';
    csv += 'Service,$' + (totals.serviceFee || 0).toFixed(2) + '\n';
    csv += 'Subtotal,$' + (totals.subtotal || 0).toFixed(2) + '\n';
    csv += 'Tax,$' + (totals.tax || 0).toFixed(2) + '\n';
    csv += 'Total,$' + (totals.total || 0).toFixed(2) + '\n';
    csv += '\n';
    
    // Profit Calculation
    csv += 'Profit,$' + profitability.profit.toFixed(2) + '\n';
    csv += 'Profit Margin,' + profitability.profitMargin.toFixed(2) + '%\n';
    csv += '\n';
    
    // Product table header
    csv += 'Category/Placement,Product Name,Product Link,Total #,Supplier,Finish,Size,# to Source,OOP Each,OOP Total,Rental Each,Rental Total\n';
    
    // Product rows
    sections.forEach(section => {
      if (section.products && Array.isArray(section.products)) {
        section.products.forEach(product => {
          const needsPurchase = product.needsPurchase === true || product.needsPurchase === 'true';
          const purchaseQuantity = needsPurchase ? (parseFloat(product.purchaseQuantity) || 0) : '';
          const oopCost = needsPurchase ? (parseFloat(product.oopCost) || 0) : '';
          const oopTotal = needsPurchase ? (purchaseQuantity * oopCost) : '';
          
          csv += `"${section.name || ''}","${product.name || ''}","${product.imageUrl || ''}",${product.quantity || 0},,,"${product.dimensions || ''}",${purchaseQuantity},${oopCost ? '$' + oopCost.toFixed(2) : ''},${oopTotal ? '$' + oopTotal.toFixed(2) : ''},$${(parseFloat(product.price) || 0).toFixed(2)},$${((parseFloat(product.quantity) || 0) * (parseFloat(product.price) || 0)).toFixed(2)}\n`;
        });
      }
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${proposal.clientName || 'Proposal'}_Profitability_Log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Shared header component for all pages
  const PageHeader = ({ sectionName, showSectionName = false }) => (
    <div style={{ marginBottom: '20px' }}>
      {/* Top header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: brandCharcoal, fontFamily: "'Inter', sans-serif", marginBottom: '0', lineHeight: '1.2' }}>MAYKER EVENTS</div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '9px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <div>{proposal.clientName}</div>
            <div>{formatDateRange(proposal)}</div>
            <div>{proposal.venueName}</div>
          </div>
          <img src="/mayker_icon-black.svg" alt="M" style={{ height: '38px' }} />
        </div>
      </div>
      {/* Separator line */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: showSectionName ? '15px' : '0' }}></div>
      {/* Section name below separator if provided */}
      {showSectionName && sectionName && (
        <div style={{ fontSize: '14px', fontWeight: '400', color: brandCharcoal, marginTop: '15px', fontFamily: "'Domaine Text', serif", textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'center' }}>{sectionName}</div>
      )}
    </div>
  );
  
  // Page counter for sequential numbering
  const pageCounterRef = React.useRef(0);
  
  const getNextPageNumber = () => {
    pageCounterRef.current += 1;
    return pageCounterRef.current;
  };
  
  // Reset counter when component mounts
  React.useEffect(() => {
    pageCounterRef.current = 0;
  }, [proposal]);
  
  // Footer component
  const PageFooter = ({ pageNum, isDark = false, useFlexbox = false }) => (
    <div style={{
      position: useFlexbox ? 'relative' : 'absolute',
      bottom: useFlexbox ? 'auto' : '20px',
      left: '60px',
      right: '60px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '10px',
      color: isDark ? 'rgba(255,255,255,0.8)' : '#666',
      fontFamily: "'Neue Haas Unica', 'Inter', sans-serif",
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
      marginTop: useFlexbox ? 'auto' : '0',
      paddingTop: useFlexbox ? '20px' : '0'
    }}>
      <div>EVENTS@MAYKER.COM</div>
      <div>{pageNum}</div>
    </div>
  );

  return (
    <div data-proposal-view="true" style={{ minHeight: '100vh', backgroundColor: 'white', width: '100%', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        /* Font loading with fallbacks - fonts will fall back to system fonts if files aren't found */
        /* Custom fonts - using WOFF2 for optimal web performance */
        /* WOFF2 is 30-50% smaller than OTF and loads faster */
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/NeueHaasUnica-Regular.woff2') format('woff2'),
               url('/assets/NeueHaasUnica-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/NeueHaasUnica-Medium.woff2') format('woff2'),
               url('/assets/NeueHaasUnica-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Domaine Text';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/test-domaine-text-light.woff2') format('woff2'),
               url('/assets/test-domaine-text-light.woff2') format('woff2');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        /* Fallback font stacks - will use system fonts if custom fonts fail to load */
        .font-neue-haas {
          font-family: 'Neue Haas Unica', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        .font-domaine {
          font-family: 'Domaine Text', Georgia, 'Times New Roman', 'Palatino', serif;
        }
        
        /* Ensure fallbacks are used if fonts don't load */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; } 
        body { font-family: 'Inter', sans-serif; } 
        
        /* Browser preview styles - ensure proper layout */
        div[data-proposal-view="true"] {
          width: 100%;
          overflow-x: hidden;
        }
        
        div[data-proposal-view="true"] > div {
          width: 100%;
          max-width: 100%;
        }
        
        @media print { 
          .no-print { display: none !important; } 
          .print-break-after { page-break-after: always; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
          @page { size: letter; margin: 0; } 
          @page:first { margin: 0; } 
          div[data-proposal-view="true"] > div:first-of-type { page-break-after: always; } 
          thead { display: table-header-group !important; } 
          thead tr { page-break-inside: avoid; } 
          thead td, thead th { background-color: white !important; } 
          tbody tr[style*="page-break-before"] { page-break-before: always !important; break-before: page !important; }
          .no-page-break { page-break-inside: avoid !important; break-inside: avoid !important; } 
        }
      ` }} />

      <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', zIndex: 1000, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onEdit} style={{ padding: '8px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
              Edit
            </button>
            {onViewProfitability && (
              <button onClick={onViewProfitability} style={{ padding: '8px 20px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                View Profitability
              </button>
            )}
            <button onClick={handlePrintDownload} style={{ padding: '8px 20px', backgroundColor: brandCharcoal, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
              Print / Export as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="print-break-after" style={{ backgroundColor: brandTaupe, height: '100vh', width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 48px', position: 'relative', boxSizing: 'border-box', margin: 0, pageBreakAfter: 'always', pageBreakBefore: 'auto', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '80px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <img src="/mayker_wordmark-events-whisper.svg" alt="MAYKER EVENTS" style={{ height: '32px', marginBottom: '24px' }} />
            <div style={{ width: '60px', height: '0.5px', backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}></div>
            <p style={{ fontSize: '14px', color: 'white', letterSpacing: '0.1em', marginBottom: '16px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textTransform: 'uppercase' }}>Product Selections</p>
            <p style={{ fontSize: '18px', color: 'white', marginBottom: '6px', fontWeight: '300', fontFamily: "'Domaine Text', serif" }}>{proposal.clientName.replace(/\s*\(V\d+\)\s*$/, '')}{proposal.status === 'Approved' ? ' (Final)' : ''}</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{proposal.venueName}</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{formatDateRange(proposal)}</p>
          </div>
          <img src="/mayker_icon-whisper.svg" alt="Mayker Events" style={{ width: '60px', height: '60px', marginTop: '40px' }} />
        </div>
      </div>

      {(() => {
        const sectionPages = [];
        
        sections.forEach((section, sectionIndex) => {
          // Check if this is an image page (support both new format with type and legacy format)
          // Image page can have imageDriveId, imageUrl, or imageData (base64)
          const isImagePage = (section.type === 'image' || (!section.products || section.products.length === 0)) && (section.imageDriveId || section.imageData || section.imageUrl);
          if (isImagePage) {
            sectionPages.push(
              <div 
                key={`image-${sectionIndex}`} 
                style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '30px 60px 40px', position: 'relative', pageBreakBefore: sectionIndex === 0 ? 'auto' : 'always', boxSizing: 'border-box', overflow: 'hidden' }}
              >
                <PageHeader />
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', flexDirection: 'column' }}>
                  <img 
                    src={section.imageDriveId ? `https://drive.google.com/uc?export=view&id=${section.imageDriveId}` : (section.imageUrl || section.imageData)} 
                    alt="Floor plan or collage" 
                    style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Error loading image:', section.imageDriveId || section.imageUrl || 'base64 data');
                      e.target.style.display = 'none';
                      // Check if error message already exists
                      let errorDiv = e.target.parentElement.querySelector('.image-error-message');
                      if (!errorDiv) {
                        errorDiv = document.createElement('div');
                        errorDiv.className = 'image-error-message';
                        errorDiv.style.cssText = 'color: #d32f2f; text-align: center; padding: 20px; font-family: Inter, sans-serif; background-color: #ffebee; border-radius: 4px; max-width: 500px;';
                        errorDiv.innerHTML = '<strong>Error loading image.</strong><br />If using Google Drive, make sure the file is set to "Anyone with the link can view".';
                        e.target.parentElement.appendChild(errorDiv);
                      }
                    }}
                  />
                </div>
                <PageFooter pageNum={getNextPageNumber()} />
              </div>
            );
            return; // Skip product rendering for image pages
          }
          
          // Regular product section
          const totalPages = Math.ceil(section.products.length / productsPerPage);
          
          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const startIndex = pageIndex * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const pageProducts = section.products.slice(startIndex, endIndex);
            const isLastPageOfSection = pageIndex === totalPages - 1;
            const isLastSection = sectionIndex === sections.length - 1;
            const isLastPage = isLastPageOfSection && isLastSection;
            const isFirstPageOfSection = pageIndex === 0;
            
            // First product page should not have pageBreakBefore to avoid blank page after cover
            const isFirstProductPage = sectionIndex === 0 && pageIndex === 0;
            
            sectionPages.push(
              <div 
                key={`${sectionIndex}-${pageIndex}`} 
                style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '30px 60px 40px', position: 'relative', pageBreakBefore: isFirstProductPage ? 'auto' : 'always', pageBreakAfter: 'auto', pageBreakInside: 'avoid', breakInside: 'avoid', boxSizing: 'border-box' }}
              >
                <PageHeader sectionName={isFirstPageOfSection ? section.name : null} showSectionName={isFirstPageOfSection} />
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 'min-content', gap: '14px', pageBreakInside: 'avoid', breakInside: 'avoid', width: '100%', boxSizing: 'border-box' }}>
                  {pageProducts.map((product, productIndex) => (
                    <div key={productIndex} style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', pageBreakInside: 'avoid', breakInside: 'avoid', height: 'fit-content' }}>
                      <div style={{ aspectRatio: '1', backgroundColor: '#e5e5e5', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999', overflow: 'hidden', borderRadius: '2px' }}>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          '[Product Image]'
                        )}
                      </div>
                      <h3 style={{ fontSize: '10px', fontWeight: '500', color: brandCharcoal, textTransform: 'uppercase', marginBottom: '2px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.2' }}>
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '9px', color: '#666', marginBottom: '2px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.3' }}>Quantity: {product.quantity}</p>
                      {product.dimensions && (
                        <p style={{ fontSize: '9px', color: '#666', marginBottom: product.note && product.note.trim() ? '2px' : '0', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.3' }}>Size: {product.dimensions}</p>
                      )}
                      {product.note && product.note.trim() && (
                        <p style={{ fontSize: '9px', color: '#666', marginBottom: '0', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.3' }}>Product Note: {product.note}</p>
                      )}
                    </div>
                  ))}
                </div>
                <PageFooter pageNum={getNextPageNumber()} />
              </div>
            );
          }
        });
        
        return sectionPages;
      })()}

      {(() => {
        // Collect all products (excluding image pages)
        const allProducts = [];
        sections.forEach((section, sectionIndex) => {
          // Skip image pages
          if (section.type === 'image') return;
          
          section.products.forEach((product, productIndex) => {
            allProducts.push({ section, sectionIndex, product, productIndex });
          });
        });
        
        // Calculate how many products fit per page (approximately 23 rows)
        const rowsPerPage = 23;
        const totalInvoicePages = Math.ceil(allProducts.length / rowsPerPage);
        
        // Invoice header component matching the screenshot
        const InvoiceHeader = ({ isFirstPage }) => (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid', breakInside: 'avoid', display: 'block', visibility: 'visible' }}>
            <PageHeader />
            {/* INVOICE title */}
            <h2 style={{ fontSize: '14px', fontWeight: '400', color: brandCharcoal, marginTop: '15px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'center', fontFamily: "'Domaine Text', serif" }}>
              {isFirstPage ? 'Invoice' : 'Invoice (Cont.)'}
            </h2>
            {/* Column headers */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderSpacing: 0, marginBottom: '0' }}>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '45%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', textAlign: 'left', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Section</th>
                  <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', textAlign: 'left', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Product</th>
                  <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', textAlign: 'center', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Qty</th>
                  <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Unit Price</th>
                  <th style={{ padding: '8px 0', fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Total</th>
                </tr>
              </thead>
            </table>
          </div>
        );
        
        // Create invoice pages
        const invoicePages = [];
        for (let pageIndex = 0; pageIndex < totalInvoicePages; pageIndex++) {
          const startIndex = pageIndex * rowsPerPage;
          const endIndex = startIndex + rowsPerPage;
          const pageProducts = allProducts.slice(startIndex, endIndex);
          const isLastPage = pageIndex === totalInvoicePages - 1;
          const isFirstPage = pageIndex === 0;
          
          const currentPageNum = getNextPageNumber();
          invoicePages.push(
            <div 
              key={`invoice-page-${pageIndex}`} 
              style={{ 
                minHeight: '100vh', 
                width: '100%',
                maxWidth: '100%',
                padding: '30px 60px',
                paddingBottom: '60px',
                position: 'relative',
                pageBreakBefore: pageIndex > 0 ? 'always' : 'always',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {isLastPage ? (
                // On last page, use flexbox to ensure footer stays at bottom
                <>
                  <div style={{ flex: '0 0 auto', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <InvoiceHeader isFirstPage={isFirstPage} />
                  </div>
                  
                  <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderSpacing: 0 }}>
                      <colgroup>
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '45%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                      </colgroup>
                      <tbody>
                        {pageProducts.map((item, pageItemIndex) => {
                          const { section, sectionIndex, product, productIndex } = item;
                          const extendedPrice = product.price * totals.rentalMultiplier;
                          const lineTotal = extendedPrice * product.quantity;
                          
                          // Show section name if this is the first product in the section on this page
                          const showSectionName = pageItemIndex === 0 || 
                            (pageItemIndex > 0 && pageProducts[pageItemIndex - 1].sectionIndex !== sectionIndex) ||
                            productIndex === 0;
                          
                          return (
                            <tr key={`${sectionIndex}-${productIndex}`} style={{ borderBottom: '1px solid #f8f8f8' }}>
                              <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: '#888', fontStyle: 'italic', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                                {showSectionName ? section.name : ''}
                              </td>
                              <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                                {product.name}
                              </td>
                              <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'center', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                                {product.quantity}
                              </td>
                              <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                                ${formatNumber(extendedPrice)}
                              </td>
                              <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                                ${formatNumber(lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                // Non-last pages: normal structure with flexbox for footer spacing
                <>
                  <div style={{ flex: '0 0 auto' }}>
                    <InvoiceHeader isFirstPage={isFirstPage} />
                  </div>
                  
                  <div style={{ flex: '1 1 auto', minHeight: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderSpacing: 0 }}>
                    <colgroup>
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '45%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '15%' }} />
                    </colgroup>
                    <tbody>
                      {pageProducts.map((item, pageItemIndex) => {
                        const { section, sectionIndex, product, productIndex } = item;
                        const extendedPrice = product.price * totals.rentalMultiplier;
                        const lineTotal = extendedPrice * product.quantity;
                        
                        // Show section name if this is the first product in the section on this page
                        const showSectionName = pageItemIndex === 0 || 
                          (pageItemIndex > 0 && pageProducts[pageItemIndex - 1].sectionIndex !== sectionIndex) ||
                          productIndex === 0;
                        
                        return (
                          <tr key={`${sectionIndex}-${productIndex}`} style={{ borderBottom: '1px solid #f8f8f8' }}>
                            <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: '#888', fontStyle: 'italic', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                              {showSectionName ? section.name : ''}
                            </td>
                            <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                              {product.name}
                            </td>
                            <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'center', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                              {product.quantity}
                            </td>
                            <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                              ${formatNumber(extendedPrice)}
                            </td>
                            <td style={{ padding: pageItemIndex === 0 ? '5px 0 10px 0' : '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                              ${formatNumber(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
              <PageFooter pageNum={currentPageNum} />
            </div>
          );
        }
        
        return invoicePages;
      })()}

      {(() => {
        const currentPageNum = getNextPageNumber();
        return (
          <div key="totals-and-details" style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', padding: '50px 80px 40px', position: 'relative', pageBreakBefore: 'always', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Template-style header - logo only */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '35px' }}>
              <img src="/assets/mayker_primary-w-tag-date-black.png" alt="Mayker" onError={(e) => { e.target.src = '/mayker_primary-w-tag-date-black.png'; }} style={{ height: '120px', width: 'auto', maxWidth: '400px' }} />
            </div>
            
            {/* Content container with border */}
            <div style={{ flex: '1', border: '1px solid #2C2C2C', padding: '40px 35px 30px', backgroundColor: 'white', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Totals Section - Two Column Layout */}
              <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ width: '140px', flexShrink: 0, paddingRight: '20px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Domaine Text', serif", letterSpacing: '0.02em', margin: 0 }}>
                    Total
                  </h2>
                </div>
                <div className="no-page-break" style={{ flex: '1', minWidth: 0 }}>
                  <table className="no-page-break" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left', width: '50%' }}>Product Subtotal</td>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", width: '50%' }}>
                          ${formatNumber(totals.productSubtotal)}
                        </td>
                      </tr>
                      {totals.standardRateDiscount > 0 && (
                        <tr>
                          <td style={{ padding: '6px 0', fontSize: '11px', color: '#059669', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>
                            {(() => {
                              // Extract clean discount name (remove TYPE:, WAIVE:, and MULT: prefixes if present)
                              let displayName = proposal.discountName || '';
                              // Remove TYPE: prefix
                              if (displayName.includes('TYPE:')) {
                                displayName = displayName.replace(/TYPE:\w+\|?/, '');
                              }
                              // Remove WAIVE: prefix
                              if (displayName.includes('WAIVE:')) {
                                displayName = displayName.replace(/WAIVE:[^|]+\|?/, '');
                              }
                              // Remove MULT: prefix
                              if (displayName.includes('MULT:')) {
                                displayName = displayName.replace(/MULT:[\d.]+\|?/, '');
                              }
                              // Clean up any remaining leading pipes
                              displayName = displayName.replace(/^\|+/, '').trim();
                              
                              if (displayName && displayName.trim()) {
                                return displayName;
                              }
                              // Fallback to default format if no name
                              return (proposal.discountType === 'dollar' 
                                ? `Discount ($${formatNumber(parseFloat(proposal.discountValue || proposal.discount || 0))})`
                                : `Discount (${proposal.discount || proposal.discountValue || 0}% off)`);
                            })()}
                          </td>
                          <td style={{ padding: '6px 0', fontSize: '11px', color: '#059669', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                            -${formatNumber(totals.standardRateDiscount)}
                          </td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 0', fontSize: '11px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>Rental Total</td>
                        <td style={{ padding: '8px 0', fontSize: '11px', fontWeight: '400', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.rentalTotal)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>Product Care (10%)</td>
                        <td style={{ padding: '6px 0', fontSize: '11px', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                          {totals.waiveProductCare ? (
                            <span style={{ color: '#059669' }}>Waived (-${formatNumber(totals.productCareAmount || totals.productCare)})</span>
                          ) : (
                            <span style={{ color: brandCharcoal }}>${formatNumber(totals.productCare)}</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>Service Fee (5%)</td>
                        <td style={{ padding: '6px 0', fontSize: '11px', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                          {totals.waiveServiceFee ? (
                            <span style={{ color: '#059669' }}>Waived (-${formatNumber(totals.serviceFeeAmount || totals.serviceFee)})</span>
                          ) : (
                            <span style={{ color: brandCharcoal }}>${formatNumber(totals.serviceFee)}</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>Delivery</td>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.delivery)}</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>Subtotal</td>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>
                          {totals.taxExempt ? 'Tax' : `Tax (${proposal.taxRate || 9.75}%)`}
                        </td>
                        <td style={{ padding: '6px 0', fontSize: '11px', color: totals.taxExempt ? '#059669' : brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                          {totals.taxExempt ? 'Exempt' : `$${formatNumber(totals.tax)}`}
                        </td>
                      </tr>
                      <tr style={{ borderTop: '1px solid #2C2C2C' }}>
                        <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'left' }}>Total</td>
                        <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '400', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Project Description Section - Two Column Layout */}
              <div style={{ paddingTop: '30px', borderTop: '1px solid #e5e7eb', marginBottom: '30px', display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ width: '140px', flexShrink: 0, paddingRight: '20px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Domaine Text', serif", letterSpacing: '0.02em', margin: 0 }}>
                    Project Description
                  </h2>
                </div>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ marginBottom: '12px', fontSize: '12px', lineHeight: '1.5', color: '#444', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    The delivery fee quoted is based on the current scope of rentals, as well as the below delivery details. If your project needs change, we're happy to accommodate where possible, but delivery fees may adjust accordingly:
                  </p>
                  <ul style={{ fontSize: '12px', lineHeight: '1.6', marginBottom: '0', color: '#222', listStyle: 'none', padding: 0, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    <li style={{ marginBottom: '5px' }}><span style={{ fontWeight: '400' }}>Project Address:</span> {proposal.venueName}, {proposal.city}, {proposal.state}</li>
                    <li style={{ marginBottom: '5px' }}><span style={{ fontWeight: '400' }}>Delivery Date:</span> {parseDateSafely(proposal.startDate)?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || ''}</li>
                    <li style={{ marginBottom: '5px' }}><span style={{ fontWeight: '400' }}>Preferred Delivery Window:</span> {proposal.deliveryTime}</li>
                    <li style={{ marginBottom: '5px' }}><span style={{ fontWeight: '400' }}>Pick-Up Date:</span> {parseDateSafely(proposal.endDate)?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || ''}</li>
                    <li style={{ marginBottom: '5px' }}><span style={{ fontWeight: '400' }}>Preferred Pick-Up Window:</span> {proposal.strikeTime}</li>
                  </ul>
                </div>
              </div>
              
              {/* Confirmation and Payment Section - Two Column Layout */}
              <div style={{ paddingTop: '30px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ width: '140px', flexShrink: 0, paddingRight: '20px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Domaine Text', serif", letterSpacing: '0.02em', margin: 0 }}>
                    Confirmation and Payment
                  </h2>
                </div>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ marginBottom: '0', fontSize: '12px', lineHeight: '1.5', color: '#444', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    Projects are confirmed with a signed service agreement and corresponding deposit payment. Payment can be made via wire, ACH, credit card, or check. A 3% processing fee is applied to all credit card payments.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Template-style footer - outside the bordered container */}
            <div style={{ marginTop: '30px', paddingTop: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                <div style={{ fontWeight: '400', color: brandCharcoal, fontSize: '14px', letterSpacing: '0.02em' }}>MAYKER EVENTS</div>
                <div style={{ fontSize: '11px', color: brandCharcoal }}>events@mayker.com | (615) 970.1244</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Profitability View Component
function ProfitabilityView({ proposal, onBack }) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  const totals = calculateDetailedTotals(proposal);
  const brandCharcoal = '#2C2C2C';
  
  // Calculate profitability
  const calculateProfitability = () => {
    let totalOOP = 0;
    let totalRevenue = 0;
    const productsWithProfit = [];
    
    sections.forEach(section => {
      if (section.products && Array.isArray(section.products)) {
        section.products.forEach(product => {
          // Debug: Log product data to check supplier and productUrl
          if (product.needsPurchase === true || product.needsPurchase === 'true') {
            console.log('Product with purchase:', {
              name: product.name,
              supplier: product.supplier,
              productUrl: product.productUrl,
              hasSupplier: 'supplier' in product,
              hasProductUrl: 'productUrl' in product,
              allKeys: Object.keys(product)
            });
          }
          
          const quantity = parseFloat(product.quantity) || 0;
          const price = parseFloat(product.price) || 0;
          const revenue = quantity * price;
          totalRevenue += revenue;
          
          const needsPurchase = product.needsPurchase === true || product.needsPurchase === 'true';
          let productOOP = 0;
          let productInvestment = 0;
          let productProfit = revenue;
          let productProfitMargin = 100;
          
          if (needsPurchase) {
            const purchaseQuantity = parseFloat(product.purchaseQuantity) || 0;
            const oopCost = parseFloat(product.oopCost) || 0;
            productOOP = purchaseQuantity * oopCost;
            totalOOP += productOOP;
            // Freight is calculated at proposal level, but for individual product display we can show proportional freight
            const freight = productOOP * 0.15;
            productInvestment = productOOP + freight;
            productProfit = revenue - productInvestment;
            productProfitMargin = revenue > 0 ? (productProfit / revenue) * 100 : 0;
          }
          
          productsWithProfit.push({
            sectionName: section.name || '',
            productName: product.name || '',
            quantity: quantity,
            purchaseQuantity: needsPurchase ? (parseFloat(product.purchaseQuantity) || 0) : 0,
            oopCost: needsPurchase ? (parseFloat(product.oopCost) || 0) : 0,
            oopTotal: productOOP,
            investment: productInvestment,
            rentalPrice: price,
            revenue: revenue,
            profit: productProfit,
            profitMargin: productProfitMargin,
            needsPurchase: needsPurchase,
            supplier: (product.supplier && product.supplier.trim()) || '',
            productUrl: (product.productUrl && product.productUrl.trim()) || ''
          });
        });
      }
    });
    
    // Add Product Care Fee and Service Fee to Total Revenue
    const productCareFee = totals.waiveProductCare ? 0 : (totals.productCare || 0);
    const serviceFee = totals.waiveServiceFee ? 0 : (totals.serviceFee || 0);
    totalRevenue += productCareFee + serviceFee;
    
    const freight = totalOOP * 0.15;
    const totalCOGS = totalOOP + freight;
    const profit = totalRevenue - totalCOGS;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    return {
      totalOOP,
      freight,
      totalCOGS,
      totalRevenue,
      profit,
      profitMargin,
      productsWithProfit
    };
  };
  
  const profitability = calculateProfitability();
  
  const formatDateRange = (proposal) => {
    const start = parseDateSafely(proposal.startDate);
    const end = parseDateSafely(proposal.endDate);
    if (!start || !end) return '';
    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = start.getFullYear();
    if (startMonth === endMonth && startDay === endDay) {
      return `${startMonth} ${startDay}, ${year}`;
    } else if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div data-profitability-view="true" style={{ minHeight: '100vh', backgroundColor: 'white', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        /* Custom fonts - using WOFF2 for optimal web performance */
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/NeueHaasUnica-Regular.woff2') format('woff2'),
               url('/assets/NeueHaasUnica-Regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/NeueHaasUnica-Medium.woff2') format('woff2'),
               url('/assets/NeueHaasUnica-Medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        
        @font-face {
          font-family: 'Domaine Text';
          src: url('https://cdn.jsdelivr.net/gh/MaykerCreative/mayker-proposals@main/public/assets/test-domaine-text-light.woff2') format('woff2'),
               url('/assets/test-domaine-text-light.woff2') format('woff2');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; } 
        body { font-family: 'Neue Haas Unica', 'Inter', sans-serif; } 
        
        @media print { 
          .no-print { display: none !important; } 
          @page { size: letter landscape; margin: 0.4in; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          [data-profitability-view] {
            padding: 0 !important;
            width: 100% !important;
          }
          [data-profitability-view] > div:first-of-type {
            padding: 20px !important;
            max-width: 100% !important;
          }
          .profitability-table {
            font-size: 10px !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          .profitability-table th,
          .profitability-table td {
            padding: 6px 8px !important;
            font-size: 10px !important;
            white-space: nowrap !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          .profitability-table td {
            white-space: nowrap !important;
          }
          .profitability-table th:nth-child(1),
          .profitability-table td:nth-child(1) { width: 10% !important; }
          .profitability-table th:nth-child(2),
          .profitability-table td:nth-child(2) { width: 16% !important; }
          .profitability-table th:nth-child(3),
          .profitability-table td:nth-child(3) { width: 5% !important; }
          .profitability-table th:nth-child(4),
          .profitability-table td:nth-child(4) { width: 9% !important; }
          .profitability-table th:nth-child(5),
          .profitability-table td:nth-child(5) { width: 10% !important; }
          .profitability-table th:nth-child(6),
          .profitability-table td:nth-child(6) { width: 8% !important; }
          .profitability-table th:nth-child(7),
          .profitability-table td:nth-child(7) { width: 9% !important; }
          .profitability-table th:nth-child(8),
          .profitability-table td:nth-child(8) { width: 10% !important; }
          .profitability-table th:nth-child(9),
          .profitability-table td:nth-child(9) { width: 10% !important; }
          .profitability-table th:nth-child(10),
          .profitability-table td:nth-child(10) { width: 9% !important; }
          .profitability-table th:nth-child(11),
          .profitability-table td:nth-child(11) { width: 9% !important; }
          .profitability-table th:nth-child(12),
          .profitability-table td:nth-child(12) { width: 10% !important; }
          .profitability-table tfoot {
            display: table-footer-group !important;
          }
          .profitability-table tfoot tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Prevent tfoot from repeating on each page - only show at end */
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          tbody { display: table-row-group !important; }
          /* Ensure totals row doesn't break across pages */
          .profitability-table tfoot tr {
            page-break-before: auto !important;
            page-break-after: auto !important;
          }
          h1 {
            font-size: 14px !important;
            margin-bottom: 15px !important;
          }
          h2 {
            font-size: 12px !important;
          }
          .profitability-cards {
            page-break-inside: avoid;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 12px !important;
            margin-bottom: 20px !important;
          }
          .profitability-cards > div {
            padding: 12px !important;
          }
          .profitability-cards > div > div:first-child {
            font-size: 9px !important;
            margin-bottom: 6px !important;
            white-space: nowrap !important;
          }
          .profitability-cards > div > div:nth-child(2) {
            font-size: 16px !important;
          }
          .profitability-cards > div > div:nth-child(3) {
            font-size: 10px !important;
          }
          [data-profitability-view] img {
            height: 35px !important;
            max-width: 250px !important;
          }
          .profitability-table tfoot td {
            font-size: 11px !important;
            font-weight: 600 !important;
            padding: 8px 12px !important;
          }
        }
      ` }} />
      
      <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', zIndex: 1000, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            ← Back to Proposal
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handlePrint} style={{ padding: '8px 20px', backgroundColor: brandCharcoal, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
              Print / Export as PDF
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '40px', paddingTop: '80px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header with Logo */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
          <img src="/mayker_wordmark-events-black.svg" alt="Mayker Events" onError={(e) => { e.target.src = '/mayker_wordmark-events-black.svg'; }} style={{ height: '32px', width: 'auto' }} />
        </div>
        
        <h1 style={{ fontSize: '14px', fontWeight: '400', color: brandCharcoal, marginBottom: '25px', fontFamily: "'Domaine Text', serif", letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Profitability Analysis
        </h1>
        
        {/* Header Info */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Client Name</div>
              <div style={{ fontSize: '14px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{proposal.clientName || ''}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Project Date(s)</div>
              <div style={{ fontSize: '14px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{formatDateRange(proposal)}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Project Location</div>
              <div style={{ fontSize: '14px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{proposal.venueName || ''}</div>
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="profitability-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Total Revenue</div>
            <div style={{ fontSize: '16px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(profitability.totalRevenue)}</div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Total Investment</div>
            <div style={{ fontSize: '16px', fontWeight: '400', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(profitability.totalCOGS)}</div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
              OOP: ${formatNumber(profitability.totalOOP)} | Freight: ${formatNumber(profitability.freight)}
            </div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#d1fae5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Profit</div>
            <div style={{ fontSize: '16px', fontWeight: '400', color: profitability.profit >= 0 ? '#059669' : '#dc2626', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
              ${formatNumber(profitability.profit)}
            </div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Profit Margin</div>
            <div style={{ fontSize: '16px', fontWeight: '400', color: profitability.profitMargin >= 0 ? '#2563eb' : '#dc2626', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
              {profitability.profitMargin.toFixed(2)}%
            </div>
          </div>
        </div>
        
        {/* Product Table */}
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '400', color: brandCharcoal, marginBottom: '20px', fontFamily: "'Domaine Text', serif", letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Product Profitability Breakdown
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="profitability-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Section</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Product</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Rental Price</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Revenue</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Purchase Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>OOP Cost</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Investment</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Profit</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Profit Margin</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Supplier</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>Product URL</th>
                </tr>
              </thead>
              <tbody>
                {profitability.productsWithProfit.map((product, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: product.needsPurchase ? '#fef3c7' : 'white' }}>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{product.sectionName}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: brandCharcoal, fontWeight: '500', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{product.productName}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{product.quantity}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(product.rentalPrice)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontWeight: '500', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(product.revenue)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: product.needsPurchase ? '#92400e' : '#999', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                      {product.needsPurchase ? product.purchaseQuantity : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: product.needsPurchase ? '#92400e' : '#999', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                      {product.needsPurchase ? `$${formatNumber(product.oopCost)}` : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: product.needsPurchase ? '#92400e' : '#999', textAlign: 'right', fontWeight: '500', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                      {product.needsPurchase ? `$${formatNumber(product.investment)}` : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: product.profit >= 0 ? '#059669' : '#dc2626', textAlign: 'right', fontWeight: '500', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                      ${formatNumber(product.profit)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: product.profitMargin >= 0 ? '#2563eb' : '#dc2626', textAlign: 'right', fontWeight: '500', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                      {product.profitMargin.toFixed(2)}%
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: product.needsPurchase && product.supplier && product.supplier.trim() ? brandCharcoal : '#999', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                      {product.needsPurchase && product.supplier && product.supplier.trim() ? product.supplier : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: product.needsPurchase && product.productUrl && product.productUrl.trim() ? '#2563eb' : '#999', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                      {product.needsPurchase && product.productUrl && product.productUrl.trim() ? (
                        <a href={product.productUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                          Link
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f9fafb', borderTop: '2px solid #e5e7eb' }}>
                  <td colSpan="4" style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>TOTALS:</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(profitability.totalRevenue)}</td>
                  <td colSpan="2" style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#92400e', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    ${formatNumber(profitability.totalOOP)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#92400e', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    ${formatNumber(profitability.totalCOGS)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: profitability.profit >= 0 ? '#059669' : '#dc2626', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    ${formatNumber(profitability.profit)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: profitability.profitMargin >= 0 ? '#2563eb' : '#dc2626', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                    {profitability.profitMargin.toFixed(2)}%
                  </td>
                  <td colSpan="2" style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'left', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProposalView({ proposal, catalog, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    clientName: proposal.clientName || '',
    venueName: proposal.venueName || '',
    city: proposal.city || '',
    state: proposal.state || '',
    startDate: proposal.startDate || '',
    endDate: proposal.endDate || '',
    deliveryTime: proposal.deliveryTime || '',
    strikeTime: proposal.strikeTime || '',
    deliveryFee: proposal.deliveryFee || '',
    discount: proposal.discount || '',
    // Extract discountType from discountName if stored there
    discountType: (() => {
      if (proposal.discountType) return proposal.discountType;
      if (proposal.discountName && proposal.discountName.startsWith('TYPE:')) {
        const match = proposal.discountName.match(/^TYPE:(\w+)(?:\|(.+))?$/);
        if (match) return match[1];
      }
      return 'percentage';
    })(),
    discountValue: proposal.discountValue || proposal.discount || '0',
    // Extract actual discountName and metadata (remove TYPE:, WAIVE:, and MULT: prefixes if present)
    discountName: (() => {
      let name = proposal.discountName || '';
      // Remove TYPE: prefix
      if (name.includes('TYPE:')) {
        name = name.replace(/TYPE:\w+\|?/, '');
      }
      // Remove WAIVE: prefix
      if (name.includes('WAIVE:')) {
        name = name.replace(/WAIVE:[^|]+\|?/, '');
      }
      // Remove MULT: prefix
      if (name.includes('MULT:')) {
        name = name.replace(/MULT:[\d.]+\|?/, '');
      }
      // Clean up any remaining leading pipes
      name = name.replace(/^\|+/, '').trim();
      return name;
    })(),
    waiveProductCare: (() => {
      // Check proposal fields first
      if (proposal.waiveProductCare === true || proposal.waiveProductCare === 'true' || String(proposal.waiveProductCare || '').toLowerCase() === 'true') {
        return true;
      }
      // Extract from discountName if stored there
      if (proposal.discountName && proposal.discountName.includes('WAIVE:')) {
        const waiveMatch = proposal.discountName.match(/WAIVE:([^|]+)/);
        if (waiveMatch && waiveMatch[1].includes('PC')) {
          return true;
        }
      }
      return false;
    })(),
    waiveServiceFee: (() => {
      // Check proposal fields first
      if (proposal.waiveServiceFee === true || proposal.waiveServiceFee === 'true' || String(proposal.waiveServiceFee || '').toLowerCase() === 'true') {
        return true;
      }
      // Extract from discountName if stored there
      if (proposal.discountName && proposal.discountName.includes('WAIVE:')) {
        const waiveMatch = proposal.discountName.match(/WAIVE:([^|]+)/);
        if (waiveMatch && waiveMatch[1].includes('SF')) {
          return true;
        }
      }
      return false;
    })(),
    customRentalMultiplier: (() => {
      // Check proposal field first
      if (proposal.customRentalMultiplier && proposal.customRentalMultiplier.trim() !== '') {
        return proposal.customRentalMultiplier;
      }
      // Extract from discountName if stored there (format: "MULT:2.0|...")
      if (proposal.discountName && proposal.discountName.includes('MULT:')) {
        const multMatch = proposal.discountName.match(/MULT:([\d.]+)/);
        if (multMatch) {
          return multMatch[1];
        }
      }
      return '';
    })(),
    clientFolderURL: proposal.clientFolderURL || '',
    salesLead: proposal.salesLead || '',
    status: proposal.status || 'Pending',
    projectNumber: proposal.projectNumber || '',
    taxExempt: proposal.taxExempt === true || proposal.taxExempt === 'true'
  });
  const [sections, setSections] = useState(() => {
    const parsed = JSON.parse(proposal.sectionsJSON || '[]');
    // Ensure all sections have a type field for backward compatibility
    return parsed.map(section => {
      if (!section.type) {
        // If it has imageData or imageUrl but no products, it's an image page
        if ((section.imageData || section.imageUrl) && (!section.products || section.products.length === 0)) {
          return { ...section, type: 'image', imageUrl: section.imageUrl || '' };
        }
        // Otherwise it's a product section
        return { ...section, type: 'products' };
      }
      // Ensure imageUrl and imageDriveId exist for image pages
      if (section.type === 'image') {
        return { 
          ...section, 
          imageUrl: section.imageUrl || '', 
          imageDriveId: section.imageDriveId || '',
          imageUploading: false
        };
      }
      // Ensure products have note field and profitability fields for backward compatibility
      if (section.products && Array.isArray(section.products)) {
        return {
          ...section,
          products: section.products.map(product => {
            // Ensure all fields exist - check if they're undefined vs empty string
            const productWithFields = { ...product };
            if (!('note' in productWithFields)) {
              productWithFields.note = '';
            }
            if (!('needsPurchase' in productWithFields)) {
              productWithFields.needsPurchase = false;
            }
            if (!('purchaseQuantity' in productWithFields)) {
              productWithFields.purchaseQuantity = 0;
            }
            if (!('oopCost' in productWithFields)) {
              productWithFields.oopCost = 0;
            }
            if (!('supplier' in productWithFields)) {
              productWithFields.supplier = '';
            }
            if (!('productUrl' in productWithFields)) {
              productWithFields.productUrl = '';
            }
            return productWithFields;
          })
        };
      }
      return section;
    });
  });
  const [draggedSection, setDraggedSection] = useState(null);
  const [draggedProduct, setDraggedProduct] = useState({ sectionIdx: null, productIdx: null });

  useEffect(() => {
    const convertTo24Hour = (time12hr) => {
      if (!time12hr) return '';
      
      const timeMatch = time12hr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!timeMatch) return '';
      
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2];
      const meridiem = timeMatch[3]?.toUpperCase() || 'AM';
      
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    setFormData(prev => ({
      ...prev,
      deliveryTime: convertTo24Hour(prev.deliveryTime),
      strikeTime: convertTo24Hour(prev.strikeTime)
    }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Handle checkboxes differently - use checked instead of value
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
  };

  const handleRemoveSection = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const handleAddProduct = (sectionIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.push({ name: '', quantity: 1, price: 0, imageUrl: '', dimensions: '', note: '', needsPurchase: false, purchaseQuantity: 0, oopCost: 0, supplier: '', productUrl: '' });
    setSections(newSections);
  };

  const handleProductSelect = (sectionIdx, productIdx, selectedProduct) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    const existingProduct = newSections[sectionIdx].products[productIdx];
    // Preserve existing note and quantity when selecting a new product
    // IMPORTANT: Only update if the product name actually changed to avoid overwriting notes
    if (existingProduct?.name === selectedProduct.name) {
      // Same product selected - don't overwrite, just ensure catalog properties are up to date
      newSections[sectionIdx].products[productIdx] = {
        ...existingProduct,
        ...selectedProduct, // Update catalog properties (price, imageUrl, dimensions)
        quantity: existingProduct.quantity || 1,
        note: existingProduct.note || '', // Keep existing note
        needsPurchase: existingProduct.needsPurchase || false,
        purchaseQuantity: existingProduct.purchaseQuantity || 0,
        oopCost: existingProduct.oopCost || 0,
        supplier: existingProduct.supplier || '',
        productUrl: existingProduct.productUrl || ''
      };
    } else {
      // Different product - preserve note and profitability fields from existing product
      newSections[sectionIdx].products[productIdx] = { 
        ...selectedProduct,
        quantity: existingProduct?.quantity || 1,
        note: existingProduct?.note || '', // Preserve note if it exists
        needsPurchase: existingProduct?.needsPurchase || false,
        purchaseQuantity: existingProduct?.purchaseQuantity || 0,
        oopCost: existingProduct?.oopCost || 0,
        supplier: existingProduct?.supplier || '',
        productUrl: existingProduct?.productUrl || ''
      };
    }
    setSections(newSections);
  };

  const handleProductQuantityChange = (sectionIdx, productIdx, newQuantity) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products[productIdx].quantity = parseInt(newQuantity) || 1;
    setSections(newSections);
  };

  const handleProductNoteChange = (sectionIdx, productIdx, newNote) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    // Ensure the product exists and update note
    if (newSections[sectionIdx] && newSections[sectionIdx].products && newSections[sectionIdx].products[productIdx]) {
      newSections[sectionIdx].products[productIdx] = {
        ...newSections[sectionIdx].products[productIdx],
        note: newNote || ''
      };
      console.log('Note changed (EditProposalView):', { sectionIdx, productIdx, newNote, product: newSections[sectionIdx].products[productIdx] });
      setSections(newSections);
    }
  };
  
  const handleProductPurchaseChange = (sectionIdx, productIdx, field, value) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    if (newSections[sectionIdx] && newSections[sectionIdx].products && newSections[sectionIdx].products[productIdx]) {
      newSections[sectionIdx].products[productIdx] = {
        ...newSections[sectionIdx].products[productIdx],
        [field]: field === 'needsPurchase' ? value : (field === 'purchaseQuantity' || field === 'oopCost' ? parseFloat(value) || 0 : value)
      };
      setSections(newSections);
    }
  };

  const handleRemoveProduct = (sectionIdx, productIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.splice(productIdx, 1);
    setSections(newSections);
  };

  const handleAddSection = () => {
    setSections([...sections, { name: '', products: [], type: 'products' }]);
  };

  const handleAddImagePage = () => {
    setSections([...sections, { name: '', products: [], type: 'image', imageData: '', imageUrl: '', imageDriveId: '', imageUploading: false }]);
  };

  const handleImageUpload = async (sectionIdx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file (JPG or PNG)');
      return;
    }
    
    // Check if clientFolderURL is available
    if (!formData.clientFolderURL || formData.clientFolderURL.trim() === '') {
      alert('Please enter a Client Folder URL first. Images will be uploaded to that Google Drive folder.');
      return;
    }
    
    // Show uploading state
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].imageUploading = true;
    setSections(newSections);
    
    try {
      // Compress image first
      const compressedBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            // Calculate new dimensions (max 1200px width, maintain aspect ratio)
            const maxWidth = 1200;
            const maxHeight = 1600;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
            
            // Create canvas and compress
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob
            const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const quality = mimeType === 'image/jpeg' ? 0.8 : 1.0;
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            }, mimeType, quality);
          };
          img.onerror = () => reject(new Error('Error loading image'));
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
      
      // Convert blob to base64 for upload
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedBlob);
      });
      
      // Upload to Google Drive via Apps Script
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'uploadImage',
            clientFolderURL: formData.clientFolderURL,
            imageBase64: base64,
            imageName: file.name,
            mimeType: compressedBlob.type
          }),
          mode: 'cors'
        });
        
        // Read response
        let result;
        try {
          result = await response.json();
        } catch (e) {
          // If CORS blocks response, assume success and prompt user
          console.log('Response blocked by CORS, assuming upload succeeded');
          result = { success: true, fileId: 'uploaded' };
        }
        
        if (result.success && result.fileId) {
          const updatedSections = JSON.parse(JSON.stringify(sections));
          updatedSections[sectionIdx].imageUploading = false;
          updatedSections[sectionIdx].imageDriveId = result.fileId;
          updatedSections[sectionIdx].imageData = ''; // Clear base64
          updatedSections[sectionIdx].imageUrl = ''; // Clear URL
          setSections(updatedSections);
          alert('Image uploaded successfully to Google Drive!');
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (fetchError) {
        // Fallback: Store base64 temporarily, will upload on save
        console.warn('Direct upload failed, will upload on save:', fetchError);
        const updatedSections = JSON.parse(JSON.stringify(sections));
        updatedSections[sectionIdx].imageUploading = false;
        updatedSections[sectionIdx].imageData = `data:${compressedBlob.type};base64,${base64}`;
        updatedSections[sectionIdx].imageUrl = '';
        updatedSections[sectionIdx].imageDriveId = '';
        setSections(updatedSections);
        alert('Image prepared. It will be uploaded to Google Drive when you save the proposal.');
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorSections = JSON.parse(JSON.stringify(sections));
      errorSections[sectionIdx].imageUploading = false;
      setSections(errorSections);
      alert('Error uploading image: ' + error.message + '. Please try again or use a different image.');
    }
  };

  const handleRemoveImagePage = (sectionIdx) => {
    setSections(sections.filter((_, i) => i !== sectionIdx));
  };

  const handleSectionNameChange = (idx, newName) => {
    const newSections = [...sections];
    newSections[idx].name = newName;
    setSections(newSections);
  };

  // Drag and drop handlers for sections
  const handleSectionDragStart = (e, sectionIdx) => {
    // Prevent dragging when clicking on inputs, buttons, or selects
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.closest('input, button, select')) {
      e.preventDefault();
      return;
    }
    setDraggedSection(sectionIdx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleSectionDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleSectionDrop = (e, targetSectionIdx) => {
    e.preventDefault();
    if (draggedSection === null || draggedSection === targetSectionIdx) {
      setDraggedSection(null);
      return;
    }
    const newSections = [...sections];
    const [movedSection] = newSections.splice(draggedSection, 1);
    newSections.splice(targetSectionIdx, 0, movedSection);
    setSections(newSections);
    setDraggedSection(null);
  };
  const handleSectionDragEnd = () => {
    setDraggedSection(null);
  };

  // Drag and drop handlers for products
  const handleProductDragStart = (e, sectionIdx, productIdx) => {
    // Prevent dragging when clicking on inputs, buttons, or selects
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.closest('input, button, select')) {
      e.preventDefault();
      return;
    }
    setDraggedProduct({ sectionIdx, productIdx });
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleProductDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleProductDrop = (e, targetSectionIdx, targetProductIdx) => {
    e.preventDefault();
    if (draggedProduct.sectionIdx === null || 
        (draggedProduct.sectionIdx === targetSectionIdx && draggedProduct.productIdx === targetProductIdx)) {
      setDraggedProduct({ sectionIdx: null, productIdx: null });
      return;
    }
    const newSections = JSON.parse(JSON.stringify(sections));
    const sourceSection = newSections[draggedProduct.sectionIdx];
    const [movedProduct] = sourceSection.products.splice(draggedProduct.productIdx, 1);
    
    // Adjust target index if moving within the same section and dragging down
    let adjustedTargetIdx = targetProductIdx;
    if (draggedProduct.sectionIdx === targetSectionIdx && draggedProduct.productIdx < targetProductIdx) {
      adjustedTargetIdx = targetProductIdx;
    }
    
    newSections[targetSectionIdx].products.splice(adjustedTargetIdx, 0, movedProduct);
    setSections(newSections);
    setDraggedProduct({ sectionIdx: null, productIdx: null });
  };
  const handleProductDragEnd = () => {
    setDraggedProduct({ sectionIdx: null, productIdx: null });
  };

  const handleSaveClick = () => {
    const clientNameWithoutVersion = formData.clientName.replace(/\s*\(V\d+\)\s*$/, '');
    
    const convertTimeFormat = (time24) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    // Debug: Check sections state before saving
    console.log('=== BEFORE SAVING ===');
    console.log('Sections state (full):', JSON.stringify(sections, null, 2));
    console.log('Sections state (summary):', sections.map(s => ({
      name: s.name,
      products: s.products ? s.products.map(p => ({ 
        name: p.name, 
        note: p.note, 
        hasNote: 'note' in p,
        noteType: typeof p.note,
        allKeys: Object.keys(p)
      })) : []
    })));
    
    // Ensure all sections have proper structure before saving
    const sectionsToSave = sections.map(section => {
      if (section.type === 'image') {
        // Prefer Drive ID, then URL, then base64 (as last resort)
        const imageDriveId = section.imageDriveId || '';
        const imageUrl = section.imageUrl || '';
        const imageData = (imageDriveId || imageUrl) ? '' : (section.imageData || '');
        
        // If using base64, check size and warn
        if (imageData && imageData.length > 40000) {
          alert('Warning: Image data is very large. The image may be truncated when saved. Consider uploading to Google Drive instead.');
        }
        
        return {
          type: 'image',
          name: section.name || '',
          products: [],
          imageDriveId: imageDriveId,
          imageUrl: imageUrl,
          imageData: imageData // Only include if Drive ID and URL are not used
        };
      }
      return {
        type: section.type || 'products',
        name: section.name || '',
        products: (section.products || []).map(product => {
          // Explicitly preserve ALL product fields, including note and profitability fields
          return {
            name: product.name || '',
            quantity: product.quantity || 1,
            price: product.price || 0,
            imageUrl: product.imageUrl || '',
            dimensions: product.dimensions || '',
            note: product.note || '', // Explicitly include note field
            needsPurchase: product.needsPurchase || false,
            purchaseQuantity: product.purchaseQuantity || 0,
            oopCost: product.oopCost || 0,
            supplier: product.supplier || '',
            productUrl: product.productUrl || ''
          };
        })
      };
    });
    
    const finalData = {
      ...formData,
      clientName: clientNameWithoutVersion,
      deliveryTime: convertTimeFormat(formData.deliveryTime),
      strikeTime: convertTimeFormat(formData.strikeTime),
      sectionsJSON: JSON.stringify(sectionsToSave),
      generatePDF: true,
      // Sync discountValue to discount for backward compatibility
      discount: formData.discountValue || formData.discount || '0',
      discountType: formData.discountType || 'percentage',
      discountValue: formData.discountValue || formData.discount || '0',
      // Store discountType, waiver flags, and custom multiplier in discountName for persistence
      // Format: "TYPE:dollar|WAIVE:PC,SF|MULT:2.0|Discount Name" or variations
      discountName: (() => {
        let name = formData.discountName || '';
        let prefix = '';
        
        // Add discount type prefix if not percentage
        if (formData.discountType && formData.discountType !== 'percentage') {
          prefix += `TYPE:${formData.discountType}|`;
        }
        
        // Add waiver flags if any are waived
        const waivers = [];
        if (formData.waiveProductCare) waivers.push('PC');
        if (formData.waiveServiceFee) waivers.push('SF');
        if (waivers.length > 0) {
          prefix += `WAIVE:${waivers.join(',')}|`;
        }
        
        // Add custom rental multiplier if provided
        if (formData.customRentalMultiplier && formData.customRentalMultiplier.trim() !== '') {
          prefix += `MULT:${formData.customRentalMultiplier}|`;
        }
        
        return prefix ? `${prefix}${name}`.replace(/\|$/, '') : name;
      })(),
      // Explicitly include waiver flags for immediate use
      waiveProductCare: formData.waiveProductCare || false,
      waiveServiceFee: formData.waiveServiceFee || false,
      taxExempt: formData.taxExempt || false
    };
    
    // Debug: Log the customRentalMultiplier being saved
    console.log('EditProposalView - Saving customRentalMultiplier in discountName:', finalData.discountName, 'from formData:', formData.customRentalMultiplier);
    console.log('EditProposalView - Full finalData keys:', Object.keys(finalData));
    console.log('EditProposalView - finalData.customRentalMultiplier value:', finalData.customRentalMultiplier, 'type:', typeof finalData.customRentalMultiplier);
    
    // Debug: log to check if image data is included
    console.log('Saving sections:', sectionsToSave.map(s => ({
      type: s.type,
      name: s.name,
      hasImageDriveId: !!s.imageDriveId,
      imageDriveId: s.imageDriveId || 'none',
      hasImageUrl: !!s.imageUrl,
      imageUrl: s.imageUrl ? s.imageUrl.substring(0, 50) + '...' : 'none',
      hasImageData: !!s.imageData,
      imageDataLength: s.imageData ? s.imageData.length : 0,
      productsCount: s.products ? s.products.length : 0,
      productsWithNotes: s.products ? s.products.filter(p => p.note && p.note.trim()).map(p => ({ name: p.name, note: p.note })) : [],
      allProductsSample: s.products && s.products.length > 0 ? s.products.slice(0, 3).map(p => ({ 
        name: p.name, 
        hasNote: 'note' in p, 
        noteValue: p.note, 
        noteType: typeof p.note,
        allKeys: Object.keys(p)
      })) : []
    })));
    
    // Check for image pages specifically
    const imagePages = sectionsToSave.filter(s => s.type === 'image');
    console.log('Image pages found:', imagePages.length);
    if (imagePages.length > 0) {
      console.log('Image page details:', imagePages.map(ip => ({
        hasImageDriveId: !!ip.imageDriveId,
        imageDriveId: ip.imageDriveId || 'none',
        hasImageUrl: !!ip.imageUrl,
        imageUrl: ip.imageUrl ? ip.imageUrl.substring(0, 50) + '...' : 'none',
        hasImageData: !!ip.imageData,
        imageDataLength: ip.imageData ? ip.imageData.length : 0
      })));
    }
    
    // Check total size of sectionsJSON
    const sectionsJSONString = JSON.stringify(sectionsToSave);
    console.log('Total sectionsJSON size:', sectionsJSONString.length, 'characters');
    if (sectionsJSONString.length > 50000) {
      console.warn('WARNING: sectionsJSON exceeds Google Sheets cell limit (50,000 chars). Data may be truncated!');
    }
    
    onSave(finalData);
  };

  const brandTaupe = '#545142';
  const brandCharcoal = '#2C2C2C';
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf8', padding: '40px 24px 24px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); 
        * { font-family: 'Inter', sans-serif; }
        /* Hide number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #545142 !important;
        }
        button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      ` }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/mayker_icon-black.svg" alt="Mayker" style={{ height: '40px' }} />
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '600', color: brandCharcoal, margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Edit Proposal</h1>
              <p style={{ fontSize: '14px', color: '#888888', margin: '0', fontFamily: "'Inter', sans-serif" }}>Make changes and save as a new version</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onCancel} disabled={saving} style={{ padding: '12px 24px', backgroundColor: '#f0ede5', color: brandCharcoal, border: 'none', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', fontFamily: "'Inter', sans-serif", opacity: saving ? 0.6 : 1, transition: 'all 0.2s' }}>
              Cancel
            </button>
            <button onClick={handleSaveClick} disabled={saving} style={{ padding: '12px 24px', backgroundColor: brandTaupe, color: 'white', border: 'none', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', fontFamily: "'Inter', sans-serif", opacity: saving ? 0.7 : 1, transition: 'all 0.2s' }}>
              {saving ? 'Saving...' : 'Save as New Version'}
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '4px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '24px', color: '#888888', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proposal Details</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Client Name (Read-only)</label>
              <input type="text" value={formData.clientName} disabled style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fafaf8', cursor: 'not-allowed', color: brandCharcoal, fontFamily: "'Inter', sans-serif" }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Sales Lead</label>
              <input type="text" name="salesLead" value={formData.salesLead} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Venue Name</label>
              <input type="text" name="venueName" value={formData.venueName} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Delivery Time</label>
              <input type="time" name="deliveryTime" value={formData.deliveryTime} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Strike Time</label>
              <input type="time" name="strikeTime" value={formData.strikeTime} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Delivery Fee</label>
              <input type="number" name="deliveryFee" value={formData.deliveryFee} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Discount Type</label>
              <select name="discountType" value={formData.discountType || 'percentage'} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="dollar">Dollar Amount ($)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>
                {formData.discountType === 'dollar' ? 'Discount Amount ($)' : 'Discount (%)'}
              </label>
              <input 
                type="number" 
                name="discountValue" 
                value={formData.discountValue || formData.discount || '0'} 
                onChange={handleInputChange} 
                min="0" 
                max={formData.discountType === 'percentage' ? '100' : undefined}
                step={formData.discountType === 'dollar' ? '0.01' : '1'}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Discount Name</label>
              <input type="text" name="discountName" value={formData.discountName} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Product Care Fee</label>
              <select name="waiveProductCare" value={formData.waiveProductCare ? 'true' : 'false'} onChange={(e) => handleInputChange({ target: { name: 'waiveProductCare', value: e.target.value === 'true' } })} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }}>
                <option value="false">Apply (10%)</option>
                <option value="true">Waive</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Service Fee</label>
              <select name="waiveServiceFee" value={formData.waiveServiceFee ? 'true' : 'false'} onChange={(e) => handleInputChange({ target: { name: 'waiveServiceFee', value: e.target.value === 'true' } })} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }}>
                <option value="false">Apply (5%)</option>
                <option value="true">Waive</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px' }}>
              <input 
                type="checkbox" 
                name="taxExempt" 
                checked={formData.taxExempt === true || formData.taxExempt === 'true'} 
                onChange={handleInputChange}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}>
                Tax Exempt
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Custom Rental Multiplier</label>
              <select 
                name="customRentalMultiplier" 
                value={formData.customRentalMultiplier || ''} 
                onChange={handleInputChange} 
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} 
              >
                <option value="">Auto-calculated from duration</option>
                <option value="1.0">1.0</option>
                <option value="1.1">1.1</option>
                <option value="1.2">1.2</option>
                <option value="1.3">1.3</option>
                <option value="1.4">1.4</option>
                <option value="1.5">1.5</option>
                <option value="2.0">2.0</option>
                <option value="2.5">2.5</option>
                <option value="3.0">3.0</option>
                <option value="3.5">3.5</option>
                <option value="4.0">4.0</option>
                <option value="4.5">4.5</option>
                <option value="5.0">5.0</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Client Folder URL</label>
              <input type="text" name="clientFolderURL" value={formData.clientFolderURL} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Project Number (Read-only)</label>
              <input type="text" value={formData.projectNumber} disabled style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fafaf8', cursor: 'not-allowed', color: brandCharcoal, fontFamily: "'Inter', sans-serif" }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", backgroundColor: 'white', transition: 'border-color 0.2s' }}>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '600', marginBottom: '24px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Products by Section</h2>
          
          {sections.map((section, sectionIdx) => {
            const isImagePage = section.type === 'image';
            
            return (
              <div 
                key={sectionIdx} 
                draggable
                onDragStart={(e) => handleSectionDragStart(e, sectionIdx)}
                onDragOver={handleSectionDragOver}
                onDrop={(e) => handleSectionDrop(e, sectionIdx)}
                onDragEnd={handleSectionDragEnd}
                style={{ 
                  marginBottom: '32px', 
                  paddingBottom: '32px', 
                  borderBottom: '1px solid #f0ede5',
                  cursor: 'move',
                  opacity: draggedSection === sectionIdx ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {isImagePage ? (
                  // Image Page Section
                  <div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span 
                          style={{ fontSize: '18px', color: '#999', cursor: 'grab', userSelect: 'none' }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >☰</span>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Image Page</label>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Upload a floor plan, collage, or other image</div>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveImagePage(sectionIdx)} style={{ padding: '12px 20px', backgroundColor: '#fafaf8', color: brandCharcoal, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
                        Remove Page
                      </button>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Upload Image File to Google Drive</label>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png" 
                        onChange={(e) => handleImageUpload(sectionIdx, e)}
                        disabled={section.imageUploading || !formData.clientFolderURL}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", marginBottom: '12px', opacity: (section.imageUploading || !formData.clientFolderURL) ? 0.6 : 1, cursor: (section.imageUploading || !formData.clientFolderURL) ? 'not-allowed' : 'pointer' }}
                      />
                      {!formData.clientFolderURL && (
                        <div style={{ fontSize: '11px', color: '#d32f2f', marginTop: '4px', fontFamily: "'Inter', sans-serif" }}>
                          ⚠️ Please enter a Client Folder URL above to enable image uploads.
                        </div>
                      )}
                      {section.imageUploading && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', fontFamily: "'Inter', sans-serif" }}>
                          Uploading image to Google Drive...
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>OR Enter Image URL (Google Drive, etc.)</label>
                      <input 
                        type="text" 
                        placeholder="https://drive.google.com/file/d/... or any image URL"
                        value={section.imageUrl || (section.imageDriveId ? `https://drive.google.com/file/d/${section.imageDriveId}/view` : '') || ''}
                        onChange={(e) => {
                          const newSections = JSON.parse(JSON.stringify(sections));
                          let url = e.target.value;
                          
                          // Extract Google Drive file ID and store it separately
                          if (url.includes('drive.google.com')) {
                            let fileId = null;
                            
                            // Format: /file/d/FILE_ID/view or /file/d/FILE_ID/edit
                            const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                            if (fileMatch) {
                              fileId = fileMatch[1];
                            }
                            
                            // Format: uc?export=view&id=FILE_ID (already converted URL)
                            if (!fileId) {
                              const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                              if (ucMatch) {
                                fileId = ucMatch[1];
                              }
                            }
                            
                            if (fileId) {
                              // Store the file ID (this will work better than URL)
                              newSections[sectionIdx].imageDriveId = fileId;
                              newSections[sectionIdx].imageUrl = ''; // Clear URL, use Drive ID instead
                              newSections[sectionIdx].imageData = ''; // Clear base64
                            } else {
                              // Not a valid Drive file link
                              newSections[sectionIdx].imageUrl = url;
                              newSections[sectionIdx].imageDriveId = '';
                              newSections[sectionIdx].imageData = '';
                            }
                          } else if (url) {
                            // Non-Drive URL
                            newSections[sectionIdx].imageUrl = url;
                            newSections[sectionIdx].imageDriveId = '';
                            newSections[sectionIdx].imageData = '';
                          } else {
                            // Empty - clear everything
                            newSections[sectionIdx].imageUrl = '';
                            newSections[sectionIdx].imageDriveId = '';
                            newSections[sectionIdx].imageData = '';
                          }
                          setSections(newSections);
                        }}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
                      />
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', fontFamily: "'Inter', sans-serif" }}>
                        <strong>For Google Drive:</strong> Open the image file (not the folder) → Right-click → "Get link" → Paste here. The file ID will be extracted automatically.
                        <br />
                        <strong>Note:</strong> Make sure the file is set to "Anyone with the link can view" in sharing settings.
                        <br />
                        <strong>⚠️ Important:</strong> Google Drive URLs may not display in the preview due to browser security, but they will work in the generated PDF. For best results, use the "Upload Image File" option above.
                      </div>
                    </div>
                    
                    {(section.imageData || section.imageUrl || section.imageDriveId) && (
                      <div style={{ marginTop: '16px', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '16px', backgroundColor: '#fafaf8' }}>
                        {section.imageDriveId ? (
                          <>
                            <div style={{ fontSize: '11px', color: '#059669', marginBottom: '8px', fontFamily: "'Inter', sans-serif", fontWeight: '500' }}>
                              ✓ Google Drive file ID detected: {section.imageDriveId.substring(0, 20)}...
                            </div>
                            <img 
                              src={`https://drive.google.com/thumbnail?id=${section.imageDriveId}&sz=w1000`}
                              alt="Google Drive image" 
                              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                              onError={(e) => {
                                // Try fallback URL
                                e.target.src = `https://drive.google.com/uc?export=view&id=${section.imageDriveId}`;
                                e.target.onerror = () => {
                                  e.target.style.display = 'none';
                                  const errorDiv = e.target.parentElement.querySelector('.drive-preview-note');
                                  if (errorDiv) {
                                    errorDiv.style.display = 'block';
                                  }
                                };
                              }}
                            />
                            <div className="drive-preview-note" style={{ display: 'none', fontSize: '11px', color: '#666', marginTop: '8px', fontFamily: "'Inter', sans-serif", padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                              <strong>Preview Note:</strong> Google Drive images may not display in the browser preview due to security restrictions, but they will appear correctly in the generated PDF.
                            </div>
                          </>
                        ) : (
                          <>
                            <img 
                              src={section.imageData || section.imageUrl} 
                              alt="Uploaded image" 
                              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const errorDiv = e.target.nextSibling;
                                if (errorDiv) {
                                  errorDiv.style.display = 'block';
                                }
                              }}
                            />
                            <div style={{ display: 'none', color: '#d32f2f', fontSize: '12px', fontFamily: "'Inter', sans-serif", padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                              <strong>Error loading image.</strong> Please check the URL or use the "Upload Image File" option above.
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Product Section
                  <>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span 
                          style={{ fontSize: '18px', color: '#999', cursor: 'grab', userSelect: 'none' }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >☰</span>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Section Name</label>
                          <input type="text" value={section.name} onChange={(e) => handleSectionNameChange(sectionIdx, e.target.value)} placeholder="e.g., BAR, LOUNGE" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', transition: 'border-color 0.2s' }} />
                        </div>
                      </div>
                      {sections.length > 1 && (
                        <button onClick={() => handleRemoveSection(sectionIdx)} style={{ padding: '12px 20px', backgroundColor: '#fafaf8', color: brandCharcoal, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
                          Remove Section
                        </button>
                      )}
                    </div>
              
              {section.products.map((product, productIdx) => (
                <div key={productIdx} style={{ marginBottom: '16px' }}>
                  <div 
                    draggable
                    onDragStart={(e) => handleProductDragStart(e, sectionIdx, productIdx)}
                    onDragOver={handleProductDragOver}
                    onDrop={(e) => handleProductDrop(e, sectionIdx, productIdx)}
                    onDragEnd={handleProductDragEnd}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'auto 2fr 1fr 1fr auto', 
                      gap: '12px', 
                      marginBottom: '8px', 
                      alignItems: 'end',
                      cursor: 'move',
                      opacity: draggedProduct.sectionIdx === sectionIdx && draggedProduct.productIdx === productIdx ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: draggedProduct.sectionIdx === sectionIdx && draggedProduct.productIdx === productIdx ? '#f0ede5' : 'transparent'
                    }}
                  >
                    <span 
                      style={{ fontSize: '16px', color: '#999', cursor: 'grab', userSelect: 'none', alignSelf: 'center' }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >☰</span>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Product</label>
                      <select 
                        value={product.name} 
                        onChange={(e) => {
                          const selected = catalog.find(p => p.name === e.target.value);
                          if (selected) handleProductSelect(sectionIdx, productIdx, selected);
                        }} 
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", backgroundColor: 'white', transition: 'border-color 0.2s' }}>
                        <option value="">{product.name || 'Select product...'}</option>
                        {catalog.map((p, idx) => (
                          <option key={idx} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Qty</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={product.quantity} 
                        onChange={(e) => handleProductQuantityChange(sectionIdx, productIdx, e.target.value)} 
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Price</label>
                      <input type="text" value={`$${product.price.toFixed(2)}`} disabled style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fafaf8', color: brandCharcoal, fontFamily: "'Inter', sans-serif" }} />
                    </div>
                    <button 
                      onClick={() => handleRemoveProduct(sectionIdx, productIdx)} 
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ padding: '12px 16px', backgroundColor: '#fafaf8', color: brandCharcoal, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Note</label>
                    <input 
                      type="text" 
                      value={product.note || ''} 
                      onChange={(e) => handleProductNoteChange(sectionIdx, productIdx, e.target.value)} 
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="Optional note..."
                      style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} 
                    />
                  </div>
                  {/* Purchase Tracking Fields */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <input 
                        type="checkbox" 
                        checked={product.needsPurchase === true || product.needsPurchase === 'true'}
                        onChange={(e) => handleProductPurchaseChange(sectionIdx, productIdx, 'needsPurchase', e.target.checked)}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}>
                        Needs Purchase
                      </label>
                    </div>
                    {(product.needsPurchase === true || product.needsPurchase === 'true') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Purchase Qty</label>
                            <input 
                              type="number" 
                              min="0" 
                              value={product.purchaseQuantity || 0} 
                              onChange={(e) => handleProductPurchaseChange(sectionIdx, productIdx, 'purchaseQuantity', e.target.value)} 
                              onMouseDown={(e) => e.stopPropagation()}
                              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>OOP Cost (per unit)</label>
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              value={product.oopCost || 0} 
                              onChange={(e) => handleProductPurchaseChange(sectionIdx, productIdx, 'oopCost', e.target.value)} 
                              onMouseDown={(e) => e.stopPropagation()}
                              placeholder="$0.00"
                              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }} 
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Supplier</label>
                          <input 
                            type="text" 
                            value={product.supplier || ''} 
                            onChange={(e) => handleProductPurchaseChange(sectionIdx, productIdx, 'supplier', e.target.value)} 
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder="e.g., Amazon, Wayfair, etc."
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif" }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Product URL</label>
                          <input 
                            type="url" 
                            value={product.productUrl || ''} 
                            onChange={(e) => handleProductPurchaseChange(sectionIdx, productIdx, 'productUrl', e.target.value)} 
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder="https://..."
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif" }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <button onClick={() => handleAddProduct(sectionIdx)} style={{ marginTop: '12px', padding: '10px 20px', backgroundColor: '#fafaf8', color: brandCharcoal, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
                + Add Product
              </button>
                  </>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleAddSection} style={{ padding: '14px 28px', backgroundColor: brandTaupe, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
              + Add Section
            </button>
            <button onClick={handleAddImagePage} style={{ padding: '14px 28px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
              + Add Image Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

