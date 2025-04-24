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
              <div class="table-wrapper">
                <table class="spell-table">
                    <thead data-level="${cleanLevel}"> <tr>
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

        const simplifiedHTMLContent = 
        `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Sticky Header Test</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                overflow-y: auto;
              }
              .sticky-header {
                position: sticky;
                top: 0;
                background: red;
                color: white;
                padding: 10px;
                z-index: 9999;
                width: 100%;
                box-sizing: border-box;
                text-align: center;
              }
              .tall-element {
                height: 500px;
                margin-bottom: 20px;
                background: #f0f0f0;
                border: 1px solid #ccc;
                text-align: center;
                line-height: 500px;
              }
            </style>
          </head>
          <body>
            <div class="sticky-header">STICKY HEADER</div>
            <div class="tall-element">Tall Element 1</div>
            <div class="tall-element">Tall Element 2</div>
            <div class="tall-element">Tall Element 3</div>
            <div class="tall-element">Tall Element 4</div>
            <div class="tall-element">Tall Element 5</div>
          </body>
          </html>`;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();


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