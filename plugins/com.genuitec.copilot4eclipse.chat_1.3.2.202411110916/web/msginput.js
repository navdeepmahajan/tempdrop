

let history = [];
let maxHistorySize = 25;
let historyIndex = -1;
let messageInput;
let autocompleteSelecting = false;
let messageInputReadonly = false;
let slashCommands = [];

function getPromptText() {
  return messageInput.innerText.trim();
}

function handleSendBtn(event) {
  // is this a stop request
  if ($("#sendBtnImage").hasClass('fa-stop')) {
    processMessageInputCancelRequest();
    return;
  }

  handlePromptSubmit(event);
}

function handlePromptSubmit(event) {
  event.preventDefault();
  if (autocompleteSelecting) return;

  let prompt = getPromptText();
  if (!prompt) return;

  let mostRecentPrompt = 
        history.length > 0 ? 
          history[history.length - 1] : 
          null;
  if (prompt != mostRecentPrompt) {
    history.push(prompt); // Add input value to history
    historyIndex = history.length; // Reset history index
  }

  clearMessageInput();
  processMessageInputRequest(prompt);
}

function clearMessageInput() {
  messageInput.innerText = '';
  setMessageSendButtonActive(false);
  // historyIndex = history.length;
}

function setupPromptHistory(promptsString, maxHistorySize) {
  history = [];
  maxHistorySize = maxHistorySize || 25;
  // from regex101.com
  const regex = new RegExp('\\"[^\\"]*\\"|[^|]+', 'gm');
  while ((m = regex.exec(promptsString)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
        //console.log(`Found match, group ${groupIndex}: ${match}`);
        history.push(match);
    });
  }

  historyIndex = history.length;

  if (history.length > maxHistorySize) {
    history = history.slice(history.length - maxHistorySize);
    historyIndex = history.length;
  }

  clearMessageInput();
}

function clearPromptHistory() {
  history = [];
  historyIndex = -1;
  clearMessageInput();
}

function handlePromptPreinput(event) {
  //let keyCode = event.which || event.keyCode;

  if (event.key === "Enter") { // Enter key, keyCode === 13
    if (!event.shiftKey) {
      handlePromptSubmit(event);
    }
    return;
  }
  
  // Navigate up in the history
  if (event.key === "ArrowUp") { // Up arrow. keyCode === 38
      event.preventDefault();
      if (historyIndex > 0) {
          historyIndex--; // Move up in the command history
          messageInput.innerText = history[historyIndex];
          moveCursorToEnd();
      }
      return;
  } 
  
  // Navigate down in the history
  if (event.key === "ArrowDown") { // Down arrow, keyCode === 40
      event.preventDefault();
      if (historyIndex < history.length - 1) {
          historyIndex++; // Move down in the command history
          messageInput.innerText = history[historyIndex];
          moveCursorToEnd();
      } else {
          historyIndex = history.length;
          clearMessageInput(); 
      }
      return;
  }
}

function moveCursorToEnd() {
  //move cursor to end of input
  let range = document.createRange();
  let sel = window.getSelection();

  // Set range to the end of the editable div
  range.selectNodeContents(messageInput); // Select the entire contents
  range.collapse(false); // Collapse the range to the end point, false means end

  // Clear any existing selections
  sel.removeAllRanges();

  // Add the new range
  sel.addRange(range);

  // Focus the editable div to ensure cursor visibility
  messageInput.focus();
}

function dropFileReference(event) {
  event.preventDefault();
  event.stopPropagation();

  let files = event.originalEvent.dataTransfer.files; // Access files
  console.log('Dropped files:', files);
}

function handlePromptPostinput(event) {
  if (messageInputReadonly) {
    setMessageSendButtonActive(false);
    return;
  }

  //console.log(event.key);
  let prompt = getPromptText();
  setMessageSendButtonActive(prompt.length > 0);
  
  // if (event.key === "/") {
  //   if (messageInput.value.trim().length === 0) {
  //     console.log('slash pressed');
  //     return;
  //   }
  // }
}

function showSubmitButton() {
  $("#sendBtnImage")
    .removeClass("fa-light fa-stop")
    .addClass("fa-light fa-paper-plane-top");
  $("#sendBtn").attr('title', 'Send');
}

function showStopButton() {
 $("#sendBtnImage")
    .removeClass("fa-light fa-paper-plane-top")
    .addClass("fa-light fa-stop");
  $("#sendBtn").attr('title', 'Stop');
}

function setMessageInputReadonly(val) {
  messageInputReadonly = val;
  let display = val ? 'inherit' : 'none';
  let messageInputOverlay = document.getElementById('messageInputOverlay');
  messageInputOverlay.style.display = display;
  
  if (val) {
    setMessageSendButtonActive(false);
    messageInput.style.color = 'var(--disabled)';
  } else {
    handlePromptPostinput(null);
    messageInput.style.color = 'var(--foreground)';
  }
}

