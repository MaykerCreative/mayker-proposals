'use client';

import React, { useState, useEffect } from 'react';

export default function ProposalApp() {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [editingProposal, setEditingProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProposals(data.proposals || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEdit = (proposal) => {
    setEditingProposal(JSON.parse(JSON.stringify(proposal)));
  };

  const handleSave = async (formData, sections) => {
    setSaving(true);
    try {
      const baseNameMatch = formData.clientName.match(/^(.+?)(?:\s*\(V\d+\))?$/);
      const baseName = baseNameMatch ? baseNameMatch[1] : formData.clientName;
      
      const payload = {
        clientName: baseName,
        venueName: formData.venueName,
        city: formData.city,
        state: formData.state,
        startDate: formData.startDate,
        endDate: formData.endDate,
        deliveryFee: formData.deliveryFee,
        discountPercent: formData.discountPercent,
        discountName: formData.discountName,
        sectionsJSON: JSON.stringify(sections)
      };

      const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        setEditingProposal(null);
        await fetchProposals();
      } else {
        alert('Error saving proposal: ' + result.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading proposals...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  if (editingProposal) {
    return <EditProposalView proposal={editingProposal} onSave={handleSave} onCancel={() => setEditingProposal(null)} saving={saving} />;
  }

  if (selectedProposal) {
    return (
      <div>
        <button onClick={() => setSelectedProposal(null)} style={{ padding: '10px 20px', margin: '20px', cursor: 'pointer' }}>
          ← Back to List
        </button>
        <ProposalView proposal={selectedProposal} onEdit={() => handleEdit(selectedProposal)} />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '30px', fontFamily: "'Domaine Text', serif" }}>Proposals</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {proposals.map((proposal, idx) => (
          <div key={idx} onClick={() => setSelectedProposal(proposal)} style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>{proposal.clientName}</h3>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{proposal.venueName}</p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{proposal.city}, {proposal.state}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProposalView({ proposal, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState(proposal);
  const [sections, setSections] = useState(JSON.parse(proposal.sectionsJSON || '[]'));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProductChange = (sectionIdx, productIdx, field, value) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    if (field === 'quantity' || field === 'price') {
      newSections[sectionIdx].products[productIdx][field] = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
    } else {
      newSections[sectionIdx].products[productIdx][field] = value;
    }
    setSections(newSections);
  };

  const addProduct = (sectionIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.push({ productName: '', quantity: 1, price: 0 });
    setSections(newSections);
  };

  const removeProduct = (sectionIdx, productIdx) => {
    const newSections = JSON.parse(JSON.stringify(sections));
    newSections[sectionIdx].products.splice(productIdx, 1);
    setSections(newSections);
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0, fontFamily: "'Domaine Text', serif" }}>Edit Proposal</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSave(formData, sections)} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#2d9b6e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Save as New Version'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '40px', borderBottom: '1px solid #e0e0e0', paddingBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', fontFamily: "'Domaine Text', serif" }}>Client Details</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Client Name</label>
            <input type="text" disabled value={formData.clientName || ''} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#f5f5f5' }} />
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Version will auto-increment on save</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Venue Name</label>
            <input type="text" value={formData.venueName || ''} onChange={(e) => handleInputChange('venueName', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>City</label>
            <input type="text" value={formData.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>State</label>
            <input type="text" value={formData.state || ''} onChange={(e) => handleInputChange('state', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Start Date</label>
            <input type="date" value={formData.startDate || ''} onChange={(e) => handleInputChange('startDate', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>End Date</label>
            <input type="date" value={formData.endDate || ''} onChange={(e) => handleInputChange('endDate', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Delivery Fee</label>
            <input type="number" value={formData.deliveryFee || ''} onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Discount %</label>
            <input type="number" value={formData.discountPercent || ''} onChange={(e) => handleInputChange('discountPercent', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>Discount Name</label>
            <input type="text" value={formData.discountName || ''} onChange={(e) => handleInputChange('discountName', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }} />
          </div>
          <div></div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', fontFamily: "'Domaine Text', serif" }}>Products by Section</h2>
        
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} style={{ marginBottom: '30px', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0' }}>{section.sectionName}</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '12px', fontWeight: '500', color: '#666' }}>Product Name</th>
                  <th style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', fontWeight: '500', color: '#666', width: '100px' }}>Quantity</th>
                  <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '12px', fontWeight: '500', color: '#666', width: '100px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '12px', fontWeight: '500', color: '#666', width: '120px' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', fontWeight: '500', color: '#666', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {section.products.map((product, productIdx) => (
                  <tr key={productIdx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 0' }}>
                      <input
                        type="text"
                        value={product.productName || ''}
                        onChange={(e) => handleProductChange(sectionIdx, productIdx, 'productName', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 0' }}>
                      <input
                        type="number"
                        value={product.quantity || 0}
                        onChange={(e) => handleProductChange(sectionIdx, productIdx, 'quantity', e.target.value)}
                        style={{ width: '80px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 0' }}>
                      <input
                        type="number"
                        value={product.price || 0}
                        onChange={(e) => handleProductChange(sectionIdx, productIdx, 'price', e.target.value)}
                        style={{ width: '80px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 0', fontSize: '14px', fontWeight: '500' }}>
                      ${((product.quantity || 0) * (product.price || 0)).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 0' }}>
                      <button onClick={() => removeProduct(sectionIdx, productIdx)} style={{ padding: '6px 12px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button onClick={() => addProduct(sectionIdx)} style={{ padding: '8px 16px', backgroundColor: '#e8eaf6', color: '#3f51b5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
              + Add Product
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProposalView({ proposal, onEdit }) {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0 }}>{proposal.clientName}</h1>
        <button onClick={onEdit} style={{ padding: '10px 20px', backgroundColor: '#2d9b6e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
          Edit Proposal
        </button>
      </div>
      
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Client Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 5px 0' }}>Venue</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{proposal.venueName}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 5px 0' }}>Location</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{proposal.city}, {proposal.state}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 5px 0' }}>Start Date</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{proposal.startDate}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 5px 0' }}>End Date</p>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{proposal.endDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
