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
              <div class="table-wrapper">
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
                      const damageHealColor = spell.damageType === 'healing' ? damageTypeColors['healing'] : '#e0e0e0'; // Default color if not healing
                      const description = (spell.description || '').replace(/\n/g, '<br>');
                      return `
                        <tr>
                          <td><span class="spell-name">${spell.name === "N/A" ? '--' : spell.name}</span></td>
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
              </div>
            </div>`;
        }).join('');

        const htmlContent = `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>D&D Spell Sheet</title>
            <style>
              /* —— Base styles —— */
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100..900&display=swap');
              body {
                margin: 0;
                padding: 20px;
                background-color: #121212;
                color: #e0e0e0;
                font-family: 'Noto Sans Mono', monospace;
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
                /* no overflow on this element */
              }
              .table-wrapper {
                /* we only want *horizontal* scrolling here */
                overflow-x: auto;
                /* remove any max-height or overflow-y */
              }
              .spell-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
              }
              .spell-table thead th {
                position: sticky;     /* ⬅️ make the <th> stick */
                top: 0;                /* ⬅️ pin it to the very top of the viewport */
                background: #1a1a1a;
                color: #ff4444;
                padding: 12px;
                border-bottom: 2px solid #ff4444;
                z-index: 10;          /* stay above the body rows */
              }

              /* —— Rest of your table styling —— */
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
                color: #ff6666;
              }
              .spell-description {
                vertical-align: top;
                min-width: 300px;
                max-width: 800px;
                line-height: 1.5;
                word-wrap: break-word;
                padding: 12px;
              }

              /* —— your @media print rules can remain below —— */
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
                .spell-name {
                  color: #d32f2f !important;
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
          </head>
          <body>
            <h1>SPELL GRIMOIRE</h1>
            ${tablesHtml}
          </body>
          </html>`;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // ——— TEMPORARILY disable auto‐print so you can scroll and verify the headers —
        // printWindow.print();
        // printWindow.close();
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