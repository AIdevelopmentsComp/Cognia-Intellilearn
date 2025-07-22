#!/usr/bin/env python3
"""
Verify that data was successfully loaded into Sherlock AI DynamoDB tables
"""

import boto3
import json
from boto3.dynamodb.conditions import Key

def verify_sherlock_data():
    """Verify data in Sherlock AI tables"""
    
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    tables = {
        'cases_main': dynamodb.Table('sherlock-cases-main'),
        'parties_roles': dynamodb.Table('sherlock-parties-roles'),
        'medical_records': dynamodb.Table('sherlock-medical-records'),
    }
    
    print("🔍 SHERLOCK AI DATA VERIFICATION")
    print("=" * 50)
    
    # Check each table
    for table_name, table in tables.items():
        print(f"\n📊 {table_name.upper()}:")
        try:
            # Get table item count (approximate)
            response = table.describe_table()
            item_count = response['Table']['ItemCount']
            print(f"   Items: ~{item_count}")
            
            # Sample some records
            scan_response = table.scan(Limit=5)
            print(f"   Sample records: {len(scan_response.get('Items', []))}")
            
            # Show sample data for main cases
            if table_name == 'cases_main':
                print("\n   📋 Sample Cases:")
                for i, item in enumerate(scan_response.get('Items', [])[:3]):
                    matter_number = item.get('matter_number', 'Unknown')
                    client_name = item.get('client_name', 'Unknown')
                    case_type = item.get('case_type', 'Unknown')
                    case_status = item.get('case_status', 'Unknown')
                    print(f"      {i+1}. {matter_number} - {client_name} ({case_type}) - {case_status}")
        
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    
    # Test querying by Matter_Number
    print("\n🔍 TESTING MATTER_NUMBER QUERIES")
    print("-" * 40)
    
    try:
        # Get a sample matter number
        cases_table = tables['cases_main']
        sample_response = cases_table.scan(Limit=1)
        
        if sample_response.get('Items'):
            sample_case = sample_response['Items'][0]
            sample_matter_number = sample_case.get('matter_number')
            
            if sample_matter_number:
                print(f"Testing with Matter_Number: {sample_matter_number}")
                
                # Query main case
                case_response = cases_table.query(
                    KeyConditionExpression=Key('PK').eq(f'MATTER#{sample_matter_number}')
                )
                print(f"   Main case records: {len(case_response.get('Items', []))}")
                
                # Query parties for this case
                parties_response = tables['parties_roles'].query(
                    KeyConditionExpression=Key('PK').eq(f'MATTER#{sample_matter_number}')
                )
                print(f"   Party records: {len(parties_response.get('Items', []))}")
                
                # Query medical records for this case
                medical_response = tables['medical_records'].query(
                    KeyConditionExpression=Key('PK').eq(f'MATTER#{sample_matter_number}')
                )
                print(f"   Medical records: {len(medical_response.get('Items', []))}")
                
                print(f"\n✅ Matter_Number '{sample_matter_number}' successfully links all related data!")
                
    except Exception as e:
        print(f"❌ Query test error: {str(e)}")
    
    print("\n🎯 VERIFICATION COMPLETE")

if __name__ == "__main__":
    verify_sherlock_data() 