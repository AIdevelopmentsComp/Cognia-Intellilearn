# 🕵️ Sherlock AI - Legal Case Management Database

## Sistema Integral de Gestión de Casos Mass Tort y Single Event

**Watts Law Firm - Professional Legal Technology Solution**

---

## 📋 Descripción del Proyecto

**Sherlock AI** es una base de datos especializada para la gestión de casos legales, diseñada específicamente para bufetes de abogados que manejan:

- **Mass Tort Litigation** (Hair Relaxer, NEC, Solar Panel, Tesla, Zantac, etc.)
- **Single Event Cases** 
- **Product Liability Claims**
- **Personal Injury Cases**

### 🎯 Características Principales

✅ **Compliance Jurídico Completo**: Cumple con ABA Model Rules, HIPAA, Attorney-Client Privilege  
✅ **Arquitectura Enterprise**: AWS DynamoDB + S3 + KMS encryption  
✅ **Integración Salesforce**: API Gateway con Named Credentials  
✅ **Monitoreo SOL**: Automated Statute of Limitations tracking  
✅ **Roles Legales**: Attorney, Paralegal, Admin access controls  
✅ **Preparación DocuSign**: Ready for document signing workflow  

---

## 🏗️ Arquitectura de la Solución

### Base de Datos DynamoDB
- **sherlock-cases-main**: Casos principales con GSIs
- **sherlock-parties-roles**: Injured parties, executors, guardians
- **sherlock-legal-representatives**: Legal representation tracking
- **sherlock-witnesses**: Fact and expert witnesses
- **sherlock-medical-records**: HIPAA-compliant medical data
- **sherlock-financial-ledger**: Trust account & cost tracking
- **sherlock-documents**: Privileged document management

### Almacenamiento S3
- **Privileged Documents**: Attorney-client privileged files
- **Medical Records**: HIPAA-compliant storage 
- **Communications**: Email and correspondence archive

### Seguridad y Compliance
- **KMS Encryption**: All data encrypted at rest and in transit
- **IAM Role-based Access**: Attorney/Paralegal/Admin permissions
- **Legal Retention Policies**: 7-year minimum retention
- **Audit Trails**: Complete access logging

---

## 🚀 Instalación y Despliegue

### Prerrequisitos
- **Node.js 18+**
- **AWS CLI** 
- **Git**
- **Credenciales AWS** (proporcionadas)

### Despliegue Automático

```bash
# 1. Clonar y navegar al directorio
cd sherlock-ai-aws-infrastructure

# 2. Ejecutar script de despliegue completo
chmod +x deploy-sherlock.sh
./deploy-sherlock.sh
```

El script automáticamente:
1. ✅ Valida prerrequisitos
2. 📦 Instala dependencias NPM
3. 🔧 Configura credenciales AWS  
4. 🚀 Ejecuta CDK Bootstrap
5. 🔨 Compila TypeScript
6. 📋 Genera CloudFormation
7. 🚀 Despliega infraestructura
8. 📊 Configura monitoreo

### Despliegue Manual (Paso a Paso)

```bash
# Instalar dependencias
npm install

# Configurar AWS
npm run configure-aws

# Bootstrap CDK
npx cdk bootstrap

# Compilar y desplegar
npm run build
npm run deploy
```

---

## 📊 Estructura de Datos Legales

### Caso Principal (SherlockCasesMain)
```json
{
  "matter_number": "HR2024001",
  "case_caption": "Rodriguez v. Beauty Corp., et al.",
  "litigation_phase": "DISCOVERY",
  "statute_of_limitations_expiry": "2025-01-15",
  "lead_counsel_id": "ATT001",
  "damages_claimed": {
    "economic_damages": 265000.00,
    "non_economic_damages": 305000.00,
    "punitive_damages_sought": true
  }
}
```

### Partes y Roles (SherlockPartiesRoles)
```json
{
  "party_type": "INJURED_PARTY", 
  "legal_capacity": "COMPETENT_ADULT",
  "relationship_to_case": "DIRECTLY_INJURED",
  "injury_classification": "CHEMICAL_BURNS_HAIR_LOSS",
  "current_medical_status": "ONGOING_TREATMENT"
}
```

### Representantes Legales
```json
{
  "representative_type": "EXECUTOR",
  "appointment_basis": "WILL_DESIGNATION", 
  "settlement_authority_limit": 50000.00,
  "fiduciary_bond_posted": true
}
```

---

## 🔍 Consultas de Datos Avanzadas

### 1. Casos con SOL Próximo a Vencer
```javascript
const criticalSOLCases = await dynamoDB.query({
  IndexName: 'GSI1-LitigationStatus',
  KeyConditionExpression: 'GSI1PK = :status AND GSI1SK BETWEEN :start AND :end',
  ExpressionAttributeValues: {
    ':status': 'LITIGATION_STATUS#ACTIVE_DISCOVERY',
    ':start': 'STATUTE_EXPIRY#2024-01-01',
    ':end': 'STATUTE_EXPIRY#2024-06-30'
  }
});
```

