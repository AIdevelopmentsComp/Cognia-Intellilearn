# Mass Tort Case Management - AWS DynamoDB Schema

## Análisis de Datos Existentes

Basándome en el análisis de los siguientes tipos de casos:
- **Hair Relaxer Cases**
- **NEC Cases** (Necrotizing Enterocolitis)
- **Solar Panel Cases**
- **Tesla Cases**
- **Zantac Cases**
- **Fire Cases** (mencionados)

Cada tipo de caso contiene las siguientes categorías de datos:
1. Case_Info - Información general del caso
2. Case_Notes - Notas y seguimiento del caso
3. Client_Letters - Correspondencia con clientes
4. Client_Damages - Daños y lesiones reportadas
5. Client_Product_Usage - Historial de uso del producto
6. Financial_Info - Información financiera y honorarios
7. Medical_Records - Registros médicos
8. SOL_Data_Tracking - Seguimiento de Statute of Limitations
9. Call_Projects - Gestión de llamadas y proyectos
10. Supporting_Documents - Documentos de soporte

## Arquitectura DynamoDB Propuesta

### Estrategia de Particionamiento
- **Single-table design** con **GSI** (Global Secondary Indexes)
- **Partition Key**: Compuesto para distribución óptima
- **Sort Key**: Para ordenamiento y consultas eficientes

---

## Tablas Principales

### 1. **CasesTable** (Tabla Principal)

#### Estructura de Partición:
```
PK: CASE#{case_type}#{case_id}
SK: META#{timestamp}
```

#### Atributos Core:
```json
{
  "PK": "CASE#HAIR_RELAXER#HR001",
  "SK": "META#2024-01-15T10:30:00Z",
  "GSI1PK": "STATUS#ACTIVE",
  "GSI1SK": "CREATED#2024-01-15T10:30:00Z",
  "GSI2PK": "ATTORNEY#ATT001",
  "GSI2SK": "PRIORITY#HIGH#2024-01-15T10:30:00Z",
  "GSI3PK": "CASE_TYPE#HAIR_RELAXER",
  "GSI3SK": "SOL_DATE#2025-01-15",
  
  // Core Case Information
  "case_id": "HR001",
  "case_type": "HAIR_RELAXER",
  "case_status": "ACTIVE",
  "case_priority": "HIGH",
  "tort_type": "MASS",
  "court_jurisdiction": "FEDERAL",
  "filing_status": "PRE_LITIGATION",
  
  // Client Information
  "client_id": "CL001",
  "client_name": "Maria Rodriguez",
  "client_phone": "+1-555-123-4567",
  "client_email": "maria.rodriguez@email.com",
  "client_address": {
    "street": "123 Main St",
    "city": "Houston",
    "state": "TX",
    "zip": "77001",
    "country": "USA"
  },
  
  // Legal Information
  "attorney_id": "ATT001",
  "law_firm": "Smith & Associates",
  "statute_of_limitations": "2025-01-15",
  "incident_date": "2022-01-15",
  "discovery_date": "2023-01-15",
  
  // Case Valuation
  "estimated_value": 150000,
  "damages_claimed": 125000,
  "medical_expenses": 25000,
  "lost_wages": 15000,
  "pain_suffering": 85000,
  
  // Product Information
  "product_name": "Hair Relaxer Brand X",
  "product_manufacturer": "Beauty Corp",
  "usage_period": {
    "start_date": "2020-01-01",
    "end_date": "2022-01-15",
    "frequency": "WEEKLY"
  },
  
  // Timestamps
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "user@lawfirm.com",
  "updated_by": "user@lawfirm.com",
  
  // Additional Metadata
  "tags": ["high_priority", "medical_review_needed"],
  "version": 1
}
```

### 2. **CaseNotesTable**

#### Estructura:
```
PK: CASE#{case_type}#{case_id}
SK: NOTE#{timestamp}#{note_id}
```

