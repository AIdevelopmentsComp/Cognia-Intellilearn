#!/usr/bin/env python3
"""
Configurar usuarios de prueba en Cognito User Pool existente
User Pool ID: us-east-1_2moXjGxZ6
Región: us-east-1
"""

import boto3
import json
import secrets
import string
from datetime import datetime

class ExistingCognitoSetup:
    def __init__(self):
        """Initialize con el User Pool existente"""
        self.user_pool_id = 'us-east-1_2moXjGxZ6'
        self.region = 'us-east-1'
        self.cognito_client = boto3.client('cognito-idp', region_name=self.region)
        
        print("🔐 SHERLOCK AI - CONFIGURACIÓN COGNITO EXISTENTE")
        print("=" * 60)
        print(f"🏢 User Pool ID: {self.user_pool_id}")
        print(f"🌎 Región: {self.region}")
        print()

    def generate_secure_password(self, length=16):
        """Generar contraseña segura que cumpla política Cognito"""
        # Asegurar que tenga al menos: mayúscula, minúscula, número, símbolo
        password = (
            secrets.choice(string.ascii_uppercase) +
            secrets.choice(string.ascii_lowercase) +
            secrets.choice(string.digits) +
            secrets.choice("!@#$%^&*()_+-=[]{}|;:,.<>?")
        )
        
        # Completar longitud con caracteres aleatorios
        remaining_length = length - 4
        all_chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
        password += ''.join(secrets.choice(all_chars) for _ in range(remaining_length))
        
        # Mezclar caracteres
        password_list = list(password)
        secrets.SystemRandom().shuffle(password_list)
        return ''.join(password_list)

    def get_user_pool_info(self):
        """Obtener información del User Pool"""
        try:
            response = self.cognito_client.describe_user_pool(
                UserPoolId=self.user_pool_id
            )
            
            pool_info = response['UserPool']
            print(f"✅ User Pool encontrado:")
            print(f"   Nombre: {pool_info.get('Name', 'N/A')}")
            print(f"   Política contraseña: MinLength={pool_info.get('Policies', {}).get('PasswordPolicy', {}).get('MinimumLength', 'N/A')}")
            print(f"   MFA: {pool_info.get('MfaConfiguration', 'N/A')}")
            print()
            
            return True
            
        except Exception as e:
            print(f"❌ Error accediendo al User Pool: {str(e)}")
            return False

    def get_user_pool_client_id(self):
        """Buscar el Client ID del User Pool"""
        try:
            response = self.cognito_client.list_user_pool_clients(
                UserPoolId=self.user_pool_id
            )
            
            clients = response.get('UserPoolClients', [])
            if clients:
                client_id = clients[0]['ClientId']
                client_name = clients[0]['ClientName']
                print(f"✅ User Pool Client encontrado:")
                print(f"   Client ID: {client_id}")
                print(f"   Nombre: {client_name}")
                print()
                return client_id
            else:
                print("⚠️ No se encontraron clients para este User Pool")
                return None
                
        except Exception as e:
            print(f"❌ Error obteniendo Client ID: {str(e)}")
            return None

    def list_existing_groups(self):
        """Listar grupos existentes en el User Pool"""
        try:
            response = self.cognito_client.list_groups(
                UserPoolId=self.user_pool_id
            )
            
            groups = response.get('Groups', [])
            if groups:
                print("📋 Grupos existentes:")
                for group in groups:
                    print(f"   • {group['GroupName']}: {group.get('Description', 'Sin descripción')}")
                print()
            else:
                print("⚠️ No hay grupos configurados en el User Pool")
                print("💡 Creando grupos estándar...")
                self.create_default_groups()
                
            return [group['GroupName'] for group in groups]
            
        except Exception as e:
            print(f"❌ Error listando grupos: {str(e)}")
            return []

    def create_default_groups(self):
        """Crear grupos estándar si no existen"""
        groups_to_create = [
            {
                'GroupName': 'Admin',
                'Description': 'System administrators with full access',
                'Precedence': 1
            },
            {
                'GroupName': 'Attorney',
                'Description': 'Licensed attorneys with full case management access',
                'Precedence': 2
            },
            {
                'GroupName': 'Paralegal',
                'Description': 'Paralegals with case support access',
                'Precedence': 3
            }
        ]
        
        for group in groups_to_create:
            try:
                self.cognito_client.create_group(
                    UserPoolId=self.user_pool_id,
                    **group
                )
                print(f"✅ Grupo creado: {group['GroupName']}")
            except self.cognito_client.exceptions.GroupExistsException:
                print(f"ℹ️ Grupo ya existe: {group['GroupName']}")
            except Exception as e:
                print(f"❌ Error creando grupo {group['GroupName']}: {str(e)}")

    def create_test_user(self, username, email, group_name, given_name, family_name):
        """Crear usuario de prueba"""
        try:
            # Generar contraseña temporal segura
            temp_password = self.generate_secure_password()
            
            # Crear usuario
            response = self.cognito_client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'email_verified', 'Value': 'true'},
                    {'Name': 'given_name', 'Value': given_name},
                    {'Name': 'family_name', 'Value': family_name}
                ],
                TemporaryPassword=temp_password,
                MessageAction='SUPPRESS',  # No enviar email
                DesiredDeliveryMediums=['EMAIL']
            )
            
            # Establecer contraseña permanente
            permanent_password = self.generate_secure_password()
            self.cognito_client.admin_set_user_password(
                UserPoolId=self.user_pool_id,
                Username=username,
                Password=permanent_password,
                Permanent=True
            )
            
            # Agregar a grupo
            self.cognito_client.admin_add_user_to_group(
                UserPoolId=self.user_pool_id,
                Username=username,
                GroupName=group_name
            )
            
            print(f"✅ Usuario creado exitosamente:")
            print(f"   👤 Username: {username}")
            print(f"   📧 Email: {email}")  
            print(f"   👥 Grupo: {group_name}")
            print(f"   🔐 Contraseña: {permanent_password}")
            print(f"   📅 Estado: CONFIRMED")
            print()
            
            return {
                'username': username,
                'email': email,
                'password': permanent_password,
                'group': group_name,
                'status': 'CONFIRMED'
            }
            
        except self.cognito_client.exceptions.UsernameExistsException:
            print(f"⚠️ Usuario {username} ya existe")
            # Intentar actualizar contraseña
            try:
                new_password = self.generate_secure_password()
                self.cognito_client.admin_set_user_password(
                    UserPoolId=self.user_pool_id,
                    Username=username,
                    Password=new_password,
                    Permanent=True
                )
                print(f"🔄 Contraseña actualizada: {new_password}")
                return {
                    'username': username,
                    'email': email,
                    'password': new_password,
                    'group': group_name,
                    'status': 'UPDATED'
                }
            except Exception as e:
                print(f"❌ Error actualizando usuario: {str(e)}")
                return None
                
        except Exception as e:
            print(f"❌ Error creando usuario {username}: {str(e)}")
            return None

    def setup_test_users(self):
        """Configurar usuarios de prueba completos"""
        print("👨‍💼 CREANDO USUARIOS DE PRUEBA")
        print("-" * 40)
        
        test_users = [
            {
                'username': 'admin.sherlock',
                'email': 'admin@mattermind.com',
                'group': 'Admin',
                'given_name': 'Admin',
                'family_name': 'MatterMind'
            },
            {
                'username': 'attorney.sherlock', 
                'email': 'attorney@mattermind.com',
                'group': 'Attorney',
                'given_name': 'Jane',
                'family_name': 'Attorney'
            },
            {
                'username': 'paralegal.sherlock',
                'email': 'paralegal@mattermind.com', 
                'group': 'Paralegal',
                'given_name': 'John',
                'family_name': 'Paralegal'
            }
        ]
        
        created_users = []
        for user_data in test_users:
            user_result = self.create_test_user(**user_data)
            if user_result:
                created_users.append(user_result)
        
        return created_users

    def generate_config_file(self, client_id, users):
        """Generar archivo de configuración para la app React"""
        config = {
            'aws_project_region': self.region,
            'aws_cognito_region': self.region,
            'aws_user_pools_id': self.user_pool_id,
            'aws_user_pools_web_client_id': client_id,
            'aws_cognito_username_attributes': ['EMAIL'],
            'aws_cognito_social_providers': [],
            'aws_cognito_signup_attributes': ['EMAIL', 'GIVEN_NAME', 'FAMILY_NAME'],
            'aws_cognito_mfa_configuration': 'OPTIONAL',
            'aws_cognito_mfa_types': ['SMS', 'TOTP'],
            'aws_cognito_password_protection_settings': {
                'passwordPolicyMinLength': 12,
                'passwordPolicyCharacters': ['REQUIRES_LOWERCASE', 'REQUIRES_UPPERCASE', 'REQUIRES_NUMBERS', 'REQUIRES_SYMBOLS']
            },
            'aws_cognito_verification_mechanisms': ['EMAIL'],
            'test_users': users
        }
        
        return config

