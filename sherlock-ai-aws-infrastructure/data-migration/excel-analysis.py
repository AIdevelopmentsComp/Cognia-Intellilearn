#!/usr/bin/env python3
"""
Excel vs DynamoDB Analysis
Compare source Excel files with migrated DynamoDB data
"""

import pandas as pd
import boto3
import os
from pathlib import Path

def analyze_excel_files():
    """Analyze all Excel source files"""
    print("🔍 ANALYZING EXCEL SOURCE FILES")
    print("=" * 60)
    
    excel_files = [
        # Hair Relaxer
        {
            'path': '../../HAIR RELAXER Watts FM to SF 20241008/HAIR Data Files/Case_Info.xlsx',
            'name': 'Hair Relaxer - Case Info',
            'type': 'HAIR_RELAXER'
        },
        {
            'path': '../../HAIR RELAXER Watts FM to SF 20241008/HAIR Data Files/Medical_Records.xlsx',
            'name': 'Hair Relaxer - Medical Records',
            'type': 'HAIR_RELAXER'
        },
        {
            'path': '../../HAIR RELAXER Watts FM to SF 20241008/HAIR Data Files/Financial_Info.xlsx',
            'name': 'Hair Relaxer - Financial Info',
            'type': 'HAIR_RELAXER'
        },
        
        # NEC
        {
            'path': '../../NEC Data Files/Case_Info.xlsx',
            'name': 'NEC - Case Info',
            'type': 'NEC'
        },
        {
            'path': '../../NEC Data Files/Medical_Records.xlsx',
            'name': 'NEC - Medical Records',
            'type': 'NEC'
        },
        {
            'path': '../../NEC Data Files/Financial_Info.xlsx',
            'name': 'NEC - Financial Info',
            'type': 'NEC'
        },
        
        # Zantac
        {
            'path': '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt1.xlsx',
            'name': 'Zantac Part 1',
            'type': 'ZANTAC'
        },
        {
            'path': '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt2.xlsx',
            'name': 'Zantac Part 2',
            'type': 'ZANTAC'
        },
        {
            'path': '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt3.xlsx',
            'name': 'Zantac Part 3',
            'type': 'ZANTAC'
        },
        {
            'path': '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt4.xlsx',
            'name': 'Zantac Part 4',
            'type': 'ZANTAC'
        }
    ]
    
    excel_summary = {}
    total_excel_rows = 0
    
    for file_info in excel_files:
        try:
            if os.path.exists(file_info['path']):
                df = pd.read_excel(file_info['path'])
                row_count = len(df)
                total_excel_rows += row_count
                
                case_type = file_info['type']
                if case_type not in excel_summary:
                    excel_summary[case_type] = {'files': 0, 'total_rows': 0, 'details': []}
                
                excel_summary[case_type]['files'] += 1
                excel_summary[case_type]['total_rows'] += row_count
                excel_summary[case_type]['details'].append({
                    'file': file_info['name'],
                    'rows': row_count,
                    'columns': list(df.columns[:10])  # First 10 columns
                })
                
                print(f"✅ {file_info['name']}: {row_count:,} rows")
                
                # Show sample columns for first few files
                if len(excel_summary[case_type]['details']) <= 2:
                    print(f"   📋 Columns: {', '.join(df.columns[:8])}...")
                
            else:
                print(f"❌ {file_info['name']}: FILE NOT FOUND")
                
        except Exception as e:
            print(f"⚠️ {file_info['name']}: ERROR - {str(e)}")
    
    print(f"\n📊 EXCEL SUMMARY:")
    for case_type, data in excel_summary.items():
        print(f"   🔹 {case_type}: {data['total_rows']:,} total rows from {data['files']} files")
    
    print(f"\n📈 TOTAL EXCEL ROWS: {total_excel_rows:,}")
    return excel_summary, total_excel_rows

