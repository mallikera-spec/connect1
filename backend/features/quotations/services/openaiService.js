import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a professional quotation in JSON format using OpenAI.
 * @param {Object} data - Project details (projectType, industry, budget)
 * @returns {Promise<Object>} The generated JSON quotation.
 */
export const generateQuotationJSON = async (data) => {
    const featuresHint = (data.keyFeatures || []).length > 0
        ? `Key features discussed: ${data.keyFeatures.join(', ')}`
        : '';

    const prompt = `You are a senior solution architect preparing a comprehensive, high-stakes client proposal.
Your task is to generate a detailed, professional quotation in JSON format. 

STRICT SCHEMA (Return ONLY this JSON):
{
  "projectName": "Catchy 2-3 word project title",
  "clientName": "Client Name",
  "industry": "Industry",
  "projectType": "Solution Type",
  "overview": ["12-15 high-level value-driven bullet points"],
  "problemStatement": "Concise summary of the client's pain points",
  "scope": ["12-15 technical scope bullet points"],
  "methodology": ["12-15 bullet points explaining the agile/dev process"],
  "security": ["12-15 bullet points on data protection, auth, and encryption"],
  "assumptions": ["12-15 project assumptions"],
  "constraints": ["12-15 technical or business constraints"],
  "features": [
    { 
      "module": "Module Name", 
      "description": "One-line descriptive value proposition of this module",
      "items": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"] 
    }
  ],
  "techStack": ["Specific technology 1", "Specific technology 2", "Infrastructure detail"],
  "timeline": [
    { "phase": "Discovery & Strategy", "duration": "2 weeks", "tasks": ["Stakeholder workshops", "Technical architecture"] },
    { "phase": "UI/UX Design Phase", "duration": "3 weeks", "tasks": ["High-fidelity wireframes", "Interactive prototype"] },
    { "phase": "Core Infrastructure Setup", "duration": "2 weeks", "tasks": ["Cloud provisioning", "Database schema"] },
    { "phase": "Development Sprint 1", "duration": "3 weeks", "tasks": ["Component 1", "Component 2"] },
    { "phase": "Development Sprint 2", "duration": "3 weeks", "tasks": ["Component 3", "Component 4"] },
    { "phase": "Development Sprint 3", "duration": "3 weeks", "tasks": ["Component 5", "Component 6"] },
    { "phase": "Integration & API Flow", "duration": "2 weeks", "tasks": ["Third-party sync", "Security audit"] },
    { "phase": "QA & UAT Testing", "duration": "2 weeks", "tasks": ["Bug resolution", "Client verification"] },
    { "phase": "Deployment & Go-Live", "duration": "1 week", "tasks": ["Production launch", "Post-deployment support"] }
  ],
  "commercialEstimate": "₹X,XX,XXX – ₹X,XX,XXX INR",
  "paymentPlan": ["40% Advance on Kickoff", "30% on Alpha Release", "20% on Beta Launch", "10% on Final Handover"],
  "visuals": {
    "diagrams": [
      { "type": "flowchart", "title": "System Architecture", "mermaid": "graph TD; LB[\"Load Balancer\"]-->AS[\"App Server\"]; AS-->DB[\"Primary DB\"]" },
      { "type": "flowchart", "title": "Enterprise Data Model", "mermaid": "graph TD; U[\"User\"]-->O[\"Order\"]; O-->P[\"Product\"]" },
      { "type": "flowchart", "title": "Authentication Flow", "mermaid": "graph LR; L[\"Login\"]-->V[\"Verify\"]-->S[\"Success\"]" },
      { "type": "flowchart", "title": "CI/CD Pipeline", "mermaid": "graph LR; G[\"Git\"]-->B[\"Build\"]-->T[\"Test\"]-->D[\"Deploy\"]" }
    ],
    "userFlows": [
      { "type": "flowchart", "title": "Customer Onboarding Flow", "mermaid": "graph LR; S[\"Signup\"]-->E[\"Email Verify\"]-->P[\"Profile Setup\"]" },
      { "type": "flowchart", "title": "Core Checkout Process", "mermaid": "graph TD; C[\"Cart\"]-->A[\"Address\"]-->P[\"Payment\"]-->S[\"Success\"]" },
      { "type": "flowchart", "title": "Admin Management Loop", "mermaid": "graph TD; D[\"Dashboard\"]-->U[\"User List\"]-->E[\"Edit\"]-->S[\"Save\"]" },
      { "type": "flowchart", "title": "Support Ticket Lifecycle", "mermaid": "graph LR; O[\"Open\"]-->A[\"Assign\"]-->R[\"Resolve\"]-->C[\"Close\"]" }
    ],
    "analytics": [
      { "type": "pie", "title": "Budget Allocation", "data": { "labels": ["Dev", "Design", "QA", "Infra"], "values": [45, 20, 20, 15] } },
      { "type": "bar", "title": "Resource Roadmap", "data": { "labels": ["Designers", "Devs", "QA", "DevOps"], "values": [2, 6, 3, 2] } }
    ]
  }
}

CLIENT BRIEF:
- Client: ${data.clientName || 'Confidential Client'}
- Industry: ${data.industry}
- Solution: ${Array.isArray(data.projectType) ? data.projectType.join(', ') : data.projectType}
- Problem to solve: ${data.problemStatement || 'Not specified'}
- ${featuresHint}
- Target users: ${data.targetAudience || 'Not specified'}
- Budget: ${data.budget || 'Not specified'}
- Desired timeline: ${data.timeline || 'Not specified'}

RULES:
1. EXTREME CONTENT DENSITY: Every array (overview, scope, methodology, security, assumptions, constraints) must have at least 15 HIGHLY DETAILED bullet points.
2. FILL THE PAGES: Be extremely descriptive. Every bullet must be a full technical/business insight.
3. ARCHITECTURAL DEPTH: Use 15-20 nodes per diagram. Use branching logic.
4. QUANTITY: 
   - Diagrams: EXACTLY 4 architectural + 4 user flows.
   - Roadmap: EXACTLY 8-10 distinct agile phases to fill the timeline page.
5. MODULES: Provide 6-8 comprehensive feature modules.
6. ARGOMSOB STACK: React (Vite), Node.js, Supabase, Razorpay, AWS.
7. NO GST INCLUDED: Mention "Exclusive of GST @ 18%".
8. MERMAID: Use ID["Label Text"] syntax. graph TD or LR only.
9. NO EXTRA TEXT: Return pure JSON.
`;



    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Using gpt-4o for high quality architectural output
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("Error generating quotation with OpenAI:", error);
        throw new Error("Failed to generate quotation content.");
    }
};
