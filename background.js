// background.js

import DocumentProcessor from './document-processor.js';
import DeductionFinder from './deduction-finder.js';
import TaxAssistant from './tax-assistant.js';

const documentProcessor = new DocumentProcessor();
const deductionFinder = new DeductionFinder();
const taxAssistant = new TaxAssistant('your-api-key-here');


let userContext = {
  taxYear: new Date().getFullYear() - 1, 
  filingStatus: null,
  income: null,
  documents: [],
  deductions: [],
  taxProfile: {}
};
/////////////////////////////////////////////////
// Modern ES modules approach for browser
let model = null;

// Initialize the Gemini AI model
async function initGeminiAI() {
  try {
    const { GoogleGenerativeAI } = await import('https://cdn.jsdelivr.net/npm/@google/generative-ai@0.3.0/dist/browser/index.js'); 
    // there are issues with the import, so I have to use the CDN link.
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    console.log("Gemini AI initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error);
  }
}

initGeminiAI();
////////////////////////////
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  switch (message.action) {
    case 'processDocument':
      handleDocumentProcessing(message.document)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({success: false, error: error.message}));
      break;
      
    case 'findDeductions':
      const deductions = deductionFinder.analyzeDocuments(userContext.documents);
      userContext.deductions = deductions;
      sendResponse({success: true, deductions: deductions});
      break;
      
    case 'askAssistant':
      if (!model) {
        await initGeminiAI();
        if (!model) {
          sendResponse({ answer: "Sorry, I couldn't initialize the AI assistant. Please try again later." });
          break;
        }
      }
      
      try {
        const chatSession = model.startChat({
          generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          },
          history: [],
        });
      
        const result = await chatSession.sendMessage(`Please return an appropriate response to the query - ${message.question}, based on the Indian financial context`);
        sendResponse({ answer: result.response.text() });
        } catch (error) {
        console.error("Error with AI assistant:", error);
        sendResponse({ answer: "Sorry, I encountered an error processing your request." });
        }
      break;
      
    case 'updateUserContext':
      userContext = {...userContext, ...message.data};
      sendResponse({success: true, context: userContext});
      break;
      
    case 'getDocuments':
      sendResponse({success: true, documents: userContext.documents});
      break;
      
    case 'getDeductions':
      sendResponse({success: true, deductions: userContext.deductions});
      break;
      
    case 'fillForm':
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'fillForm',
            data: message.data,
            formType: message.formType
          }, sendResponse);
        } else {
          sendResponse({success: false, error: 'No active tab found'});
        }
      });
      break;
      
    case 'openAssistant':
      chrome.action.openPopup();
      sendResponse({success: true});
      break;
      
    default:
      sendResponse({success: false, error: 'Unknown action'});
  }
  
  return true;
});

// Handle document processing
async function handleDocumentProcessing(document) {
  try {
    const processedDoc = await documentProcessor.processDocument(document);
    userContext.documents.push(processedDoc);
    
    // After processing, automatically analyze for deductions
    const newDeductions = deductionFinder.analyzeDocuments([processedDoc]);
    userContext.deductions = [...userContext.deductions, ...newDeductions];
    
    return {
      success: true, 
      document: processedDoc,
      deductions: newDeductions
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {success: false, error: error.message};
  }
}

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      onboardingComplete: false,
      userPreferences: {
        autoFill: true,
        saveDocuments: true,
        notificationEnabled: true
      }
    });
    
    chrome.tabs.create({
      url: 'onboarding.html'
    });
  }
});