/**
 * AWS Temporary Credentials Service
 * Obtiene credenciales temporales de AWS usando Cognito Identity Pool
 */

import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { AWS_CONFIG } from '../config';

export class AWSCredentialsService {
  private static instance: AWSCredentialsService;
  private credentials: any = null;

  public static getInstance(): AWSCredentialsService {
    if (!AWSCredentialsService.instance) {
      AWSCredentialsService.instance = new AWSCredentialsService();
    }
    return AWSCredentialsService.instance;
  }

  /**
   * Obtiene credenciales temporales de AWS usando el token de Cognito
   */
  public async getTemporaryCredentials(idToken?: string) {
    try {
      console.log('🔑 Obteniendo credenciales temporales de AWS...');

      // Si no hay token, intentar obtenerlo del localStorage
      let cognitoIdToken = idToken;
      if (!cognitoIdToken && typeof window !== 'undefined') {
        const storedTokens = localStorage.getItem('cognito_tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          cognitoIdToken = tokens.idToken;
        }
      }

      if (!cognitoIdToken) {
        // Si no hay token, usar credenciales no autenticadas
        console.log('⚠️ No hay token de Cognito, usando credenciales no autenticadas');
        
        this.credentials = fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region: AWS_CONFIG.region }),
          identityPoolId: AWS_CONFIG.cognito.identityPoolId,
        });
      } else {
        // Usar credenciales autenticadas con el token de Cognito
        const providerName = `cognito-idp.${AWS_CONFIG.region}.amazonaws.com/${AWS_CONFIG.cognito.userPoolId}`;
        
        this.credentials = fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region: AWS_CONFIG.region }),
          identityPoolId: AWS_CONFIG.cognito.identityPoolId,
          logins: {
            [providerName]: cognitoIdToken
          }
        });
      }

      // Forzar la resolución de las credenciales
      const resolvedCreds = await this.credentials();
      console.log('✅ Credenciales temporales obtenidas exitosamente');
      
      return this.credentials;
    } catch (error) {
      console.error('❌ Error obteniendo credenciales temporales:', error);
      throw error;
    }
  }

  /**
   * Obtiene las credenciales actuales o las genera si no existen
   */
  public async getCredentials() {
    if (!this.credentials) {
      await this.getTemporaryCredentials();
    }
    return this.credentials;
  }

  /**
   * Limpia las credenciales almacenadas
   */
  public clearCredentials() {
    this.credentials = null;
  }
}

export const awsCredentialsService = AWSCredentialsService.getInstance();