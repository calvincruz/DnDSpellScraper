document.addEventListener('DOMContentLoaded', () => {
    const spellLevelSections = document.querySelectorAll('.spell-level-section');
    const floatingHeaderContainer = document.createElement('div');
    floatingHeaderContainer.classList.add('floating-header');
    floatingHeaderContainer.style.position = 'sticky';
    floatingHeaderContainer.style.top = '0';
    floatingHeaderContainer.style.background = '#1a1a1a';
    floatingHeaderContainer.style.color = '#ff4444';
    floatingHeaderContainer.style.padding = '12px';
    floatingHeaderContainer.style.zIndex = '20'; /* Higher than table header */
    floatingHeaderContainer.style.fontWeight = 'bold';
    floatingHeaderContainer.style.borderBottom = '2px solid #ff4444';
    floatingHeaderContainer.style.display = 'none'; /* Initially hidden */
    document.body.appendChild(floatingHeaderContainer);
  
    let currentFloatingHeader = null;
  
    function updateFloatingHeader() {
      for (const section of spellLevelSections) {
        const table = section.querySelector('.spell-table');
        if (!table) continue;
        const thead = table.querySelector('thead');
        if (!thead) continue;
        const level = thead.dataset.level;
        const rect = section.getBoundingClientRect();
  
        if (rect.top <= 0 && rect.bottom > 0) {
          if (currentFloatingHeader !== level) {
            floatingHeaderContainer.textContent = `Spell - ${level}`;
            floatingHeaderContainer.style.display = 'block';
            currentFloatingHeader = level;
          }
          return;
        }
      }
      floatingHeaderContainer.style.display = 'none';
      currentFloatingHeader = null;
    }
  
    window.addEventListener('scroll', updateFloatingHeader);
    window.addEventListener('resize', updateFloatingHeader);
    updateFloatingHeader();
  });