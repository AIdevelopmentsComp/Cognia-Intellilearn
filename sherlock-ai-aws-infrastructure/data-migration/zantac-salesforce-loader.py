#!/usr/bin/env python3
"""
Zantac Salesforce Data Loader - UPSERT MODE
Loads/Updates Zantac case data from Salesforce JSON to Sherlock AI DynamoDB tables
Handles existing cases with different matter_number patterns
Maps Claim_Id__c to matter_number and performs intelligent upserts
"""

import json
import boto3
import logging
from datetime import datetime, timezone
from decimal import Decimal
import uuid
import os
from pathlib import Path
from boto3.dynamodb.conditions import Key, Attr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('zantac_salesforce_upsert.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ZantacSalesforceUpsertLoader:
    def __init__(self):
        """Initialize the Zantac Salesforce upsert loader"""
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        
        # Sherlock AI tables
        self.tables = {
            'cases_main': self.dynamodb.Table('sherlock-cases-main'),
            'parties_roles': self.dynamodb.Table('sherlock-parties-roles'),
            'medical_records': self.dynamodb.Table('sherlock-medical-records'),
            'documents': self.dynamodb.Table('sherlock-documents'),
            'financial_ledger': self.dynamodb.Table('sherlock-financial-ledger')
        }
        
        # Counters
        self.counters = {
            'records_processed': 0,
            'cases_created': 0,
            'cases_updated': 0,
            'parties_created': 0,
            'parties_updated': 0,
            'duplicates_merged': 0,
            'errors': 0,
            'skipped': 0
        }
        
        # Cache for existing Zantac cases to avoid repeated queries
        self.existing_cases_cache = {}
        
        logger.info("Zantac Salesforce UPSERT Loader initialized")

    def safe_string(self, value):
        """Convert value to string safely"""
        if value is None or value == '' or str(value).strip() == '':
            return None
        return str(value).strip()

    def safe_decimal(self, value):
        """Convert value to Decimal safely"""
        if value is None or value == '' or str(value).strip() == '':
            return None
        try:
            clean_value = str(value).replace('$', '').replace(',', '').strip()
            if clean_value == '' or clean_value.lower() == 'none':
                return None
            return Decimal(clean_value)
        except (ValueError, TypeError):
            return None

    def safe_date(self, date_value):
        """Convert date value to ISO format safely"""
        if not date_value or str(date_value).strip() == '':
            return None
        
        try:
            date_str = str(date_value).strip()
            
            # Format: YYYY-MM-DD
            if '-' in date_str and len(date_str) == 10:
                return date_str
            
            # Format: MM/DD/YYYY
            if '/' in date_str:
                parts = date_str.split('/')
                if len(parts) == 3:
                    month, day, year = parts
                    return f"{year.zfill(4)}-{month.zfill(2)}-{day.zfill(2)}"
            
            return None
        except:
            return None

    def find_existing_zantac_case(self, claim_id, client_name, client_email):
        """
        Find existing Zantac case using multiple strategies:
        1. By Claim_Id__c (salesforce_claim_id)
        2. By matter_number patterns (ZAN*, ZANTAC*, ZAN2024*, etc.)
        3. By client name + email combination
        """
        
        # Strategy 1: Search by salesforce_claim_id
        if claim_id:
            try:
                # First check cache
                cache_key = f"claim_{claim_id}"
                if cache_key in self.existing_cases_cache:
                    return self.existing_cases_cache[cache_key]
                
                # Query by GSI2 (matter_number)
                response = self.tables['cases_main'].query(
                    IndexName='GSI2-MatterNumber',
                    KeyConditionExpression=Key('GSI2PK').eq(f'MATTER_NUMBER#{claim_id}')
                )
                
                if response['Items']:
                    existing_case = response['Items'][0]
                    self.existing_cases_cache[cache_key] = existing_case
                    return existing_case
                    
                # Try variations of claim_id
                variations = [
                    f"ZAN{claim_id}",
                    f"ZANTAC{claim_id}", 
                    f"ZAN2024{claim_id}",
                    f"ZAN2025{claim_id}",
                    claim_id.replace('ZAN', '').replace('ZANTAC', '')
                ]
                
                for variation in variations:
                    try:
                        response = self.tables['cases_main'].query(
                            IndexName='GSI2-MatterNumber',
                            KeyConditionExpression=Key('GSI2PK').eq(f'MATTER_NUMBER#{variation}')
                        )
                        
                        if response['Items']:
                            existing_case = response['Items'][0]
                            self.existing_cases_cache[cache_key] = existing_case
                            return existing_case
                    except:
                        continue
                        
            except Exception as e:
                logger.debug(f"Strategy 1 search failed: {str(e)}")
        
        # Strategy 2: Search by Salesforce claim ID field
        if claim_id:
            try:
                response = self.tables['cases_main'].scan(
                    FilterExpression=Attr('salesforce_claim_id').eq(claim_id),
                    Limit=1
                )
                
                if response['Items']:
                    existing_case = response['Items'][0]
                    cache_key = f"claim_{claim_id}"
                    self.existing_cases_cache[cache_key] = existing_case
                    return existing_case
                    
            except Exception as e:
                logger.debug(f"Strategy 2 search failed: {str(e)}")
        
        # Strategy 3: Search by client name + email for Zantac cases
        if client_name and client_email:
            try:
                response = self.tables['cases_main'].scan(
                    FilterExpression=Attr('case_type').eq('ZANTAC') & 
                                   Attr('client_name').eq(client_name) & 
                                   Attr('client_email').eq(client_email),
                    Limit=1
                )
                
                if response['Items']:
                    existing_case = response['Items'][0]
                    cache_key = f"client_{client_name}_{client_email}"
                    self.existing_cases_cache[cache_key] = existing_case
                    return existing_case
                    
            except Exception as e:
                logger.debug(f"Strategy 3 search failed: {str(e)}")
        
        return None

    def generate_matter_number(self, claim_id, existing_case=None):
        """Generate or maintain matter_number"""
        
        # If updating existing case, keep the same matter_number
        if existing_case:
            return existing_case.get('matter_number')
        
        # For new cases, generate from claim_id
        if not claim_id:
            return f"ZAN{datetime.now().year}{str(uuid.uuid4().hex[:6]).upper()}"
        
        clean_id = str(claim_id).strip()
        
        # If it already looks like a matter number, use it
        if clean_id.startswith(('ZAN', 'ZANTAC')):
            return clean_id
        
        # Create ZAN prefix
        return f"ZAN{clean_id}"

    def load_salesforce_json(self, json_file_path):
        """Load and process Salesforce JSON data with upsert logic"""
        logger.info(f"Loading Salesforce JSON for UPSERT: {json_file_path}")
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            logger.info(f"📊 Loaded {len(data)} records from Salesforce JSON")
            
            # Process each record with upsert logic
            for index, record in enumerate(data):
                try:
                    self.process_salesforce_record_upsert(record, index)
                    self.counters['records_processed'] += 1
                    
                    if self.counters['records_processed'] % 50 == 0:
                        logger.info(f"✅ Processed {self.counters['records_processed']} records...")
                        self.print_progress_stats()
                        
                except Exception as e:
                    logger.error(f"❌ Error processing record {index}: {str(e)}")
                    self.counters['errors'] += 1
                    continue
            
            # Final summary
            self.print_final_summary()
            
        except Exception as e:
            logger.error(f"❌ Failed to load Salesforce JSON: {str(e)}")
            raise

    def process_salesforce_record_upsert(self, record, index):
        """Process a single Salesforce record with upsert logic"""
        
        # Extract key identifiers
        claim_id = record.get('Claim_Id__c') or record.get('Id') or record.get('claim_id')
        client_name = self.safe_string(record.get('First_Name__c') or record.get('FirstName'))
        client_email = self.safe_string(record.get('Email__c') or record.get('Email'))
        
        if not claim_id and not (client_name and client_email):
            logger.warning(f"⚠️ Record {index}: No identifiers found, skipping")
            self.counters['skipped'] += 1
            return
        
        # Find existing case
        existing_case = self.find_existing_zantac_case(claim_id, client_name, client_email)
        
        if existing_case:
            logger.debug(f"🔄 Updating existing case: {existing_case.get('matter_number')}")
            self.update_existing_case(record, existing_case)
        else:
            logger.debug(f"➕ Creating new case for claim: {claim_id}")
            self.create_new_case(record)

    def update_existing_case(self, salesforce_record, existing_case):
        """Update existing case with fresh Salesforce data"""
        
        matter_number = existing_case.get('matter_number')
        pk = existing_case.get('PK')
        sk = existing_case.get('SK')
        
        # Prepare update data with Salesforce priority (most current)
        update_data = {
            # Salesforce data takes priority for contact info
            'client_phone': self.safe_string(
                salesforce_record.get('Phone__c') or 
                salesforce_record.get('Mobile_Phone__c') or 
                salesforce_record.get('Phone')
            ) or existing_case.get('client_phone'),
            
            'client_email': self.safe_string(
                salesforce_record.get('Email__c') or 
                salesforce_record.get('Email')
            ) or existing_case.get('client_email'),
            
            # Address - prefer Salesforce
            'client_address': self.safe_string(salesforce_record.get('Mailing_Street__c')) or existing_case.get('client_address'),
            'client_city': self.safe_string(salesforce_record.get('Mailing_City__c')) or existing_case.get('client_city'),
            'client_state': self.safe_string(salesforce_record.get('Mailing_State__c')) or existing_case.get('client_state'),
            'client_zip': self.safe_string(salesforce_record.get('Mailing_Postal_Code__c')) or existing_case.get('client_zip'),
            
            # Financial data - update if provided
            'estimated_value': self.safe_decimal(salesforce_record.get('Estimated_Value__c')) or existing_case.get('estimated_value'),
            
            # Status updates
            'status': self.map_status(salesforce_record.get('Status__c')) or existing_case.get('status'),
            
            # Update metadata
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'last_salesforce_sync': datetime.now(timezone.utc).isoformat(),
            'data_source': f"{existing_case.get('data_source', '')};SALESFORCE_UPDATE",
            
            # Ensure project tag
            'project_tag': 'SHERLOCK AI'
        }
        
        # Build update expression
        update_expr_parts = []
        expr_values = {}
        
        for key, value in update_data.items():
            if value is not None:
                update_expr_parts.append(f"#{key} = :{key}")
                expr_values[f":{key}"] = value
        
        if not update_expr_parts:
            logger.debug(f"No updates needed for {matter_number}")
            return
        
        update_expression = "SET " + ", ".join(update_expr_parts)
        expr_names = {f"#{key}": key for key in update_data.keys() if update_data[key] is not None}
        
        try:
            self.tables['cases_main'].update_item(
                Key={'PK': pk, 'SK': sk},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expr_values,
                ExpressionAttributeNames=expr_names
            )
            
            self.counters['cases_updated'] += 1
            logger.debug(f"✅ Updated case: {matter_number}")
            
            # Also update party if needed
            self.update_existing_party(salesforce_record, matter_number)
            
        except Exception as e:
            logger.error(f"❌ Failed to update case {matter_number}: {str(e)}")
            self.counters['errors'] += 1

    def create_new_case(self, record):
        """Create new case from Salesforce data"""
        
        claim_id = record.get('Claim_Id__c') or record.get('Id') or record.get('claim_id')
        matter_number = self.generate_matter_number(claim_id)
        
        # Create main case record
        case_item = self.create_case_record(record, matter_number)
        if case_item:
            self.tables['cases_main'].put_item(Item=case_item)
            self.counters['cases_created'] += 1
            
            # Create injured party record
            party_item = self.create_party_record(record, matter_number)
            if party_item:
                self.tables['parties_roles'].put_item(Item=party_item)
                self.counters['parties_created'] += 1

    def update_existing_party(self, salesforce_record, matter_number):
        """Update existing party record"""
        
        try:
            # Find existing party
            response = self.tables['parties_roles'].query(
                KeyConditionExpression=Key('PK').eq(f'MATTER#{matter_number}') & 
                                     Key('SK').begins_with('PARTY#INJURED_PARTY')
            )
            
            if response['Items']:
                existing_party = response['Items'][0]
                
                # Update with Salesforce data
                update_data = {
                    'contact_phone': self.safe_string(
                        salesforce_record.get('Phone__c') or 
                        salesforce_record.get('Mobile_Phone__c') or 
                        salesforce_record.get('Phone')
                    ) or existing_party.get('contact_phone'),
                    
                    'contact_email': self.safe_string(
                        salesforce_record.get('Email__c') or 
                        salesforce_record.get('Email')
                    ) or existing_party.get('contact_email'),
                    
                    # Update metadata
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                    'last_salesforce_sync': datetime.now(timezone.utc).isoformat(),
                    'project_tag': 'SHERLOCK AI'
                }
                
                # Build update
                update_expr_parts = []
                expr_values = {}
                
                for key, value in update_data.items():
                    if value is not None:
                        update_expr_parts.append(f"#{key} = :{key}")
                        expr_values[f":{key}"] = value
                
                if update_expr_parts:
                    update_expression = "SET " + ", ".join(update_expr_parts)
                    expr_names = {f"#{key}": key for key in update_data.keys() if update_data[key] is not None}
                    
                    self.tables['parties_roles'].update_item(
                        Key={'PK': existing_party['PK'], 'SK': existing_party['SK']},
                        UpdateExpression=update_expression,
                        ExpressionAttributeValues=expr_values,
                        ExpressionAttributeNames=expr_names
                    )
                    
                    self.counters['parties_updated'] += 1
                    
        except Exception as e:
            logger.debug(f"Party update failed for {matter_number}: {str(e)}")

    def map_status(self, salesforce_status):
        """Map Salesforce status to Sherlock AI status"""
        if not salesforce_status:
            return None
            
        status_map = {
            'Active': 'ACTIVE',
            'Pending': 'PENDING', 
            'Closed': 'CLOSED',
            'Filed': 'FILED',
            'Rejected': 'CLOSED',
            'Settled': 'SETTLED'
        }
        
        return status_map.get(str(salesforce_status).strip(), 'ACTIVE')

    def create_case_record(self, record, matter_number):
        """Create main case record from Salesforce data"""
        
        # Extract key information
        client_name = self.safe_string(record.get('First_Name__c') or record.get('FirstName'))
        client_last_name = self.safe_string(record.get('Last_Name__c') or record.get('LastName'))
        
        # Dates
        intake_date = self.safe_date(record.get('Intake_Date__c') or record.get('CreatedDate'))
        sol_date = self.safe_date(record.get('SOL_Date__c') or record.get('Statute_of_Limitations__c'))
        
        case_status = self.map_status(record.get('Status__c') or record.get('Case_Status__c')) or 'ACTIVE'
        
        case_item = {
            'PK': f'MATTER#{matter_number}',
            'SK': 'CASE#METADATA',
            
            # ⭐ Primary identifiers (Salesforce integration)
            'matter_number': matter_number,
            'salesforce_claim_id': self.safe_string(record.get('Claim_Id__c') or record.get('Id')),
            'salesforce_record_id': self.safe_string(record.get('Id')),
            'firm_case_id': matter_number,
            
            # Case classification 
            'case_type': 'ZANTAC',
            'mass_tort_type': 'PRODUCT_LIABILITY',
            'litigation_category': 'PHARMACEUTICAL',
            'matter_type': 'MASS_TORT',
            
            # Case status and phase
            'status': case_status,
            'case_status': case_status,
            'litigation_phase': 'INTAKE',
            
            # Client information (most current from Salesforce)
            'client_name': client_name,
            'client_first_name': client_name,
            'client_last_name': client_last_name,
            'client_full_name': f"{client_name or ''} {client_last_name or ''}".strip(),
            
            # Contact information (prioritize Salesforce)
            'client_phone': self.safe_string(
                record.get('Phone__c') or 
                record.get('Mobile_Phone__c') or 
                record.get('Phone')
            ),
            'client_email': self.safe_string(
                record.get('Email__c') or 
                record.get('Email')
            ),
            
            # Address information
            'client_address': self.safe_string(record.get('Mailing_Street__c')),
            'client_city': self.safe_string(record.get('Mailing_City__c')),
            'client_state': self.safe_string(record.get('Mailing_State__c')),
            'client_zip': self.safe_string(record.get('Mailing_Postal_Code__c')),
            'client_country': self.safe_string(record.get('Mailing_Country__c') or 'USA'),
            
            # Legal dates
            'intake_date': intake_date or datetime.now().strftime('%Y-%m-%d'),
            'sol_date': sol_date,
            'statute_of_limitations': sol_date,
            
            # Financial information
            'estimated_value': self.safe_decimal(record.get('Estimated_Value__c')),
            'damages_claimed': {
                'total_claimed': self.safe_decimal(record.get('Total_Damages__c')),
                'currency': 'USD'
            } if record.get('Total_Damages__c') else None,
            
            # Legal team
            'assigned_attorney': self.safe_string(record.get('Attorney__c')) or 'ATT001',
            'paralegal': self.safe_string(record.get('Paralegal__c')) or 'PAR001',
            'case_source': 'SALESFORCE_ZANTAC',
            
            # AI Analysis (default for Zantac)
            'ai_case_strength': 75,
            'ai_summary': f"Zantac pharmaceutical liability case for {client_name or 'client'}. Imported from Salesforce on {datetime.now().strftime('%Y-%m-%d')}.",
            
            # Product information
            'product_name': 'Zantac (Ranitidine)',
            'product_manufacturer': 'Various Manufacturers',
            'product_category': 'PHARMACEUTICAL',
            
            # GSI attributes for querying
            'GSI1PK': 'CASE_TYPE#ZANTAC',  
            'GSI1SK': f'STATUS#{case_status}#INTAKE_DATE#{intake_date}',
            'GSI2PK': f'MATTER_NUMBER#{matter_number}',  # ⭐ Key for matter number searches
            'GSI2SK': f'CASE_PRIORITY#HIGH#{intake_date}',
            'GSI3PK': f'ATTORNEY#{self.safe_string(record.get("Attorney__c")) or "ATT001"}',
            'GSI3SK': f'MATTER_NUMBER#{matter_number}#{intake_date}',
            'GSI4PK': 'PROJECT#SHERLOCK_AI',  # ⭐ Project tag
            'GSI4SK': f'CASE_TYPE#ZANTAC#{intake_date}',
            
            # SOL monitoring
            'days_until_sol': self.calculate_days_until_sol(sol_date),
            
            # Metadata
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'data_source': 'SALESFORCE_ZANTAC_JSON',
            'migration_batch': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'project_tag': 'SHERLOCK AI'  # ⭐ UI filtering
        }
        
        return case_item

    def create_party_record(self, record, matter_number):
        """Create injured party record from Salesforce data"""
        
        client_name = self.safe_string(record.get('First_Name__c') or record.get('FirstName'))
        client_last_name = self.safe_string(record.get('Last_Name__c') or record.get('LastName'))
        
        if not client_name and not client_last_name:
            return None
        
        party_item = {
            'PK': f'MATTER#{matter_number}',
            'SK': f'PARTY#INJURED_PARTY#{matter_number}IP001#{datetime.now(timezone.utc).isoformat()}',
            
            # Relation to case
            'matter_number': matter_number,
            'salesforce_claim_id': self.safe_string(record.get('Claim_Id__c') or record.get('Id')),
            'party_id': f'{matter_number}IP001',
            'party_type': 'INJURED_PARTY',
            'relationship_to_case': 'DIRECTLY_INJURED',
            'legal_capacity': 'COMPETENT_ADULT',
            
            # Personal information (from Salesforce - most current)
            'first_name': client_name,
            'last_name': client_last_name,
            'full_legal_name': f"{client_name or ''} {client_last_name or ''}".strip(),
            'date_of_birth': self.safe_date(record.get('Date_of_Birth__c')),
            
            # Contact information (prioritize Salesforce)
            'contact_phone': self.safe_string(
                record.get('Phone__c') or 
                record.get('Mobile_Phone__c') or 
                record.get('Phone')
            ),
            'contact_email': self.safe_string(
                record.get('Email__c') or 
                record.get('Email')
            ),
            
            # Address (complete from Salesforce)
            'address': self.safe_string(record.get('Mailing_Street__c')),
            'city': self.safe_string(record.get('Mailing_City__c')),
            'state': self.safe_string(record.get('Mailing_State__c')),
            'zip_code': self.safe_string(record.get('Mailing_Postal_Code__c')),
            'country': self.safe_string(record.get('Mailing_Country__c') or 'USA'),
            
            # Medical/Injury information
            'injury_description': self.safe_string(record.get('Injury_Description__c')),
            'medical_conditions': self.safe_string(record.get('Medical_Conditions__c')),
            
            # GSI attributes
            'GSI1PK': 'PARTY_TYPE#INJURED_PARTY',
            'GSI1SK': f'MATTER_NUMBER#{matter_number}',
            'GSI2PK': f'MATTER_NUMBER#{matter_number}',
            'GSI2SK': 'PARTY_TYPE#INJURED_PARTY',
            
            # Metadata
            'created_date': datetime.now(timezone.utc).isoformat(),
            'data_source': 'SALESFORCE_ZANTAC_JSON',
            'project_tag': 'SHERLOCK AI'
        }
        
        return party_item

    def calculate_days_until_sol(self, sol_date):
        """Calculate days until statute of limitations expires"""
        if not sol_date:
            return 9999
        
        try:
            sol_datetime = datetime.strptime(sol_date, '%Y-%m-%d')
            today = datetime.now()
            days_diff = (sol_datetime - today).days
            return max(0, days_diff)
        except:
            return 9999

    def print_progress_stats(self):
        """Print progress statistics"""
        logger.info(f"📊 Progress: Created: {self.counters['cases_created']}, Updated: {self.counters['cases_updated']}, Errors: {self.counters['errors']}")

    def print_final_summary(self):
        """Print final migration summary"""
        logger.info(f"🎉 ZANTAC SALESFORCE UPSERT COMPLETE:")
        logger.info(f"   📋 Records processed: {self.counters['records_processed']}")
        logger.info(f"   ➕ Cases created: {self.counters['cases_created']}")
        logger.info(f"   🔄 Cases updated: {self.counters['cases_updated']}")
        logger.info(f"   👥 Parties created: {self.counters['parties_created']}")
        logger.info(f"   🔄 Parties updated: {self.counters['parties_updated']}")
        logger.info(f"   ⏭️ Records skipped: {self.counters['skipped']}")
        logger.info(f"   ❌ Errors: {self.counters['errors']}")

def main():
    """Main execution function"""
    print("ZANTAC SALESFORCE UPSERT LOADER")
    print("=" * 60)
    
    # Initialize loader
    loader = ZantacSalesforceUpsertLoader()
    
    # Path to Salesforce JSON file - try multiple locations
    possible_paths = [
        Path("../../zantac/salesforce zantac.json"),
        Path("../zantac/salesforce zantac.json"),
        Path("../../../zantac/salesforce zantac.json")
    ]
    
    json_file_path = None
    for path in possible_paths:
        if path.exists():
            json_file_path = path
            break
    
    if not json_file_path or not json_file_path.exists():
        print("❌ Salesforce JSON file not found in any of these locations:")
        for path in possible_paths:
            print(f"   • {path}")
        return False
    
    logger.info(f"📁 Found Salesforce JSON: {json_file_path}")
    
    # Confirm before proceeding
    print(f"\n📋 This will UPSERT Zantac data from Salesforce to:")
    print(f"   • sherlock-cases-main (UPDATE existing, CREATE new)")
    print(f"   • sherlock-parties-roles (UPDATE existing, CREATE new)")
    print(f"\n🔑 Using intelligent matching:")
    print(f"   • Claim_Id__c → matter_number mapping")
    print(f"   • Multiple matter_number pattern detection")
    print(f"   • Client name + email fallback matching")
    print(f"\n✅ Safe operation: Updates existing, creates missing")
    
    confirmation = input(f"\n🚀 Proceed with Salesforce UPSERT? (y/N): ")
    if confirmation.lower() != 'y':
        print("❌ Upsert cancelled by user")
        return False
    
    try:
        # Load Salesforce data with upsert
        loader.load_salesforce_json(json_file_path)
        
        print(f"\n🎉 SALESFORCE UPSERT SUCCESSFUL!")
        print(f"   Next step: Run supplemental data load from /zantac Excel files")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Upsert failed: {str(e)}")
        return False

if __name__ == "__main__":
    main() 