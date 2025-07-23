#!/usr/bin/env python3
"""
Verify Zantac Data in DynamoDB
Analyzes why only 1,864 cases show instead of 8,268 inserted
"""

import boto3
import json
from boto3.dynamodb.conditions import Key, Attr
from collections import Counter

def analyze_zantac_data():
    """Analyze Zantac data in DynamoDB"""
    
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    cases_table = dynamodb.Table('sherlock-cases-main')
    parties_table = dynamodb.Table('sherlock-parties-roles')
    
    print("ZANTAC DATA ANALYSIS")
    print("=" * 50)
    
    # 1. Check total Zantac cases by different patterns
    print("\n1. SCANNING FOR ZANTAC CASES...")
    
    # Scan for cases with ZAN in matter_number
    response = cases_table.scan(
        FilterExpression=Attr('matter_number').contains('ZAN')
    )
    zan_cases = response['Items']
    print(f"   Cases with ZAN in matter_number: {len(zan_cases)}")
    
    # Scan for cases with case_type = ZANTAC
    response = cases_table.scan(
        FilterExpression=Attr('case_type').eq('ZANTAC')
    )
    zantac_type_cases = response['Items']
    print(f"   Cases with case_type = ZANTAC: {len(zantac_type_cases)}")
    
    # Scan for cases with project_tag = SHERLOCK AI
    response = cases_table.scan(
        FilterExpression=Attr('project_tag').eq('SHERLOCK AI')
    )
    sherlock_cases = response['Items']
    print(f"   Cases with project_tag = SHERLOCK AI: {len(sherlock_cases)}")
    
    # 2. Analyze sample cases structure
    print("\n2. ANALYZING CASE STRUCTURE...")
    if zantac_type_cases:
        sample_case = zantac_type_cases[0]
        print(f"   Sample PK: {sample_case.get('PK')}")
        print(f"   Sample SK: {sample_case.get('SK')}")
        print(f"   Matter number: {sample_case.get('matter_number')}")
        print(f"   Client name: {sample_case.get('client_name')}")
        print(f"   Client full name: {sample_case.get('client_full_name')}")
        print(f"   Case type: {sample_case.get('case_type')}")
        print(f"   Status: {sample_case.get('status')}")
        print(f"   Project tag: {sample_case.get('project_tag')}")
        
        # Check GSI attributes
        print(f"   GSI4PK: {sample_case.get('GSI4PK')}")
        print(f"   GSI4SK: {sample_case.get('GSI4SK')}")
    
    # 3. Check injured parties
    print("\n3. CHECKING INJURED PARTIES...")
    parties_response = parties_table.scan(
        FilterExpression=Attr('matter_number').contains('ZAN')
    )
    zantac_parties = parties_response['Items']
    print(f"   Injured parties for Zantac cases: {len(zantac_parties)}")
    
    if zantac_parties:
        sample_party = zantac_parties[0]
        print(f"   Sample party PK: {sample_party.get('PK')}")
        print(f"   Sample party SK: {sample_party.get('SK')}")
        print(f"   First name: {sample_party.get('first_name')}")
        print(f"   Last name: {sample_party.get('last_name')}")
        print(f"   Full legal name: {sample_party.get('full_legal_name')}")
    
    # 4. Check matter_number patterns
    print("\n4. MATTER NUMBER PATTERNS...")
    matter_patterns = Counter()
    for case in zantac_type_cases[:100]:  # Sample first 100
        matter_num = case.get('matter_number', '')
        if matter_num.startswith('ZAN'):
            prefix = matter_num[:6] if len(matter_num) >= 6 else matter_num
            matter_patterns[prefix] += 1
    
    print("   Top matter_number patterns:")
    for pattern, count in matter_patterns.most_common(10):
        print(f"     {pattern}: {count} cases")
    
    # 5. Check for UI query compatibility  
    print("\n5. UI COMPATIBILITY CHECK...")
    
    # Check GSI4 index structure (used by UI)
    gsi4_compatible = 0
    missing_gsi4 = 0
    
    for case in zantac_type_cases[:100]:  # Sample
        if case.get('GSI4PK') and case.get('GSI4SK'):
            gsi4_compatible += 1
        else:
            missing_gsi4 += 1
    
    print(f"   Cases with GSI4 attributes: {gsi4_compatible}/100 sampled")
    print(f"   Cases missing GSI4: {missing_gsi4}/100 sampled")
    
    # 6. Sample query like the UI does
    print("\n6. SIMULATING UI QUERY...")
    try:
        # Query GSI4 like the UI does
        response = cases_table.query(
            IndexName='GSI4-Index',
            KeyConditionExpression=Key('GSI4PK').eq('PROJECT#SHERLOCK_AI')
        )
        ui_visible_cases = response['Items']
        
        # Count Zantac cases in UI-visible results
        zantac_in_ui = [case for case in ui_visible_cases if case.get('case_type') == 'ZANTAC']
        
        print(f"   Total cases visible to UI: {len(ui_visible_cases)}")
        print(f"   Zantac cases visible to UI: {len(zantac_in_ui)}")
        
    except Exception as e:
        print(f"   UI query simulation failed: {e}")
    
    # 7. Recommendations
    print("\n7. RECOMMENDATIONS...")
    if len(zantac_type_cases) > len(sherlock_cases):
        print("   ⚠️  Some Zantac cases missing project_tag = 'SHERLOCK AI'")
    
    if missing_gsi4 > 0:
        print("   ⚠️  Some cases missing GSI4 attributes for UI visibility")
    
    print(f"\n📊 SUMMARY:")
    print(f"   Expected: 8,268 Zantac cases")
    print(f"   Found in DB: {len(zantac_type_cases)} cases")
    print(f"   UI shows: 1,864 cases")
    print(f"   Gap: {len(zantac_type_cases) - 1864} cases not visible")

if __name__ == "__main__":
    analyze_zantac_data() 