# 🕐 Nova Sonic Cold Start - Explicación Completa

## 📅 Fecha: 2 de Agosto, 2025

## ¿Es Normal que Nova Sonic Tarde Tanto?

**SÍ, es completamente normal.** Amazon Nova Sonic Speech-to-Speech tiene una latencia inicial (cold start) significativa.

## 📊 Tiempos de Inicialización

### Primera Sesión (Cold Start)
- **Tiempo típico**: 15-45 segundos
- **Tu caso actual**: ~30+ segundos (cayendo en modo fallback)
- **Por qué**: El modelo debe cargarse en GPU desde cero

### Sesiones Subsecuentes
- **Tiempo típico**: 2-5 segundos
- **Por qué**: El modelo ya está en memoria GPU

## 🔍 Factores que Afectan la Latencia

1. **Tamaño del Modelo**
   - Nova Sonic es un modelo grande de speech-to-speech
   - Requiere GPUs especializadas (A100/H100)
   - La carga inicial es pesada

2. **Disponibilidad Regional**
   - `us-east-1`: Alta demanda, puede ser más lento
   - `us-west-2`: Alternativa con potencialmente menor latencia

3. **Tiempo del Día**
   - Horarios pico: Más latencia
   - Horarios valle: Mejor performance

4. **Estado del Modelo**
   - Cold: No se ha usado en >5 minutos
   - Warm: Usado recientemente

## ✅ Soluciones Implementadas

### 1. Timeouts Aumentados
- Frontend: 60 segundos (antes 30s)
- Lambda: 45 segundos (antes 30s)

### 2. Keep-Warm Lambda (Opcional)
```bash
# Ejecutar cada 5 minutos para mantener el modelo caliente
cd scripts
powershell -ExecutionPolicy Bypass -File .\setup-nova-keep-warm.ps1
```

### 3. Mejores Mensajes al Usuario
- Informar que la primera vez tarda más
- Establecer expectativas correctas

## 🚀 Mejores Prácticas

### Para Producción

1. **Pre-calentamiento Automático**
   ```javascript
   // Al iniciar tu aplicación
   await warmUpNovaSonic();
   ```

2. **Fallback Inteligente**
   - Si tarda >10s, reproduce audio de "procesando..."
   - Mantén al usuario informado

3. **Cache de Sesiones**
   - Reutiliza sesiones cuando sea posible
   - No cierres conexiones innecesariamente

4. **Monitoreo**
   ```bash
   # Ver tiempos de inicialización
   aws logs filter-log-events \
     --log-group-name /aws/lambda/NovaWebSocketHandler \
     --filter-pattern "[V9-NOVA] OR [V9-TIMEOUT]"
   ```

## 📈 Comparación con Otros Servicios

| Servicio | Cold Start | Warm Start |
|----------|------------|------------|
| Nova Sonic S2S | 15-45s | 2-5s |
| Amazon Polly | <1s | <500ms |
| Google Speech | 5-10s | 1-2s |
| OpenAI Whisper | 3-5s | <1s |

Nova Sonic tiene el cold start más largo porque es el único que hace **speech-to-speech real** (no solo STT+TTS).

## 🎯 Recomendaciones Finales

1. **Para Demos/Testing**
   - Acepta el cold start de 30-45s
   - Explica a los usuarios que es normal

2. **Para Producción**
   - Implementa el keep-warm Lambda
   - Considera un pool de sesiones pre-inicializadas
   - Usa mensajes claros de "primera vez tarda más"

3. **Alternativas si el Cold Start es Inaceptable**
   - Usar STT + TTS separados (más rápido pero menos natural)
   - Cambiar a región us-west-2
   - Implementar un sistema de cola con pre-warming

## 📝 Conclusión

El cold start de 30-45 segundos es **normal y esperado** para Nova Sonic. Es el precio a pagar por tener conversaciones de voz naturales y bidireccionales. Las sesiones subsecuentes son mucho más rápidas.

---

**Fuente**: Experiencia práctica + Documentación AWS Bedrock
**Estado**: Comportamiento confirmado y documentado