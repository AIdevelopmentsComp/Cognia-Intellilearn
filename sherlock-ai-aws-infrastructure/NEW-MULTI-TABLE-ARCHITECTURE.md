# 🏗️ **SHERLOCK AI - NUEVA ARQUITECTURA MULTI-TABLA**

## **🎯 PROBLEMA IDENTIFICADO:**
- **Single Table** funciona para casos simples
- **High Volume sub-records** requieren tablas separadas
- **Different Access Patterns** necesitan índices específicos
- **Lifecycle Management** diferente por tipo de dato

---

## **🗄️ NUEVA ARQUITECTURA - 6 TABLAS ESPECIALIZADAS**

### **1. 📁 SHERLOCK_CASES (Tabla Principal)**
```javascript
// Casos principales - solo metadata esencial
{
  PK: "MATTER#ZAN2024001",
  SK: "CASE#METADATA", 
  
  // Core Case Info
  matter_number: "ZAN2024001",
  case_type: "ZANTAC",
  status: "ACTIVE",
  intake_date: "2024-01-15",
  sol_date: "2024-12-15",
  
  // Legal Team
  assigned_attorney: "ATT001",
  paralegal: "PAR001",
  
  // AI Summary
  ai_case_strength: 85,
  ai_summary: "Strong liability case with clear causation...",
  
  // Timestamps
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-12-03T15:30:00Z"
}

// GSI1: CASE_TYPE + STATUS for filtering
// GSI2: ATTORNEY + PRIORITY for assignment tracking
// GSI3: SOL_DATE for deadline monitoring
```

---

### **2. 👥 SHERLOCK_PARTIES (Parties & Relationships)**
```javascript
// Injured Party
{
  PK: "MATTER#ZAN2024001",
  SK: "PARTY#INJURED#001",
  
  party_type: "INJURED_PARTY",
  party_id: "PARTY001",
  
  // Personal Info  
  first_name: "Sarah",
  last_name: "Johnson",
  dob: "1965-03-15",
  ssn: "XXX-XX-1234",
  
  // Contact
  phone: "(555) 123-4567",
  email: "sarah.johnson@email.com",
  address: "1234 Main St, Houston, TX 77001",
  
  // AI Insights
  ai_summary: "72-year-old female, excellent witness credibility..."
}

// Executor/Guardian
{
  PK: "MATTER#ZAN2024001", 
  SK: "PARTY#EXECUTOR#001",
  
  party_type: "EXECUTOR",
  relationship_to_injured: "SON",
  represents_party_id: "PARTY001",
  
  first_name: "Michael",
  last_name: "Johnson", 
  authority_type: "POWER_OF_ATTORNEY",
  authority_document: "S3://bucket/poa-doc.pdf"
}

// Multiple Witnesses
{
  PK: "MATTER#ZAN2024001",
  SK: "PARTY#WITNESS#001",
  
  party_type: "FACT_WITNESS",
  witness_category: "MEDICAL_PROFESSIONAL",
  
  first_name: "Dr. Patricia",
  last_name: "Williams",
  testimony_summary: "Prescribed Zantac 2015-2018, documented usage patterns",
  
  // Contact for deposition
  phone: "(555) 987-6543",
  address: "Medical Plaza, Houston, TX"
}

// GSI1: PARTY_TYPE + MATTER for queries like "all witnesses for case"
// GSI2: PARTY_TYPE globally for "all fact witnesses across cases"
```

---

### **3. 🏥 SHERLOCK_MEDICAL_RECORDS (High Volume Medical Data)**
```javascript
// Pathology Report
{
  PK: "MATTER#ZAN2024001",
  SK: "MEDICAL#PATHOLOGY#20200315#001",
  
  record_type: "PATHOLOGY_REPORT",
  record_id: "MED001",
  provider: "MD Anderson Cancer Center",
  provider_npi: "1234567890",
  
  // Document Details
  record_date: "2020-03-15",
  document_s3_path: "s3://wattsnewclassified/ZAN2024001/medical/pathology-001.pdf",
  
  // Medical Data
  diagnosis: "Gastric adenocarcinoma", 
  stage: "Stage II",
  histology: "Well-differentiated adenocarcinoma",
  
  // AI Analysis
  ai_causation_score: 87,
  ai_summary: "Pathology consistent with NDMA-induced carcinogenesis patterns. Strong causation evidence.",
  ai_key_findings: ["NDMA metabolite markers present", "Gastric mucosa inflammation pattern"],
  
  // Metadata
  pages_count: 15,
  reviewed_by_attorney: "ATT001",
  review_date: "2024-02-01",
  confidentiality: "ATTORNEY_CLIENT_PRIVILEGED"
}

// Treatment Records
{
  PK: "MATTER#ZAN2024001",
  SK: "MEDICAL#TREATMENT#20200401#001",
  
  record_type: "CHEMOTHERAPY_RECORDS",
  provider: "Houston Methodist Hospital",
  treatment_period: "2020-04-01 to 2020-10-01",
  
  treatment_details: {
    protocol: "FOLFOX",
    cycles_completed: 6,
    response: "Complete pathological response"
  },
  
  ai_treatment_analysis: "Standard of care followed, good prognosis indicators",
  total_treatment_cost: 245000.00
}

// GSI1: RECORD_TYPE + RECORD_DATE for chronological medical timeline
// GSI2: PROVIDER + RECORD_TYPE for provider-specific queries  
// GSI3: AI_CAUSATION_SCORE for strongest evidence ranking
```

