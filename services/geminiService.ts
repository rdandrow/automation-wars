
import { GoogleGenAI, Type } from "@google/genai";
import { ValidationResponse, Framework, Scenario } from "../types";

export async function getAutomationHelp(query: string, framework: Framework, scenarioDescription?: string) {
  // Initialize a new GoogleGenAI instance right before the call to ensure it uses the latest configured API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class ${framework} automation expert. Help the user with their question about ${framework}. 
      Context: The user is practicing on an app with the following scenario: ${scenarioDescription || 'General Learning'}.
      
      User Question: ${query}
      
      Provide clear, concise code snippets for ${framework} and explanations. Use Markdown formatting.`,
      config: {
        // Thinking budget added to help the model reason through complex automation scenarios.
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    // response.text is a getter, not a method.
    return response.text || "I'm sorry, I couldn't generate a helpful response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

export async function validateUserSolution(userCode: string, scenario: Scenario, framework: Framework): Promise<ValidationResponse> {
  // Initialize a new GoogleGenAI instance right before the call to ensure it uses the latest configured API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const expectedSnippet = framework === Framework.PLAYWRIGHT ? scenario.playwrightSnippet : scenario.cypressSnippet;
    
    const response = await ai.models.generateContent({
      // Upgraded to gemini-3-pro-preview for more robust code analysis and logic verification.
      model: 'gemini-3-pro-preview',
      contents: `ACT AS A CODE REVIEWER FOR ${framework.toUpperCase()}. 
      Challenge: ${scenario.title}
      Tool: ${framework}
      Description: ${scenario.description}
      Objectives: ${scenario.learningObjectives.join(', ')}
      Reference ${framework} Snippet: ${expectedSnippet}
      
      User's Attempt (${framework}):
      \`\`\`typescript
      ${userCode}
      \`\`\`
      
      Review the user's attempt specifically using ${framework} syntax. 
      1. Is it functionally correct for ${framework}? 
      2. Does it meet all objectives?
      3. Give 2 constructive tips for improvement if needed.
      
      Your output must be JSON.`,
      config: {
        responseMimeType: "application/json",
        // Using a moderate thinking budget to improve validation accuracy.
        thinkingConfig: { thinkingBudget: 2000 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: {
              type: Type.BOOLEAN,
              description: "True if the code is functionally correct for the selected framework and meets objectives."
            },
            feedback: {
              type: Type.STRING,
              description: "Markdown formatted feedback with specific tool-based tips."
            }
          },
          required: ["isCorrect", "feedback"]
        }
      }
    });
    
    // response.text is a getter, not a method.
    return JSON.parse(response.text || '{"isCorrect": false, "feedback": "Failed to parse response."}');
  } catch (error) {
    console.error("Validation Error:", error);
    return {
      isCorrect: false,
      feedback: "Validation service is temporarily unavailable."
    };
  }
}
