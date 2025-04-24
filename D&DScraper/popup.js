document.addEventListener('DOMContentLoaded', () => {
  const printSpellsButton = document.getElementById("printSpells");
  const updateContainer = document.getElementById("updateContainer");
  const updateMessage = document.getElementById("updateMessage");
  const zipBtn = document.getElementById("zipBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  let spellDataForPrint = null; // Store the spell data

  printSpellsButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      // Get spells data
      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "getSpells" }, resolve);
      });


      if (!response?.spells?.length) {
        throw new Error("No spells data received or empty spell list");
      }

      spellDataForPrint = response; // Store the data

      const openPrintWindow = (data) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error("Popup window blocked. Please allow popups for this site.");
        }

        const damageTypeColors = {
          'acid damage': '#00ff00',
          'fire damage': '#ff4444',
          'lightning damage': '#ffff00',
          'thunder damage': '#aaaaaa',
          'cold damage': '#00ffff',
          'necrotic damage': '#9900ff',
          'radiant damage': '#ffcc00',
          'psychic damage': '#ff00ff',
          'force damage': '#8888ff',
          'poison damage': '#00aa00',
          'healing': '#00ff88',
          'N/A': '#aaaaaa'
        };

        const spellsByLevel = {};
        data.spells.forEach(spell => {
          let level = spell.level.replace(/Slots.*/, ' ').replace(/Name.*/, ' ').trim();
          if (!spellsByLevel[level]) spellsByLevel[level] = [];
          spellsByLevel[level].push(spell);
        });

        const tablesHtml = Object.entries(spellsByLevel).map(([level, spells]) => {
          const cleanLevel = level.replace(/SlotsNameTimeRangeHit.*/, ' ').trim();
          return `
            <div class="spell-level-section">
              <h2></h2>
              <table class="spell-table">
                <thead>
                  <tr>
                    <th style="width:15%">Spell - ${cleanLevel}</th>
                    <th style="width:10%">Damage/Heal</th>
                    <th style="width:10%">Type</th>
                    <th style="width:6%">Hit/DC</th>
                    <th style="width:6%">Range</th>
                    <th style="width:8%">Duration</th>
                    <th style="width:45%">Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${spells.map(spell => {
                    const damageType = spell.damageType || 'N/A';
                    const typeColor = damageTypeColors[damageType] || '#e0e0e0';
                    const damageHealValue = spell.damagehealing === "N/A" ? '--' : spell.damagehealing;
                    const damageHealColor = spell.damageType === 'healing' ? damageTypeColors['healing'] : '#e0e0e0';
                    const description = (spell.description || '').replace(/\n/g, '<br>');

                    // Determine spell name color based on cast time
                    let spellNameColor = '#ff6666'; // Default red color
                    if (spell.castTime) {
                      if (spell.castTime.toLowerCase().includes('bonus action')) {
                        spellNameColor = '#4444ff'; // Blue for bonus action
                      } else if (spell.castTime.toLowerCase().includes('reaction')) {
                        spellNameColor = '#aaaaaa'; // Light grey for reaction
                      }
                      // Keep red for action (default)
                    }

                    return `
                      <tr>
                        <td><span class="spell-name" style="color:${spellNameColor}">${spell.name === "N/A" ? '--' : spell.name}</span></td>
                        <td style="color:${damageHealColor}">${damageHealValue}</td>
                        <td style="color:${typeColor}">${spell.damageType === "N/A" ? '--' : spell.damageType}</td>
                        <td>${spell.hitDC === "N/A" ? '--' : spell.hitDC}</td>
                        <td>${spell.range === "N/A" ? '--' : spell.range}</td>
                        <td>${spell.duration === "N/A" ? '--' : spell.duration}</td>
                        <td class="spell-description">${description === "N/A" ? '--' : description}</td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`;
        }).join('');

        const htmlContent = `<!DOCTYPE html>
          <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap');
              body {
                background-color: #121212;
                color: #e0e0e0;
                font-family: 'Noto Sans Mono', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
              }
              h1 {
                color: #ff4444;
                text-align: center;
                margin-bottom: 20px;
                text-shadow: 0 0 5px rgba(255, 68, 68, 0.3);
              }
              h2 {
                color: #ff6666;
                margin: 40px 0 15px 0;
                font-size: 1.3em;
              }
              .spell-level-section {
                margin-bottom: 40px;
                position: relative;
              }
              .spell-table {
                border-collapse: collapse;
                width: 100%;
                margin: 0 auto;
                box-shadow: 0 0 15px rgba(255, 68, 68, 0.2);
                table-layout: fixed;
              }
              
              /* Sticky header styles */
              .spell-table thead {
                position: -webkit-sticky;
                position: sticky;
                top: 0;
                z-index: 10;
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
                vertical-align: middle;
              }
              .spell-description {
                vertical-align: top;
                min-width: 300px;
                max-width: 800px;
                white-space: normal;
                word-wrap: break-word;
                line-height: 1.5;
                padding: 12px;
              }
              .spell-table tr:nth-child(even) {
                background-color: #1e1e1e;
              }
              .spell-name {
                font-size: 1.3em;
                font-weight: bold;
              }
              
              /* Spell casting time colors */
              .action-spell {
                color: #ff6666 !important; /* Red for action */
              }
              .bonus-spell {
                color: #4444ff !important; /* Blue for bonus action */
              }
              .reaction-spell {
                color: #aaaaaa !important; /* Light grey for reaction */
              }
              
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                }
                .spell-table th {
                  background-color: #f1f1f1 !important;
                  color: #d32f2f !important;
                }
                .spell-table tr:nth-child(even) {
                  background-color: #f9f9f9 !important;
                }
                h2 {
                  color: #d32f2f !important;
                }
                .spell-level-section {
                  page-break-inside: avoid;
                }
                .spell-description {
                  min-width: 400px !important;
                }
              }
            </style>
            <title>D&D Spell Sheet</title>
          </head>
          <body>
            <h1>SPELL GRIMOIRE</h1>
            ${tablesHtml}
          </body>
          </html>`;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Instead of inline script, use this approach after creating the document
        printWindow.addEventListener('load', () => {
          // Force a reflow to ensure sticky headers are applied correctly
          printWindow.scrollTo(0, 0);
          printWindow.document.body.offsetHeight; // Force a reflow
        });
      };

      // Check for updates
      chrome.runtime.sendMessage({ type: "check_update" }, (updateResponse) => {
        if (updateResponse?.updateAvailable) {
          updateMessage.textContent = `Version ${updateResponse.latestVersion} is available.`;
          updateContainer.style.display = "flex";

          zipBtn.onclick = () => {
            chrome.runtime.sendMessage({ type: "confirm_update", format: "ZIP" });
            updateContainer.style.display = "none";
            if (spellDataForPrint) {
              openPrintWindow(spellDataForPrint);
            }
          };

          cancelBtn.onclick = () => {
            chrome.runtime.sendMessage({ type: "confirm_update", format: "cancel" });
            updateContainer.style.display = "none";
            if (spellDataForPrint) {
              openPrintWindow(spellDataForPrint);
            }
          };
        } else {
          // Directly open the print window with spell content
          if (spellDataForPrint) {
            openPrintWindow(spellDataForPrint);
          }
        }
      });

    } catch (error) {
      console.error("Spell extraction error:", error);
      alert("Failed to generate spell sheet. Try refreshing the page and running the extension again.");
    }
  });
});