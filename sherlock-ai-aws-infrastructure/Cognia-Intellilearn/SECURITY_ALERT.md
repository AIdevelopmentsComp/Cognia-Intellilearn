# ALERTA DE SEGURIDAD: Credenciales AWS Expuestas

## Problema Detectado

Se han detectado credenciales de AWS en el historial de commits del repositorio. Específicamente, el commit `0216cc4b952c4f10076c3455fba5953c40dd2db5` contiene un archivo `.env.local` con las siguientes credenciales expuestas:

- Amazon AWS Access Key ID
- Amazon AWS Secret Access Key

## Acciones Inmediatas Tomadas

1. Se ha eliminado el archivo `.env.local` del repositorio actual con `git rm --cached .env.local`
2. Se ha agregado `.env.local` al archivo `.gitignore` para evitar commits futuros
3. Se ha creado un nuevo commit para registrar estos cambios

## Pasos Necesarios para Resolver el Problema

El problema persiste porque las credenciales siguen existiendo en el historial de commits. Para resolver esto, es necesario:

### Opción 1: Permitir las credenciales (NO RECOMENDADO)

Puedes usar los enlaces proporcionados por GitHub para permitir estas credenciales específicas:
- https://github.com/AIdevelopmentsComp/Cognia-Intellilearn/security/secret-scanning/unblock-secret/30msfVwHidHKzE6BNE26rF4NN80
- https://github.com/AIdevelopmentsComp/Cognia-Intellilearn/security/secret-scanning/unblock-secret/30msfSpu1AJO7teHDxKdpc1KJdR

Sin embargo, esta opción NO es recomendada por razones de seguridad.

### Opción 2: Reescribir el historial de Git (RECOMENDADO)

1. Revocar inmediatamente las credenciales AWS expuestas en la consola AWS
2. Crear nuevas credenciales
3. Reescribir el historial de Git para eliminar el archivo `.env.local` de todos los commits anteriores

```bash
# Comando para reescribir el historial y eliminar .env.local de todos los commits
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch sherlock-ai-aws-infrastructure/Cognia-Intellilearn/.env.local" --prune-empty --tag-name-filter cat -- --all

# Forzar el push al repositorio remoto
git push --force
```

## Mejores Prácticas para el Futuro

1. **Nunca** incluir archivos `.env`, `.env.local` o similares en repositorios Git
2. Usar siempre `.gitignore` para excluir archivos con credenciales
3. Considerar el uso de AWS Secrets Manager o AWS Parameter Store para gestionar credenciales
4. Implementar rotación regular de credenciales
5. Utilizar IAM Roles en lugar de Access Keys cuando sea posible

## Recursos Adicionales

- [Documentación de GitHub sobre protección de push](https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line#resolving-a-blocked-push)
- [Mejores prácticas de seguridad para AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Cómo reescribir el historial de Git](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)