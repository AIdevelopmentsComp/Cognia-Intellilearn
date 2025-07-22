#!/usr/bin/env python3
import boto3

def check_zantac_migration():
    """Check how many Zantac cases were actually migrated"""
    
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table('sherlock-cases-main')
    
    # Scan for Zantac cases
    try:
        print("🔍 Scanning for Zantac cases...")
        
        # Scan with filter for Zantac cases
        response = table.scan(
            FilterExpression='contains(matter_number, :zantac)',
            ExpressionAttributeValues={
                ':zantac': 'ZAN'
            }
        )
        
        zantac_cases = response.get('Items', [])
        print(f"🔍 Total Zantac cases found: {len(zantac_cases)}")
        
        # Show sample Matter_Numbers
        if zantac_cases:
            print("\n📋 Sample Zantac Matter Numbers:")
            for i, case in enumerate(zantac_cases[:10]):
                matter_num = case.get('matter_number', 'N/A')
                case_type = case.get('mass_tort_type', 'N/A')
                print(f"   {i+1}. {matter_num} - Type: {case_type}")
            
            if len(zantac_cases) > 10:
                print(f"   ... and {len(zantac_cases) - 10} more cases")
        
        # Also check for NEC and Hair Relaxer for comparison
        nec_response = table.scan(
            FilterExpression='contains(matter_number, :nec)',
            ExpressionAttributeValues={
                ':nec': 'NEC'
            }
        )
        
        hr_response = table.scan(
            FilterExpression='contains(matter_number, :hr)',
            ExpressionAttributeValues={
                ':hr': 'HR'
            }
        )
        
        print(f"\n📊 Migration Summary:")
        print(f"   🔹 NEC cases: {len(nec_response.get('Items', []))}")
        print(f"   🔹 Hair Relaxer cases: {len(hr_response.get('Items', []))}")
        print(f"   🔹 Zantac cases: {len(zantac_cases)}")
        
        # Check total items
        all_response = table.scan(Select='COUNT')
        total_items = all_response.get('Count', 0)
        print(f"\n📊 Total items in sherlock-cases-main: {total_items:,}")
        
        return len(zantac_cases)
        
    except Exception as e:
        print(f"❌ Error checking Zantac cases: {str(e)}")
        return 0

if __name__ == "__main__":
    check_zantac_migration() 