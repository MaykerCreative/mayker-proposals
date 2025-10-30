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
    // Check URL params on load
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'create') {
      setIsCreatingNew(true);
    }
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzTkntgiCvga488oNIYN-h5tTKPhv7VH4v2RDG0fsqx2WBPEPAkFJ6laJ92wXzV_ejr/exec');
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
  
  // Show CreateProposalView if in create mode
  if (isCreatingNew) {
    return <CreateProposalView 
      catalog={catalog} 
      onSave={async (formData) => {
        try {
          await fetch('https://script.google.com/macros/s/AKfycbzTkntgiCvga488oNIYN-h5tTKPhv7VH4v2RDG0fsqx2WBPEPAkFJ6laJ92wXzV_ejr/exec', {
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
        // Clear URL param if exists
        if (window.location.search.includes('page=create')) {
          window.history.pushState({}, '', window.location.pathname);
        }
      }}
    />;
  }
  
  if (selectedProposal) return <ProposalView proposal={selectedProposal} catalog={catalog} onBack={() => setSelectedProposal(null)} onPrint={() => window.print()} onRefresh={fetchProposals} />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf8', padding: '32px' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'); * { font-family: 'Inter', sans-serif; }` }} />
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Location</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Event Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Sales Lead</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb' }}>Project #</th>
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
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.venueName}, {proposal.city}, {proposal.state}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.eventDate}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.salesLead || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2C2C2C' }}>{proposal.projectNumber || '-'}</td>
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
    // Validation
    if (!formData.clientName.trim()) {
      alert('Client name is required');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('Start and end dates are required');
      return;
    }

    setSaving(true);
    
    // Convert times from 24-hour to 12-hour format
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

  useEffect(() => {
    if (isEditing) {
      setEditData(JSON.parse(JSON.stringify(proposal)));
    }
  }, [isEditing, proposal]);

  const handleSave = async (finalData) => {
    setSaving(true);
    try {
      await fetch('https://script.google.com/macros/s/AKfycbzTkntgiCvga488oNIYN-h5tTKPhv7VH4v2RDG0fsqx2WBPEPAkFJ6laJ92wXzV_ejr/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(finalData),
        mode: 'no-cors'
      });
      alert('Proposal saved successfully');
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      alert('Error saving proposal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && editData) {
    return <EditProposalView proposal={editData} catalog={catalog} onSave={handleSave} onCancel={() => setIsEditing(false)} saving={saving} />;
  }

  return <ViewProposalView proposal={proposal} onBack={onBack} onPrint={onPrint} onEdit={() => setIsEditing(true)} />;
}

function ViewProposalView({ proposal, onBack, onPrint, onEdit }) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  const totals = calculateDetailedTotals(proposal);
  const brandTaupe = '#545142';
  const brandCharcoal = '#2C2C2C';
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
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
            <button onClick={onPrint} style={{ padding: '8px 20px', backgroundColor: brandCharcoal, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
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
            <p style={{ fontSize: '14px', color: 'white', letterSpacing: '0.2em', marginBottom: '16px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", textTransform: 'uppercase' }}>Product Selections</p>
            <p style={{ fontSize: '18px', color: 'white', marginBottom: '6px', fontWeight: '300', fontFamily: "'Domaine Text', serif" }}>{proposal.clientName.replace(/\s*\(V\d+\)\s*$/, '')}{proposal.status === 'Approved' ? ' (Final)' : ''}</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{proposal.venueName}</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{formatDateRange(proposal)}</p>
          </div>
          <img src="/mayker_icon-whisper.svg" alt="Mayker Events" style={{ width: '60px', height: '60px', marginTop: '40px' }} />
        </div>
      </div>

      {sections.map((section, sectionIndex) => {
        const pageNum = sectionIndex + 2;
        return (
          <div key={sectionIndex} className="print-break-after" style={{ minHeight: '100vh', padding: '30px 60px 40px', position: 'relative' }}>
            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <img src="/mayker_wordmark-events-black.svg" alt="Mayker Events" style={{ height: '22px', marginTop: '4px' }} />
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ fontSize: '9px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div>{proposal.clientName}</div>
                    <div>{formatDateRange(proposal)}</div>
                    <div>{proposal.venueName}</div>
                  </div>
                  <img src="/mayker_icon-black.svg" alt="M" style={{ height: '38px' }} />
                </div>
              </div>
            </div>
            
            <h2 style={{ fontSize: '18px', fontWeight: '400', color: brandCharcoal, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Domaine Text', serif" }}>
              {section.name}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {section.products.map((product, productIndex) => (
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
            
            <div style={{ position: 'absolute', bottom: '30px', right: '60px', fontSize: '10px', color: '#999', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{pageNum}</div>
          </div>
        );
      })}

      <div style={{ minHeight: '100vh', padding: '30px 60px 40px', position: 'relative' }}>
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <img src="/mayker_wordmark-events-black.svg" alt="Mayker Events" style={{ height: '22px', marginTop: '4px' }} />
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ fontSize: '9px', color: '#666', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif", lineHeight: '1.4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <div>{proposal.clientName}</div>
                <div>{formatDateRange(proposal)}</div>
                <div>{proposal.venueName}</div>
              </div>
              <img src="/mayker_icon-black.svg" alt="M" style={{ height: '38px' }} />
            </div>
          </div>
        </div>
        
        <h2 style={{ fontSize: '18px', fontWeight: '400', color: brandCharcoal, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', fontFamily: "'Domaine Text', serif" }}>Invoice</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
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
                      <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
                        ${formatNumber(extendedPrice)}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: '11px', color: brandCharcoal, textAlign: 'right', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>
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
        
        <div style={{ position: 'absolute', bottom: '30px', right: '60px', fontSize: '10px', color: '#999', fontFamily: "'Neue Haas Unica', 'Inter', sans-serif" }}>{sections.length + 2}</div>
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

  // Convert times from 12-hour to 24-hour format for input fields
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
    
    // Convert times from 24-hour back to 12-hour format for storage
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
      sectionsJSON: JSON.stringify(sections)
    };
    onSave(finalData);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '80px 24px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Edit Proposal</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onCancel} disabled={saving} style={{ padding: '10px 24px', backgroundColor: '#e5e7eb', color: '#111827', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              Cancel
            </button>
            <button onClick={handleSaveClick} disabled={saving} style={{ padding: '10px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save as New Version'}
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Proposal Details</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Client Name (Read-only)</label>
              <input type="text" value={formData.clientName} disabled style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f3f4f6', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Sales Lead</label>
              <input type="text" name="salesLead" value={formData.salesLead} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Venue Name</label>
              <input type="text" name="venueName" value={formData.venueName} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>End Date</label>
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
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Delivery Fee</label>
              <input type="number" name="deliveryFee" value={formData.deliveryFee} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Discount (%)</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Discount Name</label>
              <input type="text" name="discountName" value={formData.discountName} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Client Folder URL</label>
              <input type="text" name="clientFolderURL" value={formData.clientFolderURL} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Project Number (Read-only)</label>
              <input type="text" value={formData.projectNumber} disabled style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f3f4f6', cursor: 'not-allowed' }} />
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

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Products by Section</h2>
          
          {sections.map((section, sectionIdx) => (
            <div key={sectionIdx} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px', color: '#6b7280' }}>Section Name</label>
                  <input type="text" value={section.name} onChange={(e) => handleSectionNameChange(sectionIdx, e.target.value)} placeholder="e.g., BAR, LOUNGE" style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                {sections.length > 1 && (
                  <button onClick={() => handleRemoveSection(sectionIdx)} style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', marginTop: '20px' }}>
                    Remove
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
                      <option value="">{product.name || 'Select product...'}</option>
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
                    <input type="number" value={product.price} disabled style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#f3f4f6' }} />
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

function calculateTotal(proposal) {
  const totals = calculateDetailedTotals(proposal);
  return totals.total;
}

function calculateDetailedTotals(proposal) {
  const sections = JSON.parse(proposal.sectionsJSON || '[]');
  const duration = getDuration(proposal);
  const rentalMultiplier = getRentalMultiplier(duration);
  
  let productSubtotal = 0;
  sections.forEach(section => {
    section.products.forEach(product => {
      const extendedPrice = product.price * rentalMultiplier;
      productSubtotal += extendedPrice * product.quantity;
    });
  });
  
  const discountPercent = parseFloat(proposal.discount) || 0;
  const standardRateDiscount = productSubtotal * (discountPercent / 100);
  const rentalTotal = productSubtotal - standardRateDiscount;
  
  const productCare = productSubtotal * 0.10;
  const serviceFee = rentalTotal * 0.05;
  const delivery = parseFloat(proposal.deliveryFee) || 0;
  
  const subtotal = rentalTotal + productCare + serviceFee + delivery;
  const tax = subtotal * 0.0975;
  const total = subtotal + tax;
  
  return {
    productSubtotal,
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
  // 1 day or less = standard rate (1.0x)
  if (duration <= 1) return 1.0;
  // 2-6 days: add 10% per day
  if (duration === 2) return 1.1;
  if (duration === 3) return 1.2;
  if (duration === 4) return 1.3;
  if (duration === 5) return 1.4;
  if (duration === 6) return 1.5;
  // 7-14 days: flat 2x rate
  if (duration >= 7 && duration <= 14) return 2.0;
  // 15-21 days: flat 3x rate
  if (duration >= 15 && duration <= 21) return 3.0;
  // 22-28 days: flat 4x rate
  if (duration >= 22 && duration <= 28) return 4.0;
  // 28+ days: 4x rate (maximum)
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
