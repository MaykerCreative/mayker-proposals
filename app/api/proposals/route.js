export async function GET() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec');
    
    if (!response.ok) {
      throw new Error(`Google Apps Script returned ${response.status}`);
    }
    
    const text = await response.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse response as JSON:', text.substring(0, 200));
      return Response.json({ error: 'Invalid JSON from Google Apps Script', raw: text.substring(0, 500) }, { status: 500 });
    }
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error('Data is not an array:', data);
      return Response.json({ error: 'Expected array from Google Apps Script', data }, { status: 500 });
    }
    
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
