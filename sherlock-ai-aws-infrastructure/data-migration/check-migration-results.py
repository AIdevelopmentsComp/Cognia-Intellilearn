#!/usr/bin/env python3
"""
Migration Results Checker
Verifies final migration results and provides detailed statistics
"""

import boto3
from boto3.dynamodb.conditions import Key, Attr
import time

def check_migration_results():
    """Check and report migration results"""
    print("🚀 SHERLOCK AI MIGRATION RESULTS CHECK")
    print("=" * 60)
    
    try:
        # Connect to DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('sherlock-cases-main')
        
        # Total record count
        print("📊 SCANNING DATABASE...")
        total_response = table.scan(Select='COUNT')
        total_count = total_response['Count']
        
        print(f"📋 Total records in database: {total_count:,}")
        print()
        
        # Count by record types
        print("🔍 ANALYZING RECORD TYPES...")
        
        # Cases (CASE_META)
        cases_response = table.scan(
            FilterExpression=Attr('SK').begins_with('CASE_META'),
            Select='COUNT'
        )
        cases_count = cases_response['Count']
        print(f"📁 Cases (CASE_META): {cases_count:,}")
        
        # Parties (INJURED_PARTY)
        parties_response = table.scan(
            FilterExpression=Attr('SK').contains('INJURED_PARTY'),
            Select='COUNT'
        )
        parties_count = parties_response['Count']
        print(f"👥 Parties (INJURED_PARTY): {parties_count:,}")
        
        # Medical Records
        medical_response = table.scan(
            FilterExpression=Attr('SK').contains('MEDICAL'),
            Select='COUNT'
        )
        medical_count = medical_response['Count']
        print(f"🏥 Medical Records: {medical_count:,}")
        
        # Documents
        documents_response = table.scan(
            FilterExpression=Attr('SK').contains('DOCUMENT'),
            Select='COUNT'
        )
        documents_count = documents_response['Count']
        print(f"📄 Documents: {documents_count:,}")
        
        print()
        print("📈 CASE TYPE BREAKDOWN...")
        
        # Count by case type
        for case_type in ['ZANTAC', 'NEC', 'HAIR_RELAXER']:
            case_type_response = table.scan(
                FilterExpression=Attr('case_type').eq(case_type),
                Select='COUNT'
            )
            case_type_count = case_type_response['Count']
            print(f"   🔸 {case_type}: {case_type_count:,} cases")
        
        print()
        print("✅ MIGRATION SUMMARY:")
        print("-" * 40)
        print(f"📊 Total Records: {total_count:,}")
        print(f"📋 Cases: {cases_count:,}")
        print(f"👥 Parties: {parties_count:,}")
        print(f"🏥 Medical: {medical_count:,}")
        print(f"📄 Documents: {documents_count:,}")
        print()
        
        # Sample recent cases
        print("🎯 SAMPLE RECENT CASES:")
        print("-" * 40)
        
        sample_response = table.scan(
            FilterExpression=Attr('SK').begins_with('CASE_META'),
            Limit=5
        )
        
        for item in sample_response.get('Items', []):
            matter_number = item.get('matter_number', 'Unknown')
            case_type = item.get('case_type', 'Unknown')
            status = item.get('status', 'Unknown')
            client_name = item.get('client_name', 'N/A')
            
            print(f"   📋 {matter_number} | {case_type} | {status} | {client_name}")
        
        print()
        print("🎉 MIGRATION ANALYSIS COMPLETE!")
        
        if total_count > 100000:
            print("✅ EXCELLENT: Large-scale migration successful!")
        elif total_count > 10000:
            print("✅ GOOD: Significant data migration completed!")
        elif total_count > 1000:
            print("✅ MODERATE: Basic migration completed!")
        else:
            print("⚠️ LOW: Consider checking migration logs for issues")
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking migration results: {str(e)}")
        return False

if __name__ == "__main__":
    check_migration_results() 