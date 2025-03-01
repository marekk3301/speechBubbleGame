// Emojis
const emojiCategoriesElement = document.querySelector('.categories__list');
const emojiListElement = document.querySelector('.emoji__list');
const emojiSelectedElement = document.querySelector('.selected');
const AllEmojisListElement = document.querySelector('.all-emojis');
const appElement = document.querySelector('.app');

let selectedEmojis = [];
let allEmojis = {};
let selectedCategory = '🙂';

inputLocked = false;

async function getEmojisJSON() {
    try {
        // Fetch the emojis.json file
        const response = await fetch('./emojis.json');

        if (!response.ok) {
            throw new Error(`Failed to fetch emojis.json: ${response.status} ${response.statusText}`);
        }

        // Parse the JSON data
        emojis = await response.json();

    } catch (error) {
        console.error('Error loading emojis:', error);
    }

    return emojis;
}

function populateEmojiList(emojis) {
    selectedEmojis = [];
    emojiCategoriesElement.innerHTML = ''; // Clear the list of categories

    // Add each existing category and newly created categories to the list
    Object.keys(emojis.categories).forEach(emote => {
        const listItem = document.createElement('li');
        listItem.className = 'emoji__category';
        listItem.textContent = emote; // Use the category name as text

        if (emojis.categories[emote].unlocked.length === 0) {
            listItem.classList.add('disabled');
        } else {
            // Remove 'selected-category' from the previously selected category
            if (emote === selectedCategory) {
                listItem.classList.add('selected-category');
            }

            listItem.addEventListener('click', () => {
                // Remove 'selected-category' from any previously selected category
                const previouslySelected = document.querySelector('.selected-category');
                if (previouslySelected) {
                    previouslySelected.classList.remove('selected-category');
                }

                // Update the selected category
                selectedCategory = emote;
                listItem.classList.add('selected-category');
                refreshEmojis(emote);
            });
        }

        emojiCategoriesElement.appendChild(listItem);
    });
    const allEmojisTab = document.createElement('li');
    allEmojisTab.className = 'emoji__category last__emoji__category';
    allEmojisTab.textContent = '📃';
    fillListWithEmojis();
    allEmojisTab.addEventListener('click', () => {
        showAllEmojis();
    });
    emojiCategoriesElement.appendChild(allEmojisTab);
}

function showAllEmojis() {
    fillListWithEmojis();
    AllEmojisListElement.style.display = 'flex';
    appElement.style.display = 'none';
}

function hideAllEmojis() {
    AllEmojisListElement.style.display = 'none';
    appElement.style.display = 'flex';
}

function fillListWithEmojis() {
    document.querySelector('.list__all').innerHTML = '';
    Object.keys(allEmojis.categories).forEach(category => {
        const categoryElement = document.createElement('ul');
        categoryElement.className = 'list__category';

        unlocked = allEmojis.categories[category].unlocked;
        toReceive = allEmojis.categories[category].to_recieve;
        toUnlock = Object.keys(allEmojis.categories[category])

        all = toReceive.concat(toUnlock);

        all.forEach(emoji => {
            if (!(emoji === 'unlocked' || emoji === 'to_recieve')) {
                const emojiElement = document.createElement('li');
                emojiElement.className = 'list__emoji';
                emojiElement.textContent = emoji;
                if (!unlocked.includes(emoji)) {
                    emojiElement.classList.add('emoji__locked');
                } else {
                    console.log(allEmojis.categories[category].unlocked);
                    emojiElement.classList.remove('emoji__locked');
                }

                categoryElement.appendChild(emojiElement);
            };
        });

        document.querySelector('.list__all').appendChild(categoryElement);
    }
);}


