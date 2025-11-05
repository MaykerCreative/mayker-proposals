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

  const APPS_SCRIPT_GET_URL = 'https://script.google.com/macros/s/AKfycbz7y_HeCwjaGrOSexyOd6sQr9IxZft1_VyRru1EOcMwXsRStsTwHwoGLTlOQazhyls/exec';
  const APPS_SCRIPT_POST_URL = 'https://script.google.com/macros/s/AKfycbzTkntgiCvga488oNIYN-h5tTKPhv7VH4v2RDG0fsqx2WBPEPAkFJ6laJ92wXzV_ejr/exec';

  useEffect(() => {
    fetchProposals();
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'create') {
      setIsCreatingNew(true);
    }
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch(APPS_SCRIPT_GET_URL);
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
 
