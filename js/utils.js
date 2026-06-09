// Shared utility functions for BK AI Career Recommendation Dashboard

export const UTILS = {
  // Format dates: e.g. "19 Mei 2026 20:29"
  formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr.replace(/-/g, '/')); // Convert to cross-browser friendly date
      if (isNaN(d.getTime())) return dateStr;
      
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      
      return `${day} ${month} ${year} ${hour}:${min}`;
    } catch (e) {
      return dateStr;
    }
  },

  // Get query parameters by name
  getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  // Get color variables for RIASEC types
  getRiasecColor(type) {
    const rootStyles = getComputedStyle(document.documentElement);
    const colorMap = {
      "r": rootStyles.getPropertyValue('--color-riasec-r').trim() || "#E03E3E",
      "i": rootStyles.getPropertyValue('--color-riasec-i').trim() || "#1E66F5",
      "a": rootStyles.getPropertyValue('--color-riasec-a').trim() || "#8839EF",
      "s": rootStyles.getPropertyValue('--color-riasec-s').trim() || "#40A02B",
      "e": rootStyles.getPropertyValue('--color-riasec-e').trim() || "#DF8E1D",
      "c": rootStyles.getPropertyValue('--color-riasec-c').trim() || "#4C4F69"
    };
    return colorMap[type.toLowerCase()[0]] || "#5F5E5A";
  },

  // Get full RIASEC label
  getRiasecLabel(type) {
    const labelMap = {
      "r": "R — Realistic",
      "i": "I — Investigative",
      "a": "A — Artistic",
      "s": "S — Social",
      "e": "E — Enterprising",
      "c": "C — Conventional"
    };
    return labelMap[type.toLowerCase()[0]] || type;
  },

  // Local Storage: Counseling Notes
  getCounselingNotes(nis) {
    const notes = localStorage.getItem(`catatan_${nis}`);
    return notes ? JSON.parse(notes) : [];
  },

  saveCounselingNote(nis, text) {
    const notes = this.getCounselingNotes(nis);
    const newNote = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      text: text
    };
    notes.unshift(newNote); // Add to beginning
    localStorage.setItem(`catatan_${nis}`, JSON.stringify(notes));
    return newNote;
  },

  deleteCounselingNote(nis, noteId) {
    const notes = this.getCounselingNotes(nis);
    const filtered = notes.filter(n => n.id !== noteId);
    localStorage.setItem(`catatan_${nis}`, JSON.stringify(filtered));
  },

  // Local Storage: Counseling Flag
  isCounseled(nis) {
    return localStorage.getItem(`counseled_${nis}`) === "true";
  },

  toggleCounseled(nis) {
    const current = this.isCounseled(nis);
    localStorage.setItem(`counseled_${nis}`, !current ? "true" : "false");
    return !current;
  },

  // Export utility: CSV download trigger
  exportToCSV(filename, headers, rows) {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    
    // Add headers
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\r\n";
    
    // Add rows
    rows.forEach(row => {
      csvContent += row.map(val => {
        const strVal = val === null || val === undefined ? "" : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(",") + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
export default UTILS;