function setMessageSendButtonActive(val) {
  if (val) {
   $('#sendBtnImage').addClass('active');
  } else {
    $('#sendBtnImage').removeClass('active');
  }
}

function handleSelectReferences(event) {
  processSelectReferencesRequest();
}

function uploadSkills(skills) {
  if (!skills) return;
  slashCommands = [];
  let clearCmd = null;
  let helpCmd = null;
  for (let i = 0; i < skills.length; i+=2) {
    // create skill rep
    let skill = {
      id: skills[i],
      desc: skills[i+1]
    };

    if (skill.id.startsWith('/clear')) {
      clearCmd = skill;
    } else if (skill.id.startsWith('/help')) {
      helpCmd = skill;
    } else {
      slashCommands.push(skill);
    }
  }

  slashCommands.sort((a, b) => {
    return a.id.localeCompare(b.id);
  });

  slashCommands.push(clearCmd);
  slashCommands.push(helpCmd);
}

function getSkills(request, responseFn) {
  let skills = [];

  if (!slashCommands || slashCommands.length === 0) {
    responseFn(skills);
    return;
  }

  let requestTrimmed = request.term ? request.term.trim() : '';
  if (requestTrimmed.length === 0) {
    responseFn(null);
    return;
  }

  slashCommands.forEach(skill => {
    if (skill.id.startsWith(requestTrimmed)) {
      skills.push({label: skill.id, desc: skill.desc});
    }
  });

  responseFn(skills);
}

/* Button template
<button class="miref">
  Hello World
  <i class="addRefBtnCloseImg fa-kit fa-close"></i>
</button> 
*/
function addMessageInputReference(visualId, fileName) {
  let $mireferencesContainer = $('#mireferencesBtnBar');
  let $button = $('<button>', {
    id: visualId,
    text: fileName,
    class: "miref"});
    $button.click(function(event) {
      if (!$(event.target).hasClass("closeIcon")) {
        console.log(event.target);
        processOpenEditorRequest(visualId);
      }
    });
    
  let $ximg = $('<i>', {
    class: "addRefBtnCloseImg fa-kit fa-close"});
  $ximg.click(function(event) {
      event.stopPropagation();
      processRemoveReferenceRequest(visualId);
    });

  $button.append($ximg);
  $mireferencesContainer.append($button);
}

function removeMessageInputReference(visualId) {
  let $button = $('#' + visualId);
  if ($button.length) {
    $button.remove();
  }
}

function removeAllMessageInputReferences() {
  $('#mireferencesBtnBar').empty();
}


function setupMessageInputListeners() {
  messageInput = document.getElementById('messageInput');
  messageInput.addEventListener('keydown', handlePromptPreinput);
  messageInput.addEventListener('input', handlePromptPostinput);
  messageInput.addEventListener('click', function(event) {
    if ( messageInput.textContent.trim() === "" ) {
      messageInput.focus();
    }
  });
  document.getElementById('sendBtn').addEventListener('click', handleSendBtn);

  $('#messageContainer').on('drop', dropFileReference);

  autocompleteSelecting = false;

  $( "#messageInput" ).autocomplete({
    source: getSkills,
    minLength: 1,
    autoFocus: true,
    position: {
      my: "left bottom",
      at: "left top",
      of: "#messageInputForm"
    },
    open: function( event, ui ) {
      autocompleteSelecting = true;
      let inputWidth = $('#messageInput').width() + 30;
      $(".ui-autocomplete").css('width', inputWidth + 'px');
    },
    select: function( event, ui ) {
      event.preventDefault();
      $(this).autocomplete('close');

      messageInput.innerHTML = ui.item.value + " &nbsp;";

      //move cursor to end of input
      let range = document.createRange();
      let sel = window.getSelection();
  
      // Set range to the end of the editable div
      range.selectNodeContents(messageInput); // Select the entire contents
      range.collapse(false); // Collapse the range to the end point, false means end
  
      // Clear any existing selections
      sel.removeAllRanges();
  
      // Add the new range
      sel.addRange(range);
  
      // Focus the editable div to ensure cursor visibility
      messageInput.focus();

      // if (!event.shiftKey) {
      //   handlePromptSubmit(event);
      // }
      
      return false;
    },
    close: function(event, ui) {
      autocompleteSelecting = false;
    }
  }).data( "ui-autocomplete" )
  ._renderItem = function( ul, item ) {
    return $("<li>")
      .append(
        "<div style='display: flex; justify-content: space-between;'>" +
          "<span style='float: left;'>" + item.label + "</span>" +
          "<span style='float: right; color: var(--disabled); font-size: 10px;'>" + item.desc + "</span>" +
        "</div>")
      .appendTo(ul);
  };
}

$(document).ready(setupMessageInputListeners);
