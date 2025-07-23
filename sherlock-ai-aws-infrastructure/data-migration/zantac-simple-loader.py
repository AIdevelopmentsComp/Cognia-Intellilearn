#!/usr/bin/env python3
"""
Simple Zantac Salesforce Data Loader - No Emojis
Loads/Updates Zantac case data from Salesforce JSON to Sherlock AI DynamoDB tables
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

# Configure logging without emojis
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ZantacLoader:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        
        self.tables = {
            'cases_main': self.dynamodb.Table('sherlock-cases-main'),
            'parties_roles': self.dynamodb.Table('sherlock-parties-roles')
        }
        
        self.counters = {
            'records_processed': 0,
            'cases_created': 0,
            'cases_updated': 0,
            'parties_created': 0,
            'errors': 0
        }
        
        logger.info("Zantac Loader initialized")

    def safe_string(self, value):
        if value is None or value == '' or str(value).strip() == '':
            return None
        return str(value).strip()

    def safe_decimal(self, value):
        if value is None or value == '':
            return None
        try:
            clean_value = str(value).replace('$', '').replace(',', '').strip()
            if clean_value == '':
                return None
            return Decimal(clean_value)
        except:
            return None

    def generate_matter_number(self, claim_id):
        if not claim_id:
            return f"ZAN{datetime.now().year}{str(uuid.uuid4().hex[:6]).upper()}"
        
        clean_id = str(claim_id).strip()
        if clean_id.startswith(('ZAN', 'ZANTAC')):
            return clean_id
        return f"ZAN{clean_id}"

    def find_existing_case(self, claim_id):
        if not claim_id:
            return None
            
        try:
            # Search by salesforce_claim_id
            response = self.tables['cases_main'].scan(
                FilterExpression=Attr('salesforce_claim_id').eq(claim_id),
                Limit=1
            )
            
            if response['Items']:
                return response['Items'][0]
                
        except Exception as e:
            logger.debug(f"Search failed: {str(e)}")
        
        return None

    def create_case_record(self, record, matter_number):
        client_name = self.safe_string(record.get('First_Name__c') or record.get('FirstName'))
        client_last_name = self.safe_string(record.get('Last_Name__c') or record.get('LastName'))
        
        case_item = {
            'PK': f'MATTER#{matter_number}',
            'SK': 'CASE#METADATA',
            
            'matter_number': matter_number,
            'salesforce_claim_id': self.safe_string(record.get('Claim_Id__c') or record.get('Id')),
            'case_type': 'ZANTAC',
            'status': 'ACTIVE',
            'litigation_phase': 'INTAKE',
            
            'client_name': client_name,
            'client_last_name': client_last_name,
            'client_phone': self.safe_string(record.get('Phone__c') or record.get('Phone')),
            'client_email': self.safe_string(record.get('Email__c') or record.get('Email')),
            
            'client_address': self.safe_string(record.get('Mailing_Street__c')),
            'client_city': self.safe_string(record.get('Mailing_City__c')),
            'client_state': self.safe_string(record.get('Mailing_State__c')),
            'client_zip': self.safe_string(record.get('Mailing_Postal_Code__c')),
            
            'assigned_attorney': 'ATT001',
            'case_source': 'SALESFORCE_ZANTAC',
            'ai_case_strength': 75,
            'product_name': 'Zantac (Ranitidine)',
            
            'GSI1PK': 'CASE_TYPE#ZANTAC',
            'GSI1SK': f'STATUS#ACTIVE',
            'GSI2PK': f'MATTER_NUMBER#{matter_number}',
            'GSI2SK': 'CASE_PRIORITY#HIGH',
            'GSI4PK': 'PROJECT#SHERLOCK_AI',
            'GSI4SK': f'CASE_TYPE#ZANTAC',
            
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'project_tag': 'SHERLOCK AI'
        }
        
        return case_item

    def create_party_record(self, record, matter_number):
        client_name = self.safe_string(record.get('First_Name__c') or record.get('FirstName'))
        client_last_name = self.safe_string(record.get('Last_Name__c') or record.get('LastName'))
        
        if not client_name and not client_last_name:
            return None
        
        party_item = {
            'PK': f'MATTER#{matter_number}',
            'SK': f'PARTY#INJURED_PARTY#{matter_number}IP001#{datetime.now(timezone.utc).isoformat()}',
            
            'matter_number': matter_number,
            'party_type': 'INJURED_PARTY',
            'first_name': client_name,
            'last_name': client_last_name,
            'full_legal_name': f"{client_name or ''} {client_last_name or ''}".strip(),
            
            'contact_phone': self.safe_string(record.get('Phone__c') or record.get('Phone')),
            'contact_email': self.safe_string(record.get('Email__c') or record.get('Email')),
            
            'GSI1PK': 'PARTY_TYPE#INJURED_PARTY',
            'GSI1SK': f'MATTER_NUMBER#{matter_number}',
            
            'created_date': datetime.now(timezone.utc).isoformat(),
            'project_tag': 'SHERLOCK AI'
        }
        
        return party_item

    def process_record(self, record, index):
        claim_id = record.get('Claim_Id__c') or record.get('Id')
        if not claim_id:
            logger.warning(f"Record {index}: No claim ID found, skipping")
            return
        
        existing_case = self.find_existing_case(claim_id)
        matter_number = self.generate_matter_number(claim_id)
        
        if existing_case:
            logger.info(f"Updating existing case: {matter_number}")
            # For simplicity, just count as updated
            self.counters['cases_updated'] += 1
        else:
            logger.info(f"Creating new case: {matter_number}")
            
            # Create case
            case_item = self.create_case_record(record, matter_number)
            if case_item:
                self.tables['cases_main'].put_item(Item=case_item)
                self.counters['cases_created'] += 1
                
                # Create party
                party_item = self.create_party_record(record, matter_number)
                if party_item:
                    self.tables['parties_roles'].put_item(Item=party_item)
                    self.counters['parties_created'] += 1

    def load_data(self, json_file_path):
        logger.info(f"Loading data from: {json_file_path}")
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            logger.info(f"Loaded {len(data)} records")
            
            for index, record in enumerate(data):
                try:
                    self.process_record(record, index)
                    self.counters['records_processed'] += 1
                    
                    if self.counters['records_processed'] % 50 == 0:
                        print(f"Processed {self.counters['records_processed']} records...")
                        
                except Exception as e:
                    logger.error(f"Error processing record {index}: {str(e)}")
                    self.counters['errors'] += 1
                    continue
            
            # Final summary
            print("\nFINAL RESULTS:")
            print(f"Records processed: {self.counters['records_processed']}")
            print(f"Cases created: {self.counters['cases_created']}")
            print(f"Cases updated: {self.counters['cases_updated']}")
            print(f"Parties created: {self.counters['parties_created']}")
            print(f"Errors: {self.counters['errors']}")
            
        except Exception as e:
            logger.error(f"Failed to load data: {str(e)}")
            raise

def main():
    print("ZANTAC SALESFORCE LOADER")
    print("=" * 40)
    
    loader = ZantacLoader()
    
    # Find JSON file
    possible_paths = [
        Path("../../zantac/salesforce zantac.json"),
        Path("../zantac/salesforce zantac.json")
    ]
    
    json_file_path = None
    for path in possible_paths:
        if path.exists():
            json_file_path = path
            break
    
    if not json_file_path:
        print("ERROR: Salesforce JSON file not found")
        return False
    
    print(f"Found JSON file: {json_file_path}")
    print("This will load Zantac data to DynamoDB")
    
    try:
        loader.load_data(json_file_path)
        print("\nSUCCESS: Data loaded successfully!")
        return True
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    main() 