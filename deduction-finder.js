// deduction-finder.js

class DeductionFinder {
    constructor() {
      this.deductionRules = [
        {
          id: "home_office",
          category: "business",
          name: "Home Office Deduction",
          description: "Deduction for using part of your home exclusively for business",
          qualifyingConditions: [
            "Self-employed or independent contractor",
            "Dedicated space used regularly and exclusively for business"
          ],
          documentationNeeded: [
            "Home square footage",
            "Office space square footage",
            "Home expenses (mortgage/rent, utilities, etc.)"
          ],
          calculator: this._calculateHomeOffice
        },
        {
          id: "student_loan_interest",
          category: "education",
          name: "Student Loan Interest",
          description: "Deduction for interest paid on qualified student loans",
          qualifyingConditions: [
            "Paid interest on qualified student loan",
            "Income below threshold ($85,000 single, $170,000 joint)"
          ],
          documentationNeeded: [
            "Form 1098-E from loan provider"
          ],
          calculator: this._calculateStudentLoanInterest
        },
        {
          id: "charitable_donation",
          category: "charity",
          name: "Charitable Contributions",
          description: "Deduction for donations to qualified charitable organizations",
          qualifyingConditions: [
            "Donation to qualifying 501(c)(3) organization",
            "Proper documentation for donations over $250"
          ],
          documentationNeeded: [
            "Donation receipts",
            "Bank statements showing donations",
            "Acknowledgment letters for donations over $250"
          ],
          calculator: this._calculateCharitableDeduction
        },
        // More deduction types would be defined here
      ];
      
      this.foundDeductions = [];
    }
    
    analyzeDocuments(documents) {
      this.foundDeductions = [];
      
      // Analyze each document for potential deductions
      for (const document of documents) {
        this._processDocumentForDeductions(document);
      }
      
      return this.foundDeductions;
    }
    
    _processDocumentForDeductions(document) {
      // Process different document types for potential deductions
      switch (document.type) {
        case "W2":
          this._processW2(document);
          break;
        case "BANK_STATEMENT":
          this._processBankStatement(document);
          break;
        case "FORM_1099":
          this._process1099(document);
          break;
        case "RECEIPT":
          this._processReceipt(document);
          break;
        default:
          // Unknown document type
          break;
      }
    }
    
    _processW2(document) {
      // Extract retirement contributions for potential deductions
      const data = document.data;
      
      // Check for retirement contributions
      if (data.retirement_contributions && parseFloat(data.retirement_contributions) > 0) {
        this._addDeduction({
          id: `retirement_${Date.now()}`,
          category: "retirement",
          name: "Retirement Contributions",
          description: "Tax-advantaged retirement account contributions",
          amount: parseFloat(data.retirement_contributions),
          confidence: 0.9,
          sourceDocument: document.id,
          notes: `Found retirement contributions on W-2 from ${data.employer_name}`
        });
      }
    }
    
    _processBankStatement(document) {
      // Example: Look for charitable donations in bank transactions
      const data = document.data;
      
      if (data.transactions) {
        for (const transaction of data.transactions) {
          // Look for potential charitable donations
          if (this._isPotentialCharitableDonation(transaction)) {
            this._addDeduction({
              id: `charity_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              category: "charity",
              name: "Potential Charitable Donation",
              description: "Possible donation to a charitable organization",
              amount: Math.abs(parseFloat(transaction.amount)),
              confidence: 0.7,
              sourceDocument: document.id,
              notes: `Transaction to "${transaction.description}" on ${transaction.date}`
            });
          }
        }
      }
    }
    
    _processReceipt(document) {
      // Example: Check if receipt might be for business expenses
      const data = document.data;
      
      // Check for business expense keywords in items
      if (data.items && this._containsBusinessExpenseKeywords(data.items)) {
        this._addDeduction({
          id: `business_exp_${Date.now()}`,
          category: "business",
          name: "Business Expense",
          description: "Potential business-related expense",
          amount: parseFloat(data.amount),
          confidence: 0.6,
          sourceDocument: document.id,
          notes: `Purchase from ${data.vendor} on ${data.date}`
        });
      }
    }
    
    _process1099(document) {
      // Process 1099 forms for potential deductions
      const data = document.data;
      
      // Example: Check for 1099-MISC with contractor expenses
      if (data.type === "MISC" && this._isContractorExpense(data)) {
        this._addDeduction({
          id: `contractor_${Date.now()}`,
          category: "business",
          name: "Contractor Expense",
          description: "Payments to a contractor for business services",
          amount: parseFloat(data.amount),
          confidence: 0.85,
          sourceDocument: document.id,
          notes: `Payment to ${data.recipient_name} for contract services`
        });
      }
    }
    
    // Helper methods for identifying specific deduction patterns
    
    _isPotentialCharitableDonation(transaction) {
      // Check if transaction description contains charity keywords
      const charityKeywords = [
        "donation", "donate", "charity", "foundation", "nonprofit", "non-profit",
        "church", "temple", "mosque", "synagogue", "relief", "salvation"
      ];
      
      return charityKeywords.some(keyword => 
        transaction.description.toLowerCase().includes(keyword)
      );
    }
    
    _containsBusinessExpenseKeywords(items) {
      // Check if items contain business-related keywords
      const businessKeywords = [
        "office", "software", "computer", "printer", "professional",
        "subscription", "business", "client", "meeting"
      ];
      
      // For simplicity in this example, we'll check if the items string contains any keywords
      return businessKeywords.some(keyword => 
        items.toLowerCase().includes(keyword)
      );
    }
    
    _isContractorExpense(data) {
      // Logic to determine if a 1099 represents a contractor expense
      // This would be more complex in a real implementation
      return true;
    }
    
    _addDeduction(deduction) {
      // Add a found deduction to the list
      this.foundDeductions.push(deduction);
    }
    
    // Calculator methods for different deduction types
    
    _calculateHomeOffice(data) {
      const totalHomeArea = parseFloat(data.totalSquareFootage) || 0;
      const officeArea = parseFloat(data.officeSquareFootage) || 0;
      const totalExpenses = parseFloat(data.totalHomeExpenses) || 0;
      
      if (totalHomeArea <= 0 || officeArea <= 0 || totalExpenses <= 0) {
        return 0;
      }
      
      const percentage = officeArea / totalHomeArea;
      return totalExpenses * percentage;
    }
    
    _calculateStudentLoanInterest(data) {
      // In a real implementation, this would include income phaseout calculations
      return Math.min(parseFloat(data.interestPaid) || 0, 2500);
    }
    
    _calculateCharitableDeduction(data) {
      return parseFloat(data.donationAmount) || 0;
    }
    
    // Public methods for accessing and managing deductions
    
    getAllDeductions() {
      return this.foundDeductions;
    }
    
    getDeductionsByCategory(category) {
      return this.foundDeductions.filter(d => d.category === category);
    }
    
    calculateTotalDeductions() {
      return this.foundDeductions.reduce((total, deduction) => total + deduction.amount, 0);
    }
  }
  
  // Export for use in other modules
  export default DeductionFinder;