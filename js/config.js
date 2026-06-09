// Google Sheets API Configuration
const CONFIG = {
  // Spreadsheet ID: diambil dari URL spreadsheet
  SPREADSHEET_ID: '1LOzNe4LI14UN7e65VZWHY7S3fig70LcT6bSn2vVe-2U',
  
  // API Key: dibuat di Google Cloud Console
  API_KEY: 'AIzaSyBuHFDH-8FyL2Rhtnycke9hMd64QdZTJVs',

  // API Base URL
  get BASE_URL() {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values`;
  },

  // Fallback to mock data if Sheets API fails or is not shared
  ENABLE_MOCK_FALLBACK: true
};

export default CONFIG;
