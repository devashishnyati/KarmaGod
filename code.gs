
const SHEET_ID = ''; // Add Google Sheet ID
const SHEET_NAME = ''; // Add Google Sheet Name
const ADMIN_EMAIL = ''; // Add Admin Email 
const KARMA_GOD_NAME = 'karma god';

/**
 * Responds to a MESSAGE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onMessage(event) {
  // Logger.log("Full Event: " + JSON.stringify(event));
  const spaceId = event.space.name;
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
   if (!sheet) {
    sendChatMessage("Error: Karma sheet not found. Contact: " + ADMIN_EMAIL);
    return;
  }
  var name = "";
  const message = event.message.argumentText;
  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes('thank'))  {
     return handleThanks(event, sheet);
  } else if (lowerCaseMessage.startsWith(' fate') || lowerCaseMessage.startsWith('fate')) {
    return handleShowKarma(event, sheet);
  }

  return displayKarmaHelp();
}

function displayKarmaHelp(){
    const helpMessage = `🌟 *Namaste! I am Karma God* 🌟  

🔹 *Spread Positivity & Earn Karma!*  
Be kind, appreciate others, and watch your karma grow!  

🔹 *How to Use Me:*
  Give Karma → "@Karma God thanks @user1 @user2"  
  Check Karma → "@Karma God fate"  

👀 _Remember: Karma God never forgets! Be nice!_ 😇  
    `;
    return sendChatMessage(helpMessage);
}

function handleThanks(event, sheet) {
const mentionedUsers = event.message.annotations ? event.message.annotations.filter(annotation => annotation.type === 'USER_MENTION') : [];
  const uniqueUsers = Array.from(new Map(
      mentionedUsers.map(userMention => [userMention.userMention.user.name, userMention])
  ).values());
  const senderId = event.user.name;
  let messageText = "";

  if (uniqueUsers.length > 0) {
    uniqueUsers.forEach(userMention => {
      if (userMention.userMention.user && userMention.userMention.user.displayName) { 
        Logger.log(JSON.stringify(userMention));
        const userId = userMention.userMention.user.name;
        const displayName = userMention.userMention.user.displayName;
        if (displayName.toLowerCase() == KARMA_GOD_NAME) {
          return;
        }
        else if (senderId == userId) {
          messageText += `🤔 Why thanking yourself ${displayName}?\nKarma Gods are watching you 👀`;
        } else {
          const userKarma = addKarma(sheet, userId, displayName);
          messageText += `${displayName} got a Karma\n`;
          messageText += `${displayName}'s new Karma: ${userKarma}\n`;
        }
        }
    });
    return sendChatMessage(messageText);
  } else {
    return sendChatMessage("No users were mentioned.");
  }
}
function handleShowKarma(event, sheet) {
    return displayKarma(event, sheet);
}


function addKarma(sheet, userId, displayName) {
  const data = sheet.getDataRange().getValues();
  let userRowIndex = -1; // Initialize to -1 (not found)

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) {
      userRowIndex = i;
      break;
    }
  }
  if (userRowIndex !== -1) {
    data[userRowIndex][2]++; // Increment karma in the data array
    sheet.getRange(userRowIndex + 1, 3).setValue(data[userRowIndex][2]); // Write back to the sheet
    return data[userRowIndex][2]; // Return the new karma value
  } else {
    sheet.appendRow([userId, displayName, 1]);
    return 1; // Return 1 for new user
  }
}

function displayKarma(event, sheet) {
  const spaceId = event.space.name;
  const spaceMembers = getSpaceMembers(spaceId);
  if (!spaceMembers) return;
  const data = sheet.getDataRange().getValues();
  const filteredData = data
    .filter(row => spaceMembers.includes(row[0])) // Keep only space members
    .sort((a, b) => b[2] - a[2]); // Sort by karma (column index 2) descending

  let karmaList = '🔮 Your fate is written in karma 🔮\n';

  for (let i = 0; i < filteredData.length; i++) {
    if (spaceMembers.includes(filteredData[i][0])) {
      karmaList += `🌟 ${filteredData[i][1]}: ${filteredData[i][2]} karma\n`;
    }
  }
  karmaList += 'Your actions shape your destiny. Keep spreading good karma!';
  return sendChatMessage(karmaList);
}



/**
 * Responds to an ADDED_TO_SPACE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onAddToSpace(event) {
 return displayKarmaHelp();
}

/**
 * Responds to a REMOVED_FROM_SPACE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onRemoveFromSpace(event) {
  console.info("Bot removed from ",
      (event.space.name ? event.space.name : "this chat"));
}

function sendChatMessage(message) {
 return {
      "text": message
    };
}

function getSpaceMembers(spaceId) {
    try {
      if (!spaceId.startsWith("spaces/")) {
            spaceId = `spaces/${spaceId}`;
        }
        const url = `https://chat.googleapis.com/v1/${spaceId}/members`;
        const options = {
            method: 'get',
            headers: {
                Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
            },
        };

        const response = UrlFetchApp.fetch(url, options);
            if (response.getResponseCode() === 200) {
          const members = JSON.parse(response.getContentText()).memberships;
          if (!members) return [];
                      // Extract 'member.name' values into an array
            const memberNames = members.map(member => member.member.name);
            Logger.log(`Extracted Members: ${JSON.stringify(memberNames)}`);

            return memberNames;
        } else {
          Logger.log(`Error getting space members: ${response.getContentText()}`); // Log the full response
          return null;
        }
       
    } catch (e) {
        Logger.log(`Error getting space members: ${e}`);
        return null;
    }
}
