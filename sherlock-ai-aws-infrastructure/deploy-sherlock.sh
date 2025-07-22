#!/bin/bash

# Sherlock AI Legal Database - Complete Deployment Script
# Watts Law Firm - Mass Tort Case Management System

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SHERLOCK AI DEPLOYMENT                   ║"
echo "║               Legal Case Management System                   ║"
echo "║                     Watts Law Firm                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Step 1: Validate Prerequisites
echo -e "${BLUE}🔍 Paso 1: Validando prerrequisitos...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Por favor instala Node.js 18+ antes de continuar.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js versión 18+ requerida. Versión actual: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detectado${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}⚠️  AWS CLI no detectado. Instalando...${NC}"
    
    # Detect OS and install AWS CLI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install awscli
        else
            echo -e "${RED}❌ Homebrew no detectado en macOS. Instala AWS CLI manualmente.${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
        rm -rf aws awscliv2.zip
    else
        echo -e "${RED}❌ OS no soportado para instalación automática de AWS CLI.${NC}"
        echo "Por favor instala AWS CLI manualmente: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
fi

echo -e "${GREEN}✅ AWS CLI disponible${NC}"

# Step 2: Install Dependencies
echo -e "\n${BLUE}📦 Paso 2: Instalando dependencias...${NC}"

if [ ! -d "node_modules" ]; then
    echo "Instalando paquetes NPM..."
    npm install
else
    echo -e "${GREEN}✅ node_modules ya existe${NC}"
fi

# Step 3: Configure AWS Credentials
echo -e "\n${BLUE}🔧 Paso 3: Configurando credenciales AWS...${NC}"

npm run configure-aws

# Verify AWS configuration
echo -e "\n${CYAN}Verificando configuración AWS...${NC}"
aws sts get-caller-identity || {
    echo -e "${RED}❌ Error de configuración AWS. Verifica las credenciales.${NC}"
    exit 1
}

# Step 4: Bootstrap CDK (if needed)
echo -e "\n${BLUE}🚀 Paso 4: Preparando CDK Bootstrap...${NC}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"

# Check if CDK is already bootstrapped
if aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION &>/dev/null; then
    echo -e "${GREEN}✅ CDK ya está bootstrapped en esta cuenta/región${NC}"
else
    echo -e "${YELLOW}⚠️  Ejecutando CDK Bootstrap...${NC}"
    npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
    echo -e "${GREEN}✅ CDK Bootstrap completado${NC}"
fi

# Step 5: Build TypeScript
echo -e "\n${BLUE}🔨 Paso 5: Compilando TypeScript...${NC}"
npm run build

# Step 6: Synthesize CloudFormation
echo -e "\n${BLUE}📋 Paso 6: Generando CloudFormation template...${NC}"
npx cdk synth

# Step 7: Review changes (diff)
echo -e "\n${BLUE}🔍 Paso 7: Revisando cambios...${NC}"
npx cdk diff || echo -e "${YELLOW}⚠️  Primera ejecución - no hay stack existente para comparar${NC}"

# Step 8: Deploy with confirmation
echo -e "\n${PURPLE}🚀 Paso 8: ¿Proceder con el despliegue de Sherlock AI?${NC}"
echo -e "${YELLOW}Este proceso creará:${NC}"
echo "  • 7 Tablas DynamoDB encriptadas"
echo "  • 3 Buckets S3 con políticas de retención legal"
echo "  • KMS Key para encriptación"
echo "  • IAM Roles para diferentes niveles de acceso"
echo "  • API Gateway para integración con Salesforce"
echo "  • Lambda functions para monitoreo SOL"
echo ""
echo -e "${YELLOW}Costo estimado: \$275-550/mes${NC}"
echo ""

read -p "¿Confirmar despliegue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}🚀 Iniciando despliegue de Sherlock AI...${NC}"
    
    # Deploy with verbose logging
    npx cdk deploy --require-approval never --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}"
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║                  ✅ DESPLIEGUE EXITOSO                      ║"
        echo "║               Sherlock AI está listo para usar              ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        
        # Display important outputs
        echo -e "\n${CYAN}📋 Información importante para Salesforce:${NC}"
        echo ""
        
        # Get stack outputs
        STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name SherlockAILegalDatabaseStack --query 'Stacks[0].Outputs' --output json)
        
        # Parse and display key outputs
        echo -e "${BLUE}API Gateway Endpoint:${NC}"
        echo "$STACK_OUTPUTS" | grep -A 2 "SherlockAPIEndpoint" | grep "OutputValue" | sed 's/.*: "\(.*\)".*/\1/'
        echo ""
        
        echo -e "${BLUE}API Key ID para Named Credential:${NC}" 
        echo "$STACK_OUTPUTS" | grep -A 2 "SalesforceAPIKeyId" | grep "OutputValue" | sed 's/.*: "\(.*\)".*/\1/'
        echo ""
        
        echo -e "${BLUE}KMS Key ARN:${NC}"
        echo "$STACK_OUTPUTS" | grep -A 2 "KMSKeyArn" | grep "OutputValue" | sed 's/.*: "\(.*\)".*/\1/'
        echo ""
        
        # Next steps
        echo -e "\n${PURPLE}🎯 Próximos pasos:${NC}"
        echo "1. Configurar Named Credential en Salesforce con la API Key"
        echo "2. Implementar Apex classes para comunicación con DynamoDB"
        echo "3. Migrar datos existentes usando las Lambda functions"
        echo "4. Configurar permisos de usuario según roles (Attorney/Paralegal)"
        echo "5. Implementar DocuSign integration"
        echo ""
        
        echo -e "${GREEN}🎉 Sherlock AI Legal Database está operacional!${NC}"
        
    else
        echo -e "\n${RED}"
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║                    ❌ DESPLIEGUE FALLÓ                      ║"
        echo "║                Revisa los logs para detalles                ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        exit 1
    fi
    
else
    echo -e "\n${YELLOW}⏸️  Despliegue cancelado por el usuario${NC}"
    exit 0
fi

# Step 9: Optional - Setup monitoring alerts
echo -e "\n${BLUE}📊 ¿Configurar alertas de monitoreo? (y/N): ${NC}"
read -p "" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Configurando alertas CloudWatch para SOL monitoring...${NC}"
    
    # Create CloudWatch alarms for critical deadlines
    aws cloudwatch put-metric-alarm \
        --alarm-name "SherlockAI-SOL-Critical-Deadlines" \
        --alarm-description "Alert when cases are within 30 days of SOL expiry" \
        --metric-name "SOLDeadlinesApproaching" \
        --namespace "SherlockAI/Legal" \
        --statistic "Sum" \
        --period 86400 \
        --threshold 1 \
        --comparison-operator "GreaterThanOrEqualToThreshold" \
        --evaluation-periods 1 || echo -e "${YELLOW}⚠️  Alerta de SOL no pudo configurarse${NC}"
    
    echo -e "${GREEN}✅ Alertas configuradas${NC}"
fi

echo -e "\n${PURPLE}🏁 Instalación de Sherlock AI completada exitosamente!${NC}"
echo -e "${CYAN}Para soporte técnico o consultas legales sobre el sistema, contacta al equipo de desarrollo.${NC}\n" 