---

### **4. 🏛️ SHERLOCK_COURT_RELEASES (Court Filings & Deficiencies)**
```javascript
// Court Filing
{
  PK: "MATTER#ZAN2024001",
  SK: "COURT#FILING#20241201#001",
  
  filing_type: "COMPLAINT_FILING",
  court_name: "US District Court - Southern District of Texas",
  court_case_number: "4:24-cv-01234",
  docket_number: "MDL-2924",
  
  // Filing Details
  filed_date: "2024-12-01", 
  filing_attorney: "ATT001",
  document_s3_path: "s3://wattsnewclassified/ZAN2024001/court/complaint-001.pdf",
  
  // Status
  filing_status: "DEFICIENT",
  acceptance_date: null,
  
  // AI Analysis
  ai_filing_strength: 82,
  ai_predicted_outcome: "LIKELY_ACCEPTED_AFTER_CURE"
}

// Deficiency Records (Separate items for each deficiency)
{
  PK: "MATTER#ZAN2024001",
  SK: "DEFICIENCY#20241201#001", 
  
  related_filing_sk: "COURT#FILING#20241201#001",
  deficiency_id: "DEF001",
  
  // Deficiency Details
  deficiency_type: "MISSING_SIGNATURE",
  description: "Exhibit A requires notarized client signature",
  severity: "CRITICAL",
  
  // Deadlines
  issued_date: "2024-12-02",
  cure_deadline: "2024-12-09",
  days_remaining: 6,
  
  // Status Tracking
  status: "PENDING_CURE",
  assigned_to: "PAR001",
  cure_actions_taken: ["Client appointment scheduled for 2024-12-05"],
  
  // AI Insights
  ai_cure_difficulty: "LOW",
  ai_recommended_actions: ["Schedule notary appointment", "Prepare backup exhibits"]
}

// Another deficiency for same filing
{
  PK: "MATTER#ZAN2024001", 
  SK: "DEFICIENCY#20241201#002",
  
  deficiency_type: "INCORRECT_FILING_FEE",
  description: "Filing fee $402 instead of $405", 
  severity: "MINOR",
  status: "CURED",
  cured_date: "2024-12-03",
  cure_method: "Additional payment submitted"
}

// GSI1: STATUS + CURE_DEADLINE for "all pending deficiencies by deadline"
// GSI2: ASSIGNED_TO + STATUS for paralegal task tracking
// GSI3: SEVERITY + DAYS_REMAINING for priority management
```

---

### **5. 📄 SHERLOCK_DOCUMENTS (Document Links & Metadata)**
```javascript
// Client Document
{
  PK: "MATTER#ZAN2024001",
  SK: "DOCUMENT#CLIENT#20240115#001",
  
  document_id: "DOC001", 
  document_type: "RETAINER_AGREEMENT",
  category: "CLIENT_CONTRACTS",
  
  // File Details
  filename: "retainer-agreement-signed.pdf",
  s3_path: "s3://wattsnewclassified/ZAN2024001/contracts/retainer-001.pdf",
  file_size: 2048576, // bytes
  pages_count: 8,
  
  // Security
  confidentiality: "ATTORNEY_CLIENT_PRIVILEGED", 
  encryption_status: "AES256_ENCRYPTED",
  access_log: ["ATT001:2024-12-01", "PAR001:2024-12-02"],
  
  // AI Processing
  ai_document_summary: "Standard retainer agreement, all required clauses present",
  ai_extracted_data: {
    client_name: "Sarah Johnson",
    contingency_fee: "33.33%",
    effective_date: "2024-01-15"
  }
}

// Medical Document Link
{
  PK: "MATTER#ZAN2024001",
  SK: "DOCUMENT#MEDICAL#20200315#001",
  
  document_type: "PATHOLOGY_REPORT",
  linked_medical_record: "MEDICAL#PATHOLOGY#20200315#001",
  
  filename: "pathology-report-mda-20200315.pdf",
  s3_path: "s3://wattsnewclassified/ZAN2024001/medical/pathology-001.pdf",
  
  // HIPAA Compliance
  hipaa_authorization: true,
  authorization_date: "2024-01-20",
  phi_classification: "PROTECTED_HEALTH_INFORMATION"
}

// Court Document
{
  PK: "MATTER#ZAN2024001",
  SK: "DOCUMENT#COURT#20241201#001",
  
  document_type: "COMPLAINT",
  linked_court_filing: "COURT#FILING#20241201#001",
  public_document: true,
  
  filename: "complaint-zantac-johnson.pdf",
  court_filing_number: "ECF-001",
  docket_entry: "1"
}

// GSI1: DOCUMENT_TYPE + UPLOAD_DATE for document type filtering
// GSI2: CONFIDENTIALITY + ACCESS_DATE for security auditing
// GSI3: S3_PATH for file system integration
```

