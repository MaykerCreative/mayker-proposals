export async function GET() {
  try {
    console.log('Fetching from Google Apps Script...');
    const response = await fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text.substring(0, 500));
      return Response.json({ error: `HTTP ${response.status}`, details: text.substring(0, 500) }, { status: 500 });
    }
    
    const text = await response.text();
    console.log('Raw response (first 500 chars):', text.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed data type:', typeof data, 'Is array:', Array.isArray(data));
    } catch (e) {
      console.error('JSON parse error:', e.message);
      return Response.json({ error: 'Invalid JSON from Google Apps Script', sample: text.substring(0, 300) }, { status: 500 });
    }
    
    if (!Array.isArray(data)) {
      console.error('Data is not an array, type:', typeof data);
      return Response.json({ error: 'Data is not an array', type: typeof data, sample: JSON.stringify(data).substring(0, 300) }, { status: 500 });
    }
    
    console.log('Success! Returning', data.length, 'proposals');
    return Response.json(data);
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
