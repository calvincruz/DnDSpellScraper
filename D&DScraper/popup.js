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

    // Group spells by level and clean level names
    const spellsByLevel = {};
    response.spells.forEach(spell => {
      let level = spell.level;
      // Clean level name (remove any appended text)
      level = level.replace(/NameTimeRangeHit.*/, ' ').trim();
      if (!spellsByLevel[level]) {
        spellsByLevel[level] = [];
      }
      spellsByLevel[level].push(spell);
    });

    // Generate clean HTML tables
    const tablesHtml = Object.entries(spellsByLevel).map(([level, spells]) => {
      // Clean level name for header
      const cleanLevel = level.replace(/NameTimeRangeHit.*/, ' ').trim();
      return `
          <div class="spell-level-section">
              <h2> </h2>
              <table class="spell-table">
                  <thead>
                      <tr>
                          <th style="width: 15%">Spell - ${cleanLevel}</th>
                          <th style="width: 10%">Damage/Heal</th>
                          <th style="width: 10%">Type</th>
                          <th style="width: 6%">Hit/DC</th>
                          <th style="width: 6%">Range</th>
                          <th style="width: 8%">Duration</th>
                          <th style="width: 45%">Description</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${spells.map(spell => {
        const damageType = spell.damageType || 'N/A';
        const typeColor = damageTypeColors[damageType] || '#e0e0e0';
        const description = spell.description.replace(/\n/g, '<br>');
        return `
                <tr>
                <td><span class="spell-name">${spell.name === "N/A" ? '--' : spell.name}</span></td>
                <td>${spell.damagehealing === "N/A" ? '--' : spell.damagehealing}</td>
                <td style="color: ${typeColor}">${spell.damageType === "N/A" ? '--' : spell.damageType}</td>
                <td>${spell.hitDC === "N/A" ? '--' : spell.hitDC}</td>
                <td>${spell.range === "N/A" ? '--' : spell.range}</td>
                <td>${spell.duration === "N/A" ? '--' : spell.duration}</td>
                <td class="spell-description">${description === "N/A" ? '--' : description}</td>
                </tr>
                `;
      }).join('')}
                  </tbody>
              </table>
          </div>
          `;
    }).join('');

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
                  }
                  .spell-table {
                      border-collapse: collapse;
                      width: 100%;
                      margin: 0 auto;
                      box-shadow: 0 0 15px rgba(255, 68, 68, 0.2);
                      table-layout: fixed;
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
                      vertical-align: top;
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
                      min-width: 300px;
                      max-width: 800px;
                      white-space: normal;
                      word-wrap: break-word;
                      line-height: 1.5;
                      padding: 12px;
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
              <script>
                  setTimeout(() => {
                      window.print();
                      setTimeout(() => window.close(), 500);
                  }, 500);
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