---

### **6. 💰 SHERLOCK_FINANCIAL (Financial Tracking)**
```javascript
// Settlement Record
{
  PK: "MATTER#ZAN2024001",
  SK: "FINANCIAL#SETTLEMENT#20241115#001",
  
  transaction_type: "SETTLEMENT_OFFER",
  transaction_id: "FIN001",
  
  // Settlement Details
  settlement_amount: 750000.00,
  offer_date: "2024-11-15",
  response_deadline: "2024-12-15",
  settlement_status: "UNDER_REVIEW",
  
  // Fee Structure
  contingency_fee_rate: 0.3333,
  attorney_fees: 249975.00,
  client_net: 500025.00,
  
  // AI Analysis
  ai_settlement_recommendation: "ACCEPT",
  ai_confidence: 87,
  ai_reasoning: "Above median settlement for similar cases, client medical costs covered"
}

// Expense Record  
{
  PK: "MATTER#ZAN2024001",
  SK: "FINANCIAL#EXPENSE#20240201#001",
  
  transaction_type: "CASE_EXPENSE",
  expense_category: "MEDICAL_RECORDS",
  amount: 1250.00,
  expense_date: "2024-02-01",
  vendor: "MD Anderson Medical Records",
  description: "Complete pathology and treatment records",
  billable_to_client: true,
  reimbursement_status: "PENDING"
}

// Cost Analysis
{
  PK: "MATTER#ZAN2024001", 
  SK: "FINANCIAL#ANALYSIS#CURRENT",
  
  total_expenses_to_date: 15750.00,
  estimated_remaining_costs: 8500.00,
  projected_total_costs: 24250.00,
  
  // AI Financial Projections
  ai_case_value_estimate: 650000,
  ai_net_profit_projection: 416750.00,
  ai_roi_score: 89
}

// GSI1: TRANSACTION_TYPE + DATE for financial reporting
// GSI2: SETTLEMENT_STATUS for active settlement tracking
// GSI3: EXPENSE_CATEGORY for cost analysis by type
```

---

## **🔄 QUERY PATTERNS - MULTI-TABLE**

### **✅ SINGLE CASE COMPLETE VIEW:**
```javascript
// Para mostrar caso completo - 6 queries paralelas
const [caseInfo, parties, medicalRecords, courtFilings, documents, financial] = await Promise.all([
  queryCases("MATTER#ZAN2024001"),           // 1 query
  queryParties("MATTER#ZAN2024001"),         // 1 query  
  queryMedical("MATTER#ZAN2024001"),         // 1 query
  queryCourtFilings("MATTER#ZAN2024001"),    // 1 query
  queryDocuments("MATTER#ZAN2024001"),       // 1 query
  queryFinancial("MATTER#ZAN2024001")        // 1 query
]);

// Total: 6 queries paralelas = ~20ms total (vs 1 query = 8ms)
// Trade-off: +12ms latencia por +1000x mejor organización
```

### **✅ SPECIFIC PATTERN QUERIES:**
```javascript
// "¿Qué deficiencias vencen hoy?"
const urgentDeficiencies = await queryCourtDeficienciesByDeadline("2024-12-03");

// "¿Qué casos tienen medical records de MD Anderson?"
const mdaRecords = await queryMedicalByProvider("MD Anderson");

// "¿Cuáles son los fact witnesses en casos Zantac?"
const zantacWitnesses = await queryPartiesByTypeAndCase("FACT_WITNESS", "ZANTAC");
```

---

## **💰 COST COMPARISON**

### **Single Table (Current):**
- 1 tabla x $150/mes = **$150/mes**
- High RCU/WCU por queries mixtas

### **Multi-Table (Proposed):**
- 6 tablas x $25/mes = **$150/mes** (same base cost)
- Optimized queries = -40% RCU/WCU
- **Total: ~$90-120/mes** 📉

---

## **🎯 MIGRATION STRATEGY**

### **Phase 1: Create New Tables** 
- Deploy new 6-table schema
- Keep current single table running

### **Phase 2: Complete Data Migration**
- Migrate ALL Excel data correctly:
  - 251 Hair Relaxer cases + 1,900 medical records
  - 316 NEC cases + 1,333 medical records  
  - Extract actual Zantac cases from 377K document links

### **Phase 3: Switch Applications**
- Update APIs to use new schema
- Parallel testing
- Cutover

---

**¿Esta arquitectura multi-tabla resuelve los problemas identificados? ¿Procedo con la implementación?** 🚀 