#### Atributos:
```json
{
  "PK": "CASE#HAIR_RELAXER#HR001",
  "SK": "NOTE#2024-01-15T14:30:00Z#N001",
  "GSI1PK": "ATTORNEY#ATT001",
  "GSI1SK": "NOTE_DATE#2024-01-15T14:30:00Z",
  
  "note_id": "N001",
  "case_id": "HR001",
  "note_type": "CLIENT_CALL",
  "note_category": "MEDICAL_UPDATE",
  "subject": "Client reported worsening symptoms",
  "content": "Client called to report increased hair loss...",
  "author": "ATT001",
  "author_name": "John Smith",
  "is_confidential": true,
  "is_work_product": true,
  "attachments": [
    {
      "file_name": "medical_report.pdf",
      "s3_location": "s3://case-documents/HR001/N001/medical_report.pdf",
      "file_size": 1024000,
      "upload_date": "2024-01-15T14:35:00Z"
    }
  ],
  "created_at": "2024-01-15T14:30:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### 3. **MedicalRecordsTable**

#### Estructura:
```
PK: CASE#{case_type}#{case_id}
SK: MEDICAL#{record_date}#{record_id}
```

#### Atributos:
```json
{
  "PK": "CASE#HAIR_RELAXER#HR001",
  "SK": "MEDICAL#2024-01-10#MR001",
  "GSI1PK": "PROVIDER#PRV001",
  "GSI1SK": "RECORD_DATE#2024-01-10",
  "GSI2PK": "MEDICAL_TYPE#DERMATOLOGY",
  "GSI2SK": "SEVERITY#HIGH",
  
  "record_id": "MR001",
  "case_id": "HR001",
  "provider_name": "Dr. Sarah Johnson",
  "provider_id": "PRV001",
  "provider_specialty": "DERMATOLOGY",
  "record_type": "CONSULTATION",
  "record_date": "2024-01-10",
  "diagnosis_codes": ["L65.9", "L66.9"],
  "diagnosis_description": "Alopecia, unspecified",
  "treatment_notes": "Severe hair loss consistent with chemical damage",
  "severity_level": "HIGH",
  "prognosis": "GUARDED",
  "related_to_product": true,
  "causation_opinion": "LIKELY_RELATED",
  "documents": [
    {
      "document_type": "MEDICAL_REPORT",
      "s3_location": "s3://medical-records/HR001/MR001/report.pdf",
      "confidential": true
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 4. **FinancialInfoTable**

#### Estructura:
```
PK: CASE#{case_type}#{case_id}
SK: FINANCIAL#{transaction_date}#{transaction_id}
```

#### Atributos:
```json
{
  "PK": "CASE#HAIR_RELAXER#HR001",
  "SK": "FINANCIAL#2024-01-15#FIN001",
  "GSI1PK": "TRANSACTION_TYPE#EXPENSE",
  "GSI1SK": "AMOUNT#1500",
  "GSI2PK": "ATTORNEY#ATT001",
  "GSI2SK": "DATE#2024-01-15",
  
  "transaction_id": "FIN001",
  "case_id": "HR001",
  "transaction_type": "EXPENSE",
  "category": "MEDICAL_EXPERT",
  "subcategory": "DERMATOLOGIST_REVIEW",
  "amount": 1500.00,
  "currency": "USD",
  "description": "Expert medical review by Dr. Johnson",
  "vendor": "Medical Expert Services LLC",
  "payment_status": "PAID",
  "payment_method": "CHECK",
  "payment_date": "2024-01-15",
  "approved_by": "ATT001",
  "billable_to_client": false,
  "reimbursable": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_by": "admin@lawfirm.com"
}
```

### 5. **DocumentsTable**

#### Estructura:
```
PK: CASE#{case_type}#{case_id}
SK: DOCUMENT#{upload_date}#{document_id}
```

#### Atributos:
```json
{
  "PK": "CASE#HAIR_RELAXER#HR001",
  "SK": "DOCUMENT#2024-01-15#DOC001",
  "GSI1PK": "DOCUMENT_TYPE#MEDICAL_RECORD",
  "GSI1SK": "UPLOAD_DATE#2024-01-15",
  "GSI2PK": "ATTORNEY#ATT001",
  "GSI2SK": "CONFIDENTIAL#TRUE",
  
  "document_id": "DOC001",
  "case_id": "HR001",
  "document_name": "Initial Medical Consultation",
  "document_type": "MEDICAL_RECORD",
  "file_name": "consultation_report.pdf",
  "file_extension": "pdf",
  "file_size": 2048000,
  "mime_type": "application/pdf",
  "s3_bucket": "case-documents-secure",
  "s3_key": "HR001/medical/DOC001/consultation_report.pdf",
  "s3_version_id": "v123456",
  "checksum": "sha256:abc123...",
  "is_confidential": true,
  "is_privileged": true,
  "is_work_product": false,
  "access_level": "RESTRICTED",
  "retention_policy": "7_YEARS",
  "uploaded_by": "ATT001",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "last_accessed": "2024-01-15T10:30:00Z"
}
```

### 6. **ClientCommunicationTable**

#### Estructura:
```
PK: CASE#{case_type}#{case_id}
SK: COMM#{communication_date}#{communication_id}
```

#### Atributos:
```json
{
  "PK": "CASE#HAIR_RELAXER#HR001",
  "SK": "COMM#2024-01-15#COMM001",
  "GSI1PK": "COMM_TYPE#EMAIL",
  "GSI1SK": "DATE#2024-01-15",
  "GSI2PK": "ATTORNEY#ATT001",
  "GSI2SK": "PRIORITY#HIGH",
  
  "communication_id": "COMM001",
  "case_id": "HR001",
  "communication_type": "EMAIL",
  "direction": "OUTBOUND",
  "from_email": "attorney@lawfirm.com",
  "to_email": "client@email.com",
  "cc_emails": ["paralegal@lawfirm.com"],
  "subject": "Case Update - Medical Records Review",
  "content": "Dear Ms. Rodriguez, We have completed...",
  "priority": "HIGH",
  "requires_response": true,
  "response_deadline": "2024-01-20",
  "status": "SENT",
  "sent_by": "ATT001",
  "sent_at": "2024-01-15T15:30:00Z",
  "delivered_at": "2024-01-15T15:31:00Z",
  "read_at": "2024-01-15T16:45:00Z",
  "attachments": [
    {
      "file_name": "case_summary.pdf",
      "s3_location": "s3://communications/HR001/COMM001/case_summary.pdf"
    }
  ]
}
```

### 7. **TimelineTable**

#### Estructura:
```
PK: CASE#{case_type}#{case_id}
SK: TIMELINE#{event_date}#{event_id}
```

#### Atributos:
```json
{
  "PK": "CASE#HAIR_RELAXER#HR001",
  "SK": "TIMELINE#2024-01-15#TL001",
  "GSI1PK": "EVENT_TYPE#STATUTE_OF_LIMITATIONS",
  "GSI1SK": "DUE_DATE#2025-01-15",
  
  "event_id": "TL001",
  "case_id": "HR001",
  "event_type": "STATUTE_OF_LIMITATIONS",
  "event_category": "LEGAL_DEADLINE",
  "event_title": "SOL Filing Deadline",
  "event_description": "Must file suit before statute of limitations expires",
  "event_date": "2025-01-15",
  "due_date": "2025-01-15",
  "priority": "CRITICAL",
  "status": "PENDING",
  "assigned_to": "ATT001",
  "reminder_dates": ["2024-12-15", "2025-01-01", "2025-01-10"],
  "completed": false,
  "completed_date": null,
  "notes": "Monitor closely - critical deadline",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Global Secondary Indexes (GSI)

### GSI1: Status and Priority Index
- **PK**: `STATUS#{status}`
- **SK**: `CREATED#{timestamp}` or `PRIORITY#{priority}#{timestamp}`
- **Uso**: Consultas por estado de caso y prioridad

### GSI2: Attorney Index
- **PK**: `ATTORNEY#{attorney_id}`
- **SK**: `PRIORITY#{priority}#{timestamp}` or `CASE_TYPE#{type}#{timestamp}`
- **Uso**: Casos asignados a abogados específicos

### GSI3: Case Type and SOL Index
- **PK**: `CASE_TYPE#{case_type}`
- **SK**: `SOL_DATE#{sol_date}` or `CREATED#{timestamp}`
- **Uso**: Casos por tipo y fechas críticas de SOL

### GSI4: Client Index
- **PK**: `CLIENT#{client_id}`
- **SK**: `CASE#{case_id}`
- **Uso**: Todos los casos de un cliente

---

## Patrones de Acceso Comunes

### 1. Consultar Casos por Estado
```javascript
// Casos activos ordenados por fecha de creación
const params = {
  TableName: 'CasesTable',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :status',
  ExpressionAttributeValues: {
    ':status': 'STATUS#ACTIVE'
  },
  ScanIndexForward: false // Más recientes primero
};
```

### 2. Casos de un Abogado por Prioridad
```javascript
const params = {
  TableName: 'CasesTable',
  IndexName: 'GSI2',
  KeyConditionExpression: 'GSI2PK = :attorney',
  ExpressionAttributeValues: {
    ':attorney': 'ATTORNEY#ATT001'
  }
};
```

### 3. Casos próximos a vencer SOL
```javascript
const params = {
  TableName: 'CasesTable',
  IndexName: 'GSI3',
  KeyConditionExpression: 'GSI3PK = :case_type AND GSI3SK BETWEEN :start_date AND :end_date',
  ExpressionAttributeValues: {
    ':case_type': 'CASE_TYPE#HAIR_RELAXER',
    ':start_date': 'SOL_DATE#2024-01-01',
    ':end_date': 'SOL_DATE#2024-12-31'
  }
};
```

### 4. Historial Completo de un Caso
```javascript
const params = {
  TableName: 'CasesTable',
  KeyConditionExpression: 'PK = :case_pk',
  ExpressionAttributeValues: {
    ':case_pk': 'CASE#HAIR_RELAXER#HR001'
  }
};
```

---

## Consideraciones de Seguridad

### 1. Encriptación
- **En reposo**: Habilitada con AWS KMS
- **En tránsito**: TLS 1.2+
- **Campo-específica**: Para datos médicos sensibles

### 2. Control de Acceso
- **IAM Roles**: Por tipo de usuario (Attorney, Paralegal, Admin)
- **Fine-grained access**: Usando VPC endpoints y condition keys
- **Audit trail**: CloudTrail para todas las operaciones

### 3. Retención de Datos
- **Legal compliance**: 7 años mínimo
- **Backup strategy**: Point-in-time recovery habilitado
- **Archival**: S3 Glacier para documentos antiguos

---

## Estimaciones de Costos (Mensual)

### DynamoDB
- **Casos activos**: ~10,000 items
- **Casos totales**: ~50,000 items
- **Read/Write Capacity**: On-demand pricing
- **Estimado**: $200-400/mes

### S3 Storage
- **Documentos**: ~1TB/mes de crecimiento
- **Estimado**: $25-50/mes

### Lambda + API Gateway
- **Procesamiento**: ~1M invocaciones/mes
- **Estimado**: $50-100/mes

**Total estimado**: $275-550/mes

---

## Migración y Implementación

### Fase 1: Setup Infrastructure
1. Crear tablas DynamoDB con GSIs
2. Configurar S3 buckets con lifecycle policies
3. Setup IAM roles y políticas

### Fase 2: Data Migration
1. ETL desde Excel hacia DynamoDB
2. Migración de documentos a S3
3. Validación de integridad de datos

### Fase 3: Integration Testing
1. Testing de patrones de acceso
2. Performance testing
3. Security testing

### Fase 4: Salesforce Integration
1. Configurar Named Credentials
2. Implementar Apex callouts
3. Build Lightning components

¿Te gustaría que profundice en algún aspecto específico de esta arquitectura o que proceda con la implementación de alguna parte? 