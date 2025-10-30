function doGet() {
  try {
    const SHEET_ID = '1QG_yHivyIAUaixZobcgDfz6Tzjt9_2ndkIkyZT2WkJ0';
    const CATALOG_ID = '116B97xSSUIDDdDLP6vWch4_BIxbEwPLdLO9FtBQZheU';
   
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    // Load product catalog
    const catalogSpreadsheet = SpreadsheetApp.openById(CATALOG_ID);
    const catalogSheet = catalogSpreadsheet.getSheetByName('Current Catalog');
    const catalogData = catalogSheet.getDataRange().getValues();
   
    // Build product lookup map AND product list for dropdown
    const productCatalog = {};
    const catalogProducts = [];
    
    catalogData.slice(1).forEach(row => {
      const productName = row[0];
      const price = parseFloat(row[2]) || 0;
      const dimensions = row[3] || '';
      const driveFileId = row[4] || '';
     
      const imageUrl = driveFileId ?
        `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400` : '';
     
      if (productName) {
        productCatalog[productName.toUpperCase()] = {
          price: price,
          imageUrl: imageUrl,
          dimensions: dimensions
        };
        
        catalogProducts.push({
          name: productName,
          price: price,
          imageUrl: imageUrl,
          dimensions: dimensions
        });
      }
    });

    catalogProducts.sort((a, b) => a.name.localeCompare(b.name));

    const headers = data[0];
    const rows = data.slice(1);

    const proposals = rows.map(row => {
      const startDate = row[5] ? new Date(row[5]) : null;
      const endDate = row[6] ? new Date(row[6]) : null;
      
      let eventDate = '';
      if (startDate && endDate) {
        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const year = startDate.getFullYear();
        
        if (startMonth === endMonth) {
          eventDate = `${startMonth} ${startDay}-${endDay}, ${year}`;
        } else {
          eventDate = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
        }
      }

      const rawProductText = String(row[13] || '').trim();
      const sectionsJSON = parseProductsFromText(rawProductText, productCatalog);
      
      const salesLeadValue = row[14] ? String(row[14]).trim() : '';
      const statusValue = row[15] ? String(row[15]).trim() : 'Pending';
      const projectNumber = row[16] ? String(row[16]).trim() : '';
      
      return {
        timestamp: row[0],
        lastUpdated: row[0] ? formatDateTime(new Date(row[0])) : '',
        clientName: row[1] || '',
        venueName: row[2] || '',
        city: row[3] || '',
        state: row[4] || '',
        startDate: startDate ? formatDateForInput(startDate) : '',
        endDate: endDate ? formatDateForInput(endDate) : '',
        eventDate: eventDate,
        deliveryTime: row[7] ? String(row[7]).trim() : '',
        strikeTime: row[8] ? String(row[8]).trim() : '',
        deliveryFee: String(row[9] || '0'),
        discount: String(row[10] || '0'),
        discountName: row[11] || '',
        clientFolderURL: row[12] || '',
        salesLead: salesLeadValue,
        status: statusValue,
        projectNumber: projectNumber,
        sectionsJSON: sectionsJSON
      };
    }).filter(proposal => proposal.clientName && proposal.clientName.trim() !== '');

    Logger.log('Returning ' + proposals.length + ' proposals and ' + catalogProducts.length + ' catalog items');

    return ContentService.createTextOutput(JSON.stringify({
      proposals: proposals,
      catalog: catalogProducts
    }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString(),
      stack: error.stack 
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const SHEET_ID = '1QG_yHivyIAUaixZobcgDfz6Tzjt9_2ndkIkyZT2WkJ0';
   
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheets()[0];
    const data = sheet.getDataRange().getValues();
   
    let baseClientName = String(payload.clientName).trim();
    baseClientName = baseClientName.replace(/\s*\(V\d+\)\s*$/g, '').trim();
    
    Logger.log('Processing: ' + baseClientName);
    Logger.log('Payload received: ' + JSON.stringify(payload));
    Logger.log('Delivery Time: ' + payload.deliveryTime);
    Logger.log('Strike Time: ' + payload.strikeTime);
    
    let highestVersion = 0;
    let projectNumber = payload.projectNumber || '';
    const versionRowMap = {};
    
    // Find all versions and get project number from V1
    for (let i = 1; i < data.length; i++) {
      const rowClientName = String(data[i][1] || '').trim();
      
      if (rowClientName.startsWith(baseClientName)) {
        Logger.log('Checking row ' + i + ': ' + rowClientName);
        
        const versionMatch = rowClientName.match(/\(V(\d+)\)$/);
        if (versionMatch) {
          const version = parseInt(versionMatch[1]);
          highestVersion = Math.max(highestVersion, version);
          versionRowMap[version] = i;
          
          // If this is V1 and we don't have a project number yet, grab it
          if (version === 1 && !projectNumber) {
            projectNumber = String(data[i][16] || '').trim();
            Logger.log('Retrieved project number from V1: ' + projectNumber);
          }
          
          Logger.log('Found version: V' + version + ' at row ' + i);
        } else if (rowClientName === baseClientName) {
          highestVersion = Math.max(highestVersion, 1);
          versionRowMap[1] = i;
          
          // Grab project number from original
          if (!projectNumber) {
            projectNumber = String(data[i][16] || '').trim();
            Logger.log('Retrieved project number from original: ' + projectNumber);
          }
          
          Logger.log('Found original (V1) at row ' + i);
        }
      }
    }
    
    // If still no project number, generate one
    if (!projectNumber) {
      projectNumber = generateProjectNumber(sheet);
      Logger.log('Generated new project number: ' + projectNumber);
    }
    
    Logger.log('Using project number: ' + projectNumber);
    
    // Handle status updates
    if (highestVersion > 0) {
      const highestVersionRow = versionRowMap[highestVersion];
      if (highestVersionRow !== undefined) {
        const currentHighestStatus = String(data[highestVersionRow][15] || 'Pending').trim();
        const newStatus = payload.status || 'Pending';
        
        Logger.log('Current highest version status: ' + currentHighestStatus);
        Logger.log('New status: ' + newStatus);
        
        if (currentHighestStatus !== newStatus && (newStatus === 'Pending' || newStatus === 'Cancelled')) {
          Logger.log('Status is changing TO ' + newStatus + ', updating all versions to: ' + newStatus);
          
          for (let version = 1; version <= highestVersion; version++) {
            const rowIndex = versionRowMap[version];
            if (rowIndex !== undefined) {
              sheet.getRange(rowIndex + 1, 16).setValue(newStatus);
              Logger.log('Updated V' + version + ' (row ' + (rowIndex + 1) + ') to status: ' + newStatus);
            }
          }
        } else if (newStatus === 'Approved') {
          Logger.log('Status changing to Approved, not updating previous versions');
        }
      }
    }
    
    const nextVersion = highestVersion + 1;
    const versionedClientName = nextVersion > 1 ? 
      baseClientName + ' (V' + nextVersion + ')' : 
      baseClientName;
    
    Logger.log('Creating new version: ' + versionedClientName);
    
    // Parse sections and format products text
    let proposalSectionsText = '';
    if (payload.sectionsJSON) {
      try {
        const sections = JSON.parse(payload.sectionsJSON);
        const sectionLines = sections.map(section => {
          const productLines = section.products.map(p => `- ${p.name}, ${p.quantity}`).join('\n');
          return `${section.name}\n${productLines}`;
        });
        proposalSectionsText = sectionLines.join('\n\n');
      } catch (err) {
        Logger.log('Error parsing sectionsJSON: ' + err.toString());
        proposalSectionsText = payload.sectionsJSON;
      }
    }
   
    // Clean up dates
    const cleanStartDate = payload.startDate ? String(payload.startDate).split('T')[0] : '';
    const cleanEndDate = payload.endDate ? String(payload.endDate).split('T')[0] : '';
    
    // Format times from 12-hour to consistent format
    const formattedDeliveryTime = formatTimeForSheet(payload.deliveryTime);
    const formattedStrikeTime = formatTimeForSheet(payload.strikeTime);
    
    Logger.log('Formatted delivery time: ' + formattedDeliveryTime);
    Logger.log('Formatted strike time: ' + formattedStrikeTime);
    
    const newRow = [
      new Date(),
      versionedClientName,
      payload.venueName || '',
      payload.city || '',
      payload.state || '',
      cleanStartDate,
      cleanEndDate,
      formattedDeliveryTime,
      formattedStrikeTime,
      payload.deliveryFee || '',
      payload.discount || '',
      payload.discountName || '',
      payload.clientFolderURL || '',
      proposalSectionsText,
      payload.salesLead || '',
      payload.status || 'Pending',
      projectNumber
    ];
   
    sheet.appendRow(newRow);
    
    Logger.log('Saved row with client name: ' + versionedClientName);
    Logger.log('Full row: ' + JSON.stringify(newRow));
   
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      clientName: versionedClientName,
      projectNumber: projectNumber,
      message: 'Proposal saved successfully'
    }))
      .setMimeType(ContentService.MimeType.JSON);
   
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Format times from user input (12-hour format) to consistent format
function formatTimeForSheet(timeStr) {
  if (!timeStr || timeStr.trim() === '') return '';
  
  try {
    // timeStr should be in format "10:00 AM" or "11:00 PM"
    const parts = timeStr.trim().split(' ');
    if (parts.length !== 2) {
      Logger.log('Invalid time format: ' + timeStr);
      return timeStr; // Return as-is if format is unexpected
    }
    
    const time = parts[0];
    const meridiem = parts[1];
    
    // Just return the time in consistent 12-hour format
    // This ensures "10:00 AM" stays "10:00 AM"
    return timeStr.trim();
  } catch (e) {
    Logger.log('Error formatting time: ' + e.toString());
    return timeStr;
  }
}

// Generate a new project number
function generateProjectNumber(sheet) {
  const data = sheet.getDataRange().getValues();
  let maxNumber = 0;
  
  // Look through all project numbers and find the highest numeric value
  for (let i = 1; i < data.length; i++) {
    const projNum = String(data[i][16] || '').trim();
    if (projNum && !isNaN(parseInt(projNum))) {
      const num = parseInt(projNum);
      maxNumber = Math.max(maxNumber, num);
    }
  }
  
  const nextNumber = maxNumber + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0'); // Generates 0001, 0002, etc.
  
  Logger.log('Generated new project number: ' + paddedNumber);
  return paddedNumber;
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

function parseProductsFromText(text, productCatalog) {
  if (!text || text.trim() === '') {
    Logger.log('Text is empty');
    return JSON.stringify([]);
  }

  const sections = [];
  let currentSection = null;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  Logger.log('Total lines to process: ' + lines.length);

  lines.forEach((line, idx) => {
    const isSectionHeader = !line.startsWith('-') && line.length > 0;

    if (isSectionHeader && !line.includes(',')) {
      if (currentSection && currentSection.products.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        name: line,
        products: []
      };
    } else if (line.startsWith('-') && currentSection) {
      const productPart = line.substring(1).trim();
      const parts = productPart.split(',');
     
      if (parts.length >= 2) {
        const productName = parts[0].trim();
        const quantity = parseInt(parts[1].trim()) || 1;
       
        let catalogEntry = productCatalog[productName.toUpperCase()];
       
        if (!catalogEntry) {
          const simplifiedName = productName.replace(/\s*\([^)]*\)\s*/g, '').toUpperCase();
          catalogEntry = productCatalog[simplifiedName];
        }
       
        if (catalogEntry) {
          currentSection.products.push({
            name: productName,
            quantity: quantity,
            price: catalogEntry.price,
            imageUrl: catalogEntry.imageUrl,
            dimensions: catalogEntry.dimensions || ''
          });
        } else {
          currentSection.products.push({
            name: productName,
            quantity: quantity,
            price: 0,
            imageUrl: '',
            dimensions: ''
          });
        }
      }
    }
  });

  if (currentSection && currentSection.products.length > 0) {
    sections.push(currentSection);
  }

  return JSON.stringify(sections);
}
