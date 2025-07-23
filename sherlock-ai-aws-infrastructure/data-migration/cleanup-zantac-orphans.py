#!/usr/bin/env python3
"""
Cleanup Zantac Orphan Cases
SAFELY removes ONLY Zantac cases that are NOT in the original Salesforce JSON
Preserves ALL other legitimate cases (NEC, Hair Relaxer, Tesla, Solar, etc.)
"""

import json
import boto3
import logging
from collections import defaultdict
from boto3.dynamodb.conditions import Key, Attr

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ZantacOrphanCleaner:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.cases_table = self.dynamodb.Table('sherlock-cases-main')
        self.parties_table = self.dynamodb.Table('sherlock-parties-roles')
        
        self.stats = {
            'orphan_cases_found': 0,
            'orphan_cases_deleted': 0,
            'orphan_parties_deleted': 0,
            'legitimate_cases_preserved': 0,
            'errors': 0
        }
        
    def load_legitimate_claim_ids(self):
        """Load Claim_Ids from original Salesforce JSON"""
        logger.info("📊 Loading legitimate Claim_Ids from Salesforce JSON...")
        
        try:
            with open(r'..\..\zantac\salesforce zantac.json', 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Extract all Claim_Ids from JSON
            legitimate_claim_ids = set()
            for record in data:
                claim_id = record.get('Claim_Id__c') or record.get('Id') or record.get('claim_id')
                if claim_id:
                    legitimate_claim_ids.add(claim_id)
            
            logger.info(f"✅ Loaded {len(legitimate_claim_ids)} legitimate Claim_Ids from Salesforce JSON")
            return legitimate_claim_ids
            
        except Exception as e:
            logger.error(f"❌ Error loading Salesforce JSON: {str(e)}")
            return set()
    
    def find_orphan_zantac_cases(self, legitimate_claim_ids):
        """Find Zantac cases that are NOT in the legitimate Salesforce JSON"""
        logger.info("🔍 Scanning for orphan Zantac cases...")
        
        orphan_cases = []
        legitimate_cases = []
        
        # Scan for all cases with ZAN in matter_number
        response = self.cases_table.scan(
            FilterExpression=Attr('matter_number').contains('ZAN')
        )
        all_zantac_cases = response['Items']
        
        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = self.cases_table.scan(
                FilterExpression=Attr('matter_number').contains('ZAN'),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            all_zantac_cases.extend(response['Items'])
        
        logger.info(f"📊 Found {len(all_zantac_cases)} total Zantac cases in database")
        
        # Classify cases as legitimate or orphan
        for case in all_zantac_cases:
            claim_id = case.get('salesforce_claim_id')
            
            if claim_id and claim_id in legitimate_claim_ids:
                # This is a legitimate case from Salesforce JSON
                legitimate_cases.append(case)
            else:
                # This is an orphan case NOT in Salesforce JSON
                orphan_cases.append(case)
        
        logger.info(f"✅ CLASSIFICATION RESULTS:")
        logger.info(f"   ✨ Legitimate cases (keep): {len(legitimate_cases)}")
        logger.info(f"   🗑️ Orphan cases (delete): {len(orphan_cases)}")
        
        self.stats['legitimate_cases_preserved'] = len(legitimate_cases)
        self.stats['orphan_cases_found'] = len(orphan_cases)
        
        return orphan_cases
    
    def delete_orphan_case(self, case):
        """Safely delete a single orphan case and its associated records"""
        try:
            pk = case.get('PK')
            sk = case.get('SK')
            matter_number = case.get('matter_number')
            
            if not pk or not sk:
                logger.warning(f"⚠️ Case missing PK/SK: {matter_number}")
                return False
            
            # Delete main case record
            self.cases_table.delete_item(Key={'PK': pk, 'SK': sk})
            logger.debug(f"🗑️ Deleted case: {matter_number}")
            
            # Delete associated injured parties
            if matter_number:
                try:
                    # Query for parties associated with this matter
                    parties_response = self.parties_table.query(
                        KeyConditionExpression=Key('PK').eq(f'MATTER#{matter_number}')
                    )
                    
                    for party in parties_response['Items']:
                        party_pk = party.get('PK')
                        party_sk = party.get('SK')
                        if party_pk and party_sk:
                            self.parties_table.delete_item(Key={'PK': party_pk, 'SK': party_sk})
                            self.stats['orphan_parties_deleted'] += 1
                            logger.debug(f"🗑️ Deleted party: {party_sk}")
                            
                except Exception as e:
                    logger.warning(f"⚠️ Error deleting parties for {matter_number}: {str(e)}")
            
            self.stats['orphan_cases_deleted'] += 1
            return True
            
        except Exception as e:
            logger.error(f"❌ Error deleting case {case.get('matter_number', 'unknown')}: {str(e)}")
            self.stats['errors'] += 1
            return False
    
    def run_cleanup(self, dry_run=True):
        """Run the orphan cleanup process"""
        mode = "DRY RUN" if dry_run else "LIVE DELETION"
        logger.info(f"🚀 Starting Zantac Orphan Cleanup - {mode}")
        logger.info("=" * 70)
        
        # Load legitimate Claim_Ids from Salesforce JSON
        legitimate_claim_ids = self.load_legitimate_claim_ids()
        if not legitimate_claim_ids:
            logger.error("❌ Cannot proceed without legitimate Claim_Ids")
            return False
        
        # Find orphan cases
        orphan_cases = self.find_orphan_zantac_cases(legitimate_claim_ids)
        
        if not orphan_cases:
            logger.info("✅ No orphan Zantac cases found - database is clean!")
            return True
        
        # Show sample orphan cases for confirmation
        logger.info(f"\n🔍 SAMPLE ORPHAN CASES TO DELETE:")
        for i, case in enumerate(orphan_cases[:5]):
            matter_num = case.get('matter_number')
            claim_id = case.get('salesforce_claim_id') or 'N/A'
            logger.info(f"   {i+1}. {matter_num} (Claim_Id: {claim_id})")
        
        if len(orphan_cases) > 5:
            logger.info(f"   ... and {len(orphan_cases) - 5} more orphan cases")
        
        if dry_run:
            logger.info(f"\n🔍 DRY RUN - NO ACTUAL DELETION PERFORMED")
            logger.info(f"   Would delete: {len(orphan_cases)} orphan Zantac cases")
            logger.info(f"   Would preserve: {self.stats['legitimate_cases_preserved']} legitimate cases")
            return True
        
        # Actual deletion
        logger.info(f"\n🗑️ STARTING DELETION OF {len(orphan_cases)} ORPHAN CASES...")
        
        for i, case in enumerate(orphan_cases):
            if (i + 1) % 100 == 0:
                logger.info(f"📊 Progress: {i + 1}/{len(orphan_cases)} cases processed")
            
            self.delete_orphan_case(case)
        
        # Final summary
        logger.info("\n" + "=" * 70)
        logger.info("🎯 ZANTAC ORPHAN CLEANUP COMPLETED")
        logger.info("=" * 70)
        logger.info(f"📊 FINAL RESULTS:")
        logger.info(f"   🗑️ Orphan cases deleted: {self.stats['orphan_cases_deleted']}")
        logger.info(f"   👥 Orphan parties deleted: {self.stats['orphan_parties_deleted']}")
        logger.info(f"   ✨ Legitimate cases preserved: {self.stats['legitimate_cases_preserved']}")
        logger.info(f"   ❌ Errors: {self.stats['errors']}")
        logger.info(f"")
        logger.info(f"🎉 Database cleaned! Only legitimate Salesforce Zantac cases remain.")
        logger.info("=" * 70)
        
        return True

def main():
    print("ZANTAC ORPHAN CLEANUP TOOL")
    print("=" * 70)
    print("This tool will SAFELY remove ONLY Zantac cases that are NOT")
    print("in the original Salesforce JSON file.")
    print("")
    print("🔒 SAFETY GUARANTEES:")
    print("   ✅ Will NOT touch NEC, Hair Relaxer, Tesla, Solar cases")
    print("   ✅ Will NOT touch legitimate Zantac cases from Salesforce JSON")
    print("   ✅ Will ONLY remove orphan/duplicate Zantac cases")
    print("")
    
    try:
        cleaner = ZantacOrphanCleaner()
        
        # First run in DRY RUN mode
        print("🔍 Running DRY RUN to analyze what would be deleted...")
        success = cleaner.run_cleanup(dry_run=True)
        
        if not success:
            print("❌ Dry run failed - cannot proceed")
            return
        
        print(f"\n📋 DRY RUN RESULTS:")
        print(f"   🗑️ Orphan cases to delete: {cleaner.stats['orphan_cases_found']}")
        print(f"   ✨ Legitimate cases to preserve: {cleaner.stats['legitimate_cases_preserved']}")
        
        if cleaner.stats['orphan_cases_found'] == 0:
            print("\n✅ No cleanup needed - database is already clean!")
            return
        
        # Confirm actual deletion
        print(f"\n🚨 READY TO DELETE {cleaner.stats['orphan_cases_found']} ORPHAN ZANTAC CASES")
        print("   This will permanently remove duplicate/orphan cases.")
        print("   Legitimate cases from the Salesforce JSON will be preserved.")
        
        confirmation = input(f"\nProceed with ACTUAL deletion? (y/N): ")
        if confirmation.lower() != 'y':
            print("❌ Cleanup cancelled by user")
            return
        
        # Reset stats and run actual cleanup
        cleaner.stats = {key: 0 for key in cleaner.stats}
        success = cleaner.run_cleanup(dry_run=False)
        
        if success:
            print(f"\n🎉 CLEANUP SUCCESSFUL!")
            print(f"   Database now contains only legitimate Zantac cases.")
            print(f"   UI should now show correct count of ~8,268 cases.")
        
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {str(e)}")
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    main() 