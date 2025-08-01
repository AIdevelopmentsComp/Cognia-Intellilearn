const { CognitoIdentityProviderClient, InitiateAuthCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config({ path: '.env.aws' });
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function testLogin() {
  try {
    console.log('🔐 Probando login con Cognito...\n');
    
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const email = 'demo@intellilearn.com';
    const password = 'Demo2025!';
    
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Client ID: ${clientId}\n`);
    
    // Primero, asegurémonos de que la contraseña esté establecida correctamente
    console.log('1. Estableciendo contraseña permanente...');
    try {
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true
      });
      
      await client.send(setPasswordCommand);
      console.log('✅ Contraseña establecida correctamente\n');
    } catch (error) {
      console.log('⚠️  No se pudo establecer la contraseña (puede que ya esté establecida)\n');
    }
    
    // Ahora intentar el login
    console.log('2. Intentando login...');
    const loginCommand = new InitiateAuthCommand({
      ClientId: clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });
    
    const response = await client.send(loginCommand);
    
    if (response.AuthenticationResult) {
      console.log('✅ Login exitoso!');
      console.log('\nTokens recibidos:');
      console.log(`- Access Token: ${response.AuthenticationResult.AccessToken?.substring(0, 50)}...`);
      console.log(`- ID Token: ${response.AuthenticationResult.IdToken?.substring(0, 50)}...`);
      console.log(`- Refresh Token: ${response.AuthenticationResult.RefreshToken?.substring(0, 50)}...`);
      
      console.log('\n🎉 El usuario puede iniciar sesión correctamente');
      console.log('\n📝 Credenciales verificadas:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else if (response.ChallengeName) {
      console.log(`⚠️  Se requiere completar un desafío: ${response.ChallengeName}`);
    }
    
  } catch (error) {
    console.error('❌ Error en el login:', error.message);
    
    if (error.name === 'NotAuthorizedException') {
      console.log('\n❌ Credenciales incorrectas');
      console.log('   Verifica que estés usando el email y contraseña correctos');
    } else if (error.name === 'UserNotFoundException') {
      console.log('\n❌ Usuario no encontrado');
    } else {
      console.log('\n❌ Error desconocido:', error);
    }
  }
}

testLogin();