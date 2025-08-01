#!/bin/bash

echo "🔧 Actualizando configuración de CloudFront..."

# Obtener la configuración actual
aws cloudfront get-distribution-config --id EAGB3KBNKHJYZ > cloudfront-config.json

# Extraer ETag
ETAG=$(jq -r '.ETag' cloudfront-config.json)

# Crear nueva configuración con el endpoint de website
jq '.DistributionConfig.Origins.Items[0].DomainName = "intellilearn-prod-app.s3-website-us-east-1.amazonaws.com" | 
    .DistributionConfig.Origins.Items[0].S3OriginConfig = null |
    .DistributionConfig.Origins.Items[0].CustomOriginConfig = {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only",
        "OriginSslProtocols": {
            "Quantity": 3,
            "Items": ["TLSv1", "TLSv1.1", "TLSv1.2"]
        },
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5
    }' cloudfront-config.json > new-config.json

# Extraer solo la DistributionConfig
jq '.DistributionConfig' new-config.json > distribution-config.json

# Actualizar la distribución
echo "Actualizando distribución CloudFront..."
aws cloudfront update-distribution \
    --id EAGB3KBNKHJYZ \
    --distribution-config file://distribution-config.json \
    --if-match $ETAG

echo "✅ Configuración actualizada"
echo ""
echo "⏳ Esperando propagación de cambios (puede tomar 15-20 minutos)..."
echo ""
echo "Mientras tanto, verifica que el sitio funcione en:"
echo "http://intellilearn-prod-app.s3-website-us-east-1.amazonaws.com/"

# Limpiar archivos temporales
rm -f cloudfront-config.json new-config.json distribution-config.json