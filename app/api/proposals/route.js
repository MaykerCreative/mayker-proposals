export async function GET() {
  try {
    console.log('Fetching catalog from Google Sheets API...');
    
    const SHEET_ID = '116B97xSSUIDDdDLP6vWch4_BIxbEwPLdLO9FtBQZheU';
    const API_KEY = 'AIzaSyDr57l3XebOxUoHO5W1VoPatGGMQ8q_9fQ';
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'Current Catalog'?key=${API_KEY}`;
    
    const response = await fetch(sheetUrl);
    
    if (!response.ok) {
      console.error('Google Sheets API error:', response.status);
      return Response.json({ error: `Google Sheets API returned ${response.status}` }, { status: 500 });
    }
    
    const data = await response.json();
    
    if (!data.values) {
      return Response.json({ error: 'No data in catalog sheet' }, { status: 500 });
    }
    
    const rows = data.values.slice(1);
    const catalogData = rows
      .filter(row => row[0] && row[4])
      .map(row => {
        let fileId = '';
        if (row[4]) {
          const match = row[4].match(/\/d\/([a-zA-Z0-9-_]+)/);
          fileId = match ? match[1] : '';
        }
        return {
          name: row[0],
          category: row[1] || '',
          price: parseFloat(row[2]) || 0,
          imageUrl: fileId ? `https://drive.google.com/uc?id=${fileId}&export=download` : null
        };
      });
    
    console.log('Catalog loaded:', catalogData.length, 'products');
    return Response.json(catalogData);
  } catch (error) {
    console.error('Catalog API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
