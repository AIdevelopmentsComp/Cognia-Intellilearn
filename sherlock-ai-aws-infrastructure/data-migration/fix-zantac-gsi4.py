#!/usr/bin/env python3
"""
Fix Zantac Cases - Add Missing GSI4 Attributes
Corrects Zantac cases that are missing GSI4PK, GSI4SK, and project_tag attributes
This ensures they appear in the UI correctly
"""

import boto3
import logging
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ZantacGSI4Fixer:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.cases_table = self.dynamodb.Table('sherlock-cases-main')
        
        self.stats = {
            'total_found': 0,
            'updated': 0,
            'errors': 0,
            'already_correct': 0
        }
        
    def find_zantac_cases_missing_gsi4(self):
        """Find all Zantac cases missing GSI4 attributes"""
        logger.info("🔍 Scanning for Zantac cases missing GSI4 attributes...")
        
        # Scan for cases with ZAN in matter_number but missing GSI4PK
        response = self.cases_table.scan(
            FilterExpression=Attr('matter_number').contains('ZAN') & Attr('GSI4PK').not_exists()
        )
        
        cases_to_fix = response['Items']
        
        # Continue scanning if there are more items
        while 'LastEvaluatedKey' in response:
            response = self.cases_table.scan(
                FilterExpression=Attr('matter_number').contains('ZAN') & Attr('GSI4PK').not_exists(),
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            cases_to_fix.extend(response['Items'])
        
        logger.info(f"📊 Found {len(cases_to_fix)} Zantac cases missing GSI4 attributes")
        return cases_to_fix
    
    def fix_case_attributes(self, case):
        """Fix missing attributes for a single case"""
        try:
            pk = case.get('PK')
            sk = case.get('SK')
            matter_number = case.get('matter_number')
            
            if not pk or not sk or not matter_number:
                logger.warning(f"⚠️ Case missing required fields: PK={pk}, SK={sk}, matter_number={matter_number}")
                return False
            
            # Prepare update attributes
            update_expression_parts = []
            expression_attribute_values = {}
            
            # Add GSI4 attributes
            if not case.get('GSI4PK'):
                update_expression_parts.append('GSI4PK = :gsi4pk')
                expression_attribute_values[':gsi4pk'] = 'PROJECT#SHERLOCK_AI'
            
            if not case.get('GSI4SK'):
                update_expression_parts.append('GSI4SK = :gsi4sk')
                expression_attribute_values[':gsi4sk'] = f'CASE_TYPE#ZANTAC'
            
            # Add project_tag
            if not case.get('project_tag'):
                update_expression_parts.append('project_tag = :project_tag')
                expression_attribute_values[':project_tag'] = 'SHERLOCK AI'
            
            # Add case_type if missing
            if not case.get('case_type'):
                update_expression_parts.append('case_type = :case_type')
                expression_attribute_values[':case_type'] = 'ZANTAC'
            
            # Add status if missing
            if not case.get('status'):
                update_expression_parts.append('#status = :status')
                expression_attribute_values[':status'] = 'ACTIVE'
                # Need to use ExpressionAttributeNames for reserved word
                expression_attribute_names = {'#status': 'status'}
            else:
                expression_attribute_names = {}
            
            # Add litigation_category if missing
            if not case.get('litigation_category'):
                update_expression_parts.append('litigation_category = :litigation_category')
                expression_attribute_values[':litigation_category'] = 'PHARMACEUTICAL'
            
            # Add mass_tort_type if missing
            if not case.get('mass_tort_type'):
                update_expression_parts.append('mass_tort_type = :mass_tort_type')
                expression_attribute_values[':mass_tort_type'] = 'PRODUCT_LIABILITY'
            
            if not update_expression_parts:
                logger.debug(f"✅ Case {matter_number} already has all required attributes")
                self.stats['already_correct'] += 1
                return True
            
            # Build update expression
            update_expression = 'SET ' + ', '.join(update_expression_parts)
            
            # Update the case
            update_params = {
                'Key': {'PK': pk, 'SK': sk},
                'UpdateExpression': update_expression,
                'ExpressionAttributeValues': expression_attribute_values
            }
            
            if expression_attribute_names:
                update_params['ExpressionAttributeNames'] = expression_attribute_names
            
            self.cases_table.update_item(**update_params)
            
            logger.info(f"✅ Updated case {matter_number} with missing attributes")
            self.stats['updated'] += 1
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating case {case.get('matter_number', 'unknown')}: {str(e)}")
            self.stats['errors'] += 1
            return False
    
    def run_fix(self):
        """Run the complete fix process"""
        logger.info("🚀 Starting Zantac GSI4 Fix Process")
        logger.info("=" * 60)
        
        # Find cases to fix
        cases_to_fix = self.find_zantac_cases_missing_gsi4()
        self.stats['total_found'] = len(cases_to_fix)
        
        if not cases_to_fix:
            logger.info("✅ No Zantac cases need GSI4 fixes")
            return
        
        # Process each case
        for i, case in enumerate(cases_to_fix):
            if (i + 1) % 50 == 0:
                logger.info(f"📊 Progress: {i + 1}/{len(cases_to_fix)} cases processed")
            
            self.fix_case_attributes(case)
        
        # Final summary
        logger.info("\n" + "=" * 60)
        logger.info("🎯 ZANTAC GSI4 FIX COMPLETED")
        logger.info("=" * 60)
        logger.info(f"📊 RESULTS:")
        logger.info(f"   🔍 Total cases found: {self.stats['total_found']}")
        logger.info(f"   ✅ Cases updated: {self.stats['updated']}")
        logger.info(f"   ✔️ Already correct: {self.stats['already_correct']}")
        logger.info(f"   ❌ Errors: {self.stats['errors']}")
        logger.info(f"")
        logger.info(f"🚀 Cases should now appear correctly in UI")
        logger.info("=" * 60)

def main():
    print("ZANTAC GSI4 ATTRIBUTE FIXER")
    print("=" * 60)
    print("This will add missing GSI4PK, GSI4SK, and project_tag attributes")
    print("to Zantac cases so they appear in the UI correctly.")
    print("")
    
    confirmation = input("Proceed with fixing Zantac cases? (y/N): ")
    if confirmation.lower() != 'y':
        print("❌ Fix cancelled by user")
        return
    
    try:
        fixer = ZantacGSI4Fixer()
        fixer.run_fix()
        
        print("\n🎉 FIX COMPLETED! Refresh the UI to see all Zantac cases.")
        
    except Exception as e:
        logger.error(f"❌ Fix process failed: {str(e)}")
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    main() 