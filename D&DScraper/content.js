chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSpells") {
        // Mark as async and handle properly
        (async () => {
            try {
                const spells = await extractSpellsFromPage();
                sendResponse({ spells });
            } catch (error) {
                console.error("Error extracting spells:", error);
                sendResponse({ spells: [] });
            }
        })();
        return true; // Required for async response
    }
});

function openSpells() {
    //search the entire document for the placeholder names
    let elements = document.querySelectorAll('.styles_tabButton__wvSLf');
    let elementToClick;
    //for each element in the document, if the text is "Spells", we want to click that.
    for (let element of elements) {
        //check if there is text content
        if (element.textContent) {
            //if so, check if the text element is "Spells"
            if (element.textContent.trim() == "Spells") {
                //if it is "Spells", we should click on that and stop looking
                elementToClick = element;
                break;
            }
        }
    }
    if (elementToClick) {
        elementToClick.click();
    } else {
        console.warn("Element not found.");
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function clickElement(element) {
    //if it exists, then you can cilck on it.
    element.click();
}


async function extractSpellsFromPage() {
    let spellList = [];
    openSpells();

    // 1. Find the main spells container
    const spellsContainers = document.querySelectorAll('.styles_content__QjnYw');

    let correctSpellContainer = null;
    for (let container of spellsContainers) {
        const subContainer = container.querySelector('.ct-content-group');

        //if the subContainer exists:
        if (subContainer)  // This checks for truthy DOM element (not null/undefined)
        {
            correctSpellContainer = container;
            break;
        }
    }

    if (correctSpellContainer == null) {
        return [];
    }


    // 2. Find all spell levels (including cantrips)
    const spellLevels = correctSpellContainer.querySelectorAll('.ct-content-group');


    //for each level type:
    for (let level of spellLevels) {

        //get the relevant information
        let levelContent = level.querySelector('.ct-content-group__content');
        let spellsLevel = levelContent.querySelector('.ct-spells-level');
        let spellsContent = spellsLevel.querySelector('.ct-spells-level__spells-content');
        let spells = spellsContent.querySelectorAll('.ct-spells-spell');
        let currentLevel = level.textContent.trim();

        //for each spell in the list of spells under the level type:
        for (let spell of spells) {
            //some spells have no damage
            let damagehealing;
            let damageType;
            let diceContainerClass = spell.querySelectorAll('.integrated-dice__container');

            //make sure the dice class exists
            if (diceContainerClass.length > 0) {
                //for each die container for the spell
                for (let die of diceContainerClass) {
                    //if we already found the damage or healing for the current spell, skip.
                    if (damagehealing) {
                        continue;
                    }
                    //check the child element's class name
                    if (die.firstElementChild.className?.includes("damage")) {
                        damagehealing = die.textContent.toString().trim();
                        if (damagehealing) {
                            let typeclass = die.querySelector('.ddbc-damage-type-icon');
                            if (typeclass) {
                                damageType = typeclass.ariaLabel?.trim();
                            } else {
                                damageType = "N/A";
                            }
                        } else {
                            damagehealing = "N/A";
                            damageType = "N/A";
                        }
                    } else if (die.firstElementChild.className?.includes("heal")) {
                        damagehealing = die.textContent.toString().trim();
                        if (damagehealing) {
                            damageType = "healing"; // Set damageType to "healing" for healing spells
                        } else {
                            damagehealing = "N/A"; // Or perhaps an empty string "" if that's more appropriate
                            damageType = "N/A";
                        }
                    }
                }
                
                //if we go through all of the die for the spell and we still don't have a value,
                //set them to N/A.
                if(!damagehealing)
                {
                    damagehealing = "N/A";
                    damageType = "N/A";
                }
            }

            //get the range of the spell
            let trueRange;
            let numrange = spell.querySelector('.ct-spells-spell__range-value');
            let typerange = spell.querySelector('.ct-spells-spell__range.ct-spells-spell--dark-mode');

            if (numrange) {
                trueRange = numrange?.textContent.trim();
            }
            else if (typerange) {
                trueRange = typerange?.textContent.trim();
            }

            //get the hit/DC of the spell
            let attackingClass = spell.querySelector('.ct-spells-spell__attacking');
            let toHitClass = attackingClass.querySelector('.ct-spells-spell__tohit');
            let emptyHitClass = attackingClass.querySelector('.ct-spells-spell__empty-value');
            let saveClass = attackingClass.querySelector('.ct-spells-spell__save');

            let hitDC;

            if (toHitClass) {
                hitDC = toHitClass?.textContent.trim();
            }
            else if (emptyHitClass) {
                hitDC = emptyHitClass?.textContent.trim();
            }
            else if (saveClass) {
                text = saveClass?.textContent.trim();
                let hitDCnum = text.slice(3, text.length);
                let hitDCsave = text.slice(0, 3);
                hitDC = hitDCsave.toString().toUpperCase() + " " + hitDCnum.toString();
            }


            let spellNameClass = spell.querySelector('.ct-spells-spell__name');
            let spellLabelClass = spellNameClass.querySelector('.ct-spells-spell__label');
            let name = spellLabelClass.querySelector('.styles_spellName__wX3ll')?.textContent.trim();
            let description = "N/A";
            let duration = "N/A";

            //first, search the page for the notes part of the spell list
            let search = spell.querySelector('.ddbc-note-components');

            //if the search comes back true, click on the notes section for the spell.
            if (search) {

                clickElement(search);
                await delay(1);

                //we want to search for the notes section of the now-open side panel
                //if the search returns true, get that information out from the side panel.
                let detailPage = document.querySelector('.ddbc-html-content.ct-spell-detail__description');


                if (detailPage) {
                    description = detailPage.textContent;
                }
                else {
                    description = "N/A";
                }

                //get the label from the side panel
                let infoField = document.querySelectorAll('.InfoItem_inline__dPVzd.styles_item__8bGe2');
                for (let field of infoField) {
                    //if the current field is the duration field:
                    if (field.textContent.includes("Duration")) {

                        //basically, the last child of the current field will have the important text
                        duration = field.lastChild.textContent.trim();
                    }
                    else if (field.textContent.includes("Range")) {
                        let subContainer = field.querySelector('.InfoItem_value__rVPhW');

                        trueRange = subContainer?.textContent;
                    }
                }
            }


            if (name) {
                spellList.push({
                    name: name,
                    level: currentLevel,
                    damagehealing: damagehealing,
                    damageType: damageType,
                    range: trueRange,
                    hitDC: hitDC,
                    duration: duration,
                    description: description
                });
            }
        };
    }
    return spellList;
}