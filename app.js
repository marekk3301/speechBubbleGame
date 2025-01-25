// Emojis
const emojiCategoriesElement = document.querySelector('.categories__list');
const emojiListElement = document.querySelector('.emoji__list');
const emojiSelectedElement = document.querySelector('.selected');

let selectedEmojis = [];
let allEmojis = {};
let selectedCategory = '';

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
        listItem.className = 'emoji';
        listItem.textContent = emote; // Use the category name as text

        if (emojis.categories[emote].unlocked.length === 0) {
            listItem.classList.add('disabled');
        } else {
            // Highlight the selected category
            if (emote === selectedCategory) {
                listItem.classList.add('selected-category');
            }

            listItem.addEventListener('click', () => {
                selectedCategory = emote;
                refreshEmojis(emote);
                populateEmojiList(allEmojis); // Re-populate the list to update the highlight
            });
        }

        emojiCategoriesElement.appendChild(listItem);
    });
}


function checkRecipe() {
    let newEmoji = "";
    Object.keys(allEmojis.categories).forEach(emote => {
        Object.keys(allEmojis.categories[emote]).forEach(emoji => {
            if (emoji !== 'unlocked' && emoji !== "to_recieve") {
                allEmojis.categories[emote][emoji].forEach(recipe => {
                    // Check if selected emojis match the recipe
                    if (areArraysEqualUnordered(recipe, selectedEmojis)) {
                        // Unlock the emoji by adding it to the unlocked list
                        allEmojis.categories[emote].unlocked.push(emoji);
                        delete allEmojis.categories[emote][emoji];  // Remove the recipe once it's unlocked
                        console.log(`Unlocked emoji: ${emoji} for recipe: ${recipe}`);
                        newEmoji = emoji
                    }
                });
            }
        });
    });

    // Chat functionality
    const currentContact = contacts[Object.keys(contacts)[currentContactIndex]];
    const wants = currentContact.wants;

    // Copy selected emojis for comparison
    const sentEmojis = [...selectedEmojis];

    // Find matching emojis and remove them from `wants`
    const matchedEmojis = [];
    for (const emoji of wants) {
        const emojiIndex = sentEmojis.indexOf(emoji);
        if (emojiIndex !== -1) {
            matchedEmojis.push(emoji);
            sentEmojis.splice(emojiIndex, 1); // Remove matched emoji from sentEmojis
        }
    }

    // Remove all matched emojis from the wants list
    for (const matchedEmoji of matchedEmojis) {
        const wantIndex = wants.indexOf(matchedEmoji);
        if (wantIndex !== -1) {
            wants.splice(wantIndex, 1);
        }
    }

    // Add selected emojis as a chat message to the current contact's history
    currentContact.chatHistory.push({
        type: 'req', // Type 'req' for request bubbles
        text: selectedEmojis.join(' ') // Convert the selected emojis to text
    });

    // Simulate a response based on whether all wants are satisfied
    if (wants.length === 0) {
        // Add emoji from "gives" to unlocked emojis
        const givenEmoji = currentContact.gives[0]; // Assume one emoji is given

        // Find the correct category for the emoji, either by the 'to_recieve' array or 'unlocked'
        let emojiCategory = Object.keys(allEmojis.categories).find(category => 
            allEmojis.categories[category].to_recieve && allEmojis.categories[category].to_recieve.includes(givenEmoji) ||
            allEmojis.categories[category].unlocked.includes(givenEmoji)
        );

        // If the emoji is in the "to_recieve" array of a category, we use that category
        if (!emojiCategory) {
            // No category found, try to assign it based on 'to_recieve'
            emojiCategory = Object.keys(allEmojis.categories).find(category => 
                allEmojis.categories[category].to_recieve && allEmojis.categories[category].to_recieve.includes(givenEmoji)
            );
        }

        // Add the received emoji to the correct category's unlocked list
        if (emojiCategory) {
            allEmojis.categories[emojiCategory].unlocked.push(givenEmoji);
            console.log(`Added ${givenEmoji} to category ${emojiCategory}`); // Log to verify
        } else {
            console.error(`Category for emoji ${givenEmoji} not found in 'to_recieve' or 'unlocked'.`);
        }

        // Unlock contacts specified in the "unlocks" array
        console.log(currentContact.unlocks);
        unlockContacts(currentContact.unlocks);

        // Mark the current contact as offline (inactive) using its name from the contact's key
        const currentContactName = Object.keys(contacts)[currentContactIndex]; // Get the contact's name as the key
        contacts[currentContactName].is_active = "false"; // Set the current contact's status to offline
        console.log(`Marked ${currentContactName} as offline (inactive).`);

        currentContact.chatHistory.push({
            type: 'res',
            text: `You've given me everything I wanted! Here's a ${givenEmoji} for you!` // Example response
        });
        currentContact.chatHistory.push({
            type: 'res',
            text: `This user is offline` // Example response
        });
    } else {
        currentContact.chatHistory.push({
            type: 'res',
            text: newEmoji // Example response
        });
    }

    // Refresh all categories by re-populating the emoji list
    populateEmojiList(allEmojis); // Re-populate all categories' emojis

    // Display the updated chat history and contact description
    updateContactDisplay();

    // Clear selected emojis
    selectedEmojis = [];
    emojiSelectedElement.innerHTML = '';
}

