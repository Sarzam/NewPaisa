// deduction-finder.js

class DeductionFinder {
  constructor() {
    this.deductionRules = [
      {
        id: "home_office",
        category: "business",
        name: "House Rent Allowance (HRA)",
        description: "Exemption for rent paid for residential accommodation",
        qualifyingConditions: [
          "Salaried employee receiving HRA",
          "Living in rented accommodation",
          "Rent paid exceeds 10% of basic salary"
        ],
        documentationNeeded: [
          "Rent receipts or rent agreement",
          "Landlord PAN for rent > ₹1 lakh per year",
          "Form 12BB from employer"
        ],
        calculator: this._calculateHRA
      },
      {
        id: "education_loan",
        category: "education",
        name: "Education Loan Interest",
        description: "Deduction for interest paid on loan for higher education under Section 80E",
        qualifyingConditions: [
          "Loan taken for higher education of self, spouse or children",
          "Loan from approved financial institution"
        ],
        documentationNeeded: [
          "Interest certificate from loan provider",
          "Course details"
        ],
        calculator: this._calculateEducationLoanInterest
      },
      {
        id: "donations",
        category: "charity",
        name: "Charitable Donations",
        description: "Deduction for donations to approved institutions under Section 80G",
        qualifyingConditions: [
          "Donation to qualifying institutions approved under 80G",
          "Proper documentation for donations"
        ],
        documentationNeeded: [
          "Donation receipts with 80G registration details",
          "Bank statements showing donations"
        ],
        calculator: this._calculateCharitableDeduction
      },
    ];
    
    this.foundDeductions = [];
  }
  
  analyzeDocuments(documents) {
    this.foundDeductions = [];
    
    for (const document of documents) {
      this._processDocumentForDeductions(document);
    }
    
    return this.foundDeductions;
  }
  
  _processDocumentForDeductions(document) {
    switch (document.type) {
      case "FORM16":
        this._processForm16(document);
        break;
      case "BANK_STATEMENT":
        this._processBankStatement(document);
        break;
      case "FORM_16A":
        this._processForm16A(document);
        break;
      case "RECEIPT":
        this._processReceipt(document);
        break;
      default:
        // If document type is unknown.
        break;
    }
  }
  
  _processForm16(document) {
    const data = document.data;
    
    // Checking for Section 80C investments
    if (data.section_80c_investments && parseFloat(data.section_80c_investments) > 0) {
      this._addDeduction({
        id: `section80c_${Date.now()}`,
        category: "investments",
        name: "Section 80C Investments",
        description: "Tax-saving investments under Section 80C",
        amount: Math.min(parseFloat(data.section_80c_investments), 150000), // Kept ₹1.5 lakh limit
        confidence: 0.9,
        sourceDocument: document.id,
        notes: `Found Section 80C investments on Form 16 from ${data.employer_name}`
      });
    }
  }
  
  _processBankStatement(document) {
    // This is a Dummy implementation of looking for charitable donations in bank transactions
    const data = document.data;
    
    if (data.transactions) {
      for (const transaction of data.transactions) {
        // Look for potential charitable donations
        if (this._isPotentialCharitableDonation(transaction)) {
          this._addDeduction({
            id: `charity_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            category: "charity",
            name: "Potential Section 80G Donation",
            description: "Possible donation to a charitable organization under Section 80G",
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
    const data = document.data;
    
    if (data.items && this._containsBusinessExpenseKeywords(data.items)) {
      this._addDeduction({
        id: `business_exp_${Date.now()}`,
        category: "business",
        name: "Professional Expenses",
        description: "Potential professional expenses under Section 80DD",
        amount: parseFloat(data.amount),
        confidence: 0.6,
        sourceDocument: document.id,
        notes: `Purchase from ${data.vendor} on ${data.date}`
      });
    }
  }
  
  _processForm16A(document) {
    const data = document.data;
    
    if (data.tds_deducted && this._isProfessionalIncome(data)) {
      this._addDeduction({
        id: `professional_${Date.now()}`,
        category: "business",
        name: "Professional Income Expense",
        description: "Expenses against professional income under Section 44ADA",
        amount: parseFloat(data.gross_receipts) * 0.5, // 50% presumptive taxation
        confidence: 0.85,
        sourceDocument: document.id,
        notes: `TDS deducted for professional services from ${data.deductor_name}`
      });
    }
  }
  
  _isPotentialCharitableDonation(transaction) {
    const charityKeywords = [
      "donation", "donate", "charity", "foundation", "nonprofit", "non-profit",
      "temple", "gurudwara", "mosque", "relief", "trust", "PM CARES", "seva"
    ];
    
    return charityKeywords.some(keyword => 
      transaction.description.toLowerCase().includes(keyword)
    );
  }
  
  _containsBusinessExpenseKeywords(items) {
    const businessKeywords = [
      "office", "software", "computer", "printer", "professional",
      "subscription", "business", "client", "meeting", "GST"
    ];
    
    return businessKeywords.some(keyword => 
      items.toLowerCase().includes(keyword)
    );
  }
  
  _isProfessionalIncome(data) {
    return true;
  }
  
  _addDeduction(deduction) {
    this.foundDeductions.push(deduction);
  }
  
  // Calculator methods 
  _calculateHRA(data) {
    // According to my research, HRA exemption is minimum of:
    // 1. Actual HRA received
    // 2. Rent paid minus 10% of basic salary
    // 3. 50% of basic salary (metro cities) or 40% (non-metro)
    
    const hraReceived = parseFloat(data.hraReceived) || 0;
    const rentPaid = parseFloat(data.rentPaid) || 0;
    const basicSalary = parseFloat(data.basicSalary) || 0;
    const isMetroCity = data.isMetroCity || false;
    
    if (hraReceived <= 0 || rentPaid <= 0 || basicSalary <= 0) {
      return 0;
    }
    
    const rentMinusTenPercentSalary = rentPaid - (0.1 * basicSalary);
    const salaryPercentage = isMetroCity ? 0.5 * basicSalary : 0.4 * basicSalary;
    
    return Math.min(hraReceived, rentMinusTenPercentSalary, salaryPercentage);
  }
  
  _calculateEducationLoanInterest(data) {
    // Section 80E allows full deduction of interest with no upper limit
    return parseFloat(data.interestPaid) || 0;
  }
  
  _calculateCharitableDeduction(data) {
    const donationAmount = parseFloat(data.donationAmount) || 0;
    const deductionPercentage = data.deductionRate || 0.5; // Setting default deduction rate 50% for middle ground.
    
    return donationAmount * deductionPercentage;
  }
  
  
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


export default DeductionFinder;