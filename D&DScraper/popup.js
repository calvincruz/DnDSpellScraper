// document.getElementById("printSpells").addEventListener("click", async () => {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     try {
//         // Get spells data
//         const response = await new Promise((resolve) => {
//             chrome.tabs.sendMessage(tab.id, { action: "getSpells" }, resolve);
//         });

//         if (!response?.spells?.length) {
//             throw new Error("No spells data received or empty spell list");
//         }

//         const printWindow = window.open("about:blank", "_blank");
        
//         // Dark theme with red accents
//         const htmlContent = `
//           <!DOCTYPE html>
//           <html>
//             <head>
//               <title>D&D Spell Sheet</title>
//               <style>
//                 body {
//                   background-color: #121212;
//                   color: #e0e0e0;
//                   font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//                   margin: 0;
//                   padding: 20px;
//                 }
//                 h1 {
//                   color: #ff4444;
//                   text-align: center;
//                   margin-bottom: 10px;
//                   text-shadow: 0 0 5px rgba(255, 68, 68, 0.3);
//                 }
//                 .spell-table {
//                   border-collapse: collapse;
//                   width: 100%;
//                   margin: 0 auto;
//                   box-shadow: 0 0 15px rgba(255, 68, 68, 0.2);
//                 }
//                 .spell-table th {
//                   background-color: #1a1a1a;
//                   color: #ff4444;
//                   padding: 12px;
//                   text-align: left;
//                   border-bottom: 2px solid #ff4444;
//                 }
//                 .spell-table td {
//                   padding: 10px;
//                   border-bottom: 1px solid #333;
//                 }
//                 .spell-table tr:nth-child(even) {
//                   background-color: #1e1e1e;
//                 }
//                 .spell-table tr:hover {
//                   background-color: #252525;
//                 }
//                 .spell-table td:first-child {
//                   color: #ff6666;
//                   font-weight: bold;
//                 }
//                 @media print {
//                   body {
//                     background-color: white;
//                     color: black;
//                   }
//                   .spell-table th {
//                     background-color: #f1f1f1 !important;
//                     color: #d32f2f !important;
//                   }
//                   .spell-table tr:nth-child(even) {
//                     background-color: #f9f9f9 !important;
//                   }
//                 }
//               </style>
//             </head>
//             <body>
//               <h1>SPELL GRIMOIRE</h1>
//               <table class="spell-table">
//                 <thead>
//                   <tr>
//                     <th>Spell</th>
//                     <th>Damage</th>
//                     <th>Type</th>
//                     <th>Hit/DC</th>
//                     <th>Range</th>
//                     <th>Duration</th>
//                     <th>Description</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   ${response.spells.map(spell => `
//                     <tr>
//                       <td>${spell.name || '—'}</td>
//                       <td>${spell.damage || '—'}</td>
//                       <td>${spell.damageType || '—'}</td>
//                       <td>${spell.hitDC || '—'}</td>
//                       <td>${spell.range || '—'}</td>
//                       <td>${spell.duration || '—'}</td>
//                       <td style="max-width: 500px;">${spell.description || '—'}</td>
//                     </tr>
//                   `).join('')}
//                 </tbody>
//               </table>
//               <script>
//                 // Auto-print and close after delay
//                 setTimeout(() => {
//                   window.print();
//                   setTimeout(() => window.close(), 300);
//                 }, 300);
//               </script>
//             </body>
//           </html>
//         `;
  
//         // Write content and close
//         printWindow.document.write(htmlContent);
//         printWindow.document.close();

//     } catch (error) {
//         console.error("Spell extraction error:", error);
//         alert("Failed to generate spell sheet:\n" + error.message);
//     }
// });

document.getElementById("printSpells").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
        // Get spells data
        const response = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: "getSpells" }, resolve);
        });

        if (!response?.spells?.length) {
            throw new Error("No spells data received or empty spell list");
        }

        const printWindow = window.open("about:blank", "_blank");
        
        // Damage type color mapping
        const damageTypeColors = {
            'acid damage': '#00ff00',       // Green
            'fire damage': '#ff4444',       // Red
            'lightning damage': '#ffff00',  // Yellow
            'thunder damage': '#aaaaaa',    // Grey
            'cold damage': '#00ffff',       // Cyan
            'necrotic damage': '#9900ff',   // Purple
            'radiant damage': '#ffcc00',    // Gold
            'psychic damage': '#ff00ff',    // Pink
            'force damage': '#8888ff',      // Light blue
            'poison damage': '#00aa00'      // Dark green
        };

        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>D&D Spell Sheet</title>
              <style>
                body {
                  background-color: #121212;
                  color: #e0e0e0;
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 20px;
                }
                h1 {
                  color: #ff4444;
                  text-align: center;
                  margin-bottom: 10px;
                  text-shadow: 0 0 5px rgba(255, 68, 68, 0.3);
                }
                .spell-table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 0 auto;
                  box-shadow: 0 0 15px rgba(255, 68, 68, 0.2);
                }
                .spell-table th {
                  background-color: #1a1a1a;
                  color: #ff4444;
                  padding: 12px;
                  text-align: left;
                  border-bottom: 2px solid #ff4444;
                }
                .spell-table td {
                  padding: 10px;
                  border-bottom: 1px solid #333;
                }
                .spell-table tr:nth-child(even) {
                  background-color: #1e1e1e;
                }
                .spell-table tr:hover {
                  background-color: #252525;
                }
                .spell-name {
                  font-size: 1.5em;  /* 3x normal size (assuming normal is ~0.5em) */
                  font-weight: bold;
                  color: #ff6666;
                }
                @media print {
                  body {
                    background-color: white;
                    color: black;
                  }
                  .spell-table th {
                    background-color: #f1f1f1 !important;
                    color: #d32f2f !important;
                  }
                  .spell-table tr:nth-child(even) {
                    background-color: #f9f9f9 !important;
                  }
                  .spell-name {
                    color: #d32f2f !important;
                  }
                }
              </style>
            </head>
            <body>
              <h1>SPELL GRIMOIRE</h1>
              <table class="spell-table">
                <thead>
                  <tr>
                    <th>Spell</th>
                    <th>Damage</th>
                    <th>Type</th>
                    <th>Hit/DC</th>
                    <th>Range</th>
                    <th>Duration</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${response.spells.map(spell => {
                    const damageType = spell.damageType?.toLowerCase() || '';
                    const typeColor = damageTypeColors[damageType] || '#e0e0e0';
                    return `
                    <tr>
                      <td><span class="spell-name">${spell.name || '—'}</span></td>
                      <td>${spell.damage || '—'}</td>
                      <td style="color: ${typeColor}">${spell.damageType || '—'}</td>
                      <td>${spell.hitDC || '—'}</td>
                      <td>${spell.range || '—'}</td>
                      <td>${spell.duration || '—'}</td>
                      <td style="max-width: 500px;">${spell.description || '—'}</td>
                    </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <script>
                // Auto-print and close after delay
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 300);
                }, 300);
              </script>
            </body>
          </html>
        `;
  
        // Write content and close
        printWindow.document.write(htmlContent);
        printWindow.document.close();

    } catch (error) {
        console.error("Spell extraction error:", error);
        alert("Failed to generate spell sheet:\n" + error.message);
    }
});