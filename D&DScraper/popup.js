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
        if (!printWindow) throw new Error("Popup window blocked. Please allow popups.");

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
                    const damageHealColor = typeColor;
                    const description = (spell.description || '').replace(/\n/g, '<br>');

                    // Determine spell name color based on cast time
                    let spellNameColor = '#ff6666'; // Default red color for Action
                    if (spell.spellType) {
                      if (spell.spellType.includes('Bonus')) {
                        spellNameColor = '#4444ff'; // Blue for bonus action
                      } else if (spell.spellType.includes('Reaction')) {
                        spellNameColor = '#ffcc00'; // Gold/yellow for reactionn
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

        const htmlContent = 
        `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>D&D Spell Sheet</title>
            <style>
              /* —— Base styles —— */
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap');
              html, body {
                margin: 0;
                padding: 20px;
                background-color: #121212;
                color: #e0e0e0;
                font-family: 'Noto Sans Mono', monospace;
                overflow-y: auto;
                display: flex; /* Make body a flex container */
                flex-direction: column; /* Stack children vertically */
                min-height: 100vh; /* Ensure body takes at least the full viewport height */
              }
              h1 {
                color: #ff4444;
                text-align: center;
                margin-bottom: 20px;
                text-shadow: 0 0 5px rgba(255, 68, 68, 0.3);
              }

              /* —— Crucial sticky‐header rules —— */
              .spell-level-section {
                margin-bottom: 40px;
                position: relative;
              }
              .table-wrapper {
                overflow-x: auto;
              }

              .spell-table {
                width: 100%;
                border-collapse: collapse;
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
                border-bottom: 2px solid #ff4444;
              }
              
              .spell-table td {
                padding: 10px;
                border-bottom: 1px solid #333;
                vertical-align: middle;
              }
              .spell-table tr:nth-child(even) {
                background-color: #1e1e1e;
              }
              .spell-name {
                font-size: 1.3em;
                font-weight: bold;
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

              /* Suggest a feature button styles */
              .button {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px 20px;
                background-color:rgb(0, 0, 0);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1em;
                font-family: 'Noto Sans Mono', monospace;
                transition: background-color 0.3s ease;
                margin-top: 20px; /* Add some space above the button */
                align-self: center; /* Center the button */
              }

              .button:hover {
                background-color: #1e70ff;
              }

              .button svg {
                width: 24px;
                height: 24px;
                margin-right: 10px;
              }

              .button .text {
                margin: 0;
              }
            </style>
          </head>
          <body>
            <h1>SPELL GRIMOIRE</h1>
            ${tablesHtml}
          </body>
          </html>
            </style>
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