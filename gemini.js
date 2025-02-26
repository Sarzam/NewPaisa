const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
//   const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI("AIzaSyCfpBRngblwdsha-NGphdCOLkWPPt8wUsA");
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  
  async function run() {
    const chatSession = model.startChat({
      generationConfig,
      history: [
      ],
    });
  
    const result = await chatSession.sendMessage("Please suggest what I should have for breakfast?");
    console.log(result.response.text());
    
  }
  
  run();