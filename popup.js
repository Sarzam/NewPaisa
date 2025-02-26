
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



// Populating the processed documents from document-finder.js
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

// Handling deduction filters
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

    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('message', 'assistant-message');
    loadingMessage.innerHTML = `<p>Analyzing...</p>`;
    chatMessages.appendChild(loadingMessage);

   
    chrome.runtime.sendMessage({ action: 'askAssistant', question: messageText }, (response) => {
      
      if (response && response.answer) {
        loadingMessage.innerHTML = `<p>${response.answer}</p>`;
      } else {
        loadingMessage.innerHTML = `<p>...</p>`;
      }
    
      // Scrolling to the latest message
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }
});

// ===== Monte Carlo Tax Filing Quiz =====
const taxScenarios = [
  {
    description: "Riya is filing her ITR-1 for FY 2023-24. She has a salary income of Rs. 12,00,000, interest from savings account Rs. 18,000, and FD interest of Rs. 45,000. She has opted for the new tax regime.",
    options: [
      "She cannot file ITR-1 as her total income exceeds Rs. 10,00,000",
      "She needs to pay tax on the entire interest income of Rs. 63,000",
      "She can claim deduction under Section 80TTA for savings account interest",
      "She should file ITR-2 instead of ITR-1"
    ],
    correctOption: 2,
    explanation: "Under the new tax regime, no deduction under Section 80TTA is available for savings account interest. Riya incorrectly assumed she could claim this deduction."
  },
  {
    description: "Rahul purchased a house in May 2023 for Rs. 75,00,000 with a home loan of Rs. 60,00,000. He paid Rs. 4,80,000 as interest for FY 2023-24. He claims full interest as deduction under Section 24.",
    options: [
      "Rahul should claim only Rs. 2,00,000 as deduction",
      "The interest is fully deductible as the property is self-occupied",
      "He should include the principal repayment under Section 80C",
      "He needs to show rental income for the property"
    ],
    correctOption: 0,
    explanation: "For a self-occupied property, the maximum interest deduction under Section 24 is limited to Rs. 2,00,000 per year. Rahul incorrectly claimed the entire interest amount."
  },
  {
    description: "Priya has salary income of Rs. 9,50,000 and capital gains from equity shares of Rs. 1,20,000 (held for 14 months). She paid Rs. 15,000 for health insurance premium for herself and Rs. 35,000 for her parents (both senior citizens). She claims deductions for both under Section 80D.",
    options: [
      "Priya should pay long-term capital gains tax at 20% with indexation",
      "She should claim only Rs. 25,000 for her own health insurance premium",
      "She can claim a maximum of Rs. 50,000 for her parents' health insurance",
      "Her capital gains should be taxed at 15% as short-term gains"
    ],
    correctOption: 3,
    explanation: "Equity shares held for more than 12 months are considered long-term capital assets, and gains are taxed at 10% above Rs. 1 lakh without indexation benefit. The correct tax rate is not 15%, which applies to short-term capital gains."
  },
  {
    description: "Vikram is self-employed with a gross income of Rs. 18,00,000. He invested Rs. 1,50,000 in PPF, paid Rs. 25,000 for life insurance premium, and contributed Rs. 75,000 to NPS. He claims deductions of Rs. 1,50,000 under Section 80C and Rs. 75,000 under Section 80CCD(1B).",
    options: [
      "He cannot claim both PPF and life insurance under 80C",
      "His NPS contribution should be included in the Rs. 1,50,000 limit of 80C",
      "He can claim an additional deduction of Rs. 50,000 for NPS under 80CCD(2)",
      "He is correctly claiming the available deductions"
    ],
    correctOption: 3,
    explanation: "Vikram is correctly claiming Rs. 1,50,000 under Section 80C (for PPF and life insurance) and an additional Rs. 75,000 under Section 80CCD(1B) for NPS contribution, which has a separate limit of Rs. 50,000."
  },
  {
    description: "Neha received HRA of Rs. 3,60,000 for FY 2023-24. She paid a rent of Rs. 35,000 per month in Mumbai. Her basic salary is Rs. 8,40,000. She claims HRA exemption for the entire HRA received.",
    options: [
      "She should claim exemption for only 50% of basic salary",
      "The exemption should be limited to Rs. 2,80,000",
      "She can claim the entire HRA as exempt",
      "She needs to reduce 10% of her basic salary from the HRA exemption"
    ],
    correctOption: 1,
    explanation: "HRA exemption is the minimum of: (1) Actual HRA received (Rs. 3,60,000), (2) 50% of basic salary for metro cities (Rs. 4,20,000), or (3) Actual rent paid minus 10% of basic salary (Rs. 4,20,000 - Rs. 84,000 = Rs. 3,36,000). The minimum is Rs. 3,36,000, not the entire HRA of Rs. 3,60,000."
  },
  {
    description: "Arun made donations of Rs. 10,000 to a registered political party and Rs. 25,000 to PM Relief Fund. He claims 100% deduction for both donations under Section 80G.",
    options: [
      "Political party donation should be claimed under Section 80GGC",
      "PM Relief Fund donation is eligible for only 50% deduction",
      "The total deduction is capped at Rs. 10,000",
      "He is correctly claiming the deductions"
    ],
    correctOption: 0,
    explanation: "Donations to registered political parties should be claimed under Section 80GGC, not 80G. Donations to PM Relief Fund qualify for 100% deduction under Section 80G."
  }
];