function refreshEmojis(emote) {
    // console.log(`Refreshing emojis for category: ${emote}`); // Log the selected category

    emojiListElement.innerHTML = ''; // Clear the emoji list

    if (!allEmojis.categories[emote]) {
        console.error(`Category ${emote} not found in allEmojis.`);
        return;
    }

    // Display all unlocked emojis in the selected category
    allEmojis.categories[emote].unlocked.forEach(emoji => {
        const emojiItem = document.createElement('li');
        emojiItem.className = 'emoji';
        emojiItem.textContent = emoji; // Use emoji as text
        emojiItem.addEventListener('click', () => {
            if (inputLocked) return;
            selectedEmojis.push(emoji);
            if (selectedEmojis.length > 5){
                selectedEmojis = [];
                emojiSelectedElement.innerHTML = '';
                return;
            } 
            const selectedItem = document.createElement('li');
            selectedItem.className = 'selected__emoji';
            selectedItem.textContent = emoji;
            emojiSelectedElement.appendChild(selectedItem);
        });
        emojiListElement.appendChild(emojiItem);
    });
}

function checkRecipe() {
    if (selectedEmojis.length === 0) {
        // console.log('No emojis selected.');
        return;
    }
    const currentContact = contacts[Object.keys(contacts)[currentContactIndex]];

    // Process recipe matching and unlocking emojis
    const newEmoji = processRecipes();

    // Handle chat functionality
    const matchedEmojis = matchAndRemoveWants(currentContact);
    addToChatHistory(currentContact, matchedEmojis);

    // Handle response if all wants are satisfied
    if (currentContact.wants.length === 0) {
        handleWantsSatisfied(currentContact);
    } else if (newEmoji) {
        currentContact.chatHistory.push({
            type: 'res',
            text: newEmoji // Respond with the unlocked emoji
        });
    }

    // Update UI
    refreshUI();
}

// Step 1: Process recipes and unlock emojis
function processRecipes() {
    let newEmoji = "";

    Object.keys(allEmojis.categories).forEach(category => {
        Object.keys(allEmojis.categories[category]).forEach(emoji => {
            if (emoji !== 'unlocked' && emoji !== 'to_recieve') {
                allEmojis.categories[category][emoji].forEach(recipe => {
                    if (areArraysEqualUnordered(recipe, selectedEmojis)) {
                        // Prevent duplicates in unlocked list
                        if (!allEmojis.categories[category].unlocked.includes(emoji)) {
                            allEmojis.categories[category].unlocked.push(emoji);
                            // console.log(`Unlocked emoji: ${emoji} for recipe: ${recipe}`);
                            newEmoji = emoji;
                        }
                    }
                });
            }
        });
    });

    return newEmoji;
}

// Step 2: Match selected emojis with the contact's wants
function matchAndRemoveWants(contact) {
    const sentEmojis = [...selectedEmojis];
    const matchedEmojis = [];

    for (const emoji of contact.wants) {
        const emojiIndex = sentEmojis.indexOf(emoji);
        if (emojiIndex !== -1) {
            matchedEmojis.push(emoji);
            sentEmojis.splice(emojiIndex, 1); // Remove matched emoji from sentEmojis
        }
    }

    // Remove matched emojis from the wants list
    contact.wants = contact.wants.filter(want => !matchedEmojis.includes(want));

    return matchedEmojis;
}

// Step 3: Add the selected emojis to the contact's chat history
function addToChatHistory(contact, matchedEmojis) {
    contact.chatHistory.push({
        type: 'req',
        text: selectedEmojis.join(' ')
    });

    if (matchedEmojis.length === 0) {
        // contact.chatHistory.push({
        //     type: 'res',
        //     text: "I didn't receive what I wanted."
        // });
        // console.log("I didn't receive what I wanted.");
    }
}

// Step 4: Handle the scenario where all wants are satisfied
function handleWantsSatisfied(contact) {
    const givenEmojis = contact.gives;
    const receivedItems = []; // This will store the emojis to show in the message

    givenEmojis.forEach(givenEmoji => {
        if (givenEmoji) {
            const category = findEmojiCategory(givenEmoji);

            if (category && !allEmojis.categories[category].unlocked.includes(givenEmoji)) {
                allEmojis.categories[category].unlocked.push(givenEmoji);
            }

            unlockContacts(contact.unlocks);
            markContactAsOffline(contact);

            receivedItems.push(givenEmoji); // Add the given emoji to the list
        } else {
            console.error("No emoji available to unlock.");
        }
    });

    // Only push the message once, with the list of received items
    if (receivedItems.length > 0) {
        contact.chatHistory.push({
            type: 'res',
            text: `Here's a ${receivedItems.join(", ")} for you!`
        });
    }

    if (contact.gives != "Dylan") {
        console.log(contact.gives)
        // Push the "offline" message inside a comic-style bubble
        contact.chatHistory.push({
            type: 'res',
            text: `This user is offline`
        });

        inputLocked = true;
        updatePanel();
    }
}



