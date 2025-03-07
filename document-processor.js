// document-processor.js

class DocumentProcessor {
    constructor() {
      this.processedDocuments = [];
      this.documentTypes = {
        W2: {
          name: "W-2",
          fields: ["employer_name", "employer_id", "employee_ssn", "wages", "federal_income_tax", 
                   "social_security_wages", "social_security_tax", "medicare_wages", "medicare_tax", 
                   "state_wages", "state_income_tax"]
        },
        BANK_STATEMENT: {
          name: "Bank Statement",
          fields: ["account_number", "period_start", "period_end", "starting_balance", 
                   "ending_balance", "transactions"]
        },
        FORM_1099: {
          name: "Form 1099",
          fields: ["payer_name", "payer_id", "recipient_name", "recipient_id", "amount", "type"]
        },
        RECEIPT: {
          name: "Receipt",
          fields: ["vendor", "date", "amount", "items", "payment_method"]
        }
      };
    }
  
    async processDocument(file) {
      try {
        const base64Data = await this._fileToBase64(file);
        const textContent = await this._performOCR(base64Data);
        
        const docType = this._detectDocumentType(textContent);
        
        const extractedData = this._extractDataByType(textContent, docType);
        
        const processedDoc = {  
          id: Date.now().toString(),
          filename: file.name,
          type: docType,
          data: extractedData,
          rawText: textContent,
          dateProcessed: new Date().toISOString()
        };
        
        this.processedDocuments.push(processedDoc);
        return processedDoc;
      } catch (error) {
        console.error("Error processing document:", error);
        throw error;
      }
    }
    //work in progress
    _fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
      });
    }
    
    async _performOCR(base64Data) {
      /*
      const response = await fetch('https://api.ocr-service.com/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({ image: base64Data })
      });
      
      if (!response.ok) {
        throw new Error('OCR processing failed');
      }
      
      const result = await response.json();
      return result.text;
      */
      
      // This is just Dummy code, I plan to link a cloud based OCR service.
      return new Promise(resolve => {
        setTimeout(() => {
          resolve("SIMULATED OCR TEXT CONTENT FOR TAX DOCUMENT");
        }, 1000);
      });
    }
    
    _detectDocumentType(textContent) {
      // This would contain logic to identify document type based on content patterns
      // For example, looking for "W-2" or "Wage and Tax Statement"
      
      // Simplified example:
      if (textContent.includes("W-2") || textContent.includes("Wage and Tax Statement")) {
        return "W2";
      } else if (textContent.includes("1099")) {
        return "FORM_1099";
      } else if (textContent.includes("Statement") && 
                (textContent.includes("Bank") || textContent.includes("Account"))) {
        return "BANK_STATEMENT";
      } else {
        return "RECEIPT";
      }
    }
    
    _extractDataByType(textContent, docType) {
      
      // This is also a dummy inplementation for the prototypes sake.
      const typeConfig = this.documentTypes[docType];
      const extractedData = {};

      typeConfig.fields.forEach(field => {
        extractedData[field] = "";
      });
      
      if (docType === "W2") {
        extractedData.employer_name = "Example Corp";
        extractedData.wages = "50000.00";
        extractedData.federal_income_tax = "8000.00";
      }
      
      return extractedData;
    }
    
    getAllDocuments() {
      return this.processedDocuments;
    }
    
    getDocumentById(id) {
      return this.processedDocuments.find(doc => doc.id === id);
    }
    
    deleteDocument(id) {
      const index = this.processedDocuments.findIndex(doc => doc.id === id);
      if (index !== -1) {
        this.processedDocuments.splice(index, 1);
        return true;
      }
      return false;
    }
  }
  
  
  export default DocumentProcessor;