// Keeping track of used scenarios to avoid repetition
let usedScenarioIndices = [];

function getRandomScenario() {
  // Reseting if all scenarios have been used
  if (usedScenarioIndices.length === taxScenarios.length) {
    usedScenarioIndices = [];
  }
  
  let index;
  do {
    index = Math.floor(Math.random() * taxScenarios.length);
  } while (usedScenarioIndices.includes(index));
  
  usedScenarioIndices.push(index);
  return taxScenarios[index];
}

function displayScenario() {
  const scenario = getRandomScenario();
  const scenarioDescription = document.getElementById('scenario-description');
  const quizOptions = document.getElementById('quiz-options');
  const quizFeedback = document.getElementById('quiz-feedback');
  const nextButton = document.getElementById('next-scenario');
  
  // Clear previous state
  scenarioDescription.innerHTML = `<p>${scenario.description}</p>`;
  quizOptions.innerHTML = '';
  quizFeedback.innerHTML = '';
  quizFeedback.style.display = 'none';
  quizFeedback.className = 'feedback';
  nextButton.style.display = 'none';
  
  // Add options
  scenario.options.forEach((option, index) => {
    const li = document.createElement('li');
    li.textContent = option;
    li.dataset.index = index;
    li.addEventListener('click', () => checkAnswer(index, scenario.correctOption, scenario.explanation));
    quizOptions.appendChild(li);
  });
}

function checkAnswer(selectedIndex, correctIndex, explanation) {
  const quizOptions = document.getElementById('quiz-options');
  const quizFeedback = document.getElementById('quiz-feedback');
  const nextButton = document.getElementById('next-scenario');
  

  Array.from(quizOptions.children).forEach(li => {
    li.style.pointerEvents = 'none';

    if (parseInt(li.dataset.index) === correctIndex) {
      li.style.backgroundColor = '#c8e6c9'; 
      li.style.borderLeft = '4px solid #4CAF50';
    }
    
    if (parseInt(li.dataset.index) === selectedIndex && selectedIndex !== correctIndex) {
      li.style.backgroundColor = '#ffcdd2'; 
      li.style.borderLeft = '4px solid #e57373';
    }
  });
  
  quizFeedback.style.display = 'block';
  
  if (selectedIndex === correctIndex) {
    quizFeedback.className = 'feedback correct';
    quizFeedback.innerHTML = `<p>Correct! ${explanation}</p>`;
  } else {
    quizFeedback.className = 'feedback incorrect';
    quizFeedback.innerHTML = `<p>Incorrect :(   ${explanation}</p>`;
  }
  
  nextButton.style.display = 'block';
}

// Initializing the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Displaying the first scenario
  displayScenario();
  
  const nextButton = document.getElementById('next-scenario');
  nextButton.addEventListener('click', displayScenario);
});