### 2. Carga de Trabajo por Attorney
```javascript
const attorneyCases = await dynamoDB.query({
  IndexName: 'GSI2-AttorneyWorkload', 
  KeyConditionExpression: 'GSI2PK = :attorney',
  ExpressionAttributeValues: {
    ':attorney': 'COUNSEL_OF_RECORD#ATT001'
  }
});
```

### 3. Reconciliación de Trust Account
```javascript
const trustTransactions = await dynamoDB.query({
  IndexName: 'GSI2-TrustAccount',
  KeyConditionExpression: 'GSI2PK = :account AND GSI2SK BETWEEN :start AND :end',
  ExpressionAttributeValues: {
    ':account': 'TRUST_ACCOUNT#SHERLOCK_IOLTA_001',
    ':start': 'DATE#2024-01-01',
    ':end': 'DATE#2024-01-31'
  }
});
```

---

## 🔐 Seguridad y Compliance

### Attorney-Client Privilege Protection
- Document privilege classification
- Work product doctrine safeguards
- Confidentiality level management
- Access control by role

### HIPAA Compliance (Medical Records)
- PHI encryption in transit and at rest
- Audit logging for all access
- Retention policy automation
- Provider authorization tracking

### Trust Account (IOLTA) Management
- Segregated client funds tracking
- Transaction-level audit trail
- Cost advance reconciliation
- Fee calculation compliance

---

## 🔌 Integración con Salesforce

### Named Credential Setup
1. Crear Named Credential en Salesforce
2. Usar API Key ID del deployment output
3. Configurar endpoint del API Gateway
4. Implementar Apex callouts

### Ejemplo Apex Integration
```apex
public class SherlockAIService {
    
    @future(callout=true)
    public static void syncCaseData(String caseId) {
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Sherlock_AI_API/cases/' + caseId);
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');
        
        Http http = new Http();
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() == 200) {
            // Process Sherlock AI response
            SherlockCaseWrapper caseData = 
                (SherlockCaseWrapper) JSON.deserialize(
                    res.getBody(), 
                    SherlockCaseWrapper.class
                );
            
            // Update Salesforce records
            updateSalesforceCase(caseData);
        }
    }
}
```

---

## 📈 Monitoreo y Alertas

### CloudWatch Dashboards
- SOL deadline monitoring
- Database performance metrics  
- API Gateway usage analytics
- Cost tracking and optimization

### Automated Alerts
- Critical SOL deadlines (7, 30, 60, 90 days)
- Failed API calls
- Unusual access patterns
- Trust account discrepancies

---

## 💰 Costos Estimados

### AWS Infrastructure (Monthly)
- **DynamoDB**: $200-400 (on-demand pricing)
- **S3 Storage**: $25-50 (with lifecycle policies)
- **Lambda/API Gateway**: $50-100 
- **KMS/CloudWatch**: $25-50
- **Total**: $300-600/mes

### Factores de Costo
- Número de casos activos
- Volumen de documentos
- Frecuencia de consultas API
- Retención de datos

---

## 🛠️ Mantenimiento y Soporte

### Actualizaciones Regulares
- Security patches mensual
- Feature releases trimestral
- Compliance audits anuales

### Backup y Disaster Recovery
- Point-in-time recovery habilitado
- Cross-region backup replication
- RTO: 2 horas, RPO: 15 minutos

### Monitoring Proactivo
- Alertas automáticas 24/7
- Performance optimization
- Capacity planning

---

## 📞 Soporte y Contacto

### Soporte Técnico
- **Email**: support@watts-law-tech.com
- **Emergency**: +1-XXX-XXX-XXXX
- **Hours**: 24/7 for critical issues

### Documentación Legal
- ABA Model Rules compliance
- State bar requirements
- HIPAA technical safeguards
- Trust account regulations

---

## 🚨 Importante - Consideraciones Legales

⚠️ **PRIVILEGIO ATTORNEY-CLIENT**: Este sistema contiene comunicaciones privilegiadas. El acceso no autorizado constituye una violación del privilegio attorney-client.

⚠️ **DATOS MÉDICOS PROTEGIDOS**: Cumple con HIPAA. Todo acceso está auditado y registrado.

⚠️ **TRUST ACCOUNT**: Las transacciones financieras están sujetas a reglas de cuentas fiduciarias (IOLTA) del estado.

---

## 📄 Licencia

**PROPRIETARY** - Watts Law Firm
Todos los derechos reservados. No se permite distribución sin autorización.

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Desarrollado por**: Legal Technology Team - Watts Law Firm 