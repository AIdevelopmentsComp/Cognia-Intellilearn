const { CognitoIdentityProviderClient, InitiateAuthCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config({ path: '.env.aws' });
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function debugLogin() {
  try {
    console.log('🔍 Diagnóstico completo del sistema de login\n');
    
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    
    console.log('📋 Configuración actual:');
    console.log(`User Pool ID: ${userPoolId}`);
    console.log(`Client ID: ${clientId}`);
    console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);
    
    // Verificar usuarios existentes
    console.log('👥 Verificando usuarios...');
    const listCommand = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 10
    });
    
    const users = await client.send(listCommand);
    console.log(`Total de usuarios: ${users.Users.length}`);
    
    // Buscar o crear usuario demo
    let demoUserExists = false;
    for (const user of users.Users) {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      if (email === 'demo@intellilearn.com') {
        demoUserExists = true;
        console.log(`✅ Usuario demo encontrado - Status: ${user.UserStatus}`);
        break;
      }
    }
    
    if (!demoUserExists) {
      console.log('❌ Usuario demo no encontrado. Creándolo...');
      
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: 'demo@intellilearn.com',
        UserAttributes: [
          { Name: 'email', Value: 'demo@intellilearn.com' },
          { Name: 'email_verified', Value: 'true' }
        ],
        MessageAction: 'SUPPRESS',
        TemporaryPassword: 'TempPass123!'
      });
      
      await client.send(createCommand);
      console.log('✅ Usuario creado');
    }
    
    // Establecer contraseña permanente
    console.log('\n🔐 Estableciendo contraseña permanente...');
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: 'demo@intellilearn.com',
      Password: 'Demo2025!',
      Permanent: true
    });
    
    await client.send(setPasswordCommand);
    console.log('✅ Contraseña establecida: Demo2025!');
    
    // Probar login
    console.log('\n🔓 Probando login...');
    const loginCommand = new InitiateAuthCommand({
      ClientId: clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: 'demo@intellilearn.com',
        PASSWORD: 'Demo2025!'
      }
    });
    
    const response = await client.send(loginCommand);
    
    if (response.AuthenticationResult) {
      console.log('✅ Login exitoso desde backend!\n');
      
      console.log('📝 RESUMEN:');
      console.log('===========');
      console.log('URL: https://telmoai.mx');
      console.log('Email: demo@intellilearn.com');
      console.log('Password: Demo2025!');
      console.log('\n⚠️  Si no puedes entrar desde el navegador:');
      console.log('1. Limpia las cookies y caché del navegador');
      console.log('2. Intenta en modo incógnito');
      console.log('3. Verifica la consola del navegador (F12) para ver errores');
      console.log('\n🔧 Posibles causas del problema:');
      console.log('- Caché del navegador con datos antiguos');
      console.log('- Cookies de sesiones anteriores');
      console.log('- Problema de CORS si hay errores en consola');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLogin();