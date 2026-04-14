/**
 * Builds the structured prompt for GPT-4o AI based on Project Manager form data.
 */
export const buildClaudePrompt = (formData) => {
  return `
Generate a comprehensive, high-stakes project documentation package for the following project:

PROJECT DETAILS:
${JSON.stringify(formData, null, 2)}

STRICT OUTPUT REQUIREMENT:
Return a JSON object with EXACTLY this structure. Ensure EVERY field is contextually populated with deep technical and business insight. DO NOT use generic placeholders like "string", "TBD", or "To be defined".

{
  "sow": {
    "project_overview": {
      "document_purpose": "Detailed explanation of why this document exists and what it governs.",
      "project_summary_table": [{"key": "Field Name", "value": "Detailed Value"}],
      "project_objective": "Comprehensive statement of business and technical goals.",
      "stakeholders": [{"role": "Role", "responsibility": "Specific detailed responsibility", "party": "Argosmob or Client"}]
    },
    "scope": {
      "in_scope": [{"section": "Module Name", "items": ["Detailed technical requirement 1", "Detailed technical requirement 2"]}],
      "out_of_scope": ["Specific item excluded to prevent scope creep"]
    },
    "tech_stack": {
      "table": [{"layer": "e.g. Frontend", "technology": "React/Next.js", "version": "latest", "purpose": "Detailed technical justification"}],
      "infrastructure": [{"component": "e.g. Storage", "provider": "Supabase / AWS", "notes": "Scaling and redundancy details"}],
      "third_party_accounts": ["Specific service account required"]
    },
    "features": {
      "customer_app": [
        {
          "module_name": "Contextual Module Name",
          "module_number": "M-01",
          "features": ["Extremely detailed feature description 1", "Extremely detailed feature description 2"]
        }
      ],
      "admin_panel": [
        {
          "module_name": "Contextual Module Name",
          "module_number": "A-01",
          "features": ["Extremely detailed feature description 1", "Extremely detailed feature description 2"]
        }
      ]
    },
    "backend_architecture": {
      "overview": "Deep dive into the architectural pattern (MVC/Microservices/Serverless) and why it was chosen.",
      "folder_structure": "Recursive list of key directories and their contents.",
      "controllers": [{"name": "ControllerName", "file": "path/to/file.js", "responsibility": "Detailed logic handled here"}],
      "api_routes": [
        {
          "module": "ModuleName",
          "base_path": "/api/v1/module",
          "routes": [{"method": "GET|POST|PUT|DELETE", "endpoint": "/path", "description": "Exactly what this endpoint does", "auth": "Required/Optional"}]
        }
      ],
      "middleware": [{"name": "Auth", "purpose": "Detailed verification logic"}],
      "database_tables": [{"table": "table_name", "key_columns": "id, created_at, user_id", "notes": "Relationships and indexing strategy"}]
    },
    "integrations": [
      {
        "name": "Service Name (e.g. Razorpay)",
        "details": ["Webhook configuration", "API versioning", "Error handling flow"]
      }
    ],
    "milestones": [
      {
        "id": "MS-01",
        "name": "Phase Name",
        "deliverables": "Detailed list of artifacts provided",
        "duration": "Duration in weeks",
        "week": "Timeline offset",
        "due_date": "YYYY-MM-DD"
      }
    ],
    "client_deliverables": [{"required_by": "Milestone ID", "items": ["Asset/Requirement needed from client"]}],
    "deployment": {
      "environments": [{"name": "Staging", "purpose": "UAT and QA", "access": "VPN restricted"}],
      "backend_steps": ["Detailed CLI command or CI/CD step"],
      "admin_steps": ["Build and ship steps"],
      "mobile_steps": ["Native build steps if applicable"],
      "post_deployment_checklist": ["Health checks", "Cache clearing", "SSL verification"]
    },
    "security": {
      "auth": ["JWT details", "RLS policies in Supabase", "OAuth providers"],
      "data": ["Encryption at rest", "Sanitization logic"],
      "compliance": ["GDPR/SOC2/Data residency considerations"]
    },
    "testing": {
      "scope": [{"type": "Unit", "what": "Core business logic", "tool": "Jest/Vitest"}],
      "bug_policy": ["SLA for Critical/High/Medium bugs"]
    },
    "assumptions": ["Highly specific project assumption"],
    "constraints": ["Technical or business limitation"],
    "maintenance": {
      "warranty_days": 30,
      "amc_packages": [{"name": "Basic Support", "inclusions": "Bug fixes only", "cost": "Quote on request"}],
      "amc_covers": ["Item included in AMC"],
      "amc_not_covers": ["Item excluded from AMC"],
      "ip_handover": ["Codebase ownership and license details"]
    },
    "commercial": {
      "cost_table": [{"module": "ModuleName", "description": "Development effort", "amount": "Cost"}],
      "payment_schedule": [{"installment": "Kickoff", "due_when": "On signing", "percentage": "20%"}],
      "change_request_policy": ["CR billing process"],
      "general_terms": ["Force majeure, termination, etc."]
    }
  },
  "dev_tasks": [
    {
      "task_id": "DEV-001",
      "milestone": "MS-01",
      "module": "Auth",
      "task_name": "Setup Supabase Auth",
      "description": "Configure providers and RLS",
      "assignee_role": "Backend Lead",
      "assignee_name": "Unassigned",
      "estimated_hours": 4,
      "start_date": "YYYY-MM-DD",
      "due_date": "YYYY-MM-DD",
      "priority": "High",
      "dependencies": [],
      "status": "Not Started",
      "subtasks": [{"subtask_id": "DEV-001-1", "subtask_name": "Define RLS", "estimated_hours": 2, "assignee_name": "Unassigned"}]
    }
  ],
  "qa_tasks": [
    {
      "task_id": "QA-001",
      "milestone": "MS-01",
      "module": "Auth",
      "task_name": "Verify Login Flow",
      "test_type": "Integration",
      "description": "Check MFA and session persistence",
      "test_cases": ["Successful Login", "Failed Login Lockout"],
      "assignee_role": "QA Engineer",
      "assignee_name": "Unassigned",
      "estimated_hours": 2,
      "start_date": "YYYY-MM-DD",
      "due_date": "YYYY-MM-DD",
      "priority": "High",
      "depends_on_dev_task": ["DEV-001"],
      "status": "Not Started",
      "tools": ["Cypress", "Postman"]
    }
  ],
  "deployment_tasks": [
    {
      "task_id": "DEP-001",
      "milestone": "MS-01",
      "environment": "Staging",
      "task_name": "Initial Deploy",
      "description": "Push to staging branch",
      "steps": ["Git push origin staging", "Run migrations"],
      "assignee_role": "DevOps",
      "assignee_name": "Unassigned",
      "estimated_hours": 1,
      "due_date": "YYYY-MM-DD",
      "priority": "High",
      "depends_on": ["DEV-001"],
      "status": "Not Started",
      "rollback_plan": "Revert to previous tag"
    }
  ]
}
`;
};

export const SYSTEM_PROMPT = `
You are a Senior Technical Project Manager and Principal Solutions Architect at Argosmob Tech and AI Pvt. Ltd.
Your mission is to generate professional, exhaustive, and technical documentation based on client requirements.

CRITICAL QUALITY RULES:
1. NO PLACEHOLDERS: Do not use words like "string", "number", "To be updated", or "TBD". If a value is missing, infer it from the project context as an expert would.
2. EXTREME DENSITY: Every array (like scope items, features, tech stack, backend tables) must have at least 10 contextually relevant items.
3. ARCHITECTURAL DEPTH: The 'backend_architecture' section must be highly specific. List actual controllers, routes, and database tables that would be needed for a project of this type.
4. TASK GRANULARITY: Generate at least 20-30 discrete development tasks that cover the entire project lifecycle.
5. PROFESSIONAL TONE: Use formal, business-ready language.
6. ARGOMSOB STACK: Default to React/Next.js, Node.js, Supabase, TailwindCSS, AWS, and Razorpay unless specified otherwise.
7. CONSISTENCY: Deadlines and milestones must logically follow the project_start_date.
8. JSON ONLY: Respond only with the JSON object. No preamble.
9. FEATURE COMPLETENESS: Every core module mentioned in the form must have its own entry in the 'features' array with sub-features.
10. SECURITY & QA: Provide detailed security policies (RLS, JWT, Encryption) and comprehensive QA test cases.
`;