// Helper: Find the category for an emoji
function findEmojiCategory(emoji) {
    return Object.keys(allEmojis.categories).find(category =>
        allEmojis.categories[category].to_recieve?.includes(emoji) ||
        allEmojis.categories[category].unlocked.includes(emoji)
    );
}

// Helper: Mark a contact as offline
function markContactAsOffline(contact) {
    const contactName = Object.keys(contacts)[currentContactIndex];
    contacts[contactName].is_active = false;
    // console.log(`Marked ${contactName} as offline.`);
}

// Step 5: Refresh UI after processing
function refreshUI() {
    populateEmojiList(allEmojis);
    refreshEmojis(selectedCategory);
    updateContactDisplay();
    selectedEmojis = [];
    emojiSelectedElement.innerHTML = '';
}

// Helper: Unlock contacts based on their "unlocks" property
function unlockContacts(unlocks) {
    unlocks.forEach(contactName => {
        if (contacts[contactName]) {
            contacts[contactName].is_active = true;
            // console.log(`Unlocked contact: ${contactName}`);
        }
    });
}
function unlockContacts(unlockArray) {
    unlockArray.forEach(unlockedContact => {
        // Ensure the contact exists in the allContacts object (even inactive ones)
        // console.log(allContacts);
        // console.log(unlockedContact);

        // Check if the contact exists in allContacts
        if (allContacts.hasOwnProperty(unlockedContact)) {
            // Log to ensure the contacts and unlockedContact are accessible
            // console.log("Unlocking:", unlockedContact);
            // console.log("Contact details:", allContacts[unlockedContact]);

            // Set the status of the unlocked contact to active
            allContacts[unlockedContact].is_active = "true"; // Set the status to active
            // console.log(`Unlocked ${unlockedContact} and set status to active.`);

            // Add the unlocked contact to the active contacts list
            // We need to add it to contacts object if not already there
            if (!contacts.hasOwnProperty(unlockedContact)) {
                contacts[unlockedContact] = allContacts[unlockedContact]; // Add to active contacts
                contacts[unlockedContact].chatHistory = []; // Initialize the chat history array
                // console.log(`${unlockedContact} has been added to active contacts.`);
            }

            // Optional: Log the unlocked contact's status
            // console.log(`${unlockedContact} is now active: ${allContacts[unlockedContact].is_active}`);
        } else {
            console.log(`Contact ${unlockedContact} is not found in the allContacts list.`);
        }
    });
}

function areArraysEqualUnordered(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    // Sort both arrays and compare their elements
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();

    return sortedArr1.every((value, index) => value === sortedArr2[index]);
}

// Contacts
const contactsElement = document.querySelector('.contacts');
const contactNameElement = document.querySelector('.contact-name');
const contactDescriptionElement = document.querySelector('.contact-description');
const prevContactButton = document.querySelector('.prev-contact');
const nextContactButton = document.querySelector('.next-contact');

let currentContactIndex = 0;

let allContacts = {}; // Store all contacts, including inactive ones
let contacts = {}; // Store only active contacts