function unlockContacts(unlockArray) {
    unlockArray.forEach(unlockedContact => {
        // Ensure the contact exists in the allContacts object (even inactive ones)
        console.log(allContacts);
        console.log(unlockedContact);

        // Check if the contact exists in allContacts
        if (allContacts.hasOwnProperty(unlockedContact)) {
            // Log to ensure the contacts and unlockedContact are accessible
            console.log("Unlocking:", unlockedContact);
            console.log("Contact details:", allContacts[unlockedContact]);

            // Set the status of the unlocked contact to active
            allContacts[unlockedContact].is_active = "true"; // Set the status to active
            console.log(`Unlocked ${unlockedContact} and set status to active.`);

            // Add the unlocked contact to the active contacts list
            // We need to add it to contacts object if not already there
            if (!contacts.hasOwnProperty(unlockedContact)) {
                contacts[unlockedContact] = allContacts[unlockedContact]; // Add to active contacts
                contacts[unlockedContact].chatHistory = []; // Initialize the chat history array
                console.log(`${unlockedContact} has been added to active contacts.`);
            }

            // Optional: Log the unlocked contact's status
            console.log(`${unlockedContact} is now active: ${allContacts[unlockedContact].is_active}`);
        } else {
            console.log(`Contact ${unlockedContact} is not found in the allContacts list.`);
        }
    });
}




function refreshEmojis(emote) {
    console.log(`Refreshing emojis for category: ${emote}`); // Log the selected category

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
            selectedEmojis.push(emoji);
            const selectedItem = document.createElement('li');
            selectedItem.className = 'selected__emoji';
            selectedItem.textContent = emoji;
            emojiSelectedElement.appendChild(selectedItem);
        });
        emojiListElement.appendChild(emojiItem);
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
        console.log('Fetched Contacts:', allContacts); // Debugging the fetched data

        // Filter only active contacts
        const activeContacts = Object.keys(allContacts).filter(contactName => allContacts[contactName].is_active);

        console.log('Active Contacts:', activeContacts); // Debugging the active contacts

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
    updateContactDisplay();
});

nextContactButton.addEventListener('click', () => {
    const contactNames = Object.keys(contacts);
    if (contactNames.length === 0) return;

    currentContactIndex = (currentContactIndex + 1) % contactNames.length;
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
    contactNameElement.textContent = contactNames[currentContactIndex];

    // Display the wants list in the contact description
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
}


// Main function

function main() {
    const sendButton = document.querySelector('.send__button');
    sendButton.addEventListener('click', checkRecipe);
    
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
