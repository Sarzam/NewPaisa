
// Handle tab navigation
const tabs = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    tabContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === tab.getAttribute('data-tab')) {
        content.classList.add('active');
      }
    });
  });
});

// Document upload functionality
const fileInput = document.getElementById('file-input');

fileInput.addEventListener('change', (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log(`Uploaded: ${file.name}`);
        // Trigger processing from document.processor.js
        chrome.runtime.sendMessage({ action: 'processDocument', fileData: reader.result });
      };
      reader.readAsDataURL(file);
    });
  }
});



// Populate processed documents from document-finder.js
chrome.runtime.sendMessage({ action: 'getProcessedDocuments' }, (response) => {
  const documentsContainer = document.getElementById('documents-container');
  documentsContainer.innerHTML = '';

  if (response.documents && response.documents.length > 0) {
    response.documents.forEach(doc => {
      const docItem = document.createElement('div');
      docItem.classList.add('document-item');
      docItem.innerHTML = `<p>${doc.name}</p>`;
      documentsContainer.appendChild(docItem);
    });
  } else {
    documentsContainer.innerHTML = '<p>No documents processed yet.</p>';
  }
});

// Handle deduction filters
const deductionCategory = document.getElementById('deduction-category');
deductionCategory.addEventListener('change', (event) => {
  const selectedCategory = event.target.value;
  chrome.runtime.sendMessage({ action: 'filterDeductions', category: selectedCategory }, (response) => {
    const deductionsContainer = document.getElementById('deductions-container');
    deductionsContainer.innerHTML = '';

    if (response.deductions && response.deductions.length > 0) {
      response.deductions.forEach(deduction => {
        const deductionItem = document.createElement('div');
        deductionItem.classList.add('deduction-item');
        deductionItem.innerHTML = `
          <h4>${deduction.name}</h4>
          <p>${deduction.description}</p>
          <span class="deduction-amount">${deduction.amount}</span>
        `;
        deductionsContainer.appendChild(deductionItem);
      });
    } else {
      deductionsContainer.innerHTML = '<p>No deductions found.</p>';
    }
  });
});


// Handle chat with Tax Assistant
const userInput = document.getElementById('user-input');
const sendMessageButton = document.getElementById('send-message');
const chatMessages = document.getElementById('chat-messages');

sendMessageButton.addEventListener('click', () => {
  const messageText = userInput.value.trim();
  if (messageText) {
    // Display user message
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user-message');
    userMessage.innerHTML = `<p>${messageText}</p>`;
    chatMessages.appendChild(userMessage);
    userInput.value = '';

    // Add loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('message', 'assistant-message');
    loadingMessage.innerHTML = `<p>Analyzing...</p>`;
    chatMessages.appendChild(loadingMessage);

    // Send message to Tax Assistant
    chrome.runtime.sendMessage({ action: 'askAssistant', question: messageText }, (response) => {
      // Remove or update the loading message
      if (response && response.answer) {
        loadingMessage.innerHTML = `<p>${response.answer}</p>`;
      } else {
        loadingMessage.innerHTML = `<p>...</p>`;
      }
    
      // Scroll to the latest message
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }
});