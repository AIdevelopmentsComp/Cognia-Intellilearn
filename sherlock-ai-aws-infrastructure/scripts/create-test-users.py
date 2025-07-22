#!/usr/bin/env python3
"""
Create Test Users for Sherlock AI
Creates 3 users: Admin, Attorney, Paralegal
"""

import boto3
import json
import random
import string
from botocore.exceptions import ClientError

def generate_temp_password():
    """Generate secure temporary password"""
    length = 12
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(random.choice(chars) for _ in range(length))

def create_sherlock_test_users():
    """Create 3 test users for Sherlock AI system"""
    
    # Get User Pool ID from CloudFormation outputs
    cf_client = boto3.client('cloudformation', region_name='us-east-1')
    cognito_client = boto3.client('cognito-idp', region_name='us-east-1')
    
    try:
        # Get the Cognito stack outputs
        response = cf_client.describe_stacks(
            StackName='SherlockCognitoAuthStack'
        )
        
        user_pool_id = None
        for output in response['Stacks'][0]['Outputs']:
            if output['OutputKey'] == 'UserPoolId':
                user_pool_id = output['OutputValue']
                break
        
        if not user_pool_id:
            print("❌ Could not find User Pool ID")
            return False
            
        print(f"📋 Using User Pool: {user_pool_id}")
        
    except Exception as e:
        print(f"❌ Error getting User Pool ID: {str(e)}")
        return False
    
    # Define test users
    test_users = [
        {
            'username': 'admin@watts-law.com',
            'email': 'admin@watts-law.com',
            'given_name': 'System',
            'family_name': 'Administrator',
            'group': 'Admin',
            'bar_number': 'ADM001',
            'department': 'Technology',
            'specialization': 'System Administration'
        },
        {
            'username': 'attorney@watts-law.com', 
            'email': 'attorney@watts-law.com',
            'given_name': 'Maria',
            'family_name': 'Rodriguez',
            'group': 'Attorney',
            'bar_number': 'TX987654',
            'department': 'Mass Tort Litigation',
            'specialization': 'Product Liability'
        },
        {
            'username': 'paralegal@watts-law.com',
            'email': 'paralegal@watts-law.com',
            'given_name': 'Carlos',
            'family_name': 'Johnson',
            'group': 'Paralegal',
            'bar_number': 'PAR001',
            'department': 'Case Management',
            'specialization': 'Legal Research'
        }
    ]
    
    print("🚀 Creating Sherlock AI test users...")
    print("=" * 60)
    
    created_users = []
    
    for user in test_users:
        try:
            # Generate temporary password
            temp_password = generate_temp_password() + "1A!"  # Ensure compliance
            
            print(f"\n👤 Creating {user['group']}: {user['username']}")
            
            # Create user
            cognito_client.admin_create_user(
                UserPoolId=user_pool_id,
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
                TemporaryPassword=temp_password,
                MessageAction='SUPPRESS'  # Don't send welcome email
            )
            
            # Set permanent password
            cognito_client.admin_set_user_password(
                UserPoolId=user_pool_id,
                Username=user['username'],
                Password=temp_password,
                Permanent=True
            )
            
            # Add user to group
            cognito_client.admin_add_user_to_group(
                UserPoolId=user_pool_id,
                Username=user['username'],
                GroupName=user['group']
            )
            
            print(f"   ✅ User created successfully")
            print(f"   📧 Email: {user['email']}")
            print(f"   🔑 Password: {temp_password}")
            print(f"   👥 Group: {user['group']}")
            print(f"   🏛️ Bar Number: {user['bar_number']}")
            
            created_users.append({
                'username': user['username'],
                'email': user['email'], 
                'password': temp_password,
                'group': user['group'],
                'bar_number': user['bar_number']
            })
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'UsernameExistsException':
                print(f"   ⚠️  User {user['username']} already exists - skipping")
            else:
                print(f"   ❌ Error creating user: {e}")
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
    
    # Save credentials to file
    if created_users:
        credentials_file = 'sherlock-test-credentials.json'
        with open(credentials_file, 'w') as f:
            json.dump({
                'user_pool_id': user_pool_id,
                'users': created_users,
                'instructions': {
                    'login_url': f'https://{user_pool_id.split("_")[1]}.auth.us-east-1.amazoncognito.com/login',
                    'api_endpoint': 'https://your-api-gateway-endpoint.amazonaws.com',
                    'note': 'Change passwords on first login for production use'
                }
            }, indent=2)
        
        print(f"\n💾 Credentials saved to: {credentials_file}")
    
    print("\n" + "=" * 60)
    print("🎯 SHERLOCK AI USERS CREATED")
    print("=" * 60)
    
    # Display summary
    for user in created_users:
        print(f"\n{user['group'].upper()}:")
        print(f"  👤 Username: {user['username']}")
        print(f"  🔐 Password: {user['password']}")
        print(f"  🎭 Role: {user['group']}")
    
    print(f"\n📋 Total users created: {len(created_users)}")
    print("🔐 Remember to change passwords in production!")
    
    return len(created_users) > 0

if __name__ == "__main__":
    success = create_sherlock_test_users()
    exit(0 if success else 1) 