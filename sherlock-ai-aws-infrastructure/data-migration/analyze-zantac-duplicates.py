#!/usr/bin/env python3
"""
Analyze Zantac Duplicates
Analyzes unique Claim_Id from Salesforce JSON and identifies duplicates in DynamoDB
"""

import json
import boto3
import logging
from collections import Counter, defaultdict
from boto3.dynamodb.conditions import Key, Attr

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ZantacDuplicateAnalyzer:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.cases_table = self.dynamodb.Table('sherlock-cases-main')
        
    def analyze_salesforce_json(self):
        """Analyze the original Salesforce JSON file"""
        logger.info("📊 Analyzing original Salesforce JSON file...")
        
        try:
            with open(r'..\..\zantac\salesforce zantac.json', 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            logger.info(f"📁 Loaded JSON with {len(data)} records")
            
            # Count unique Claim_Id values
            claim_ids = []
            for record in data:
                claim_id = record.get('Claim_Id__c') or record.get('Id') or record.get('claim_id')
                if claim_id:
                    claim_ids.append(claim_id)
            
            # Analyze uniqueness
            claim_id_counts = Counter(claim_ids)
            unique_claim_ids = set(claim_ids)
            
            logger.info(f"📈 SALESFORCE JSON ANALYSIS:")
            logger.info(f"   📋 Total records: {len(data)}")
            logger.info(f"   🔑 Records with Claim_Id: {len(claim_ids)}")
            logger.info(f"   ✨ Unique Claim_Ids: {len(unique_claim_ids)}")
            logger.info(f"   🔄 Duplicated Claim_Ids: {len(claim_id_counts) - len(unique_claim_ids)}")
            
            # Show duplicated Claim_Ids in JSON if any
            duplicates_in_json = {k: v for k, v in claim_id_counts.items() if v > 1}
            if duplicates_in_json:
                logger.info(f"   ⚠️ Duplicated Claim_Ids in JSON: {len(duplicates_in_json)}")
                for claim_id, count in list(duplicates_in_json.items())[:5]:
                    logger.info(f"      - {claim_id}: {count} times")
            
            return unique_claim_ids, data
            
        except Exception as e:
            logger.error(f"❌ Error analyzing JSON: {str(e)}")
            return set(), []
    
    def analyze_dynamodb_cases(self):
        """Analyze Zantac cases currently in DynamoDB"""
        logger.info("🔍 Analyzing Zantac cases in DynamoDB...")
        
        # Scan for all cases with ZAN in matter_number
        all_zantac_cases = []
        
        response = self.cases_table.scan(
            FilterExpression=Attr('matter_number').contains('ZAN')
        )
        all_zantac_cases.extend(response['Items'])
        
        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = self.cases_table.scan(
                FilterExpression=Attr('matter_number').contains('ZAN'),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            all_zantac_cases.extend(response['Items'])
        
        logger.info(f"📊 DYNAMODB ANALYSIS:")
        logger.info(f"   📋 Total Zantac cases in DB: {len(all_zantac_cases)}")
        
        # Group by salesforce_claim_id
        cases_by_claim_id = defaultdict(list)
        cases_by_matter_number = defaultdict(list)
        
        for case in all_zantac_cases:
            claim_id = case.get('salesforce_claim_id')
            matter_number = case.get('matter_number')
            
            if claim_id:
                cases_by_claim_id[claim_id].append(case)
            if matter_number:
                cases_by_matter_number[matter_number].append(case)
        
        # Analyze duplicates
        duplicated_claim_ids = {k: v for k, v in cases_by_claim_id.items() if len(v) > 1}
        duplicated_matter_numbers = {k: v for k, v in cases_by_matter_number.items() if len(v) > 1}
        
        logger.info(f"   🔑 Unique Claim_Ids: {len(cases_by_claim_id)}")
        logger.info(f"   🔄 Duplicated Claim_Ids: {len(duplicated_claim_ids)}")
        logger.info(f"   📄 Unique Matter Numbers: {len(cases_by_matter_number)}")
        logger.info(f"   🔄 Duplicated Matter Numbers: {len(duplicated_matter_numbers)}")
        
        # Show examples of duplicates
        if duplicated_claim_ids:
            logger.info(f"   ⚠️ Examples of duplicated Claim_Ids:")
            for claim_id, cases in list(duplicated_claim_ids.items())[:3]:
                logger.info(f"      - {claim_id}: {len(cases)} cases")
                for case in cases[:2]:
                    logger.info(f"        PK: {case.get('PK')}, Matter: {case.get('matter_number')}")
        
        return all_zantac_cases, cases_by_claim_id, cases_by_matter_number
    
    def identify_legitimate_cases(self, salesforce_claim_ids, db_cases_by_claim_id):
        """Identify which cases are legitimate based on Salesforce JSON"""
        logger.info("🎯 Identifying legitimate vs duplicate cases...")
        
        legitimate_cases = []
        orphan_cases = []
        
        for claim_id, db_cases in db_cases_by_claim_id.items():
            if claim_id in salesforce_claim_ids:
                # This is a legitimate case from Salesforce
                # Keep only the first one if there are duplicates
                legitimate_cases.append(db_cases[0])
                
                if len(db_cases) > 1:
                    logger.info(f"⚠️ Found {len(db_cases)} duplicates for Claim_Id: {claim_id}")
                    for duplicate_case in db_cases[1:]:
                        logger.info(f"   - Duplicate: {duplicate_case.get('PK')} / {duplicate_case.get('matter_number')}")
            else:
                # This case is not in the original Salesforce JSON
                logger.info(f"❓ Orphan case not in Salesforce JSON: {claim_id}")
                for case in db_cases:
                    orphan_cases.append(case)
        
        logger.info(f"✅ LEGITIMATE ANALYSIS:")
        logger.info(f"   ✨ Legitimate cases (from Salesforce): {len(legitimate_cases)}")
        logger.info(f"   🗑️ Orphan cases (not in Salesforce): {len(orphan_cases)}")
        logger.info(f"   📊 Expected total: {len(salesforce_claim_ids)}")
        
        if len(legitimate_cases) != len(salesforce_claim_ids):
            missing_count = len(salesforce_claim_ids) - len(legitimate_cases)
            logger.warning(f"⚠️ Missing {missing_count} cases from Salesforce JSON")
        
        return legitimate_cases, orphan_cases
    
    def run_analysis(self):
        """Run complete duplicate analysis"""
        logger.info("🚀 Starting Zantac Duplicate Analysis")
        logger.info("=" * 70)
        
        # Step 1: Analyze Salesforce JSON
        salesforce_claim_ids, salesforce_data = self.analyze_salesforce_json()
        
        # Step 2: Analyze DynamoDB cases
        db_cases, db_cases_by_claim_id, db_cases_by_matter_number = self.analyze_dynamodb_cases()
        
        # Step 3: Identify legitimate vs duplicate cases
        legitimate_cases, orphan_cases = self.identify_legitimate_cases(
            salesforce_claim_ids, db_cases_by_claim_id
        )
        
        # Final summary
        logger.info("\n" + "=" * 70)
        logger.info("🎯 FINAL ANALYSIS SUMMARY")
        logger.info("=" * 70)
        logger.info(f"📊 SALESFORCE JSON (Source of Truth):")
        logger.info(f"   📄 Total records: {len(salesforce_data)}")
        logger.info(f"   🔑 Unique Claim_Ids: {len(salesforce_claim_ids)}")
        logger.info(f"")
        logger.info(f"📊 DYNAMODB CURRENT STATE:")
        logger.info(f"   📄 Total Zantac cases: {len(db_cases)}")
        logger.info(f"   ✅ Legitimate cases: {len(legitimate_cases)}")
        logger.info(f"   🗑️ Orphan/duplicate cases: {len(orphan_cases)}")
        logger.info(f"")
        logger.info(f"🎯 RECOMMENDED ACTIONS:")
        if len(orphan_cases) > 0:
            logger.info(f"   1. Remove {len(orphan_cases)} orphan/duplicate cases")
        if len(legitimate_cases) < len(salesforce_claim_ids):
            missing = len(salesforce_claim_ids) - len(legitimate_cases)
            logger.info(f"   2. Re-import {missing} missing legitimate cases")
        if len(legitimate_cases) == len(salesforce_claim_ids) and len(orphan_cases) == 0:
            logger.info(f"   ✅ Database is clean - no action needed")
        
        logger.info("=" * 70)
        
        return {
            'salesforce_count': len(salesforce_claim_ids),
            'db_total': len(db_cases),
            'legitimate': len(legitimate_cases),
            'orphans': len(orphan_cases),
            'orphan_cases': orphan_cases
        }

def main():
    print("ZANTAC DUPLICATE ANALYZER")
    print("=" * 70)
    print("This will analyze Zantac cases and identify duplicates/orphans")
    print("that should not exist based on the original Salesforce JSON.")
    print("")
    
    try:
        analyzer = ZantacDuplicateAnalyzer()
        results = analyzer.run_analysis()
        
        print(f"\n📊 Analysis complete!")
        print(f"   Expected cases: {results['salesforce_count']}")
        print(f"   Current DB cases: {results['db_total']}")
        print(f"   Legitimate cases: {results['legitimate']}")
        print(f"   Orphan/duplicate cases: {results['orphans']}")
        
        if results['orphans'] > 0:
            print(f"\n🚨 Found {results['orphans']} cases that should be removed.")
            print(f"   Run cleanup script to remove orphan cases.")
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {str(e)}")
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    main() 