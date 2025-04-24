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
    console.log('Floating header container created:', floatingHeaderContainer);
  
    let currentFloatingHeader = null;
  
    function updateFloatingHeader() {
      console.log('updateFloatingHeader called');
      for (const section of spellLevelSections) {
        console.log('Checking section:', section);
        const table = section.querySelector('.spell-table');
        if (!table) continue;
        const thead = table.querySelector('thead');
        if (!thead) continue;
        const level = thead.dataset.level;
        const rect = section.getBoundingClientRect();
        console.log('Section rect:', rect, 'Level:', level);
  
        if (rect.top <= 0 && rect.bottom > 0) {
          console.log('Relevant section in view:', level);
          if (currentFloatingHeader !== level) {
            console.log('Updating floating header to:', level);
            floatingHeaderContainer.textContent = `Spell - ${level}`;
            floatingHeaderContainer.style.display = 'block';
            currentFloatingHeader = level;
          }
          return;
        }
      }
      console.log('No relevant section in view, hiding header');
      floatingHeaderContainer.style.display = 'none';
      currentFloatingHeader = null;
    }
  
    window.addEventListener('scroll', updateFloatingHeader);
    window.addEventListener('resize', updateFloatingHeader);
    updateFloatingHeader();
  });