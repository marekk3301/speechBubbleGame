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
        const response = await fetch('https://raw.githubusercontent.com/marekk3301/speechBubbleGame/refs/heads/master/emojis.json');

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
    // Clear the current list (if needed)
    emojiCategoriesElement.innerHTML = '';

    // Populate the list with emojis
    Object.keys(emojis.categories).forEach(emote => {
        const listItem = document.createElement('li');
        listItem.className = 'emoji';
        listItem.textContent = emote; // Use emote key as text

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

    return selectedEmojis;
}

function checkRecipe() {
    Object.keys(allEmojis.categories).forEach(emote => {
        Object.keys(allEmojis.categories[emote]).forEach(emoji => {
            if (emoji !== 'unlocked') {
                allEmojis.categories[emote][emoji].forEach(recipe => {
                    if (areArraysEqualUnordered(recipe, selectedEmojis)) {
                        allEmojis.categories[emote].unlocked.push(emoji);
                        delete allEmojis.categories[emote][emoji];
                        console.log(allEmojis);
                        refreshEmojis(selectedCategory); // Pass the current category to refresh
                    }
                });
            }
        });    
    });

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

        // Ensure the emoji is added to the correct category
        const emojiCategory = Object.keys(allEmojis.categories).find(category =>
            allEmojis.categories[category].unlocked.includes(givenEmoji) ||
            allEmojis.categories[category][givenEmoji]
        );

        if (emojiCategory) {
            allEmojis.categories[emojiCategory].unlocked.push(givenEmoji);
        } else {
            console.error(`Category for emoji ${givenEmoji} not found.`);
        }

        currentContact.chatHistory.push({
            type: 'res',
            text: `You've given me everything I wanted! Here's a ${givenEmoji} for you!` // Example response
        });

        // Disable input and show offline message
        disableContactInput(Object.keys(contacts)[currentContactIndex]);

    } else {
        currentContact.chatHistory.push({
            type: 'res',
            text: "Thank you for the emoji!" // Example response
        });
    }

    // Display the updated chat history and contact description
    updateContactDisplay();

    // Clear selected emojis
    selectedEmojis = [];
    emojiSelectedElement.innerHTML = '';
}

function refreshEmojis(emote) {
    emojiListElement.innerHTML = ''; // Clear the emoji list

    if (!allEmojis.categories[emote]) {
        console.error(`Category ${emote} not found in allEmojis.`);
        return;
    }

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

let contacts = {};
let currentContactIndex = 0;

async function getContactsJSON() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/marekk3301/speechBubbleGame/refs/heads/master/contacts.json');

        if (!response.ok) {
            throw new Error(`Failed to fetch contacts.json: ${response.status} ${response.statusText}`);
        }

        contacts = await response.json();

        // Initialize chat history for each contact
        Object.keys(contacts).forEach(contactName => {
            contacts[contactName].chatHistory = []; // Add a chatHistory array
        });

        updateContactDisplay();
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

prevContactButton.addEventListener('click', () => {
    currentContactIndex = (currentContactIndex - 1 + Object.keys(contacts).length) % Object.keys(contacts).length;
    updateContactDisplay();
});

nextContactButton.addEventListener('click', () => {
    currentContactIndex = (currentContactIndex + 1) % Object.keys(contacts).length;
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
    contactDescriptionElement.textContent = `${currentContact.description}\nWants: ${wantsList}`;

    // Display the chat history
    const chatHistory = currentContact.chatHistory;
    const bubblesContainer = document.querySelector('.bubbles');
    bubblesContainer.innerHTML = ''; // Clear previous bubbles

    chatHistory.forEach(bubble => {
        const bubbleElement = document.createElement('div');
        bubbleElement.className = `bubble ${bubble.type === 'req' ? 'bubble_req' : 'bubble_res'}`;
        bubbleElement.textContent = bubble.text;
        bubblesContainer.appendChild(bubbleElement);
    });
}

function disableContactInput(contactName) {
    const sendButton = document.querySelector('.send__button');
    sendButton.disabled = true; // Disable the send button

    const contactNameElement = document.querySelector('.contact-name');
    contactNameElement.textContent = `${contactName} is offline`; // Change name to "offline" message
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
