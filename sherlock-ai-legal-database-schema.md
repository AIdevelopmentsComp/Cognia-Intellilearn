# SHERLOCK AI - Legal Case Management Database Schema
## Sistema Integral con Matter_Number como Identificador Principal

**IMPORTANTE**: El campo `Claim_Id__c` de Salesforce se mapea como `Matter_Number` - el identificador legal estándar para casos.

---

## 🔗 ESTRUCTURA DE RELACIONES PRINCIPAL

### **Matter_Number (Claim_Id__c)** - Identificador Universal
- **Formato**: `MT2024001`, `HR2024015`, `NEC2024089`
- **Presente en**: TODAS las tablas como campo de relación
- **Uso**: Vincular todos los datos de un caso específico
- **Indexado**: En todos los GSI para consultas rápidas

---

## TABLAS PRINCIPALES - SHERLOCK AI DATABASE

### 1. **SherlockCasesMain** (Tabla Central de Casos)

#### Estructura Legal Actualizada:
```
PK: MATTER#{matter_number}
SK: CASE_META#{docket_date}
```

#### Atributos Jurídicos con Matter_Number:
```json
{
  "PK": "MATTER#MT2024001",
  "SK": "CASE_META#2024-01-15T10:30:00Z",
  
  // === IDENTIFICADOR PRINCIPAL ===
  "matter_number": "MT2024001", // Mapea a Claim_Id__c en Salesforce
  "salesforce_claim_id": "MT2024001", // Referencia directa al campo Salesforce
  "firm_case_id": "MT2024001", // ID interno de la firma
  
  // GSI Keys for Legal Queries
  "GSI1PK": "LITIGATION_STATUS#ACTIVE_DISCOVERY",
  "GSI1SK": "STATUTE_EXPIRY#2025-01-15",
  "GSI2PK": "MATTER_NUMBER#MT2024001", // ⭐ Nuevo GSI para búsqueda por Matter Number
  "GSI2SK": "CASE_PRIORITY#HIGH#2024-01-15",
  "GSI3PK": "COUNSEL_OF_RECORD#ATT001", 
  "GSI3SK": "MATTER_NUMBER#MT2024001#2024-01-15",
  "GSI4PK": "CASE_TYPE#HAIR_RELAXER",
  "GSI4SK": "MATTER_NUMBER#MT2024001",
  
  // === CASE IDENTIFICATION ===
  "docket_number": "2:24-cv-00123-ABC", 
  "matter_type": "MASS_TORT",
  "litigation_category": "PRODUCT_LIABILITY", 
  "case_caption": "Rodriguez v. Beauty Corp., et al.",
  "short_case_name": "Hair Relaxer MDL",
  
  // === LITIGATION STATUS ===
  "litigation_phase": "DISCOVERY",
  "case_status": "ACTIVE",
  "statute_of_limitations_expiry": "2025-01-15",
  
  // === INJURED PARTY REFERENCE ===
  "primary_injured_party_id": "IP001",
  "injured_party_matter_ref": "MT2024001-IP001",
  
  // === LEGAL REPRESENTATION ===
  "lead_counsel_id": "ATT001",
  "matter_attorney_ref": "MT2024001-ATT001",
  
  // === DAMAGES ===
  "damages_claimed": {
    "total_claimed": 570000.00,
    "economic_damages": 265000.00,
    "non_economic_damages": 305000.00
  },
  
  "created_date": "2024-01-15T10:30:00Z",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

### 2. **SherlockPartiesRoles** (Todas las Partes vinculadas por Matter_Number)

#### Estructura:
```
PK: MATTER#{matter_number}
SK: PARTY#{party_type}#{party_id}#{relationship_date}
```

#### Atributos con Relación Matter_Number:
```json
{
  "PK": "MATTER#MT2024001",
  "SK": "PARTY#INJURED_PARTY#IP001#2024-01-15",
  "GSI1PK": "PARTY_TYPE#INJURED_PARTY",
  "GSI1SK": "MATTER_NUMBER#MT2024001",
  "GSI2PK": "MATTER_NUMBER#MT2024001", // ⭐ Búsqueda directa por Matter Number
  "GSI2SK": "PARTY_TYPE#INJURED_PARTY",
  
  // === RELACIÓN CON CASE PRINCIPAL ===
  "matter_number": "MT2024001", // ⭐ Campo principal de relación
  "salesforce_claim_id": "MT2024001",
  "party_matter_reference": "MT2024001-IP001",
  
  // === PARTY IDENTIFICATION ===
  "party_id": "IP001",
  "party_type": "INJURED_PARTY",
  "full_legal_name": "Maria Elena Rodriguez",
  "relationship_to_case": "DIRECTLY_INJURED",
  "legal_capacity": "COMPETENT_ADULT",
  
  // === INJURY DETAILS ===
  "injury_classification": "CHEMICAL_BURNS_HAIR_LOSS",
  "current_medical_status": "ONGOING_TREATMENT",
  
  "created_date": "2024-01-15T10:30:00Z"
}
```

### 3. **SherlockMedicalRecords** (Registros Médicos por Matter_Number)

#### Estructura:
```
PK: MATTER#{matter_number}
SK: MEDICAL#{record_date}#{provider_id}#{record_id}
```

#### Atributos:
```json
{
  "PK": "MATTER#MT2024001", 
  "SK": "MEDICAL#2024-01-10#PROV001#MED001",
  "GSI1PK": "MATTER_NUMBER#MT2024001", // ⭐ Búsqueda por Matter Number
  "GSI1SK": "RECORD_DATE#2024-01-10",
  "GSI2PK": "PROVIDER_SPECIALTY#DERMATOLOGY",
  "GSI2SK": "MATTER_NUMBER#MT2024001",
  
  // === RELACIÓN CON CASE ===
  "matter_number": "MT2024001", // ⭐ Identificador principal
  "salesforce_claim_id": "MT2024001",
  "medical_record_matter_ref": "MT2024001-MED001",
  
  // === RECORD DETAILS ===
  "medical_record_id": "MED001",
  "injured_party_id": "IP001",
  "provider_name": "Dr. Sarah Johnson",
  "provider_specialty": "DERMATOLOGY",
  "encounter_date": "2024-01-10",
  
  // === CAUSATION ANALYSIS ===
  "causation_opinion": "LIKELY_RELATED",
  "causation_confidence": "HIGH",
  "related_to_product": true,
  
  "created_date": "2024-01-25T10:30:00Z"
}
```

### 4. **SherlockFinancialLedger** (Trust Account por Matter_Number)

#### Estructura:
```
PK: MATTER#{matter_number}
SK: FINANCIAL#{transaction_date}#{transaction_type}#{transaction_id}
```

#### Atributos:
```json
{
  "PK": "MATTER#MT2024001",
  "SK": "FINANCIAL#2024-01-15#COST_ADVANCE#FIN001",
  "GSI1PK": "MATTER_NUMBER#MT2024001", // ⭐ Búsqueda por Matter Number
  "GSI1SK": "TRANSACTION_DATE#2024-01-15",
  "GSI2PK": "TRANSACTION_TYPE#COST_ADVANCE", 
  "GSI2SK": "MATTER_NUMBER#MT2024001",
  
  // === RELACIÓN CON CASE ===
  "matter_number": "MT2024001", // ⭐ Identificador principal
  "salesforce_claim_id": "MT2024001",
  "financial_matter_ref": "MT2024001-FIN001",
  
  // === TRANSACTION DETAILS ===
  "transaction_id": "FIN001",
  "transaction_type": "COST_ADVANCE",
  "amount": 1500.00,
  "description": "Expert dermatologist medical record review",
  "vendor_name": "Dr. Sarah Johnson",
  
  // === TRUST ACCOUNT ===
  "trust_account_number": "SHERLOCK_IOLTA_001",
  "billable_to_client": true,
  
  "created_date": "2024-01-15T10:30:00Z"
}
```

### 5. **SherlockDocuments** (Documentos por Matter_Number)

#### Estructura:
```
PK: MATTER#{matter_number}
SK: DOCUMENT#{doc_category}#{upload_date}#{doc_id}
```

#### Atributos:
```json
{
  "PK": "MATTER#MT2024001",
  "SK": "DOCUMENT#PRIVILEGED_COMMUNICATION#2024-01-15#DOC001",
  "GSI1PK": "MATTER_NUMBER#MT2024001", // ⭐ Búsqueda por Matter Number
  "GSI1SK": "DOCUMENT_TYPE#LEGAL_MEMORANDUM",
  "GSI2PK": "PRIVILEGE_TYPE#ATTORNEY_CLIENT",
  "GSI2SK": "MATTER_NUMBER#MT2024001",
  
  // === RELACIÓN CON CASE ===
  "matter_number": "MT2024001", // ⭐ Identificador principal
  "salesforce_claim_id": "MT2024001",
  "document_matter_ref": "MT2024001-DOC001",
  
  // === DOCUMENT IDENTIFICATION ===
  "document_id": "DOC001",
  "document_name": "Initial Case Assessment and Strategy Memorandum",
  "document_type": "LEGAL_MEMORANDUM",
  
  // === PRIVILEGE PROTECTION ===
  "privilege_type": "ATTORNEY_CLIENT",
  "confidentiality_level": "HIGHLY_CONFIDENTIAL",
  "attorney_eyes_only": false,
  
  "created_date": "2024-01-15T10:30:00Z"
}
```

---

## 🔍 CONSULTAS POR MATTER_NUMBER

### 1. Obtener TODO de un Caso Específico:
```javascript
// Buscar caso principal
const mainCase = await dynamoDB.query({
  TableName: 'sherlock-cases-main',
  KeyConditionExpression: 'PK = :matter_pk',
  ExpressionAttributeValues: {
    ':matter_pk': 'MATTER#MT2024001'
  }
});