def main():
    """Función principal"""
    setup = ExistingCognitoSetup()
    
    # 1. Verificar acceso al User Pool
    if not setup.get_user_pool_info():
        return
    
    # 2. Obtener Client ID
    client_id = setup.get_user_pool_client_id()
    if not client_id:
        return
    
    # 3. Verificar/crear grupos
    existing_groups = setup.list_existing_groups()
    
    # 4. Crear usuarios de prueba
    created_users = setup.setup_test_users()
    
    # 5. Generar configuración
    config = setup.generate_config_file(client_id, created_users)
    
    # 6. Guardar configuración
    config_file = '../mattermind-clean/src/config/cognitoConfig.json'
    try:
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"📄 Configuración guardada en: {config_file}")
    except Exception as e:
        print(f"⚠️ Error guardando configuración: {str(e)}")
    
    # 7. Resumen final
    print("\n" + "="*60)
    print("🎉 CONFIGURACIÓN COMPLETADA")
    print("="*60)
    print(f"🏢 User Pool ID: {setup.user_pool_id}")
    print(f"📱 Client ID: {client_id}")
    print(f"👥 Usuarios creados: {len(created_users)}")
    print("\n💡 SIGUIENTE PASO:")
    print("   Ejecutar: python configure-app-cognito.py")
    print("   Para integrar con la aplicación React")

if __name__ == '__main__':
    main() 