async function getContactsJSON() {
    try {
        // Fetch the contacts JSON file
        const response = await fetch('./contacts.json');

        if (!response.ok) {
            throw new Error(`Failed to fetch contacts.json: ${response.status} ${response.statusText}`);
        }

        // Parse the response data as JSON
        allContacts = await response.json(); // Save all contacts, including inactive ones
        // console.log('Fetched Contacts:', allContacts); // Debugging the fetched data

        // Filter only active contacts
        const activeContacts = Object.keys(allContacts).filter(contactName => allContacts[contactName].is_active);

        // console.log('Active Contacts:', activeContacts); // Debugging the active contacts

        // Create a new object containing only active contacts
        contacts = {};
        activeContacts.forEach(contactName => {
            contacts[contactName] = allContacts[contactName]; // Store only active contacts
            contacts[contactName].chatHistory = []; // Add a chatHistory array
        });

        // If there are no active contacts, display a message or handle as needed
        if (Object.keys(contacts).length === 0) {
            console.log('No active contacts available.');
            // Handle the case where no active contacts exist, if needed
        }

        // Call updateContactDisplay to show active contacts
        updateContactDisplay();
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}


prevContactButton.addEventListener('click', () => {
    const contactNames = Object.keys(contacts);
    if (contactNames.length === 0) return;

    currentContactIndex = (currentContactIndex - 1 + contactNames.length) % contactNames.length;
    if (inputLocked === true) {
        if (contactNames.length === 0) return;
        console.log(contactNames[currentContactIndex-1]);

        const contactToRemove = contactNames[currentContactIndex+1];
        delete contacts[contactToRemove];
        inputLocked = false;
    }
    updateContactDisplay();
});

nextContactButton.addEventListener('click', () => {
    const contactNames = Object.keys(contacts);
    if (contactNames.length === 0) return;

    currentContactIndex = (currentContactIndex + 1) % contactNames.length;
    if (inputLocked === true) {
        if (contactNames.length === 0) return;
        console.log(contactNames[currentContactIndex-1]);

        const contactToRemove = contactNames[currentContactIndex-1];
        delete contacts[contactToRemove];
        inputLocked = false;
        updatePanel();
    }
    updateContactDisplay();
});


document.addEventListener('DOMContentLoaded', () => {
    getContactsJSON();
});

// Chat
function updateContactDisplay() {
    if (Object.keys(contacts).length === 0) return;

    const contactNames = Object.keys(contacts);
    const currentContact = contacts[contactNames[currentContactIndex]];

    // Display the contact name and description
    console.log(contactNameElement);
    contactNameElement.textContent = contactNames[currentContactIndex];

    // Ensure the description is added as the first chat message if not already present
    if (!currentContact.chatHistory.some(bubble => bubble.text === currentContact.description)) {
        currentContact.chatHistory.unshift({
            type: 'res', // Mark it as a response
            text: currentContact.description
        });
    }

    // Display the wants list in the contact description (for extra context)
    const wantsList = currentContact.wants.join(' ');
    contactDescriptionElement.textContent = `${wantsList}`;

    // Display the chat history
    const chatHistory = currentContact.chatHistory;
    const bubblesContainer = document.querySelector('.bubbles');
    bubblesContainer.innerHTML = ''; // Clear previous bubbles

    chatHistory.forEach(bubble => {
        const bubbleElement = document.createElement('div');
        if (bubble.text === "This user is offline") {
            bubbleElement.className = `bubble status-message`; // Add the status class
        } else {
            bubbleElement.className = `bubble ${bubble.type === 'req' ? 'bubble_req' : 'bubble_res'}`;
        }
        bubbleElement.textContent = bubble.text;
        bubblesContainer.appendChild(bubbleElement);
    });

    bubblesContainer.scrollTop = bubblesContainer.scrollHeight;
}

const panel = document.querySelector('.panel');

// Function to update the panel appearance based on inputLocked
function updatePanel() {
    if (inputLocked) {
        panel.classList.add('disabled');  // Apply the dark filter
    } else {
        panel.classList.remove('disabled');  // Remove the dark filter
    }
}


// Main function

function main() {
    const sendButton = document.querySelector('.send__button');
    const eraseButton = document.querySelector('.erase__button');
    sendButton.addEventListener('click', checkRecipe);
    eraseButton.addEventListener('click', _ => {
        selectedEmojis = [];
        emojiSelectedElement.innerHTML = '';
    });
    
    getEmojisJSON()
    .then(emojis => {
        allEmojis = emojis;
        populateEmojiList(emojis); // Process the emojis and get selectedEmojis
        if (selectedCategory) {
            refreshEmojis(selectedCategory); // Ensure selected category remains visible
        }
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

document.addEventListener('DOMContentLoaded', main);