// Buscar todas las partes del caso
const allParties = await dynamoDB.query({
  TableName: 'sherlock-parties-roles',
  IndexName: 'GSI2-MatterNumber',
  KeyConditionExpression: 'GSI2PK = :matter_num',
  ExpressionAttributeValues: {
    ':matter_num': 'MATTER_NUMBER#MT2024001'
  }
});

// Buscar registros médicos del caso
const medicalRecords = await dynamoDB.query({
  TableName: 'sherlock-medical-records',
  IndexName: 'GSI1-MatterNumber',
  KeyConditionExpression: 'GSI1PK = :matter_num',
  ExpressionAttributeValues: {
    ':matter_num': 'MATTER_NUMBER#MT2024001'
  }
});

// Buscar transacciones financieras del caso
const financialData = await dynamoDB.query({
  TableName: 'sherlock-financial-ledger',
  IndexName: 'GSI1-MatterNumber',
  KeyConditionExpression: 'GSI1PK = :matter_num',
  ExpressionAttributeValues: {
    ':matter_num': 'MATTER_NUMBER#MT2024001'
  }
});

// Buscar documentos del caso
const caseDocuments = await dynamoDB.query({
  TableName: 'sherlock-documents',
  IndexName: 'GSI1-MatterNumber',
  KeyConditionExpression: 'GSI1PK = :matter_num',
  ExpressionAttributeValues: {
    ':matter_num': 'MATTER_NUMBER#MT2024001'
  }
});
```

### 2. Integración con Salesforce usando Claim_Id__c:
```apex
public class SherlockAIService {
    
