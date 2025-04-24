document.addEventListener('DOMContentLoaded', () => {
    const spellLevelSections = document.querySelectorAll('.spell-level-section');
    const floatingHeaderContainer = document.createElement('div');
    floatingHeaderContainer.className = 'floating-header-styled'; // New class name
    // floatingHeaderContainer.style.display = 'none';
    document.body.appendChild(floatingHeaderContainer);

    let currentFloatingHeader = null;
  
    function updateFloatingHeader() {
      console.log('updateFloatingHeader called');
      let foundRelevantSection = false;
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
            floatingHeaderContainer.className = 'floating-header-styled'; // Apply the class
            currentFloatingHeader = level;
          }
          foundRelevantSection = true;
          return; // Exit early since we found the current header
        }
      }
    
      // If the loop completes without finding a relevant section, hide the header
      // if (!foundRelevantSection) {
      //   console.log('No relevant section in view, hiding header');
      //   floatingHeaderContainer.className = '.floating-header-styled.hidden'; // Apply the class
      //   floatingHeaderContainer.style.display = 'none';
      //   currentFloatingHeader = null;
      // }
    }
  
    window.addEventListener('scroll', updateFloatingHeader);
    window.addEventListener('resize', updateFloatingHeader);
    updateFloatingHeader();
  });