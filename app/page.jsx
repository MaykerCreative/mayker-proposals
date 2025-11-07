'use client';

import React, { useState, useEffect } from 'react';

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

  const fetchProposals = async () => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (!data || !data.proposals || !Array.isArray(data.proposals) || data.proposals.length === 0) {
        setProposals([]);
        setCatalog([]);
      } else {
        const sortedProposals = data.proposals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setProposals(sortedProposals);
        setCatalog(data.catalog || []);
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
          await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(formData),
            mode: 'no-cors'
          });
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
    return <ProposalView proposal={selectedProposal} catalog={catalog} onBack={() => setSelectedProposal(null)} onPrint={() => window.print()} onRefresh={fetchProposals} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf8', padding: '32px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); 
        
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('/assets/NeueHaasUnica-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Neue Haas Unica';
          src: url('/assets/Neue Haas Unica Medium-abce.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'Domaine Text';
          src: url('/assets/TestDomaineText-Light.otf') format('opentype');
          font-weight: 300;
          font-style: normal;
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

        <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f7f4' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Client</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Venue</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>City, State</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Event Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Project #</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Version</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Sales Lead</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Last Edited</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.map((proposal, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0ede5', backgroundColor: index % 2 === 0 ? 'white' : '#fafaf8' }}>
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
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#888888' }}>{proposal.lastUpdated || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C', fontWeight: '500' }}>${calculateTotal(proposal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
    discountName: '',
    clientFolderURL: '',
    salesLead: '',
    status: 'Pending',
    projectNumber: ''
  });
  const [sections, setSections] = useState([{ name: '', products: [] }]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSection = () => {
    setSections([...sections, { name: '', products: [] }]);
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
    newSections[sectionIdx].products.push({ name: '', quantity: 1, price: 0, imageUrl: '', dimensions: '' });
    setSections(newSections);
  };

  const handleProductSelect = (sectionIdx, productIdx, selectedProduct) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products[productIdx] = { 
      ...selectedProduct, 
      quantity: newSections[sectionIdx].products[productIdx].quantity 
    };
    setSections(newSections);
  };

  const handleProductQuantityChange = (sectionIdx, productIdx, newQuantity) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products[productIdx].quantity = parseInt(newQuantity) || 1;
    setSections(newSections);
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
      sectionsJSON: JSON.stringify(sections)
    };

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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Discount (%)</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} placeholder="0" min="0" max="100" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Discount Name</label>
              <input type="text" name="discountName" value={formData.discountName} onChange={handleInputChange} placeholder="e.g., Industry Discount" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
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
                <div key={productIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
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

function ProposalView({ proposal, catalog, onBack, onPrint, onRefresh }) {
  const [isEditing, setIsEditing] = useState(proposal._isEditing || false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isCapturingPDF, setIsCapturingPDF] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEditData(JSON.parse(JSON.stringify(proposal)));
    }
  }, [isEditing, proposal]);

  const generatePDFFromProposal = async (proposalData) => {
    // Create a temporary hidden container with the proposal view
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '816px'; // 8.5 inches
    document.body.appendChild(tempContainer);
    
    // Render the proposal view temporarily
    const React = require('react');
    const ReactDOM = require('react-dom');
    
    // We'll use html2pdf.js to convert the rendered view
    // For now, return null and we'll handle it differently
    return null;
  };

  const handleSave = async (finalData) => {
    setSaving(true);
    try {
      // PDF generation disabled for now - the programmatic approach isn't working reliably
      // Users can manually download the PDF using the Print/Export button which works perfectly
      let pdfBase64 = null;
      
      // Uncomment below to re-enable automatic PDF generation (when working):
      /*
      if (finalData.clientFolderURL && finalData.clientFolderURL.trim() !== '') {
        try {
          console.log('Starting PDF generation - temporarily showing view to capture...');
          const tempProposal = {
            ...proposal,
            ...finalData,
            sectionsJSON: finalData.sectionsJSON
          };
          pdfBase64 = await generatePDFFromRenderedComponent(tempProposal);
          console.log('PDF generated successfully, length:', pdfBase64 ? pdfBase64.length : 0);
        } catch (pdfError) {
          console.error('PDF generation error:', pdfError);
          alert('PDF generation failed: ' + pdfError.message + '. Proposal will still be saved.');
        }
      }
      */
      
      const payload = {
        ...finalData,
        generatePDF: false, // Disabled - automatic PDF generation not working reliably
        pdfBase64: null
      };
      
      // Log payload info (without the full base64 to avoid console spam)
      console.log('Sending payload to Apps Script:');
      console.log('- generatePDF:', payload.generatePDF);
      console.log('- clientFolderURL:', payload.clientFolderURL ? 'provided' : 'missing');
      console.log('- pdfBase64:', pdfBase64 ? `Yes (${pdfBase64.length} chars)` : 'No');
      console.log('- Payload size:', JSON.stringify(payload).length, 'bytes');
      
      // Check if payload is too large (Google Apps Script has limits)
      const payloadSize = JSON.stringify(payload).length;
      if (payloadSize > 10000000) { // 10MB limit
        console.warn('WARNING: Payload is very large (' + payloadSize + ' bytes). PDF might be too big.');
        alert('Warning: PDF is very large. Upload may fail. Consider reducing image sizes.');
      }
      
      await fetch('https://script.google.com/macros/s/AKfycbzB7gHa5o-gBep98SJgQsG-z2EsEspSWC6NXvLFwurYBGpxpkI-weD-HVcfY2LDA4Yz/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      
      const successMsg = 'Proposal saved successfully. Use the "Print / Export as PDF" button to download the PDF.';
      console.log(successMsg);
      alert(successMsg);
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      alert('Error saving proposal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const generatePDFFromRenderedComponent = async (proposalData) => {
    return new Promise((resolve, reject) => {
      // Check if html2pdf is already loaded
      if (window.html2pdf) {
        captureRenderedProposalView(proposalData, resolve, reject);
      } else {
        // Dynamically load html2pdf.js
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          captureRenderedProposalView(proposalData, resolve, reject);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      }
    });
  };
  
  const captureRenderedProposalView = (proposalData, resolve, reject) => {
    console.log('Capturing rendered proposal view (same as print view)...');
    
    // Find the ViewProposalView component - it should be rendered (even if hidden)
    const existingView = document.querySelector('[data-proposal-view]');
    
    if (existingView) {
      // Perfect! The view is rendered - use it directly (same as print view)
      console.log('Found rendered ViewProposalView - capturing it (this is the same component that prints perfectly)');
      const noPrintElements = existingView.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        el.style.display = 'none';
      });
      
      // Convert all images to base64 to avoid CORS/tainted canvas issues
      const images = existingView.querySelectorAll('img');
      const totalImages = images.length;
      console.log('Found', totalImages, 'images, converting to base64 to avoid tainted canvas...');
      
      const convertImageToBase64 = (img) => {
        return new Promise((imgResolve) => {
          // If already base64, skip
          if (img.src && img.src.startsWith('data:')) {
            imgResolve();
            return;
          }
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const newImg = new Image();
          
          // Use CORS proxy
          const originalSrc = img.src;
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalSrc)}`;
          
          newImg.crossOrigin = 'anonymous';
          
          newImg.onload = () => {
            try {
              canvas.width = newImg.width;
              canvas.height = newImg.height;
              ctx.drawImage(newImg, 0, 0);
              const dataURL = canvas.toDataURL('image/jpeg', 0.8);
              img.src = dataURL;
              console.log('Image converted to base64');
              imgResolve();
            } catch (err) {
              console.log('Could not convert image, using placeholder:', err);
              // Use placeholder
              img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
              imgResolve();
            }
          };
          
          newImg.onerror = () => {
            console.log('Image failed to load, using placeholder');
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
            imgResolve();
          };
          
          newImg.src = proxyUrl;
          
          // Timeout fallback
          setTimeout(() => {
            if (!newImg.complete) {
              img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
              imgResolve();
            }
          }, 3000);
        });
      };
      
      const convertAllImages = async () => {
        try {
          if (totalImages === 0) {
            console.log('No images, capturing PDF immediately');
            setTimeout(() => {
              captureElementAsPDF(existingView, resolve, reject, noPrintElements);
            }, 300);
            return;
          }
          
          console.log('Converting', totalImages, 'images to base64...');
          const conversionPromises = Array.from(images).map((img, idx) => {
            if (img.src && !img.src.startsWith('data:')) {
              console.log(`Converting image ${idx + 1}/${totalImages}...`);
              return convertImageToBase64(img);
            } else {
              return Promise.resolve();
            }
          });
          
          await Promise.all(conversionPromises);
          console.log('All images converted, capturing PDF...');
          
          // Wait a moment for final rendering
          setTimeout(() => {
            captureElementAsPDF(existingView, resolve, reject, noPrintElements);
          }, 500);
        } catch (conversionError) {
          console.error('Error converting images:', conversionError);
          // Continue anyway - html2canvas will handle it
          setTimeout(() => {
            captureElementAsPDF(existingView, resolve, reject, noPrintElements);
          }, 500);
        }
      };
      
      convertAllImages();
      return;
    }
    
    // View not found - fallback to HTML generation
    console.log('ViewProposalView not found in DOM, using HTML generation fallback');
    generatePDFFromRenderedView(proposalData, resolve, reject);
  };
  
  const renderProposalViewToContainer = (container, proposalData, resolve, reject) => {
    // Check if we're in the ProposalView component context
    // If so, we can temporarily show the ViewProposalView
    const existingView = document.querySelector('[data-proposal-view]');
    
    if (existingView && existingView.offsetParent !== null) {
      // The view is already rendered and visible - use it!
      console.log('Using existing rendered proposal view');
      const noPrintElements = existingView.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        el.style.display = 'none';
      });
      
      setTimeout(() => {
        captureElementAsPDF(existingView, resolve, reject, noPrintElements);
      }, 500);
    } else {
      // The view isn't rendered - we need to trigger a temporary view
      // Best approach: Use the browser's print functionality programmatically
      // But since we can't capture from print(), we'll use the HTML fallback
      console.log('View not rendered, using HTML generation (will match print view)');
      generatePDFFromRenderedView(proposalData, resolve, reject);
    }
  };
  
  const generatePDFBlob = async (proposalData) => {
    // Legacy function name - redirect to new function
    return generatePDFFromRenderedComponent(proposalData);
  };
  
  const generatePDFFromRenderedView = (proposalData, resolve, reject) => {
    console.log('generatePDFFromRenderedView called');
    // Find the proposal view container in the DOM
    // The ViewProposalView should be rendered when editing
    const proposalContainer = document.querySelector('[data-proposal-view]');
    
    if (proposalContainer && proposalContainer.offsetParent !== null) {
      console.log('Found rendered proposal view, using it for PDF');
      // Use the actual rendered view - this will be an exact match!
      // Hide the no-print elements temporarily
      const noPrintElements = proposalContainer.querySelectorAll('.no-print');
      noPrintElements.forEach(el => {
        el.style.display = 'none';
      });
      
      // Wait a moment for any animations/transitions
      setTimeout(() => {
        captureElementAsPDF(proposalContainer, resolve, reject, noPrintElements);
      }, 500);
    } else {
      console.log('Proposal view not found, generating HTML fallback');
      // Fallback: The view isn't rendered, so we need to generate HTML
      // Use an iframe to properly render the full HTML document
      const iframe = document.createElement('iframe');
      iframe.setAttribute('data-proposal-view', 'true');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '816px';
      iframe.style.height = '2000px'; // Tall enough for multiple pages
      iframe.style.backgroundColor = 'white';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        console.log('Iframe loaded, waiting for content to render...');
        setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeBody = iframeDoc.body;
            const iframeHtml = iframeDoc.documentElement;
            
            // Set explicit dimensions on html and body
            iframeHtml.style.width = '816px';
            iframeHtml.style.margin = '0';
            iframeHtml.style.padding = '0';
            iframeBody.style.width = '816px';
            iframeBody.style.margin = '0';
            iframeBody.style.padding = '0';
            iframeBody.style.overflow = 'visible';
            
            // Calculate total height needed
            const totalHeight = iframeBody.scrollHeight;
            console.log('Total document height:', totalHeight);
            iframe.style.height = Math.max(totalHeight + 100, 2000) + 'px';
            
            // Convert images to base64 to avoid CORS issues
            const images = iframeBody.querySelectorAll('img');
            const totalImages = images.length;
            console.log('Found', totalImages, 'images, converting to base64 to avoid CORS...');
            
            const convertImageToBase64 = (img) => {
              return new Promise((imgResolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Create a new image
                const newImg = new Image();
                
                // Use a CORS proxy to fetch the image
                const originalSrc = img.src;
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalSrc)}`;
                
                newImg.onload = () => {
                  try {
                    canvas.width = newImg.width;
                    canvas.height = newImg.height;
                    ctx.drawImage(newImg, 0, 0);
                    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                    img.src = dataURL;
                    console.log('Image converted to base64 successfully');
                    imgResolve();
                  } catch (err) {
                    console.log('Could not convert image (CORS issue), using placeholder:', err);
                    // Use placeholder if conversion fails
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    imgResolve();
                  }
                };
                
                newImg.onerror = () => {
                  console.log('Image failed to load via proxy, using placeholder');
                  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  imgResolve();
                };
                
                // Try loading through CORS proxy first, fallback to direct
                newImg.crossOrigin = 'anonymous';
                newImg.src = proxyUrl;
                
                // Fallback: if proxy fails, try direct (will likely fail but we have error handler)
                setTimeout(() => {
                  if (!newImg.complete) {
                    newImg.src = originalSrc;
                  }
                }, 2000);
              });
            };
            
            const convertAllImages = async () => {
              try {
                if (totalImages === 0) {
                  console.log('No images, generating PDF immediately');
                  setTimeout(() => {
                    captureElementAsPDF(iframeBody, resolve, reject);
                  }, 500);
                  return;
                }
                
                const conversionPromises = Array.from(images).map((img, idx) => {
                  if (img.src && !img.src.startsWith('data:')) {
                    console.log(`Converting image ${idx + 1}/${totalImages}...`);
                    return convertImageToBase64(img);
                  } else {
                    return Promise.resolve();
                  }
                });
                
                await Promise.all(conversionPromises);
                console.log('All images converted, generating PDF...');
                
                // Give it a moment for final rendering
                setTimeout(() => {
                  captureElementAsPDF(iframeBody, resolve, reject);
                }, 500);
              } catch (conversionError) {
                console.error('Error converting images:', conversionError);
                // Continue anyway - html2canvas will handle missing images
                setTimeout(() => {
                  captureElementAsPDF(iframeBody, resolve, reject);
                }, 500);
              }
            };
            
            convertAllImages();
          } catch (iframeError) {
            console.error('Error accessing iframe content:', iframeError);
            reject(iframeError);
          }
        }, 500);
      };
      
      // Write the HTML content to the iframe
      try {
        const htmlContent = generateProposalHTMLForPDF(proposalData);
        console.log('Generated HTML content, length:', htmlContent.length);
        iframe.contentDocument.open();
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();
      } catch (htmlError) {
        console.error('Error generating HTML:', htmlError);
        document.body.removeChild(iframe);
        reject(htmlError);
      }
    }
  };
  
  const captureElementAsPDF = (element, resolve, reject, noPrintElements = []) => {
    try {
      console.log('Starting PDF capture from element');
      if (!window.html2pdf) {
        throw new Error('html2pdf library not loaded');
      }
      
      window.html2pdf()
        .set({
          margin: 0,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 1.5, 
            useCORS: false,
            logging: false,
            letterRendering: true,
            allowTaint: false, // Changed to false - images should be base64 by now
            backgroundColor: '#ffffff',
            windowWidth: 816,
            windowHeight: element.scrollHeight || 1056,
            scrollX: 0,
            scrollY: 0,
            removeContainer: false,
            ignoreElements: (element) => {
              // Ignore elements that might cause issues
              return element.classList && element.classList.contains('no-print');
            }
          },
          jsPDF: { 
            unit: 'in', 
            format: 'letter', 
            orientation: 'portrait'
          }
        })
        .from(element)
        .outputPdf('datauristring')
        .then((pdfDataUri) => {
          console.log('PDF generated, extracting base64');
          const base64 = pdfDataUri.split(',')[1];
          console.log('Base64 length:', base64 ? base64.length : 0);
          
          // Restore no-print elements
          noPrintElements.forEach(el => {
            el.style.display = '';
          });
          
          // Clean up temporary elements
          const tempElements = document.querySelectorAll('[data-proposal-view]');
          tempElements.forEach(el => {
            if (el.style.position === 'absolute' && (el.style.left === '-9999px' || el.tagName === 'IFRAME')) {
              document.body.removeChild(el);
            }
          });
          
          resolve(base64);
        })
        .catch((pdfError) => {
          console.error('PDF generation error:', pdfError);
          // Restore no-print elements on error
          noPrintElements.forEach(el => {
            el.style.display = '';
          });
          reject(pdfError);
        });
    } catch (error) {
      console.error('Error in captureElementAsPDF:', error);
      // Restore no-print elements on error
      noPrintElements.forEach(el => {
        el.style.display = '';
      });
      reject(error);
    }
  };
  
  const generateProposalHTMLForPDF = (proposalData) => {
    // Generate HTML that matches the ViewProposalView structure
    const sections = JSON.parse(proposalData.sectionsJSON || '[]');
    const brandTaupe = '#545142';
    const brandCharcoal = '#2C2C2C';
    
    // Format event date
    const formatDateRange = (proposal) => {
      if (!proposal.startDate || !proposal.endDate) return '';
      const start = new Date(proposal.startDate);
      const end = new Date(proposal.endDate);
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
    
    // Generate section pages HTML
    let sectionsHTML = '';
    const productsPerPage = 9;
    let pageCounter = 2; // Start at 2 (after cover page)
    
    sections.forEach((section, sectionIndex) => {
      const totalPages = Math.ceil(section.products.length / productsPerPage);
      
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIndex = pageIndex * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const pageProducts = section.products.slice(startIndex, endIndex);
        const currentPageNum = pageCounter++;
        
        sectionsHTML += `
          <div style="width: 816px; min-height: 1056px; height: 1056px; padding: 30px 60px; page-break-after: always; position: relative; box-sizing: border-box; background: white; margin: 0;">
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-size: 14px; font-weight: 600; color: ${brandCharcoal}; font-family: 'Inter', sans-serif;">MAYKER EVENTS</div>
                <div style="text-align: right; font-size: 9px; color: #666; text-transform: uppercase; font-family: 'Inter', sans-serif; line-height: 1.4;">
                  <div>${proposalData.clientName || ''}</div>
                  <div>${formatDateRange(proposalData)}</div>
                  <div>${proposalData.venueName || ''}</div>
                </div>
              </div>
            </div>
            <h2 style="font-size: 18px; font-weight: 400; color: ${brandCharcoal}; margin-bottom: 20px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Inter', sans-serif;">
              ${section.name || 'Section'}
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 20px; width: 696px; max-width: 696px;">
        `;
        
        pageProducts.forEach(product => {
          sectionsHTML += `
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; width: 212px; min-width: 212px; max-width: 212px; box-sizing: border-box; flex-shrink: 0;">
              <div style="width: 100%; padding-bottom: 100%; position: relative; background-color: #e5e5e5; margin-bottom: 12px; border-radius: 2px; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #999; background: #e5e5e5;">
                  ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name || ''}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.parentElement.innerHTML='[Product Image]';" />` : '<span>[Product Image]</span>'}
                </div>
              </div>
              <h3 style="font-size: 11px; font-weight: 500; color: ${brandCharcoal}; text-transform: uppercase; margin-bottom: 4px; margin-top: 0; font-family: \'Inter\', sans-serif; line-height: 1.3;">
                ${product.name || 'Product'}
              </h3>
              <p style="font-size: 10px; color: #666; margin-bottom: 4px; margin-top: 0; font-family: \'Inter\', sans-serif;">Quantity: ${product.quantity || 1}</p>
              ${product.dimensions ? `<p style="font-size: 10px; color: #666; margin-top: 0; margin-bottom: 0; font-family: 'Inter', sans-serif;">${product.dimensions}</p>` : ''}
            </div>
          `;
        });
        
        sectionsHTML += `
            </div>
            <div style="position: absolute; bottom: 30px; right: 60px; font-size: 10px; color: #999;">${currentPageNum}</div>
          </div>
        `;
      }
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { 
            size: letter; 
            margin: 0; 
          }
          * { 
            box-sizing: border-box; 
            margin: 0;
            padding: 0;
          }
          html, body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            margin: 0; 
            padding: 0; 
            width: 816px;
            background: white;
          }
          body {
            background: white;
            overflow: visible;
          }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div style="width: 816px; height: 1056px; min-height: 1056px; background-color: ${brandTaupe}; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 48px; position: relative; page-break-after: always; box-sizing: border-box; margin: 0;">
          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 80px;">
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
              <p style="font-size: 14px; color: white; letter-spacing: 0.1em; margin-bottom: 16px; text-transform: uppercase; font-weight: 400;">Product Selections</p>
              <p style="font-size: 18px; color: white; margin-bottom: 6px; font-weight: 300; line-height: 1.4;">${proposalData.clientName || ''}</p>
              <p style="font-size: 13px; color: rgba(255,255,255,0.9); margin-bottom: 4px; line-height: 1.4;">${proposalData.venueName || ''}</p>
              <p style="font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.4;">${formatDateRange(proposalData)}</p>
            </div>
          </div>
        </div>
        
        ${sectionsHTML}
      </body>
      </html>
    `;
  };
  
  const generatePDFFilename = (proposalData) => {
    const clientName = String(proposalData.clientName || '').trim();
    const venueName = String(proposalData.venueName || '').trim();
    const version = proposalData.version || 1;
    
    // Format event date
    let eventDate = '';
    if (proposalData.startDate && proposalData.endDate) {
      const start = new Date(proposalData.startDate);
      const end = new Date(proposalData.endDate);
      const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
      const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
      const startDay = start.getDate();
      const endDay = end.getDate();
      const year = start.getFullYear();
      
      if (startMonth === endMonth && startDay === endDay) {
        eventDate = `${startMonth} ${startDay}, ${year}`;
      } else if (startMonth === endMonth) {
        eventDate = `${startMonth} ${startDay}-${endDay}, ${year}`;
      } else {
        eventDate = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
      }
    }
    
    return `(V${version}) ${clientName} - ${venueName} - ${eventDate} - Mayker Events Rental Proposal`;
  };

  if (isEditing && editData) {
    return (
      <>
        <EditProposalView proposal={editData} catalog={catalog} onSave={handleSave} onCancel={() => setIsEditing(false)} saving={saving} />
        {/* Hidden ViewProposalView for PDF capture - this is the same component that prints perfectly! */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '816px', zIndex: -1, pointerEvents: 'none' }}>
          <ViewProposalView 
            proposal={{ ...proposal, ...editData }} 
            onBack={() => {}} 
            onPrint={() => {}} 
            onEdit={() => {}} 
          />
        </div>
      </>
    );
  }

  return <ViewProposalView proposal={proposal} onBack={onBack} onPrint={onPrint} onEdit={() => setIsEditing(true)} />;
}

function ViewProposalView({ proposal, onBack, onPrint, onEdit }) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  const totals = calculateDetailedTotals(proposal);
  const brandTaupe = '#545142';
  const brandCharcoal = '#2C2C2C';
  
  // Calculate total number of section pages (9 products per page)
  const productsPerPage = 9;
  const totalSectionPages = sections.reduce((total, section) => {
    return total + Math.ceil(section.products.length / productsPerPage);
  }, 0);
  
  // Invoice page number = cover page (1) + section pages + invoice page itself
  const invoicePageNum = 1 + totalSectionPages + 1;
  const projectDetailsPageNum = invoicePageNum + 1;
  
  // Simple print handler - just opens browser print dialog
  const handlePrintDownload = () => {
    window.print();
  };
  
  return (
    <div data-proposal-view="true" style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Inter', sans-serif; } @media print { .no-print { display: none !important; } .print-break-after { page-break-after: always; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { size: letter; margin: 0; } }` }} />

      <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', zIndex: 1000, padding: '16px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onEdit} style={{ padding: '8px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
              Edit
            </button>
            <button onClick={handlePrintDownload} style={{ padding: '8px 20px', backgroundColor: brandCharcoal, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
              Print / Export as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="print-break-after" style={{ backgroundColor: brandTaupe, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 48px', position: 'relative', boxSizing: 'border-box' }}>
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
        const productsPerPage = 9;
        let pageCounter = 2; // Start at 2 (after cover page)
        const sectionPages = [];
        
        sections.forEach((section, sectionIndex) => {
          const totalPages = Math.ceil(section.products.length / productsPerPage);
          
          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const startIndex = pageIndex * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const pageProducts = section.products.slice(startIndex, endIndex);
            const isLastPageOfSection = pageIndex === totalPages - 1;
            const isLastSection = sectionIndex === sections.length - 1;
            const isLastPage = isLastPageOfSection && isLastSection;
            const currentPageNum = pageCounter++;
            
            sectionPages.push(
              <div 
                key={`${sectionIndex}-${pageIndex}`} 
                className={isLastPage ? "print-break-after" : ""} 
                style={{ minHeight: '100vh', padding: '30px 60px 40px', position: 'relative' }}
              >
                <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <img src="/mayker_wordmark-events-black.svg" alt="Mayker Events" style={{ height: '22px', marginTop: '4px' }} />
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                      <div style={{ fontSize: '9px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        <div>{proposal.clientName}</div>
                        <div>{formatDateRange(proposal)}</div>
                        <div>{proposal.venueName}</div>
                      </div>
                      <img src="/mayker_icon-black.svg" alt="M" style={{ height: '38px' }} />
                    </div>
                  </div>
                </div>
                
                <h2 style={{ fontSize: '18px', fontWeight: '400', color: brandCharcoal, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Domaine Text', serif" }}>
                  {section.name}
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  {pageProducts.map((product, productIndex) => (
                    <div key={productIndex} style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                      <div style={{ aspectRatio: '1', backgroundColor: '#e5e5e5', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999', overflow: 'hidden', borderRadius: '2px' }}>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          '[Product Image]'
                        )}
                      </div>
                      <h3 style={{ fontSize: '11px', fontWeight: '500', color: brandCharcoal, textTransform: 'uppercase', marginBottom: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>Quantity: {product.quantity}</p>
                      {product.dimensions && (
                        <p style={{ fontSize: '10px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{product.dimensions}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div style={{ position: 'absolute', bottom: '30px', right: '60px', fontSize: '10px', color: '#999', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{currentPageNum}</div>
              </div>
            );
          }
        });
        
        return sectionPages;
      })()}

      <div style={{ minHeight: '100vh', padding: '30px 60px 40px', position: 'relative' }}>
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <img src="/mayker_wordmark-events-black.svg" alt="Mayker Events" style={{ height: '22px', marginTop: '4px' }} />
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ fontSize: '9px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <div>{proposal.clientName}</div>
                <div>{formatDateRange(proposal)}</div>
                <div>{proposal.venueName}</div>
              </div>
              <img src="/mayker_icon-black.svg" alt="M" style={{ height: '38px' }} />
            </div>
          </div>
        </div>
        
        <h2 style={{ fontSize: '18px', fontWeight: '400', color: brandCharcoal, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', fontFamily: "'Domaine Text', serif" }}>Invoice</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', tableLayout: 'fixed' }}>
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
            <tbody>
              {sections.map((section, sectionIndex) => (
                section.products.map((product, productIndex) => {
                  const extendedPrice = product.price * totals.rentalMultiplier;
                  const lineTotal = extendedPrice * product.quantity;
                  
                  return (
                    <tr key={`${sectionIndex}-${productIndex}`} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      <td style={{ padding: '10px 0', fontSize: '11px', color: '#888', fontStyle: 'italic', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                        {productIndex === 0 ? section.name : ''}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                        {product.name}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'center', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                        {product.quantity}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                        ${formatNumber(extendedPrice)}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                        ${formatNumber(lineTotal)}
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
            <div style={{ marginLeft: 'auto', width: '30%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right', width: '50%' }}>Product Subtotal</td>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", width: '50%' }}>
                      ${formatNumber(totals.productSubtotal)}
                    </td>
                  </tr>
                  {totals.standardRateDiscount > 0 && (
                    <tr>
                      <td style={{ padding: '8px 0', fontSize: '11px', color: '#059669', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>
                        Discount ({proposal.discount}% off)
                      </td>
                      <td style={{ padding: '8px 0', fontSize: '11px', color: '#059669', textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                        -${formatNumber(totals.standardRateDiscount)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>Rental Total</td>
                    <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.rentalTotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>Product Care (10%)</td>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.productCare)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>Service Fee (5%)</td>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.serviceFee)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>Delivery</td>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.delivery)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>Subtotal</td>
                    <td style={{ padding: '10px 0', fontSize: '11px', fontWeight: '500', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>Tax (9.75%)</td>
                    <td style={{ padding: '8px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.tax)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid ' + brandCharcoal }}>
                    <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textAlign: 'right' }}>TOTAL</td>
                    <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '600', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>${formatNumber(totals.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div style={{ position: 'absolute', bottom: '30px', right: '60px', fontSize: '10px', color: '#999', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{invoicePageNum}</div>
      </div>

      <div className="print-break-after" style={{ minHeight: '100vh', padding: '30px 60px 40px', position: 'relative' }}>
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <img src="/mayker_wordmark-events-black.svg" alt="Mayker Events" style={{ height: '22px', marginTop: '4px' }} />
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ fontSize: '9px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <div>{proposal.clientName}</div>
                <div>{formatDateRange(proposal)}</div>
                <div>{proposal.venueName}</div>
              </div>
              <img src="/mayker_icon-black.svg" alt="M" style={{ height: '38px' }} />
            </div>
          </div>
        </div>
        
        <h2 style={{ fontSize: '16px', fontWeight: '400', color: brandCharcoal, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Domaine Text', serif" }}>Project Details</h2>
        
        <p style={{ marginBottom: '24px', fontSize: '12px', lineHeight: '1.6', color: '#444' }}>
          The project fee quoted is based on the current scope of rentals, as well as the delivery details below. If your requirements change, delivery fees may adjust accordingly:
        </p>
        
        <ul style={{ fontSize: '12px', lineHeight: '1.8', marginBottom: '20px', color: '#222', listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '8px' }}><strong>Project Location:</strong> {proposal.venueName}, {proposal.city}, {proposal.state}</li>
          <li style={{ marginBottom: '8px' }}><strong>Delivery Date:</strong> {new Date(proposal.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</li>
          <li style={{ marginBottom: '8px' }}><strong>Preferred Delivery Window:</strong> {proposal.deliveryTime}</li>
          <li style={{ marginBottom: '8px' }}><strong>Pick-Up Date:</strong> {new Date(proposal.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</li>
          <li style={{ marginBottom: '8px' }}><strong>Preferred Pick-Up Window:</strong> {proposal.strikeTime}</li>
        </ul>
        
        <div style={{ position: 'absolute', bottom: '30px', right: '60px', fontSize: '10px', color: '#999', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{projectDetailsPageNum}</div>
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
    discountName: proposal.discountName || '',
    clientFolderURL: proposal.clientFolderURL || '',
    salesLead: proposal.salesLead || '',
    status: proposal.status || 'Pending',
    projectNumber: proposal.projectNumber || ''
  });
  const [sections, setSections] = useState(JSON.parse(proposal.sectionsJSON || '[]'));

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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveSection = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const handleAddProduct = (sectionIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.push({ name: '', quantity: 1, price: 0, imageUrl: '', dimensions: '' });
    setSections(newSections);
  };

  const handleProductSelect = (sectionIdx, productIdx, selectedProduct) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products[productIdx] = { ...selectedProduct, quantity: newSections[sectionIdx].products[productIdx].quantity };
    setSections(newSections);
  };

  const handleProductQuantityChange = (sectionIdx, productIdx, newQuantity) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products[productIdx].quantity = parseInt(newQuantity) || 1;
    setSections(newSections);
  };

  const handleRemoveProduct = (sectionIdx, productIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.splice(productIdx, 1);
    setSections(newSections);
  };

  const handleAddSection = () => {
    setSections([...sections, { name: '', products: [] }]);
  };

  const handleSectionNameChange = (idx, newName) => {
    const newSections = [...sections];
    newSections[idx].name = newName;
    setSections(newSections);
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
    
    const finalData = {
      ...formData,
      clientName: clientNameWithoutVersion,
      deliveryTime: convertTimeFormat(formData.deliveryTime),
      strikeTime: convertTimeFormat(formData.strikeTime),
      sectionsJSON: JSON.stringify(sections),
      generatePDF: true // Flag to trigger PDF generation
    };
    onSave(finalData);
  };

  const brandTaupe = '#545142';
  const brandCharcoal = '#2C2C2C';
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf8', padding: '40px 24px 24px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); 
        * { font-family: 'Inter', sans-serif; }
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
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Discount (%)</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Discount Name</label>
              <input type="text" name="discountName" value={formData.discountName} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
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
          
          {sections.map((section, sectionIdx) => (
            <div key={sectionIdx} style={{ marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #f0ede5' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Section Name</label>
                  <input type="text" value={section.name} onChange={(e) => handleSectionNameChange(sectionIdx, e.target.value)} placeholder="e.g., BAR, LOUNGE" style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', transition: 'border-color 0.2s' }} />
                </div>
                {sections.length > 1 && (
                  <button onClick={() => handleRemoveSection(sectionIdx)} style={{ padding: '12px 20px', backgroundColor: '#fafaf8', color: brandCharcoal, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
                    Remove Section
                  </button>
                )}
              </div>
              
              {section.products.map((product, productIdx) => (
                <div key={productIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Product</label>
                    <select value={product.name} onChange={(e) => {
                      const selected = catalog.find(p => p.name === e.target.value);
                      if (selected) handleProductSelect(sectionIdx, productIdx, selected);
                    }} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", backgroundColor: 'white', transition: 'border-color 0.2s' }}>
                      <option value="">{product.name || 'Select product...'}</option>
                      {catalog.map((p, idx) => (
                        <option key={idx} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Qty</label>
                    <input type="number" min="1" value={product.quantity} onChange={(e) => handleProductQuantityChange(sectionIdx, productIdx, e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', color: brandCharcoal, fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Price</label>
                    <input type="text" value={`$${product.price.toFixed(2)}`} disabled style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fafaf8', color: brandCharcoal, fontFamily: "'Inter', sans-serif" }} />
                  </div>
                  <button onClick={() => handleRemoveProduct(sectionIdx, productIdx)} style={{ padding: '12px 16px', backgroundColor: '#fafaf8', color: brandCharcoal, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
                    Remove
                  </button>
                </div>
              ))}
              
              <button onClick={() => handleAddProduct(sectionIdx)} style={{ marginTop: '12px', padding: '10px 20px', backgroundColor: '#fafaf8', color: brandCharcoal, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
                + Add Product
              </button>
            </div>
          ))}

          <button onClick={handleAddSection} style={{ padding: '14px 28px', backgroundColor: brandTaupe, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
            + Add Section
          </button>
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
  const duration = getDuration(proposal);
  const rentalMultiplier = getRentalMultiplier(duration);
  
  let baseProductTotal = 0;
  sections.forEach(section => {
    section.products.forEach(product => {
      baseProductTotal += product.price * product.quantity;
    });
  });
  
  const extendedProductTotal = baseProductTotal * rentalMultiplier;
  
  const discountPercent = parseFloat(proposal.discount) || 0;
  const standardRateDiscount = extendedProductTotal * (discountPercent / 100);
  const rentalTotal = extendedProductTotal - standardRateDiscount;
  
  const productCare = extendedProductTotal * 0.10;
  
  const delivery = parseFloat(proposal.deliveryFee) || 0;
  
  const serviceFee = (rentalTotal + productCare + delivery) * 0.05;
  
  const subtotal = rentalTotal + productCare + serviceFee + delivery;
  const tax = subtotal * 0.0975;
  const total = subtotal + tax;
  
  return {
    productSubtotal: extendedProductTotal,
    standardRateDiscount,
    rentalTotal,
    productCare,
    serviceFee,
    delivery,
    subtotal,
    tax,
    total,
    rentalMultiplier
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
  
  if (startMonth === endMonth && startDay === endDay) {
    return `${startMonth} ${startDay}, ${year}`;
  } else if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

function getDuration(proposal) {
  if (proposal.deliveryTime && proposal.strikeTime) {
    const deliveryDateTime = parseDateTime(proposal.startDate, proposal.deliveryTime);
    const strikeDateTime = parseDateTime(proposal.endDate, proposal.strikeTime);
    
    const diffTime = strikeDateTime - deliveryDateTime;
    const diffHours = diffTime / (1000 * 60 * 60);
    
    return Math.ceil(diffHours / 24);
  }
  
  const start = new Date(proposal.startDate);
  const end = new Date(proposal.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

function parseDateTime(dateStr, timeStr) {
  const [date] = new Date(dateStr).toISOString().split('T');
  const [time] = timeStr.split(' ');
  const [hours, minutes] = time.split(':');
  const isPM = timeStr.includes('PM');
  let hour = parseInt(hours);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return new Date(`${date}T${String(hour).padStart(2, '0')}:${minutes}:00Z`);
}

function formatNumber(num) {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
