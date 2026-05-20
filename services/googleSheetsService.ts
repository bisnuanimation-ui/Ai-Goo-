/**
 * Google Sheets API Integration Service
 * Uses client-side fetch with the Google OAuth access token.
 */

export interface SpreadsheetInfo {
  id: string;
  url: string;
  title: string;
}

/**
 * Creates a brand new Google Spreadsheet
 */
export async function createSpreadsheet(accessToken: string, title: string): Promise<SpreadsheetInfo> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || title,
  };
}

/**
 * Validates whether a spreadsheet exists and is accessible
 */
export async function verifySpreadsheet(accessToken: string, spreadsheetId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Appends a row of values to a sheet
 */
export async function appendSpreadsheetRow(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: string[]
): Promise<any> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [values],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to append spreadsheet data: ${errorText || response.statusText}`);
  }

  return response.json();
}
