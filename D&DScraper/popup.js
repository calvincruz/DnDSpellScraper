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

        const suggestionbuttonHTML = `<button id="suggestionbutton" class="button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0.296997C5.37 0.296997 0 5.67 0 12.297C0 17.6 3.438 22.097 8.205 23.682C8.805 23.795 9.025 23.424 9.025 23.105C9.025 22.82 9.015 22.065 9.01 21.065C5.672 21.789 4.968 19.455 4.968 19.455C4.422 18.07 3.633 17.7 3.633 17.7C2.546 16.956 3.717 16.971 3.717 16.971C4.922 17.055 5.555 18.207 5.555 18.207C6.625 20.042 8.364 19.512 9.05 19.205C9.158 18.429 9.467 17.9 9.81 17.6C7.145 17.3 4.344 16.268 4.344 11.67C4.344 10.36 4.809 9.29 5.579 8.45C5.444 8.147 5.039 6.927 5.684 5.274C5.684 5.274 6.689 4.952 8.984 6.504C9.944 6.237 10.964 6.105 11.984 6.099C13.004 6.105 14.024 6.237 14.984 6.504C17.264 4.952 18.269 5.274 18.269 5.274C18.914 6.927 18.509 8.147 18.389 8.45C19.154 9.29 19.619 10.36 19.619 11.67C19.619 16.28 16.814 17.295 14.144 17.59C14.564 17.95 14.954 18.686 14.954 19.81C14.954 21.416 14.939 22.706 14.939 23.096C14.939 23.411 15.149 23.786 15.764 23.666C20.565 22.092 24 17.592 24 12.297C24 5.67 18.627 0.296997 12 0.296997Z" fill="white"></path>
        </svg>
        <p class="text">Suggest a feature!</p>
      </button>`;

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
            ${suggestionbuttonHTML}
            ${tablesHtml}
          </body>
          </html>`;


        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        const suggestButtonInNewWindow = printWindow.document.getElementById("suggestionbutton");

        if (suggestButtonInNewWindow) {
          suggestButtonInNewWindow.addEventListener('click', (e) => {
            e.preventDefault();
            const githubUrl = 'https://github.com/calvincruz/DnDSpellScraper/issues/new?template=feature_request.md&title=[Feature Request] Your Suggestion Title';
            printWindow.open(githubUrl, '_blank');
          });
        }

        // Instead of inline script, use this approach after creating the document
        printWindow.addEventListener('load', () => {
          // Force a reflow to ensure sticky headers are applied correctly
          printWindow.scrollTo(0, 0);
          printWindow.document.body.offsetHeight; // Force a reflow
        }
        );
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