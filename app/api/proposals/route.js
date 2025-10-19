export async function GET() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzEC-ub0N3GVE-UoVTtHGf04luQRXNC26v6mjACwPtmpUeZrdG1csiTl51sUjYu03Bk/exec');
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
