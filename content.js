// content.js - Runs in the context of tax websites

// Map of field selectors for different tax websites
const fieldMappings = {
    'turbotax.com': {
      'w2_employer_name': '#employerName',
      'w2_employer_id': '#employerEIN',
      'w2_wages': '#box1Wages',
      'w2_federal_tax': '#box2FederalTax',
      'w2_social_security_wages': '#box3SocialSecurityWages',
      'w2_social_security_tax': '#box4SocialSecurityTax',
      'w2_medicare_wages': '#box5MedicareWages',
      'w2_medicare_tax': '#box6MedicareTax',
      // Add more field mappings as needed
    },
    'hrblock.com': {
      'w2_employer_name': '.employer-name-input',
      'w2_employer_id': '.employer-ein-input',
      'w2_wages': '.wages-input',
      'w2_federal_tax': '.federal-tax-input',
      // Add more field mappings as needed
    },
    // Add mappings for other tax websites
  };
  
  // Listen for messages from the popup or background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fillForm') {
      fillFormWithData(message.data, message.formType);
      sendResponse({success: true});
    } else if (message.action === 'detectFormFields') {
      const fields = detectFormFields();
      sendResponse({fields: fields});
    }
    
    // Return true to indicate we'll respond asynchronously
    return true;
  });
  
  // Detect what form fields are on the current page
  function detectFormFields() {
    const hostname = window.location.hostname;
    let fieldsFound = [];
    
    // Find which site mapping to use
    let siteMapping = null;
    for (const site in fieldMappings) {
      if (hostname.includes(site)) {
        siteMapping = fieldMappings[site];
        break;
      }
    }
    
    if (!siteMapping) {
      return fieldsFound;
    }
    
    // Check which fields exist on the page
    for (const field in siteMapping) {
      const selector = siteMapping[field];
      const element = document.querySelector(selector);
      if (element) {
        fieldsFound.push({
          id: field,
          selector: selector,
          type: element.type || 'text'
        });
      }
    }
    
    return fieldsFound;
  }
  
  // Fill form with provided data
  function fillFormWithData(data, formType) {
    const hostname = window.location.hostname;
    
    // Find which site mapping to use
    let siteMapping = null;
    for (const site in fieldMappings) {
      if (hostname.includes(site)) {
        siteMapping = fieldMappings[site];
        break;
      }
    }
    
    if (!siteMapping) {
      console.warn('No field mapping found for this website');
      return;
    }
    
    // Fill in the form fields
    for (const fieldId in data) {
      const mappedField = `${formType}_${fieldId}`;
      const selector = siteMapping[mappedField];
      
      if (selector) {
        const element = document.querySelector(selector);
        if (element) {
          // Set value and trigger change event for form validation
          element.value = data[fieldId];
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Highlight the field briefly to show it was filled
          highlightField(element);
        }
      }
    }
    
    // Notify user of completion
    showNotification(`Successfully filled ${Object.keys(data).length} fields`);
  }
  
  // Highlight a field that was filled
  function highlightField(element) {
    const originalBackground = element.style.backgroundColor;
    const originalTransition = element.style.transition;
    
    element.style.transition = 'background-color 1s';
    element.style.backgroundColor = '#e6f7ff';
    
    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
      element.style.transition = originalTransition;
    }, 1000);
  }
  
  // Show a notification to the user
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
  
  // Add a floating assistant button to the page
  function addAssistantButton() {
    const button = document.createElement('button');
    button.textContent = 'Tax Assistant';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.padding = '10px 15px';
    button.style.backgroundColor = '#4285F4';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.zIndex = '10000';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({action: 'openAssistant'});
    });
    
    document.body.appendChild(button);
  }
  
  // Initialize when content script loads
  (function init() {
    // Wait for page to be fully loaded
    if (document.readyState === 'complete') {
      addAssistantButton();
    } else {
      window.addEventListener('load', addAssistantButton);
    }
  })();