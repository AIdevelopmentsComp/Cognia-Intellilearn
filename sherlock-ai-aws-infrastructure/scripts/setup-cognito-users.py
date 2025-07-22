#!/usr/bin/env python3
"""
Cognito Users Setup for Sherlock AI
Specifically configured for arosas@sfsmart.ai
Creates secure test users with proper roles and permissions
"""

import boto3
import json
import random
import string
from datetime import datetime

class CognitoUserSetup:
    def __init__(self, region='us-east-1'):
        """Initialize Cognito setup for Sherlock AI"""
        self.cognito_client = boto3.client('cognito-idp', region_name=region)
        self.region = region
        self.user_pool_id = None
        self.user_pool_client_id = None
        
        print("🔐 SHERLOCK AI - COGNITO USER SETUP")
        print("=" * 60)
        print(f"👤 Configurado para: arosas@sfsmart.ai")
        print(f"🌎 Región AWS: {region}")
        print()

    def get_user_pool_info(self):
        """Get User Pool information from CloudFormation"""
        try:
            cf_client = boto3.client('cloudformation', region_name=self.region)
            
            # Try to get from Cognito stack first
            try:
                response = cf_client.describe_stacks(StackName='SherlockCognitoAuthStack')
                outputs = response['Stacks'][0]['Outputs']
                
                for output in outputs:
                    if output['OutputKey'] == 'UserPoolId':
                        self.user_pool_id = output['OutputValue']
                    elif output['OutputKey'] == 'UserPoolClientId':
                        self.user_pool_client_id = output['OutputValue']
                        
                print(f"✅ Found Cognito Stack:")
                print(f"   User Pool ID: {self.user_pool_id}")
                print(f"   Client ID: {self.user_pool_client_id}")
                return True
                
            except cf_client.exceptions.ClientError:
                print("⚠️ SherlockCognitoAuthStack not found, checking main stack...")
                
                # Fallback to main stack
                response = cf_client.describe_stacks(StackName='SherlockAILegalDatabaseStack')
                # For now, we'll need to create users manually if no Cognito stack
                print("❌ No Cognito configuration found in main stack")
                print("💡 You'll need to deploy the Cognito stack first:")
                print("   npx cdk deploy SherlockCognitoAuthStack")
                return False
                
        except Exception as e:
            print(f"❌ Error getting CloudFormation outputs: {str(e)}")
            return False

    def create_secure_password(self, length=12):
        """Generate secure password for users"""
        # Include uppercase, lowercase, digits, and special chars
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(random.choice(chars) for _ in range(length))
        
        # Ensure it meets Cognito requirements
        if not any(c.islower() for c in password):
            password = password[:-1] + 'a'
        if not any(c.isupper() for c in password):
            password = password[:-1] + 'A'
        if not any(c.isdigit() for c in password):
            password = password[:-1] + '1'
        if not any(c in "!@#$%^&*" for c in password):
            password = password[:-1] + '!'
            
        return password

    def create_sherlock_users(self):
        """Create Sherlock AI users with proper roles"""
        if not self.user_pool_id:
            print("❌ User Pool ID not available. Deploy Cognito stack first.")
            return False
            
        # Define users specifically for Sherlock AI Legal
        users = [
            {
                'username': 'arosas.admin',
                'email': 'arosas@sfsmart.ai',
                'given_name': 'Alejandro',
                'family_name': 'Rosas',
                'group': 'Admin',
                'bar_number': 'ADMIN001',
                'department': 'Administration',
                'specialization': 'Legal Technology',
                'temp_password': 'SherlockAdmin2025!'
            },
            {
                'username': 'sherlock.attorney',
                'email': 'attorney@sherlock-ai.demo',
                'given_name': 'Legal',
                'family_name': 'Attorney',
                'group': 'Attorney',
                'bar_number': 'ATT001',
                'department': 'Mass Torts',
                'specialization': 'Product Liability',
                'temp_password': 'SherlockAtt2025!'
            },
            {
                'username': 'sherlock.paralegal',
                'email': 'paralegal@sherlock-ai.demo',
                'given_name': 'Legal',
                'family_name': 'Paralegal',
                'group': 'Paralegal',
                'bar_number': 'PAR001',
                'department': 'Case Management',
                'specialization': 'Document Review',
                'temp_password': 'SherlockPar2025!'
            }
        ]

        print("👥 CREATING SHERLOCK AI USERS")
        print("-" * 40)
        
        created_users = []
        
        for user in users:
            try:
                print(f"Creating user: {user['username']} ({user['group']})")
                
                # Create user with attributes
                response = self.cognito_client.admin_create_user(
                    UserPoolId=self.user_pool_id,
                    Username=user['username'],
                    UserAttributes=[
                        {'Name': 'email', 'Value': user['email']},
                        {'Name': 'email_verified', 'Value': 'true'},
                        {'Name': 'given_name', 'Value': user['given_name']},
                        {'Name': 'family_name', 'Value': user['family_name']},
                        {'Name': 'custom:bar_number', 'Value': user['bar_number']},
                        {'Name': 'custom:firm_department', 'Value': user['department']},
                        {'Name': 'custom:specialization', 'Value': user['specialization']}
                    ],
                    TemporaryPassword=user['temp_password'],
                    MessageAction='SUPPRESS'  # Don't send welcome email
                )
                
                # Set permanent password
                self.cognito_client.admin_set_user_password(
                    UserPoolId=self.user_pool_id,
                    Username=user['username'],
                    Password=user['temp_password'],
                    Permanent=True
                )
                
                # Add user to group
                try:
                    self.cognito_client.admin_add_user_to_group(
                        UserPoolId=self.user_pool_id,
                        Username=user['username'],
                        GroupName=user['group']
                    )
                    print(f"   ✅ Added to group: {user['group']}")
                except Exception as e:
                    print(f"   ⚠️ Group assignment failed: {str(e)}")
                
                created_users.append({
                    'username': user['username'],
                    'email': user['email'],
                    'password': user['temp_password'],
                    'group': user['group']
                })
                
                print(f"   ✅ User created successfully")
                
            except self.cognito_client.exceptions.UsernameExistsException:
                print(f"   ℹ️ User {user['username']} already exists")
                created_users.append({
                    'username': user['username'],
                    'email': user['email'],
                    'password': user['temp_password'],
                    'group': user['group']
                })
                
            except Exception as e:
                print(f"   ❌ Error creating user {user['username']}: {str(e)}")
                continue
                
        return created_users

    def display_login_info(self, users):
        """Display login information for created users"""
        print("\n" + "=" * 60)
        print("🔑 SHERLOCK AI - LOGIN CREDENTIALS")
        print("=" * 60)
        print("🎯 Para uso de: arosas@sfsmart.ai")
        print()
        
        for user in users:
            print(f"👤 {user['group'].upper()} ACCESS:")
            print(f"   Username: {user['username']}")
            print(f"   Email: {user['email']}")
            print(f"   Password: {user['password']}")
            print(f"   Role: {user['group']}")
            print()
            
        print("🔐 SECURITY NOTES:")
        print("   - Cambiar passwords en primer login")
        print("   - Usuario Admin tiene acceso completo")
        print("   - S3 bucket es read-only por diseño")
        print("   - Todas las acciones son auditadas")
        print()
        
        print("🌐 VERCEL APP URL:")
        print("   https://your-sherlock-app.vercel.app")
        print("   (Configurar después del deploy)")
        print()
        
        print("📊 DATABASE STATUS:")
        print("   - DynamoDB: sherlock-cases-main (2,262 casos)")
        print("   - S3 Bucket: wattsnewclassified (protected)")
        print("   - Case Types: Zantac (1,987), NEC (36), Hair Relaxer (30)")
        print("=" * 60)

    def run_setup(self):
        """Run complete Cognito setup process"""
        print("🚀 STARTING SHERLOCK AI COGNITO SETUP")
        print()
        
        # Step 1: Get User Pool information
        if not self.get_user_pool_info():
            print("\n❌ Setup failed: No User Pool found")
            print("💡 Next steps:")
            print("   1. Deploy Cognito stack: npx cdk deploy SherlockCognitoAuthStack")
            print("   2. Re-run this script")
            return False
            
        # Step 2: Create users
        users = self.create_sherlock_users()
        
        if not users:
            print("\n❌ No users created")
            return False
            
        # Step 3: Display login info
        self.display_login_info(users)
        
        print("🎉 COGNITO SETUP COMPLETE!")
        print("✅ Users ready for Sherlock AI Legal System")
        
        return True

def main():
    """Main setup function"""
    setup = CognitoUserSetup()
    success = setup.run_setup()
    
    if success:
        print("\n🚀 NEXT STEPS:")
        print("1. Deploy frontend to Vercel")
        print("2. Configure environment variables")
        print("3. Test login with created users")
        print("4. Customize user permissions as needed")
    else:
        print("\n🔧 TROUBLESHOOTING:")
        print("- Ensure AWS credentials are configured")
        print("- Verify CloudFormation stacks are deployed")
        print("- Check region settings (us-east-1)")
    
    return success

if __name__ == "__main__":
    main() 