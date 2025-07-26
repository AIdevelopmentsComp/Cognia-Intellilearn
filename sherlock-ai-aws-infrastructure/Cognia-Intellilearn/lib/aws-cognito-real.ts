import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';

// Configuración de Cognito usando las credenciales correctas
const COGNITO_CONFIG = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_ZRhTo5zvG',
  clientId: '37n270qpd9os6e92uadus8cqor',
  identityPoolId: 'us-east-1:88239e31-286e-4125-99f5-691dd32b45fe'
};

console.log('🔧 Cognito Config:', COGNITO_CONFIG);

// Cliente de Cognito con credenciales AWS
const cognitoClient = new CognitoIdentityProviderClient({
  region: COGNITO_CONFIG.region,
  credentials: {
    accessKeyId: 'AKIAVI3ULX4ZB3253Q6R',
    secretAccessKey: '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'
  }
});

export interface CognitoUser {
  username: string;
  email: string;
  displayName?: string;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}

export async function signIn(email: string, password: string): Promise<CognitoUser> {
  console.log('🔐 Attempting sign in for:', email);
  console.log('🔧 Using client ID:', COGNITO_CONFIG.clientId);
  console.log('🔧 Using user pool:', COGNITO_CONFIG.userPoolId);
  
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CONFIG.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    console.log('📤 Sending auth command:', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CONFIG.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: '[HIDDEN]'
      }
    });

    const response = await cognitoClient.send(command);
    console.log('📥 Auth response received:', response);

    if (response.AuthenticationResult) {
      const user: CognitoUser = {
        username: email,
        email: email,
        displayName: email.split('@')[0],
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
      };
      
      console.log('✅ Sign in successful for:', email);
      return user;
    } else {
      console.error('❌ No authentication result received');
      throw new Error('No se pudo completar la autenticación');
    }
  } catch (error) {
    console.error('❌ Sign in error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// Listeners para cambios de autenticación
let authListeners: Array<(user: CognitoUser | null) => void> = [];

export const subscribeToAuthChanges = (callback: (user: CognitoUser | null) => void) => {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
};

const notifyAuthListeners = (user: CognitoUser | null) => {
  authListeners.forEach(callback => callback(user));
};

export async function signUp(email: string, password: string, displayName?: string): Promise<void> {
  console.log('📝 Attempting sign up for:', email);
  
  try {
    const command = new SignUpCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        ...(displayName ? [{
          Name: 'name',
          Value: displayName,
        }] : [])
      ],
    });

    const response = await cognitoClient.send(command);
    console.log('✅ Sign up successful:', response);
  } catch (error) {
    console.error('❌ Sign up error:', error);
    throw error;
  }
}

export async function confirmSignUp(email: string, confirmationCode: string): Promise<void> {
  console.log('✅ Confirming sign up for:', email);
  
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await cognitoClient.send(command);
    console.log('✅ Sign up confirmed successfully');
  } catch (error) {
    console.error('❌ Confirm sign up error:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  console.log('🚪 Signing out...');
  // Clear local storage or session storage if needed
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cognia_user');
    sessionStorage.removeItem('cognia_user');
  }
  console.log('✅ Sign out completed');
}

export async function getCurrentUser(): Promise<CognitoUser | null> {
  console.log('👤 Getting current user...');
  
  try {
    // Try to get user from local storage first
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('cognia_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('✅ User found in storage:', user.email);
        return user;
      }
    }
    
    console.log('ℹ️ No current user found');
    return null;
  } catch (error) {
    console.error('❌ Get current user error:', error);
    return null;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  console.log('🔄 Initiating forgot password for:', email);
  
  try {
    const command = new ForgotPasswordCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
    });

    await cognitoClient.send(command);
    console.log('✅ Forgot password initiated successfully');
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    throw error;
  }
}

export async function confirmForgotPassword(
  email: string,
  confirmationCode: string,
  newPassword: string
): Promise<void> {
  console.log('🔄 Confirming forgot password for:', email);
  
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: COGNITO_CONFIG.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });

    await cognitoClient.send(command);
    console.log('✅ Password reset completed successfully');
  } catch (error) {
    console.error('❌ Confirm forgot password error:', error);
    throw error;
  }
}

export async function initializeAuth(): Promise<CognitoUser | null> {
  console.log('🔧 Initializing auth...');
  return await getCurrentUser();
}

export default COGNITO_CONFIG; 