def analyze_dynamodb_data():
    """Analyze migrated DynamoDB data"""
    print("\n🗄️ ANALYZING DYNAMODB MIGRATED DATA")
    print("=" * 60)
    
    try:
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('sherlock-cases-main')
        
        # Get comprehensive data by scanning different patterns
        case_types = ['NEC', 'HR', 'ZAN']  # HR = Hair Relaxer
        dynamo_summary = {}
        total_dynamo_items = 0
        
        for case_type in case_types:
            try:
                # Scan for cases of this type
                response = table.scan(
                    FilterExpression='contains(matter_number, :case_type)',
                    ExpressionAttributeValues={':case_type': case_type}
                )
                
                items = response.get('Items', [])
                case_count = len(items)
                total_dynamo_items += case_count
                
                # Get sample matter numbers
                sample_matter_numbers = [item.get('matter_number', 'N/A') for item in items[:5]]
                
                dynamo_summary[case_type] = {
                    'count': case_count,
                    'samples': sample_matter_numbers
                }
                
                print(f"✅ {case_type} Cases: {case_count:,}")
                if sample_matter_numbers:
                    print(f"   📋 Samples: {', '.join(sample_matter_numbers)}")
                
            except Exception as e:
                print(f"❌ Error scanning {case_type}: {str(e)}")
                dynamo_summary[case_type] = {'count': 0, 'samples': []}
        
        # Get total table count
        total_response = table.scan(Select='COUNT')
        total_table_items = total_response.get('Count', 0)
        
        print(f"\n📊 DYNAMODB SUMMARY:")
        for case_type, data in dynamo_summary.items():
            print(f"   🔹 {case_type}: {data['count']:,} items")
        
        print(f"\n📈 TOTAL TABLE ITEMS: {total_table_items:,}")
        
        return dynamo_summary, total_table_items
        
    except Exception as e:
        print(f"❌ Error analyzing DynamoDB: {str(e)}")
        return {}, 0

def compare_data(excel_summary, excel_total, dynamo_summary, dynamo_total):
    """Compare Excel vs DynamoDB data"""
    print("\n🔄 EXCEL vs DYNAMODB COMPARISON")
    print("=" * 60)
    
    # Case type mapping
    case_mapping = {
        'HAIR_RELAXER': 'HR',
        'NEC': 'NEC', 
        'ZANTAC': 'ZAN'
    }
    
    discrepancies = []
    
    for excel_type, excel_data in excel_summary.items():
        dynamo_type = case_mapping.get(excel_type, excel_type)
        dynamo_data = dynamo_summary.get(dynamo_type, {'count': 0})
        
        excel_count = excel_data['total_rows']
        dynamo_count = dynamo_data['count']
        
        difference = excel_count - dynamo_count
        percentage = (dynamo_count / excel_count * 100) if excel_count > 0 else 0
        
        status = "✅" if abs(difference) < 10 else "⚠️" if abs(difference) < 100 else "❌"
        
        print(f"{status} {excel_type}:")
        print(f"   📊 Excel: {excel_count:,} rows")
        print(f"   🗄️ DynamoDB: {dynamo_count:,} items")
        print(f"   📈 Migration: {percentage:.1f}%")
        
        if abs(difference) > 5:
            discrepancies.append({
                'type': excel_type,
                'excel': excel_count,
                'dynamo': dynamo_count,
                'difference': difference
            })
            print(f"   ⚠️ Difference: {difference:+,} items")
        
        print()
    
    print(f"📊 OVERALL COMPARISON:")
    print(f"   📂 Total Excel Rows: {excel_total:,}")
    print(f"   🗄️ Total DynamoDB Items: {dynamo_total:,}")
    print(f"   📈 Overall Migration: {(dynamo_total/excel_total*100):.1f}%")
    
    if discrepancies:
        print(f"\n⚠️ DISCREPANCIES FOUND: {len(discrepancies)} case types need review")
        return False
    else:
        print(f"\n✅ MIGRATION LOOKS GOOD: All data within acceptable ranges")
        return True

def main():
    """Main analysis function"""
    print("🎯 SHERLOCK AI DATA ANALYSIS")
    print("=" * 60)
    
    # Analyze Excel files
    excel_summary, excel_total = analyze_excel_files()
    
    # Analyze DynamoDB data
    dynamo_summary, dynamo_total = analyze_dynamodb_data()
    
    # Compare results
    migration_success = compare_data(excel_summary, excel_total, dynamo_summary, dynamo_total)
    
    print("\n🎯 ANALYSIS COMPLETE")
    print("=" * 60)
    
    return migration_success

if __name__ == "__main__":
    main() 