    @future(callout=true)
    public static void syncCompleteCase(String claimId) {
        
        // Usar el Claim_Id__c como Matter_Number
        String matterNumber = claimId;
        
        // Obtener datos completos del caso
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Sherlock_AI_API/matter/' + matterNumber + '/complete');
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            SherlockCompleteCaseWrapper caseData = 
                (SherlockCompleteCaseWrapper) JSON.deserialize(
                    res.getBody(), 
                    SherlockCompleteCaseWrapper.class
                );
            
            // Actualizar TODOS los datos relacionados en Salesforce
            updateSalesforceCompleteCase(caseData, claimId);
        }
    }
    
    public static void createNewMatter(String claimId, String caseType) {
        
        // Crear nuevo case en Sherlock AI usando Claim_Id__c
        Map<String, Object> caseData = new Map<String, Object>{
            'matter_number' => claimId,
            'salesforce_claim_id' => claimId,
            'matter_type' => 'MASS_TORT',
            'case_type' => caseType,
            'litigation_phase' => 'INTAKE',
            'case_status' => 'ACTIVE'
        };
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Sherlock_AI_API/matter');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(caseData));
        
        Http http = new Http();
        HttpResponse res = http.send(req);
    }
}
```

---

## 📊 ESTRUCTURA DE DATOS UNIFICADA POR MATTER_NUMBER

### **Todas las tablas conectadas por Matter_Number:**

```
MATTER#MT2024001
├── SherlockCasesMain (Información principal del caso)
├── SherlockPartiesRoles (Injured party, executors, witnesses)
├── SherlockMedicalRecords (Todos los registros médicos)
├── SherlockFinancialLedger (Trust account, costos, honorarios)
├── SherlockDocuments (Documentos privilegiados)
├── SherlockWitnesses (Testigos y expertos)
└── SherlockLegalReps (Representantes legales)
```

### **Ventajas de esta estructura:**
- ✅ **Búsqueda instantánea** por Claim_Id__c (Matter_Number)
- ✅ **Consistencia** entre Salesforce y Sherlock AI
- ✅ **Escalabilidad** para millones de casos
- ✅ **Integridad referencial** garantizada
- ✅ **Compliance legal** mantenido

---

Ahora voy a proceder con el despliegue usando tus credenciales AWS. El sistema estará completamente integrado con el `Claim_Id__c` como `Matter_Number`.

¿Te parece bien esta estructura? ¡Procedo con el despliegue! 