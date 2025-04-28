document.addEventListener('DOMContentLoaded', async () => {
  const printSpellsButton = document.getElementById("printSpells");
  const updateContainer = document.getElementById("updateContainer");
  const updateMessage = document.getElementById("updateMessage");
  const zipBtn = document.getElementById("zipBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const downloadLogsButton = document.getElementById("downloadLogs"); // Get the new button

  let spellDataForPrint = null; // Store the spell data


  const logToFile = (level, message, ...args) => {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}\n`;

      chrome.storage.local.get({ logs: '' }, (data) => {
          const newLogs = data.logs + logEntry;
          chrome.storage.local.set({ logs: newLogs });
      });
  };

  // Override console methods
  console.log = (message, ...args) => logToFile('log', message, ...args);
  console.warn = (message, ...args) => logToFile('warn', message, ...args);
  console.error = (message, ...args) => logToFile('error', message, ...args);

  // Function to download logs
  const downloadLogs = () => {
      chrome.storage.local.get({ logs: '' }, (data) => {
          const jsonLogs = JSON.stringify({ logs: data.logs.split('\n').filter(Boolean) }, null, 2);
          const blob = new Blob([jsonLogs], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          chrome.downloads.download({
              url: url,
              filename: 'extension_logs.json',
              saveAs: true
          });
          // Optionally clear logs after download:
          chrome.storage.local.set({ logs: '' });
      });
  };

  if (downloadLogsButton) {
      downloadLogsButton.addEventListener('click', downloadLogs);
  }

  printSpellsButton.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      try {
          // Get spells data
          const response = await new Promise((resolve) => {
              chrome.tabs.sendMessage(tab.id, { action: "getSpells" }, resolve);
          });

          if (!response?.spells?.length) {
              console.log("No spells data received or empty spell list");
          }

          spellDataForPrint = response; // Store the data

          const openPrintWindow = async (data) => {
              const printWindow = window.open("", "_blank");
              if (!printWindow) {
                  console.log("Popup window blocked. Please allow popups for this site.");
              }

              const suggestionbuttonHTML = `<a href="https://github.com/calvincruz/DnDSpellScraper/issues/new?template=feature_request.md" target="_blank" class="button">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0.296997C5.37 0.296997 0 5.67 0 12.297C0 17.6 3.438 22.097 8.205 23.682C8.805 23.795 9.025 23.424 9.025 23.105C9.025 22.82 9.015 22.065 9.01 21.065C5.672 21.789 4.968 19.455 4.968 19.455C4.422 18.07 3.633 17.7 3.633 17.7C2.546 16.956 3.717 16.971 3.717 16.971C4.922 17.055 5.555 18.207 5.555 18.207C6.625 20.042 8.364 19.512 9.05 19.205C9.158 18.429 9.467 17.9 9.81 17.6C7.145 17.3 4.344 16.268 4.344 11.67C4.344 10.36 4.809 9.29 5.579 8.45C5.444 8.147 5.039 6.927 5.684 5.274C5.684 5.274 6.689 4.952 8.984 6.504C9.944 6.237 10.964 6.105 11.984 6.099C13.004 6.105 14.024 6.237 14.984 6.504C17.264 4.952 18.269 5.274 18.269 5.274C18.914 6.927 18.509 8.147 18.389 8.45C19.154 9.29 19.619 10.36 19.619 11.67C19.619 16.28 16.814 17.295 14.144 17.59C14.564 17.95 14.954 18.686 14.954 19.81C14.954 21.416 14.939 22.706 14.939 23.096C14.939 23.411 15.149 23.786 15.764 23.666C20.565 22.092 24 17.592 24 12.297C24 5.67 18.627 0.296997 12 0.296997Z" fill="red"></path>
                  </svg>
                  <p class="text">Suggest a feature!</p>
              </a>`;

              const rowData = [];
              data.spells.forEach(spell => {
                  rowData.push({
                      name: spell.name === "N/A" ? '--' : spell.name,
                      level: spell.level.replace(/Slots.*/, ' ').replace(/Name.*/, ' ').trim(),
                      damagehealing: spell.damagehealing === "N/A" ? '--' : spell.damagehealing,
                      damageType: spell.damageType === "N/A" ? '--' : spell.damageType,
                      hitDC: spell.hitDC === "N/A" ? '--' : spell.hitDC,
                      range: spell.range === "N/A" ? '--' : spell.range,
                      duration: spell.duration === "N/A" ? '--' : spell.duration,
                      description: (spell.description || '').replace(/\n/g, '<br>'),
                      spellType: spell.spellType || '--'
                  });
              });

              const columnDefs = [
                  {
                      headerName: "Spell", field: "name", sortable: true, filter: true, cellStyle: params => {
                          let color = '#ff6666';
                          if (params.data?.spellType?.includes('Bonus')) color = '#4444ff';
                          else if (params.data?.spellType?.includes('Reaction')) color = '#ffcc00';
                          return { color: color, fontWeight: 'bold', fontSize: '1.1em' };
                      }
                  },
                  { headerName: "Level", field: "level", sortable: true, filter: true },
                  {
                      headerName: "Damage/Heal", field: "damagehealing", sortable: true, filter: true, cellStyle: params => {
                          const colors = { 'acid damage': '#00ff00', 'fire damage': '#ff4444', 'lightning damage': '#ffff00', 'thunder damage': '#aaaaaa', 'cold damage': '#00ffff', 'necrotic damage': '#9900ff', 'radiant damage': '#ffcc00', 'psychic damage': '#ff00ff', 'force damage': '#8888ff', 'poison damage': '#00aa00', 'healing': '#00ff88', 'N/A': '#e0e0e0' };
                          return { color: colors[params.data?.damageType?.toLowerCase()] || '#e0e0e0' };
                      }
                  },
                  {
                      headerName: "Type", field: "damageType", sortable: true, filter: true, cellStyle: params => {
                          const colors = { 'acid damage': '#00ff00', 'fire damage': '#ff4444', 'lightning damage': '#ffff00', 'thunder damage': '#aaaaaa', 'cold damage': '#00ffff', 'necrotic damage': '#9900ff', 'radiant damage': '#ffcc00', 'psychic damage': '#ff00ff', 'force damage': '#8888ff', 'poison damage': '#00aa00', 'healing': '#00ff88', 'N/A': '#e0e0e0' };
                          return { color: colors[params.value?.toLowerCase()] || '#e0e0e0' };
                      }
                  },
                  { headerName: "Hit/DC", field: "hitDC", sortable: true, filter: true },
                  { headerName: "Range", field: "range", sortable: true, filter: true },
                  { headerName: "Duration", field: "duration", sortable: true, filter: true },
                  { headerName: "Description", field: "description", sortable: false, filter: false, autoHeight: true, wrapText: true, cellStyle: { 'white-space': 'normal' } }
              ];

              const gridOptions = {
                  rowData: rowData,
                  columnDefs: columnDefs,
                  pagination: true,
                  paginationPageSize: 20,
                  domLayout: 'normal',
              };

              try {
                  // Fetch AG Grid CSS
                  const cssResponse = await fetch('https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-grid.css');


                  const cssText = await cssResponse.text();


                  const themeCssResponse = await fetch('https://cdn.jsdelivr.net/npm/ag-grid-community/styles/ag-theme-material.css');


                  const themeCssText = await themeCssResponse.text();

                  // Fetch AG Grid JS
                  const jsResponse = await fetch('https://cdn.jsdelivr.net/npm/ag-grid-community@33.0.4/dist/ag-grid-community.min.js');

                  console.log("Finished jsResponse: \n" + jsResponse);

                  const jsText = jsResponse.toString();

                  console.log("Finished jsText: \n" + jsText);

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
                                              .button {
                                                  display: flex;
                                                  align-items: left;
                                                  justify-content: center;
                                                  width: 169px;
                                                  padding: 0;
                                                  background-color: rgb(0, 0, 0);
                                                  color: white;
                                                  border: none;
                                                  border-radius: 5px;
                                                  cursor: pointer;
                                                  font-size: 1em;
                                                  font-family: 'Noto Sans Mono', monospace;
                                                  transition: background-color 0.3s ease;
                                                  margin: 5px auto;
                                                  text-decoration: none;
                                              }
                                              .button:hover {
                                                  background-color: #1e70ff;
                                              }
                                              .button svg {
                                                  margin-right: 10px;
                                                  align-self: center;
                                              }
                                              .button .text {
                                                  margin-bottom: 10;
                                                  color: #ff4444;
                                              }
                                              /* Inline AG Grid Theme CSS */
                                              ${themeCssText}
                                              /* Inline AG Grid Base CSS */
                                              ${cssText}
                                              #myGrid {
                                                  height: 600px;
                                                  width: 100%;
                                              }
                                          </style>
                                          <title>D&D Spell Sheet</title>
                                      </head>
                                      <body>
                                          <div class="glitch-wrapper">
                                              <h1 class="glitch" data-glitch="SPELL GRIMOIRE">SPELL GRIMOIRE</h1>
                                          </div>
                                          ${suggestionbuttonHTML}
                                          <div id="myGrid" class="ag-theme-dark"></div>
                                          <script>
                                              ${jsText}
                                              const gridOptions = ${JSON.stringify(gridOptions)};
                                              const myGridElement = document.querySelector('#myGrid');
                                              agGrid.createGrid(myGridElement, gridOptions);
                                          </script>
                                      </body>
                                      </html>`;

                  printWindow.document.open();


                  printWindow.document.write(htmlContent);
                  

                  printWindow.document.close();


              } catch (error) {
                  printWindow.document.close();
                  printWindow.close();
                  console.log("Error fetching AG Grid resources:", error);
              }
          };

          // Check for updates (remains the same)
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
          console.log("Spell extraction error:", error);
          console.log("Failed to generate spell sheet. Try refreshing the page and running the extension again.");
      }
  });
});