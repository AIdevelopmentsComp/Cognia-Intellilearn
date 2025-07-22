# Sherlock AI - Data Migration

## Migración de Casos Mass Tort a DynamoDB

Este directorio contiene los scripts para migrar datos de casos legales desde archivos Excel a las tablas DynamoDB de Sherlock AI.

### 📋 Proyectos Incluidos
- **NEC** - Necrotizing Enterocolitis cases
- **HAIR_RELAXER** - Hair Relaxer product liability cases  
- **ZANTAC** - Zantac litigation cases

### 🔑 Identificador Principal
- **Matter_Number** - Mapea directamente a `Claim_Id__c` en Salesforce
- Se usa como identificador universal en todas las tablas
- Formato: `NEC2024001`, `HR2024001`, `ZAN2024001`

---

## 🚀 Ejecución Rápida

### 1. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 2. Ejecutar Migración
```bash
python run-migration.py
```

---

## 📊 Tablas Objetivo

### **sherlock-cases-main**
- Información principal del caso
- Cliente, attorney, status, damages
- PK: `MATTER#{matter_number}`

### **sherlock-parties-roles** 
- Injured parties y roles legales
- Información de contacto completa
- PK: `MATTER#{matter_number}`

### **sherlock-medical-records**
- Registros médicos por caso
- Providers, diagnósticos, tratamientos
- PK: `MATTER#{matter_number}`

### **sherlock-financial-ledger**
- Trust account y transacciones
- Costos, honorarios, gastos
- PK: `MATTER#{matter_number}`

---

## 📁 Estructura de Archivos Excel

### **NEC Data Files**
```
Case_Info.xlsx          # Información principal
Medical_Records.xlsx    # Registros médicos
Financial_Info.xlsx     # Información financiera
Client_Damages.xlsx     # Damages
SOL_Data_Tracking.xlsx  # Statute of limitations
```

### **HAIR RELAXER Data Files** 
```
HAIR Data Files/
├── Case_Info.xlsx
├── Medical_Records.xlsx  
├── Financial_Info.xlsx
└── [otros archivos similares]
```

### **ZANTAC Data Files**
```
ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - pt1.xlsx
ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - pt2.xlsx
ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - pt3.xlsx
ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - pt4.xlsx
```

---

## 🔍 Mapeo de Campos

### **Case_Info.xlsx → sherlock-cases-main**
| Excel Column | DynamoDB Field | Descripción |
|--------------|----------------|-------------|
| `Matter_Number` / `Claim_Id__c` | `matter_number` | Identificador principal |
| `Client_Name` / `First_Name` | `client_name` | Nombre del cliente |
| `Status` | `case_status` | Estado del caso |
| `Attorney` | `attorney_assigned` | Attorney asignado |
| `Phone` | `client_phone` | Teléfono principal |
| `Email` | `client_email` | Email del cliente |
| `Address` | `client_address` | Dirección completa |

### **Medical_Records.xlsx → sherlock-medical-records**
| Excel Column | DynamoDB Field | Descripción |
|--------------|----------------|-------------|
| `Provider_Name` | `provider_name` | Nombre del proveedor médico |
| `Specialty` | `provider_specialty` | Especialidad médica |
| `Date` | `encounter_date` | Fecha del encuentro |
| `Diagnosis` | `diagnosis` | Diagnóstico |
| `Causation` | `causation_opinion` | Opinión de causación |

### **Financial_Info.xlsx → sherlock-financial-ledger**
| Excel Column | DynamoDB Field | Descripción |
|--------------|----------------|-------------|
| `Amount` | `amount` | Cantidad de la transacción |
| `Type` | `transaction_type` | Tipo de transacción |
| `Description` | `description` | Descripción del gasto |
| `Vendor` | `vendor_name` | Proveedor o payee |
| `Date` | `transaction_date` | Fecha de transacción |

---

## 📝 Logs y Monitoreo

### **Archivos de Log**
- `migration_YYYYMMDD_HHMMSS.log` - Log detallado de la migración
- `migration_results.json` - Resumen de resultados en JSON

### **Ejemplo de Output**
```
📊 NEC:
   Cases: 1281
   Medical Records: 1771  
   Financial Records: 110

📊 HAIR_RELAXER:
   Cases: 1481
   Medical Records: 2341
   Financial Records: 113

🎯 TOTALS:
   Total Cases: 2762
   Total Medical Records: 4112
   Total Financial Records: 223
```

---

## 🔧 Configuración Avanzada

### **Variables de Entorno**
```bash
AWS_REGION=us-east-1
AWS_PROFILE=default
```

### **Personalizar Matter_Number**
```python
# En sherlock_data_loader.py
case_prefix = {
    'NEC': 'NEC',
    'HAIR_RELAXER': 'HR', 
    'ZANTAC': 'ZAN'
}
```

---

## ⚠️ Consideraciones Importantes

1. **Bucket S3 Productivo**: No modificar `wattsnewclassified`
2. **Matter_Number**: Debe ser único y consistente
3. **Datos Sensibles**: Toda la información está encriptada con KMS
4. **Rollback**: Mantener backups antes de ejecutar
5. **Performance**: Migración en batch para evitar throttling

---

## 🆘 Troubleshooting

### **Error: AWS credentials not configured**
```bash
aws configure
# Ingresar Access Key ID y Secret Access Key
```

### **Error: Table not found**
```bash
# Verificar que Sherlock AI esté desplegado
aws dynamodb list-tables --region us-east-1
```

### **Error: Excel file not found**
```bash
# Verificar estructura de directorios
ls -la "../NEC Data Files/"
```

---

## 📞 Soporte

Para problemas con la migración:
1. Revisar los logs detallados
2. Verificar conectividad AWS
3. Validar estructura de archivos Excel
4. Contactar al equipo de desarrollo

---

**Sherlock AI Legal Database** - Mass Tort Case Management System  
*Watts Law Firm - Technology Division* 