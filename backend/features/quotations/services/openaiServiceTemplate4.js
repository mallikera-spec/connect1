import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a professional quotation in JSON format using OpenAI for Template 4 (Cost Breakdown).
 * @param {Object} data - Project details (projectType, industry, budget, includeGST)
 * @returns {Promise<Object>} The generated JSON quotation.
 */
export const generateQuotationJSONTemplate4 = async (data) => {
  const featuresHint = (data.keyFeatures || []).length > 0
    ? `CRITICAL REQUIREMENT: These specific features MUST be included in the 'features' section of the quotation: ${data.keyFeatures.join(', ')}. Do not miss or omit any of them.`
    : '';

  const gstInstruction = data.includeGST
    ? `INCLUDE GST: Add 18% GST to the totalCost. The "totalCost" field should be the SUBTOTAL (before GST). Add a separate "gstAmount" field with the 18% GST value and a "grandTotal" field with the final amount inclusive of GST. Format all amounts in Indian currency (₹).`
    : `NO GST INCLUDED: Mention "Exclusive of GST @ 18%" in the cost section.`;

  const prompt = `You are a Senior Technical Consultant at a top-tier consulting firm (like McKinsey, Deloitte, or BCG).
Your task is to generate a structured, enterprise-grade project proposal and quotation in JSON format.
The tone must be professional, clear, structured, and focused on value and solutions.
AVOID marketing hype. KEEP paragraphs short and business-oriented.

STRICT SCHEMA (Return ONLY this JSON):
{
  "projectName": "Professional Project Title",
  "clientName": "Client Name",
  "introduction": "Executive summary paragraph explaining the project purpose, value proposition, and solution at a high level.",
  "features": [
    { 
      "module": "Module Name", 
      "description": "One-line descriptive value proposition of this module",
      "items": [
        "Feature Name 1: First line of explanation.\\\\nSecond line of explanation.", 
        "Feature Name 2: First line of explanation.\\\\nSecond line of explanation."
      ] 
    }
  ],
  "techStack": {
    "frontend": ["React", "Vite", "TailwindCSS"],
    "backend": ["Node JS", "Express JS"],
    "database": ["Supabase", "PostgreSQL"],
    "cloud": ["AWS", "Digital Ocean"],
    "devops": ["CI/CD", "GitHub Actions", "NGINX", "SSL"]
  },
  "deliveryScope": [
    "UI/UX design",
    "Frontend Development",
    "Backend APIs",
    "Admin panel",
    "Database architecture",
    "Testing & QA",
    "Deployment and Cloud setup"
  ],
  "costBreakdown": [
    {
      "category": "UI/UX Design",
      "description": "Wireframes, prototyping, design system, user flows, high-fidelity mockups",
      "hoursEstimated": 80,
      "ratePerHour": "₹1,500",
      "cost": "₹1,20,000"
    },
    {
      "category": "Frontend Development",
      "description": "Component development, responsive UI, state management, routing",
      "hoursEstimated": 120,
      "ratePerHour": "₹1,500",
      "cost": "₹1,80,000"
    },
    {
      "category": "Backend Development",
      "description": "REST APIs, business logic, authentication, authorization, integrations",
      "hoursEstimated": 140,
      "ratePerHour": "₹1,500",
      "cost": "₹2,10,000"
    },
    {
      "category": "Database Design & Setup",
      "description": "Schema design, migrations, indexing, optimization, seed data",
      "hoursEstimated": 40,
      "ratePerHour": "₹1,500",
      "cost": "₹60,000"
    },
    {
      "category": "Testing & QA",
      "description": "Unit testing, integration testing, UAT, regression, performance testing",
      "hoursEstimated": 60,
      "ratePerHour": "₹1,200",
      "cost": "₹72,000"
    },
    {
      "category": "Deployment & Cloud Setup",
      "description": "Server provisioning, SSL, domain setup, cloud infrastructure configuration",
      "hoursEstimated": 20,
      "ratePerHour": "₹1,500",
      "cost": "₹30,000"
    },
    {
      "category": "DevOps & CI/CD",
      "description": "GitHub Actions pipelines, automated builds, deployment automation, monitoring",
      "hoursEstimated": 25,
      "ratePerHour": "₹1,500",
      "cost": "₹37,500"
    },
    {
      "category": "Project Management",
      "description": "Sprint planning, daily stand-ups, client demos, progress reporting",
      "hoursEstimated": 40,
      "ratePerHour": "₹1,200",
      "cost": "₹48,000"
    },
    {
      "category": "Documentation",
      "description": "API documentation, user guides, technical specs, handover docs",
      "hoursEstimated": 20,
      "ratePerHour": "₹1,000",
      "cost": "₹20,000"
    },
    {
      "category": "Data Migration",
      "description": "Legacy data extraction, transformation, loading, validation",
      "hoursEstimated": 30,
      "ratePerHour": "₹1,500",
      "cost": "₹45,000"
    },
    {
      "category": "Security & Compliance",
      "description": "OWASP compliance, security audit, penetration testing, encryption setup",
      "hoursEstimated": 20,
      "ratePerHour": "₹1,500",
      "cost": "₹30,000"
    },
    {
      "category": "3rd Party Integrations",
      "description": "Payment gateway, SMS, email service, analytics, maps integration",
      "hoursEstimated": 30,
      "ratePerHour": "₹1,500",
      "cost": "₹45,000"
    }
  ],
  "costEstimation": {
    "totalCost": "₹X,XX,XXX",
    "gstAmount": "₹X,XX,XXX (if GST included)",
    "grandTotal": "₹X,XX,XXX (if GST included)",
    "paymentPlan": [
      { "milestone": "Project Kickoff (Advance)", "percentage": "40%", "amount": "₹X,XX,XXX" },
      { "milestone": "UAT Delivery", "percentage": "40%", "amount": "₹X,XX,XXX" },
      { "milestone": "Go-Live / Handover", "percentage": "20%", "amount": "₹X,XX,XXX" }
    ]
  },
  "timeline": [
    { "phase": "Discovery & Strategy", "duration": "2 Weeks", "deliverables": "Stakeholder workshops, Technical architecture document, Wireframes" },
    { "phase": "UI/UX Design Phase", "duration": "3 Weeks", "deliverables": "High-fidelity wireframes, Interactive prototype, Design system" },
    { "phase": "Core Infrastructure Setup", "duration": "2 Weeks", "deliverables": "Cloud provisioning, Database schema, CI/CD pipeline, Auth setup" },
    { "phase": "Sprint 1: Foundation Development", "duration": "3 Weeks", "deliverables": "Core backend APIs, Primary database models, Base UI components" },
    { "phase": "Sprint 2: Feature Development", "duration": "3 Weeks", "deliverables": "Module 1-3 implementation, Admin panel core, API integrations" },
    { "phase": "Sprint 3: Advanced Features", "duration": "3 Weeks", "deliverables": "Module 4-6 implementation, 3rd party integrations, Notifications" },
    { "phase": "Integration & API Flow", "duration": "2 Weeks", "deliverables": "End-to-end integration, Payment gateway, External API sync" },
    { "phase": "QA & UAT Testing", "duration": "2 Weeks", "deliverables": "Bug resolution, Performance testing, Client verification, UAT sign-off" },
    { "phase": "Deployment & Go-Live", "duration": "1 Week", "deliverables": "Production deployment, DNS setup, SSL, Post-launch monitoring" }
  ],
  "proposedTeam": [
    { "role": "Project Manager", "count": 1 },
    { "role": "UI/UX Designer", "count": 1 },
    { "role": "Frontend Developer", "count": 2 },
    { "role": "Backend Developer", "count": 2 },
    { "role": "QA Tester", "count": 1 },
    { "role": "DevOps Engineer", "count": 1 }
  ],
  "amc": "Post-warranty Annual Maintenance Contract details.",
  "sla": {
    "responseTimes": ["Critical: 1 hour", "High: 4 hours", "Standard: 24 hours"],
    "resolutionTimes": ["Critical: 4-8 hours", "High: 24-48 hours", "Standard: 3-5 days"],
    "maintenanceCoverage": "Includes server monitoring, scaling, and security patches."
  },
  "changeRequest": "Any new feature or change in scope will undergo a Change Request (CR) process.",
  "acceptanceCriteria": [
    "Completion of all functional modules as per agreed scope.",
    "Successful User Acceptance Testing (UAT) sign-off.",
    "Deployment to the production environment."
  ],
  "warranty": "3-month code warranty post go-live.",
  "legal": "This proposal is valid for 30 days."
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
1. EXECUTIVE TONE: Professional McKinsey/Deloitte consulting style. No fluff.
2. COST BREAKDOWN is the KEY DIFFERENTIATOR of this template. The "costBreakdown" array MUST have EXACTLY 12 categories covering ALL engineering areas listed in the schema above. Each category must have realistic hours, rate/hour, and cost that ADD UP to the totalCost.
3. REALISTIC ESTIMATES: Base the hours and rates on the budget provided. If budget is "Not specified", use realistic Indian IT consulting rates (₹1,000-₹2,000/hour).
4. ${gstInstruction}
5. MODULES: Provide 5-7 comprehensive feature modules.
6. ARGOMSOB STACK: React (Vite), Node.js, Supabase, Razorpay, AWS.
7. MERMAID: Use ID["Label Text"] syntax. graph TD or LR only.
8. EXACT FEATURE FORMAT: Every item in the "items" array MUST be "Feature Name: First line.\\\\nSecond line."
9. NO EXTRA TEXT: Return pure JSON.
10. FEATURE ENFORCEMENT: Every single feature listed above MUST be present in the JSON 'features' array.
11. MATH CHECK: The sum of all costBreakdown[].cost values MUST equal costEstimation.totalCost exactly.
12. TIMELINE: The "timeline" array MUST have EXACTLY 6-9 distinct phases including discovery, design, infrastructure setup, multiple development sprints, integration, QA/UAT, and deployment. Do NOT compress everything into 2 phases.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating Template 4 quotation with OpenAI:", error);
    throw new Error("Failed to generate quotation content.");
  }
};
