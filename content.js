// content.js (Mostly a context file.)
const fieldMappings = {
  'cleartax.in': {
    'form16_employer_name': '#employerName',
    'form16_employer_tan': '#employerTAN',
    'form16_gross_salary': '#grossSalary',
    'form16_tds_deducted': '#tdsDeducted',
    'form16_hra_exemption': '#hraExemption',
    'form16_lta_exemption': '#ltaExemption',
    'form16_professional_tax': '#professionalTax',
    'form16_standard_deduction': '#standardDeduction',
  },
  'incometax.gov.in': {
    'form16_employer_name': '.employer-name-input',
    'form16_employer_tan': '.employer-tan-input',
    'form16_gross_salary': '.gross-salary-input',
    'form16_tds_deducted': '.tds-deducted-input',
    'form16_80c_deductions': '.section-80c-input',
    'form16_80d_deductions': '.section-80d-input',
  },
};
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fillForm') {
      fillFormWithData(message.data, message.formType);
      sendResponse({success: true});
    } else if (message.action === 'detectFormFields') {
      const fields = detectFormFields();
      sendResponse({fields: fields});
    }
    
    return true;
  });
  
  function detectFormFields() {
    const hostname = window.location.hostname;
    let fieldsFound = [];
    
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
  
  function fillFormWithData(data, formType) {
    const hostname = window.location.hostname;
    
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
    
    for (const fieldId in data) {
      const mappedField = `${formType}_${fieldId}`;
      const selector = siteMapping[mappedField];
      
      if (selector) {
        const element = document.querySelector(selector);
        if (element) {
          element.value = data[fieldId];
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          
          highlightField(element);
        }
      }
    }
    
    showNotification(`Successfully filled ${Object.keys(data).length} fields`);
  }
  
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
  /////////////////////////////////////
  function addAssistantButton() {
    const button = document.createElement('button');
    button.textContent = 'NewPaisa Tax Assistant';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.padding = '10px 15px';
    button.style.backgroundColor = '#4CAF50'; 
    button.style.color = 'black';
    button.style.border = 'solid 2px black';
    button.style.borderRadius = '4px';
    button.style.zIndex = '10000';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    button.style.cursor = 'move'; 
    let isDragging = false;
    let offsetX, offsetY;
  
    // Mouse Down event
    button.addEventListener('mousedown', (e) => {
      isDragging = true;
      
      const rect = button.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      e.preventDefault();
    });
  
    // Mouse Move event
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      button.style.right = 'auto';
      button.style.bottom = 'auto';
      button.style.left = `${e.clientX - offsetX}px`;
      button.style.top = `${e.clientY - offsetY}px`;
    });
  
    // Mouse Up event
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  
    // Mouse Click event
    button.addEventListener('click', (e) => {
      if (isDragging) return; // Don't open assistant if we were dragging
      chrome.runtime.sendMessage({action: 'openAssistant'});
    });
    
    document.body.appendChild(button);
  }

  (function init() {
    if (document.readyState === 'complete') {
      addAssistantButton();
    } else {
      window.addEventListener('load', addAssistantButton);
    }
  })();