import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a professional quotation in JSON format using OpenAI for Template 2 (Consulting Style).
 * @param {Object} data - Project details (projectType, industry, budget)
 * @returns {Promise<Object>} The generated JSON quotation.
 */
export const generateQuotationJSONTemplate2 = async (data) => {
    const featuresHint = (data.keyFeatures || []).length > 0
        ? `Key features discussed: ${data.keyFeatures.join(', ')}`
        : '';

    const prompt = `You are a Senior Technical Consultant at a top-tier consulting firm (like McKinsey, Deloitte, or BCG).
Your task is to generate a structured, enterprise-grade project proposal and quotation in JSON format.
The tone must be professional, clear, structured, and focused on value and solutions.
AVOID marketing hype (e.g., "This amazing system will revolutionize your business").
KEEP paragraphs short and business-oriented and use bullet points where possible.

STRICT SCHEMA (Return ONLY this JSON):
{
  "projectName": "Professional Project Title",
  "clientName": "Client Name",
  "introduction": "Executive summary paragraph explaining the project purpose, value proposition, and solution at a high level. Keep it professional and structured.",
  "keyModules": [
    { 
      "title": "Module Name", 
      "description": "Short, professional description of the module.",
      "features": ["Feature 1", "Feature 2", "Feature 3"] 
    }
  ],
  "techStack": {
    "frontend": ["React JS", "Next JS"],
    "backend": ["Node JS", "Express JS"],
    "database": ["MongoDB", "MySQL"],
    "cloud": ["AWS", "Digital Ocean"],
    "devops": ["CI/CD", "NGINX", "SSL"]
  },
  "deliveryScope": [
    "UI/UX design",
    "Android app",
    "iOS app",
    "Backend APIs",
    "Admin panel",
    "Database architecture",
    "Deployment and Cloud setup"
  ],
  "timeline": [
    { "phase": "Discovery & Architecture", "duration": "2 Weeks", "deliverables": "Architecture Document, Wireframes" },
    { "phase": "Sprint 1: Core Development", "duration": "4 Weeks", "deliverables": "Backend APIs, Database, Core UI" }
  ],
  "costEstimation": {
    "totalCost": "₹X,XX,XXX",
    "paymentPlan": [
      { "milestone": "Project Kickoff (Advance)", "percentage": "40%", "amount": "₹X,XX,XXX" },
      { "milestone": "UAT Delivery", "percentage": "40%", "amount": "₹X,XX,XXX" },
      { "milestone": "Go-Live / Handover", "percentage": "20%", "amount": "₹X,XX,XXX" }
    ]
  },
  "proposedTeam": [
    { "role": "Project Manager", "count": 1 },
    { "role": "UI/UX Designer", "count": 1 },
    { "role": "Frontend Developer", "count": 2 },
    { "role": "Backend Developer", "count": 2 },
    { "role": "QA Tester", "count": 1 },
    { "role": "DevOps Engineer", "count": 1 }
  ],
  "amc": "Post-warranty Annual Maintenance Contract details. typically 15-20% of project cost.",
  "sla": {
    "responseTimes": ["Critical Issue: 1 hour", "High Priority: 4 hours", "Standard: 24 hours"],
    "resolutionTimes": ["Critical Issue: 4-8 hours", "High Priority: 24-48 hours", "Standard: 3-5 business days"],
    "maintenanceCoverage": "Includes server monitoring, scaling adjustments, and security patches."
  },
  "changeRequest": "Any new feature or change in scope will undergo a Change Request (CR) process. It will be estimated separately for time and cost before execution.",
  "acceptanceCriteria": [
    "Completion of all functional modules as per agreed scope.",
    "Successful User Acceptance Testing (UAT) sign-off.",
    "Deployment to the production environment."
  ],
  "warranty": "3-month code warranty post go-live, covering bug fixes and critical security patches exclusively for the delivered scope.",
  "legal": "This proposal is valid for 30 days. All intellectual property (IP) rights of the custom developed code will transfer to the client upon full payment. The governing law shall be as per the jurisdiction of the service provider."
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
1. Provide 5-8 comprehensive Key Modules.
2. Under Proposed Team, provide realistic numbers based on project size.
3. Tailor the Tech Stack completely to the specific problem, but maintain the categories.
4. Ensure the SLA response and resolution times are realistic.
5. Provide actual estimates in 'CostEstimation' if the budget is provided, otherwise formulate realistic consulting figures. Include standard Indian currency format (e.g. ₹15,00,000).
6. Output raw JSON only with no markdown wrapping.
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.5, // slightly lower for more deterministic consulting tone
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("Error generating Template 2 quotation with OpenAI:", error);
        throw new Error("Failed to generate quotation content.");
    }
};
