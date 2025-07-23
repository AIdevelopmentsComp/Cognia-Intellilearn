#!/usr/bin/env python3
"""
Configurar integración de Cognito con aplicación React
Instala dependencias y configura servicios de autenticación
"""

import json
import os
import subprocess
import sys

class ReactCognitoIntegration:
    def __init__(self):
        """Initialize configuración React + Cognito"""
        self.app_dir = '../mattermind-clean'
        self.config_file = os.path.join(self.app_dir, 'src/config/cognitoConfig.json')
        
        print("⚛️ REACT + COGNITO INTEGRATION")
        print("=" * 50)
        print(f"📁 App Directory: {self.app_dir}")
        print()

    def install_cognito_dependencies(self):
        """Instalar dependencias de AWS Cognito para React"""
        print("📦 INSTALANDO DEPENDENCIAS AWS COGNITO")
        print("-" * 40)
        
        dependencies = [
            '@aws-amplify/ui-react',
            'aws-amplify',
            '@aws-sdk/client-cognito-identity',
            '@aws-sdk/credential-provider-cognito-identity',
            '@aws-sdk/client-cognito-identity-provider'
        ]
        
        for dep in dependencies:
            try:
                print(f"📥 Instalando {dep}...")
                result = subprocess.run(
                    ['npm', 'install', dep],
                    cwd=self.app_dir,
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    print(f"✅ {dep} instalado exitosamente")
                else:
                    print(f"❌ Error instalando {dep}: {result.stderr}")
                    
            except Exception as e:
                print(f"❌ Error instalando {dep}: {str(e)}")
        
        print()

    def load_cognito_config(self):
        """Cargar configuración de Cognito generada"""
        try:
            with open(self.config_file, 'r') as f:
                config = json.load(f)
            print("✅ Configuración Cognito cargada")
            return config
        except FileNotFoundError:
            print(f"❌ Archivo de configuración no encontrado: {self.config_file}")
            print("💡 Ejecuta primero: python setup-existing-cognito.py")
            return None
        except Exception as e:
            print(f"❌ Error cargando configuración: {str(e)}")
            return None

    def create_auth_service(self, config):
        """Crear servicio de autenticación React"""
        auth_service_code = f'''// Servicio de autenticación Cognito para MatterMind
import {{ Amplify }} from 'aws-amplify';
import {{ signIn, signOut, getCurrentUser, fetchAuthSession, signUp }} from 'aws-amplify/auth';

// Configuración Amplify
const amplifyConfig = {{
  Auth: {{
    Cognito: {{
      userPoolId: '{config['aws_user_pools_id']}',
      userPoolClientId: '{config['aws_user_pools_web_client_id']}',
      loginWith: {{
        email: true,
        username: false
      }},
      signUpVerificationMethod: 'code',
      userAttributes: {{
        email: {{
          required: true,
        }},
        given_name: {{
          required: true,
        }},
        family_name: {{
          required: true,
        }}
      }}
    }}
  }}
}};

// Configurar Amplify
Amplify.configure(amplifyConfig);

class AuthService {{
  
  /**
   * Iniciar sesión con email y contraseña
   */
  static async signIn(email, password) {{
    try {{
      const user = await signIn({{
        username: email,
        password: password
      }});
      
      console.log('Login exitoso:', user);
      return {{
        success: true,
        user: user,
        needsPasswordChange: user.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED',
        nextStep: user.nextStep
      }};
      
    }} catch (error) {{
      console.error('Error en login:', error);
      return {{
        success: false,
        error: error.message || 'Error de autenticación',
        code: error.name
      }};
    }}
  }}

  /**
   * Obtener usuario actual autenticado
   */
  static async getCurrentUser() {{
    try {{
      const user = await getCurrentUser();
      return {{
        success: true,
        user: user
      }};
    }} catch (error) {{
      console.error('Usuario no autenticado:', error);
      return {{
        success: false,
        error: 'No authenticated user'
      }};
    }}
  }}

  /**
   * Obtener sesión y tokens
   */
  static async getSession() {{
    try {{
      const session = await fetchAuthSession();
      return {{
        success: true,
        session: session,
        accessToken: session.tokens?.accessToken?.toString(),
        idToken: session.tokens?.idToken?.toString(),
        refreshToken: session.tokens?.refreshToken?.toString(),
        credentials: session.credentials
      }};
    }} catch (error) {{
      console.error('Error obteniendo sesión:', error);
      return {{
        success: false,
        error: error.message
      }};
    }}
  }}

  /**
   * Obtener grupos del usuario (roles)
   */
  static async getUserGroups() {{
    try {{
      const session = await this.getSession();
      if (!session.success) {{
        return {{ success: false, groups: [] }};
      }}

      const idToken = session.session.tokens?.idToken;
      if (!idToken) {{
        return {{ success: false, groups: [] }};
      }}

      // Decodificar token para obtener grupos
      const payload = JSON.parse(atob(idToken.toString().split('.')[1]));
      const groups = payload['cognito:groups'] || [];
      
      return {{
        success: true,
        groups: groups,
        permissions: this.getPermissionsForGroups(groups)
      }};

    }} catch (error) {{
      console.error('Error obteniendo grupos:', error);
      return {{
        success: false,
        groups: [],
        error: error.message
      }};
    }}
  }}

  /**
   * Mapear grupos a permisos
   */
  static getPermissionsForGroups(groups) {{
    const permissions = new Set();
    
    groups.forEach(group => {{
      switch(group) {{
        case 'Admin':
          permissions.add('cases.create');
          permissions.add('cases.read');
          permissions.add('cases.update');
          permissions.add('cases.delete');
          permissions.add('users.manage');
          permissions.add('system.configure');
          break;
          
        case 'Attorney':
          permissions.add('cases.create');
          permissions.add('cases.read');
          permissions.add('cases.update');
          permissions.add('documents.manage');
          permissions.add('reports.generate');
          break;
          
        case 'Paralegal':
          permissions.add('cases.read');
          permissions.add('cases.update');
          permissions.add('documents.read');
          permissions.add('reports.view');
          break;
          
        default:
          permissions.add('cases.read');
      }}
    }});
    
    return Array.from(permissions);
  }}

  /**
   * Verificar si usuario tiene permiso
   */
  static async hasPermission(permission) {{
    try {{
      const groupsResult = await this.getUserGroups();
      if (!groupsResult.success) return false;
      
      return groupsResult.permissions.includes(permission);
    }} catch (error) {{
      console.error('Error verificando permisos:', error);
      return false;
    }}
  }}

  /**
   * Cerrar sesión
   */
  static async signOut() {{
    try {{
      await signOut();
      return {{ success: true }};
    }} catch (error) {{
      console.error('Error en logout:', error);
      return {{
        success: false,
        error: error.message
      }};
    }}
  }}

  /**
   * Obtener credenciales temporales para AWS Services
   */
  static async getAWSCredentials() {{
    try {{
      const session = await this.getSession();
      if (!session.success || !session.credentials) {{
        throw new Error('No valid AWS credentials available');
      }}

      return {{
        accessKeyId: session.credentials.accessKeyId,
        secretAccessKey: session.credentials.secretAccessKey,
        sessionToken: session.credentials.sessionToken,
        region: '{config['aws_project_region']}'
      }};
      
    }} catch (error) {{
      console.error('Error obteniendo credenciales AWS:', error);
      throw error;
    }}
  }}
}}

export default AuthService;

// Datos de usuarios de prueba (solo para desarrollo)
export const TEST_USERS = {json.dumps(config.get('test_users', []), indent=2)};
'''
        
        auth_service_path = os.path.join(self.app_dir, 'src/services/authService.js')
        
        try:
            with open(auth_service_path, 'w') as f:
                f.write(auth_service_code)
            print(f"✅ Servicio de autenticación creado: {auth_service_path}")
            return True
        except Exception as e:
            print(f"❌ Error creando servicio de autenticación: {str(e)}")
            return False

    def create_auth_hook(self, config):
        """Crear hook React para manejar autenticación"""
        auth_hook_code = '''import { useState, useEffect, useContext, createContext } from 'react';
import AuthService from '../services/authService';

// Context para autenticación
const AuthContext = createContext();

// Provider de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay usuario autenticado
      const userResult = await AuthService.getCurrentUser();
      
      if (userResult.success) {
        setUser(userResult.user);
        setIsAuthenticated(true);
        
        // Obtener grupos y permisos
        const groupsResult = await AuthService.getUserGroups();
        if (groupsResult.success) {
          setGroups(groupsResult.groups);
          setPermissions(groupsResult.permissions);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setGroups([]);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await AuthService.signIn(email, password);
      
      if (result.success) {
        await checkAuthState(); // Refrescar estado
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error,
          needsPasswordChange: result.needsPasswordChange 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setGroups([]);
      setPermissions([]);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasRole = (role) => {
    return groups.includes(role);
  };

  const getAWSCredentials = async () => {
    try {
      return await AuthService.getAWSCredentials();
    } catch (error) {
      console.error('Error getting AWS credentials:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    groups,
    permissions,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasRole,
    getAWSCredentials,
    checkAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
'''
        
        auth_hook_path = os.path.join(self.app_dir, 'src/hooks/useAuth.js')
        
        try:
            # Crear directorio hooks si no existe
            hooks_dir = os.path.join(self.app_dir, 'src/hooks')
            os.makedirs(hooks_dir, exist_ok=True)
            
            with open(auth_hook_path, 'w') as f:
                f.write(auth_hook_code)
            print(f"✅ Hook de autenticación creado: {auth_hook_path}")
            return True
        except Exception as e:
            print(f"❌ Error creando hook de autenticación: {str(e)}")
            return False

    def update_dynamo_hook(self, config):
        """Actualizar hook de DynamoDB para usar autenticación Cognito"""
        updated_hook_code = f'''import {{ useState, useEffect, useCallback }} from 'react';
import {{ DynamoDBClient }} from '@aws-sdk/client-dynamodb';
import {{ DynamoDBDocumentClient, ScanCommand, QueryCommand }} from '@aws-sdk/lib-dynamodb';
import {{ fromCognitoIdentityPool }} from '@aws-sdk/credential-provider-cognito-identity';
import {{ CognitoIdentityClient }} from '@aws-sdk/client-cognito-identity';
import useAuth from './useAuth';

// Configuración AWS
const REGION = '{config['aws_project_region']}';
const CASES_TABLE_NAME = 'MatterMind-Cases';

const useDynamoData = (options = {{}}) => {{
  const {{ tableName = CASES_TABLE_NAME, autoLoad = false }} = options;
  
  // Estados
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamoClient, setDynamoClient] = useState(null);
  
  // Hook de autenticación
  const {{ isAuthenticated, getAWSCredentials }} = useAuth();

  // Crear cliente DynamoDB con credenciales Cognito
  const createDynamoClient = useCallback(async () => {{
    try {{
      if (!isAuthenticated) {{
        console.log('User not authenticated, using mock data');
        return null;
      }}

      // Obtener credenciales de Cognito
      const credentials = await getAWSCredentials();
      
      const client = new DynamoDBClient({{
        region: REGION,
        credentials: {{
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }}
      }});
      
      return DynamoDBDocumentClient.from(client);
      
    }} catch (error) {{
      console.error('Error creating DynamoDB client:', error);
      return null;
    }}
  }}, [isAuthenticated, getAWSCredentials]);

  // Inicializar cliente DynamoDB
  useEffect(() => {{
    const initClient = async () => {{
      try {{
        const client = await createDynamoClient();
        if (client) {{
          setDynamoClient(client);
        }} else {{
          console.log('Using mock data - no authenticated DynamoDB client');
          setError('Using mock data - authentication required for live data');
          setData(getMockCasesData());
        }}
      }} catch (err) {{
        console.error('Error initializing DynamoDB client:', err);
        setError('Using mock data - DynamoDB connection failed');
        setData(getMockCasesData());
      }}
    }};

    initClient();
  }}, [createDynamoClient]);

  // Función auxiliar para extraer case ID del PK
  const extractCaseIdFromPK = (pk) => {{
    return pk ? pk.replace('CASE#', '') : 'UNKNOWN';
  }};

  /**
   * Función para hacer scan completo de la tabla
   */
  const scanTable = useCallback(async () => {{
    setLoading(true);
    setError(null);

    // Si no hay cliente DynamoDB, usar datos mock directamente
    if (!dynamoClient) {{
      console.log('No DynamoDB client available, using mock data');
      setData(getMockCasesData());
      setLoading(false);
      return;
    }}

    try {{
      const command = new ScanCommand({{
        TableName: tableName,
        // Filtrar solo items principales de casos (META entries)
        FilterExpression: 'begins_with(SK, :sk_prefix)',
        ExpressionAttributeValues: {{
          ':sk_prefix': 'META#'
        }}
      }});

      const response = await dynamoClient.send(command);
      
      // Transformar datos para la UI
      const transformedData = response.Items?.map(item => ({{
        id: item.case_id || extractCaseIdFromPK(item.PK),
        caseNumber: item.case_id || extractCaseIdFromPK(item.PK),
        caseType: item.case_type || 'UNKNOWN',
        clientName: item.client_name || 'Unknown Client',
        status: item.case_status || 'UNKNOWN',
        solDate: item.statute_of_limitations || null,
        estimatedValue: item.estimated_value || 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        priority: item.case_priority || 'NORMAL',
        attorney: item.attorney_id || 'UNASSIGNED',
        // Datos completos para vista de detalle
        rawData: item
      }})) || [];

      setData(transformedData);
      console.log('Successfully loaded cases from DynamoDB (authenticated):', transformedData.length);
    }} catch (err) {{
      console.warn('DynamoDB scan failed, using mock data:', err.message);
      // Fallback silencioso a datos mock en caso de error
      setData(getMockCasesData());
    }} finally {{
      setLoading(false);
    }}
  }}, [dynamoClient, tableName]);

  /**
   * Función para query con filtros específicos
   */
  const queryTable = useCallback(async (gsiName, keyExpression, attributeValues) => {{
    if (!dynamoClient) {{
      console.log('No DynamoDB client for query, using filtered mock data');
      setData(getMockCasesData());
      return;
    }}

    setLoading(true);
    setError(null);

    try {{
      const command = new QueryCommand({{
        TableName: tableName,
        IndexName: gsiName,
        KeyConditionExpression: keyExpression,
        ExpressionAttributeValues: attributeValues
      }});

      const response = await dynamoClient.send(command);
      
      const transformedData = response.Items?.map(item => ({{
        id: item.case_id || extractCaseIdFromPK(item.PK),
        caseNumber: item.case_id || extractCaseIdFromPK(item.PK),
        caseType: item.case_type || 'UNKNOWN',
        clientName: item.client_name || 'Unknown Client',
        status: item.case_status || 'UNKNOWN',
        solDate: item.statute_of_limitations || null,
        estimatedValue: item.estimated_value || 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        priority: item.case_priority || 'NORMAL',
        attorney: item.attorney_id || 'UNASSIGNED',
        rawData: item
      }})) || [];

      setData(transformedData);
    }} catch (err) {{
      console.error('Query error:', err);
      setError(`Query failed: ${{err.message}}`);
    }} finally {{
      setLoading(false);
    }}
  }}, [dynamoClient, tableName]);

  /**
   * Aplicar filtro basado en campo y valor
   */
  const applyFilter = useCallback(async (filterField, filterValue) => {{
    if (!filterValue || filterValue.trim() === '') {{
      // Si no hay filtro, hacer scan completo
      await scanTable();
      return;
    }}

    const trimmedValue = filterValue.trim();
    
    // Determinar qué GSI usar según el campo
    switch (filterField) {{
      case 'status':
        await queryTable('GSI1', 'case_status = :status', {{
          ':status': trimmedValue.toUpperCase()
        }});
        break;
        
      case 'attorney':
        await queryTable('GSI2', 'attorney_id = :attorney', {{
          ':attorney': trimmedValue
        }});
        break;
        
      case 'case_type':
        await queryTable('GSI3', 'case_type = :case_type', {{
          ':case_type': trimmedValue.toUpperCase()
        }});
        break;
        
      default:
        // Para otros campos, usar scan con filtro
        setLoading(true);
        try {{
          if (!dynamoClient) {{
            // Filtrar mock data
            const mockData = getMockCasesData();
            const filtered = mockData.filter(item => {{
              const fieldValue = item[filterField];
              if (typeof fieldValue === 'string') {{
                return fieldValue.toLowerCase().includes(trimmedValue.toLowerCase());
              }}
              return String(fieldValue || '').includes(trimmedValue);
            }});
            setData(filtered);
          }} else {{
            // Scan con filtro
            const command = new ScanCommand({{
              TableName: tableName,
              FilterExpression: 'begins_with(SK, :sk_prefix) AND contains(#field, :value)',
              ExpressionAttributeNames: {{
                '#field': filterField
              }},
              ExpressionAttributeValues: {{
                ':sk_prefix': 'META#',
                ':value': trimmedValue
              }}
            }});

            const response = await dynamoClient.send(command);
            const transformedData = response.Items?.map(item => ({{
              id: item.case_id || extractCaseIdFromPK(item.PK),
              caseNumber: item.case_id || extractCaseIdFromPK(item.PK),
              caseType: item.case_type || 'UNKNOWN',
              clientName: item.client_name || 'Unknown Client',
              status: item.case_status || 'UNKNOWN',
              solDate: item.statute_of_limitations || null,
              estimatedValue: item.estimated_value || 0,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              priority: item.case_priority || 'NORMAL',
              attorney: item.attorney_id || 'UNASSIGNED',
              rawData: item
            }})) || [];
            
            setData(transformedData);
          }}
        }} catch (err) {{
          console.error('Filter scan error:', err);
          setError(`Filter failed: ${{err.message}}`);
        }} finally {{
          setLoading(false);
        }}
    }}
  }}, [dynamoClient, tableName, scanTable, queryTable]);

  /**
   * Obtener caso por ID
   */
  const getCaseById = useCallback(async (caseId) => {{
    if (!dynamoClient) {{
      // Buscar en mock data
      const mockData = getMockCasesData();
      return mockData.find(item => item.id === caseId) || null;
    }}

    try {{
      const command = new QueryCommand({{
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {{
          ':pk': `CASE#${{caseId}}`
        }}
      }});

      const response = await dynamoClient.send(command);
      const caseData = response.Items?.find(item => item.SK?.startsWith('META#'));
      
      return caseData || null;
    }} catch (err) {{
      console.error('Error getting case by ID:', err);
      return null;
    }}
  }}, [dynamoClient, tableName]);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {{
    setError(null);
  }}, []);

  // Cargar datos automáticamente al montar el componente
  useEffect(() => {{
    if (autoLoad) {{
      // Pequeño delay para asegurar que el cliente se inicialice
      setTimeout(() => {{
        scanTable();
      }}, 100);
    }}
  }}, [autoLoad, scanTable]);

  return {{
    data,
    loading,
    error,
    scanTable,
    queryTable,
    applyFilter,
    getCaseById,
    clearError
  }};
}};

// Mock data para desarrollo/testing
const getMockCasesData = () => {{
  return [
    {{
      id: 'ZAN-2024-0001',
      caseNumber: 'ZAN-2024-0001',
      caseType: 'ZANTAC',
      clientName: 'John Doe',
      status: 'ACTIVE',
      solDate: '2025-12-31',
      estimatedValue: 250000,
      createdAt: '2024-01-15',
      updatedAt: '2024-07-20',
      priority: 'HIGH',
      attorney: 'J.Smith'
    }},
    {{
      id: 'HR-2024-0001',
      caseNumber: 'HR-2024-0001',
      caseType: 'HAIR_RELAXER',
      clientName: 'Jane Smith',
      status: 'PENDING',
      solDate: '2026-06-30',
      estimatedValue: 180000,
      createdAt: '2024-02-20',
      updatedAt: '2024-07-21',
      priority: 'MEDIUM',
      attorney: 'M.Johnson'
    }},
    {{
      id: 'NEC-2024-0001',
      caseNumber: 'NEC-2024-0001',
      caseType: 'NEC',
      clientName: 'Baby Williams',
      status: 'SETTLED',
      solDate: '2025-03-15',
      estimatedValue: 500000,
      createdAt: '2024-03-10',
      updatedAt: '2024-07-21',
      priority: 'HIGH',
      attorney: 'L.Davis'
    }}
  ];
}};

export default useDynamoData;
'''
        
        dynamo_hook_path = os.path.join(self.app_dir, 'src/hooks/useDynamoData.js')
        
        try:
            with open(dynamo_hook_path, 'w') as f:
                f.write(updated_hook_code)
            print(f"✅ Hook DynamoDB actualizado con autenticación Cognito")
            return True
        except Exception as e:
            print(f"❌ Error actualizando hook DynamoDB: {str(e)}")
            return False

    def create_login_component(self, config):
        """Crear componente de login"""
        login_component_code = '''import React, { useState } from 'react';
import styled from 'styled-components';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { TEST_USERS } from '../services/authService';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  padding: 2rem;
`;

const LoginCard = styled.div`
  background: #0a0a0a;
  border-radius: 30px;
  padding: 3rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 
    -12px -12px 24px rgba(255, 255, 255, 0.02),
    12px 12px 24px rgba(0, 0, 0, 0.9);
  text-align: center;
`;

const Title = styled.h1`
  color: #FFD700;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #cccccc;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputField = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: #0a0a0a;
  border: none;
  border-radius: 20px;
  color: #ffffff;
  font-size: 16px;
  box-shadow: 
    inset -6px -6px 12px rgba(255, 255, 255, 0.02),
    inset 6px 6px 12px rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    box-shadow: 
      inset -8px -8px 16px rgba(255, 255, 255, 0.03),
      inset 8px 8px 16px rgba(0, 0, 0, 0.95),
      0 0 0 2px rgba(255, 215, 0, 0.3);
  }
  
  &::placeholder {
    color: #666666;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #FFD700;
  z-index: 1;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #FFD700;
  cursor: pointer;
  z-index: 1;
  
  &:hover {
    color: #ffffff;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #0a0a0a;
  border: none;
  border-radius: 20px;
  color: #FFD700;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 
    -6px -6px 12px rgba(255, 255, 255, 0.02),
    6px 6px 12px rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 
      -8px -8px 16px rgba(255, 255, 255, 0.03),
      8px 8px 16px rgba(0, 0, 0, 0.95);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 
      inset -4px -4px 8px rgba(255, 255, 255, 0.02),
      inset 4px 4px 8px rgba(0, 0, 0, 0.9);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 
    inset -4px -4px 8px rgba(255, 255, 255, 0.02),
    inset 4px 4px 8px rgba(0, 0, 0, 0.9);
`;

const TestUsersSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const TestUsersTitle = styled.h3`
  color: #FFD700;
  margin-bottom: 1rem;
  font-size: 1rem;
`;

const TestUserButton = styled.button`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  background: #0a0a0a;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 15px;
  color: #cccccc;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    color: #ffffff;
    transform: translateY(-1px);
  }
`;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const useTestUser = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>MatterMind AI</Title>
        <Subtitle>Legal Case Management System</Subtitle>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon>
              <FiMail size={20} />
            </InputIcon>
            <InputField
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </InputGroup>
          
          <InputGroup>
            <InputIcon>
              <FiLock size={20} />
            </InputIcon>
            <InputField
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </PasswordToggle>
          </InputGroup>
          
          {error && (
            <ErrorMessage>
              <FiAlertCircle size={20} />
              {error}
            </ErrorMessage>
          )}
          
          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </LoginButton>
        </Form>
        
        <TestUsersSection>
          <TestUsersTitle>Test Users (Development)</TestUsersTitle>
          {TEST_USERS.map((user, index) => (
            <TestUserButton
              key={index}
              onClick={() => useTestUser(user)}
              type="button"
            >
              <FiUser size={16} />
              <div>
                <div>{user.email}</div>
                <small style={{ color: '#999' }}>Role: {user.group}</small>
              </div>
            </TestUserButton>
          ))}
        </TestUsersSection>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginScreen;
'''
        
        login_component_path = os.path.join(self.app_dir, 'src/components/LoginScreen.js')
        
        try:
            with open(login_component_path, 'w') as f:
                f.write(login_component_code)
            print(f"✅ Componente de login creado: {login_component_path}")
            return True
        except Exception as e:
            print(f"❌ Error creando componente de login: {str(e)}")
            return False

    def run_integration(self):
        """Ejecutar integración completa"""
        print("🚀 INICIANDO INTEGRACIÓN COGNITO + REACT")
        print("=" * 50)
        
        # 1. Cargar configuración
        config = self.load_cognito_config()
        if not config:
            return False
        
        # 2. Instalar dependencias
        self.install_cognito_dependencies()
        
        # 3. Crear servicio de autenticación
        if not self.create_auth_service(config):
            return False
        
        # 4. Crear hook de autenticación
        if not self.create_auth_hook(config):
            return False
        
        # 5. Actualizar hook DynamoDB
        if not self.update_dynamo_hook(config):
            return False
        
        # 6. Crear componente de login
        if not self.create_login_component(config):
            return False
        
        print("\n" + "="*50)
        print("🎉 INTEGRACIÓN COMPLETADA EXITOSAMENTE")
        print("="*50)
        print("✅ Dependencias AWS Amplify instaladas")
        print("✅ Servicio de autenticación configurado")
        print("✅ Hook de autenticación creado")
        print("✅ Hook DynamoDB actualizado con Cognito")
        print("✅ Componente de login creado")
        print(f"✅ Configuración guardada en: {self.config_file}")
        
        print("\n💡 SIGUIENTE PASO:")
        print("   1. Actualizar App.js para usar AuthProvider")
        print("   2. Agregar LoginScreen al routing")
        print("   3. Rebuild y deploy la aplicación")
        print("   4. Probar con usuarios de prueba")
        
        return True

def main():
    """Función principal"""
    integration = ReactCognitoIntegration()
    integration.run_integration()

if __name__ == '__main__':
    main() 