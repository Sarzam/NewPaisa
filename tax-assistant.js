// tax-assistant.js

class TaxAssistant {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.conversationHistory = [];
      this.taxKnowledge = {
        standardDeduction: {
          '2022': {
            single: 12950,
            married_joint: 25900,
            head_of_household: 19400,
            married_separate: 12950
          },
          '2023': {
            single: 13850,
            married_joint: 27700,
            head_of_household: 20800,
            married_separate: 13850
          },
          '2024': {
            single: 14200,
            married_joint: 28400,
            head_of_household: 21300,
            married_separate: 14200
          }
        },
        taxBrackets: {
          '2023': {
            single: [
              { rate: 0.10, upTo: 11000 },
              { rate: 0.12, upTo: 44725 },
              { rate: 0.22, upTo: 95375 },
              { rate: 0.24, upTo: 182100 },
              { rate: 0.32, upTo: 231250 },
              { rate: 0.35, upTo: 578125 },
              { rate: 0.37, upTo: Infinity }
            ],
            // Other filing statuses would be defined similarly
          }
        },
        commonDeductions: [
          {
            id: "student_loan_interest",
            name: "Student Loan Interest Deduction",
            description: "Deduct up to $2,500 of student loan interest paid during the year",
            qualifications: "Income must be below $85,000 (single) or $175,000 (married filing jointly)"
          },
          {
            id: "mortgage_interest",
            name: "Mortgage Interest Deduction",
            description: "Deduct interest paid on mortgage debt up to $750,000",
            qualifications: "Must be for a qualified residence (primary or secondary home)"
          },
          {
            id: "retirement_contributions",
            name: "Retirement Contributions",
            description: "Contributions to traditional IRAs, 401(k)s, and other qualified retirement plans",
            qualifications: "Maximum contributions limited by plan type and income"
          }
          // More deductions would be defined here
        ],
        commonCredits: [
          {
            id: "child_tax_credit",
            name: "Child Tax Credit",
            description: "Credit for qualifying dependents under age 17",
            amount: "Up to $2,000 per qualifying child"
          },
          {
            id: "earned_income_credit",
            name: "Earned Income Tax Credit",
            description: "Credit for low to moderate income workers",
            amount: "Varies based on income and number of qualifying children"
          }
          // More credits would be defined here
        ]
      };
    }
    
    async processUserQuery(query, userContext = {}) {
      // Add message to conversation history
      this.conversationHistory.push({
        role: "user",
        content: query
      });
      
      try {
        // Classify the query intent
        const intent = this._classifyQueryIntent(query);
        
        // Generate a response based on the intent
        let response;
        
        switch (intent) {
          case "deduction_question":
            response = this._handleDeductionQuestion(query, userContext);
            break;
          case "credit_question":
            response = this._handleCreditQuestion(query, userContext);
            break;
          case "filing_status_question":
            response = this._handleFilingStatusQuestion(query, userContext);
            break;
          case "calculation_question":
            response = this._handleCalculationQuestion(query, userContext);
            break;
          case "deadline_question":
            response = this._handleDeadlineQuestion(query);
            break;
          case "general_question":
          default:
            // For general questions, use the AI API
            response = await this._getAIResponse(query, userContext);
            break;
        }
        
        // Add response to conversation history
        this.conversationHistory.push({
          role: "assistant",
          content: response
        });
        
        return response;
      } catch (error) {
        console.error("Error processing query:", error);
        return "I'm sorry, I encountered an error while processing your question. Please try again.";
      }
    }
    
    _classifyQueryIntent(query) {
      // A simple rule-based classifier - in a real implementation, this would be more sophisticated
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes("deduction") || lowerQuery.includes("write off") || 
          lowerQuery.includes("write-off") || lowerQuery.includes("expense")) {
        return "deduction_question";
      } else if (lowerQuery.includes("credit") || lowerQuery.includes("rebate")) {
        return "credit_question";
      } else if (lowerQuery.includes("filing status") || lowerQuery.includes("file as") ||
                lowerQuery.includes("head of household") || lowerQuery.includes("joint") ||
                lowerQuery.includes("married") || lowerQuery.includes("single")) {
        return "filing_status_question";
      } else if (lowerQuery.includes("calculate") || lowerQuery.includes("computation") || lowerQuery.includes("compute") ||
                lowerQuery.includes("how much") || lowerQuery.includes("tax bracket")) {
        return "calculation_question";
      } else if (lowerQuery.includes("deadline") || lowerQuery.includes("due date") ||
                lowerQuery.includes("extension")) {
        return "deadline_question";
      } else {
        return "general_question";
      }
    }
    
    _handleDeductionQuestion(query, userContext) {
      // Find relevant deductions based on the query
      const matchingDeductions = this._findRelevantDeductions(query);
      
      if (matchingDeductions.length === 0) {
        return "I couldn't find specific information about that deduction. Would you like to know about common tax deductions instead?";
      }
      
      // Format the response
      let response = "Here's what I found about that deduction:\n\n";
      for (const deduction of matchingDeductions) {
        response += `**${deduction.name}**\n${deduction.description}\n`;
        response += `**Qualifications:** ${deduction.qualifications}\n\n`;
      }
      
      // Add personalized advice if context is available
      if (userContext.income) {
        response += this._getPersonalizedDeductionAdvice(matchingDeductions[0].id, userContext);
      }
      
      return response;
    }
    
    _handleCreditQuestion(query, userContext) {
      // Similar to deduction handler, but for tax credits
      const matchingCredits = this._findRelevantCredits(query);
      
      if (matchingCredits.length === 0) {
        return "I couldn't find specific information about that tax credit. Would you like to know about common tax credits instead?";
      }
      
      let response = "Here's what I found about that tax credit:\n\n";
      for (const credit of matchingCredits) {
        response += `**${credit.name}**\n${credit.description}\n`;
        response += `**Amount:** ${credit.amount}\n\n`;
      }
      
      return response;
    }
    
    _handleFilingStatusQuestion(query, userContext) {
      // Recommend filing status based on user context
      if (!userContext.maritalStatus) {
        return "Your filing status affects your tax rates and eligibility for certain deductions and credits. " +
               "The main filing statuses are: Single, Married Filing Jointly, Married Filing Separately, " +
               "Head of Household, and Qualifying Widow(er). Would you like to tell me more about your situation " +
               "so I can suggest the best filing status for you?";
      }
      
      // Simple logic for recommendation - would be more complex in reality
      if (userContext.maritalStatus === "married") {
        return "Based on your information, **Married Filing Jointly** might be the most beneficial filing status for you. " +
               "This typically results in a lower tax liability compared to filing separately. However, there are " +
               "specific situations where filing separately might be better, such as if one spouse has significant " +
               "medical expenses, student loans, or income-based repayment plans.";
      } else if (userContext.maritalStatus === "single" && userContext.dependents > 0) {
        return "You might qualify for **Head of Household** filing status, which generally provides better tax rates " +
               "and a higher standard deduction than filing as Single. To qualify, you must be unmarried, pay more than " +
               "half the cost of keeping up a home, and have a qualifying dependent living with you for more than half the year.";
      } else {
        return "Based on your information, you would likely file as **Single**. If you have dependents or other special " +
               "circumstances, you might qualify for Head of Household status, which would give you better tax benefits.";
      }
    }
    
    _handleCalculationQuestion(query, userContext) {
      // Perform tax calculations based on available context
      if (!userContext.income || !userContext.filingStatus || !userContext.taxYear) {
        return "To calculate your taxes, I'll need to know your income, filing status, and tax year. " +
               "Would you like to provide this information?";
      }
      
      // Get standard deduction for the filing status and year
      const standardDeduction = this.taxKnowledge.standardDeduction[userContext.taxYear][userContext.filingStatus];
      
      // Calculate taxable income
      const taxableIncome = Math.max(0, userContext.income - standardDeduction);
      
      // Calculate tax based on brackets
      const tax = this._calculateTaxFromBrackets(taxableIncome, userContext.filingStatus, userContext.taxYear);
      
      // Format the response
      return `Based on your information (income of $${userContext.income.toLocaleString()} for ${userContext.taxYear}` +
             ` as ${userContext.filingStatus.replace('_', ' ')}), here's a basic tax estimate:\n\n` +
             `- Standard Deduction: $${standardDeduction.toLocaleString()}\n` +
             `- Taxable Income: $${taxableIncome.toLocaleString()}\n` +
             `- Estimated Federal Income Tax: $${tax.toLocaleString()}\n\n` +
             `This is a simplified calculation that doesn't account for credits, additional deductions, or other factors. ` +
             `For a more accurate calculation, you would need to provide additional information about your specific situation.`;
    }
    
    _handleDeadlineQuestion(query) {
      // Provide information about tax deadlines
      const currentYear = new Date().getFullYear();
      
      return `The standard tax filing deadline is April 15th. For the ${currentYear} tax year (filing in ${currentYear + 1}), ` +
             `the deadline would typically be April 15, ${currentYear + 1}, unless that date falls on a weekend or holiday.\n\n` +
             `If you need more time, you can request an automatic extension until October 15th. However, an extension to file ` +
             `is not an extension to pay - you still need to estimate and pay any taxes due by the April deadline to avoid penalties.`;
    }
    
    async _getAIResponse(query, userContext) {
      // For sophisticated responses, this would call an AI API with the query and context
      // For this example, we'll simulate some predefined responses
      
      // This would be replaced with an actual API call in a real implementation
      /*
      const apiResponse = await fetch('https://api.ai-service.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'tax-assistant-model',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful tax assistant. Provide accurate, concise information about US taxes.'
            },
            ...this.conversationHistory,
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 500
        })
      });
      
      const result = await apiResponse.json();
      return result.choices[0].message.content;
      */
      
      // Simulated response for the example
      return "I'm your AI tax assistant. I can help answer tax questions, find potential deductions, " +
             "and guide you through the tax filing process. For this specific question, I would need " +
             "to analyze your financial information more thoroughly. Would you like to upload relevant " +
             "tax documents so I can provide more personalized assistance?";
    }
    
    _findRelevantDeductions(query) {
      // Simple keyword matching - a real implementation would use more sophisticated NLP
      const lowerQuery = query.toLowerCase();
      return this.taxKnowledge.commonDeductions.filter(deduction => {
        return lowerQuery.includes(deduction.id) || 
               lowerQuery.includes(deduction.name.toLowerCase()) || 
               deduction.description.toLowerCase().split(' ').some(word => lowerQuery.includes(word));
      });
    }
    
    _findRelevantCredits(query) {
      // Similar to deduction matching, but for credits
      const lowerQuery = query.toLowerCase();
      return this.taxKnowledge.commonCredits.filter(credit => {
        return lowerQuery.includes(credit.id) || 
               lowerQuery.includes(credit.name.toLowerCase()) || 
               credit.description.toLowerCase().split(' ').some(word => lowerQuery.includes(word));
      });
    }
    
    _getPersonalizedDeductionAdvice(deductionId, userContext) {
      // Provide personalized advice based on user context
      switch (deductionId) {
        case "student_loan_interest":
          if (userContext.income > 85000 && userContext.filingStatus === "single") {
            return "Based on your income, you may be partially or fully phased out of the student loan interest deduction. For single filers, the deduction starts phasing out at $70,000 and is eliminated at $85,000.";
          }
          break;
        case "mortgage_interest":
          if (userContext.mortgageBalance > 750000) {
            return "Since your mortgage balance exceeds $750,000, note that only interest on the first $750,000 of mortgage debt is deductible for loans taken out after December 15, 2017.";
          }
          break;
        // Add more personalized advice cases
      }
      
      return "";
    }
    
    _calculateTaxFromBrackets(taxableIncome, filingStatus, taxYear) {
      // Get the appropriate tax brackets
      const brackets = this.taxKnowledge.taxBrackets[taxYear][filingStatus];
      
      // Calculate tax progressively through each bracket
      let tax = 0;
      let remainingIncome = taxableIncome;
      let previousBracketLimit = 0;
      
      for (const bracket of brackets) {
        const incomeInBracket = Math.min(remainingIncome, bracket.upTo - previousBracketLimit);
        
        if (incomeInBracket <= 0) {
          break;
        }
        
        tax += incomeInBracket * bracket.rate;
        remainingIncome -= incomeInBracket;
        previousBracketLimit = bracket.upTo;
      }
      
      return Math.round(tax);
    }
    
    // Public methods for managing conversation and user context
    
    clearConversationHistory() {
      this.conversationHistory = [];
    }
    
    getConversationHistory() {
      return this.conversationHistory;
    }
  }
  
  // Export for use in other modules
  export default TaxAssistant;