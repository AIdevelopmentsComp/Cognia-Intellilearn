#!/usr/bin/env python3
"""
Sherlock AI Data Migration Script
Migrates data from Excel files to DynamoDB tables
Uses Matter_Number as primary identifier (maps to Claim_Id__c in Salesforce)
"""

import pandas as pd
import boto3
import json
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal
import uuid
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SherlockDataMigrator:
    def __init__(self):
        """Initialize the data migrator with AWS clients"""
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        self.s3 = boto3.client('s3', region_name='us-east-1')
        
        # DynamoDB table references
        self.tables = {
            'cases_main': self.dynamodb.Table('sherlock-cases-main'),
            'parties_roles': self.dynamodb.Table('sherlock-parties-roles'),
            'medical_records': self.dynamodb.Table('sherlock-medical-records'),
            'financial_ledger': self.dynamodb.Table('sherlock-financial-ledger'),
            'documents': self.dynamodb.Table('sherlock-documents'),
            'legal_reps': self.dynamodb.Table('sherlock-legal-representatives'),
            'witnesses': self.dynamodb.Table('sherlock-witnesses')
        }
        
        # Project mappings
        self.project_mappings = {
            'NEC': {
                'case_type': 'NEC',
                'litigation_category': 'PRODUCT_LIABILITY',
                'matter_type': 'MASS_TORT'
            },
            'HAIR_RELAXER': {
                'case_type': 'HAIR_RELAXER',
                'litigation_category': 'PRODUCT_LIABILITY',
                'matter_type': 'MASS_TORT'
            },
            'ZANTAC': {
                'case_type': 'ZANTAC',
                'litigation_category': 'PRODUCT_LIABILITY',
                'matter_type': 'MASS_TORT'
            }
        }

    def safe_decimal(self, value):
        """Convert value to Decimal safely for DynamoDB"""
        if pd.isna(value) or value is None or value == '':
            return None
        try:
            return Decimal(str(float(value)))
        except (ValueError, TypeError):
            return None

    def safe_string(self, value):
        """Convert value to string safely"""
        if pd.isna(value) or value is None:
            return None
        return str(value).strip()

    def generate_matter_number(self, case_type, row_index):
        """Generate Matter_Number if not present in data"""
        case_prefix = {
            'NEC': 'NEC',
            'HAIR_RELAXER': 'HR',
            'ZANTAC': 'ZAN'
        }
        prefix = case_prefix.get(case_type, 'MT')
        return f"{prefix}2024{str(row_index + 1).zfill(4)}"

    def process_case_info(self, file_path, project_type):
        """Process Case_Info.xlsx files"""
        logger.info(f"Processing Case Info for {project_type}: {file_path}")
        
        try:
            df = pd.read_excel(file_path)
            logger.info(f"Loaded {len(df)} rows from {file_path}")
            
            project_config = self.project_mappings[project_type]
            cases_processed = 0
            
            for index, row in df.iterrows():
                try:
                    # Extract Matter_Number from actual column names in Excel
                    matter_number = self.safe_string(row.get('case_num') or 
                                                   row.get('Matter_Number') or 
                                                   row.get('Claim_Id__c') or 
                                                   row.get('Case_ID'))
                    
                    if not matter_number:
                        matter_number = self.generate_matter_number(project_type, index)
                        logger.info(f"Generated Matter_Number: {matter_number}")
                    
                    # Create main case record
                    case_item = {
                        'PK': f'MATTER#{matter_number}',
                        'SK': f'CASE_META#{datetime.now(timezone.utc).isoformat()}',
                        
                        # Core identifiers
                        'matter_number': matter_number,
                        'salesforce_claim_id': matter_number,  # Maps to Claim_Id__c
                        'firm_case_id': matter_number,
                        
                        # Case classification
                        'case_type': project_config['case_type'],
                        'matter_type': project_config['matter_type'],
                        'litigation_category': project_config['litigation_category'],
                        
                        # Case details from Excel (using actual column names)
                        'case_status': self.safe_string(row.get('status', 'ACTIVE')),
                        'litigation_phase': self.safe_string(row.get('Phase', 'INTAKE')),
                        'case_name': self.safe_string(row.get('case_name')),
                        'client_name': self.safe_string(row.get('client_info::first_name')),
                        'client_last_name': self.safe_string(row.get('client_info::last_name')),
                        'client_middle_name': self.safe_string(row.get('client_info::middle_name')),
                        
                        # Contact information (using actual Excel column names)
                        'client_phone': self.safe_string(row.get('client_info::cell_number') or row.get('client_info::home_number')),
                        'client_email': self.safe_string(row.get('client_info::email')),
                        'client_address': self.safe_string(row.get('client_address_primary::address_1_2')),
                        'client_city': self.safe_string(row.get('client_address_primary::city')),
                        'client_state': self.safe_string(row.get('client_address_primary::state')),
                        'client_zip': self.safe_string(row.get('client_address_primary::zip')),
                        
                        # Legal details (using available fields)
                        'attorney_assigned': self.safe_string(row.get('Attorney') or row.get('Assigned_Attorney')),
                        'paralegal_assigned': self.safe_string(row.get('Paralegal')),
                        'intake_date': self.safe_string(row.get('intake_date')),
                        'mass_tort_type': self.safe_string(row.get('mass_tort_type::mass_tort_type')),
                        
                        # Dates
                        'date_signed': self.safe_string(row.get('Date_Signed')),
                        'statute_of_limitations': self.safe_string(row.get('SOL_Date')),
                        'client_dob': self.safe_string(row.get('client_info::dob')),
                        
                        # GSI attributes for querying
                        'GSI1PK': f'CASE_TYPE#{project_config["case_type"]}',
                        'GSI1SK': f'MATTER_NUMBER#{matter_number}',
                        'GSI2PK': f'MATTER_NUMBER#{matter_number}',
                        'GSI2SK': f'CASE_STATUS#{self.safe_string(row.get("Status", "ACTIVE"))}',
                        
                        # Metadata
                        'created_date': datetime.now(timezone.utc).isoformat(),
                        'data_source': f'{project_type}_MIGRATION',
                        'migration_batch': datetime.now().strftime('%Y%m%d_%H%M%S')
                    }
                    
                    # Add damages if available
                    if 'Damages' in row or 'Total_Damages' in row:
                        damages_value = self.safe_decimal(row.get('Damages') or row.get('Total_Damages'))
                        if damages_value:
                            case_item['damages_claimed'] = {
                                'total_claimed': damages_value,
                                'currency': 'USD'
                            }
                    
                    # Insert into DynamoDB
                    self.tables['cases_main'].put_item(Item=case_item)
                    cases_processed += 1
                    
                    # Also create injured party record
                    if case_item['client_name']:
                        party_item = {
                            'PK': f'MATTER#{matter_number}',
                            'SK': f'PARTY#INJURED_PARTY#{matter_number}IP001#{datetime.now(timezone.utc).isoformat()}',
                            
                            'matter_number': matter_number,
                            'salesforce_claim_id': matter_number,
                            'party_id': f'{matter_number}IP001',
                            'party_type': 'INJURED_PARTY',
                            'full_legal_name': f"{case_item['client_name']} {case_item.get('client_last_name', '')}".strip(),
                            'relationship_to_case': 'DIRECTLY_INJURED',
                            'legal_capacity': 'COMPETENT_ADULT',
                            
                            'contact_phone': case_item['client_phone'],
                            'contact_email': case_item['client_email'],
                            'address': case_item['client_address'],
                            'city': case_item['client_city'],
                            'state': case_item['client_state'],
                            'zip_code': case_item['client_zip'],
                            
                            'GSI1PK': 'PARTY_TYPE#INJURED_PARTY',
                            'GSI1SK': f'MATTER_NUMBER#{matter_number}',
                            'GSI2PK': f'MATTER_NUMBER#{matter_number}',
                            'GSI2SK': 'PARTY_TYPE#INJURED_PARTY',
                            
                            'created_date': datetime.now(timezone.utc).isoformat(),
                            'data_source': f'{project_type}_MIGRATION'
                        }
                        
                        self.tables['parties_roles'].put_item(Item=party_item)
                    
                    if cases_processed % 10 == 0:
                        logger.info(f"Processed {cases_processed} cases for {project_type}")
                
                except Exception as e:
                    logger.error(f"Error processing case {index} in {project_type}: {str(e)}")
                    continue
            
            logger.info(f"Successfully processed {cases_processed} cases for {project_type}")
            return cases_processed
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {str(e)}")
            return 0

    def process_medical_records(self, file_path, project_type):
        """Process Medical_Records.xlsx files"""
        logger.info(f"Processing Medical Records for {project_type}: {file_path}")
        
        try:
            df = pd.read_excel(file_path)
            records_processed = 0
            
            for index, row in df.iterrows():
                try:
                    # Extract Matter_Number
                    matter_number = self.safe_string(row.get('Matter_Number') or 
                                                   row.get('Claim_Id__c') or 
                                                   row.get('Case_ID'))
                    
                    if not matter_number:
                        matter_number = self.generate_matter_number(project_type, index)
                    
                    medical_item = {
                        'PK': f'MATTER#{matter_number}',
                        'SK': f'MEDICAL#{datetime.now(timezone.utc).isoformat()}#{uuid.uuid4().hex[:8]}',
                        
                        'matter_number': matter_number,
                        'salesforce_claim_id': matter_number,
                        'medical_record_id': f'MED{index + 1:04d}',
                        
                        'provider_name': self.safe_string(row.get('Provider_Name') or row.get('Doctor_Name')),
                        'provider_specialty': self.safe_string(row.get('Specialty')),
                        'encounter_date': self.safe_string(row.get('Date') or row.get('Service_Date')),
                        'diagnosis': self.safe_string(row.get('Diagnosis')),
                        'treatment': self.safe_string(row.get('Treatment')),
                        
                        'causation_opinion': self.safe_string(row.get('Causation', 'UNKNOWN')),
                        'related_to_product': True if str(row.get('Related_to_Case', '')).lower() in ['yes', 'true', '1'] else False,
                        
                        'GSI1PK': f'MATTER_NUMBER#{matter_number}',
                        'GSI1SK': f'RECORD_DATE#{self.safe_string(row.get("Date", ""))}',
                        
                        'created_date': datetime.now(timezone.utc).isoformat(),
                        'data_source': f'{project_type}_MIGRATION'
                    }
                    
                    self.tables['medical_records'].put_item(Item=medical_item)
                    records_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing medical record {index}: {str(e)}")
                    continue
            
            logger.info(f"Successfully processed {records_processed} medical records for {project_type}")
            return records_processed
            
        except Exception as e:
            logger.error(f"Error processing medical records {file_path}: {str(e)}")
            return 0

    def process_financial_info(self, file_path, project_type):
        """Process Financial_Info.xlsx files"""
        logger.info(f"Processing Financial Info for {project_type}: {file_path}")
        
        try:
            df = pd.read_excel(file_path)
            transactions_processed = 0
            
            for index, row in df.iterrows():
                try:
                    matter_number = self.safe_string(row.get('Matter_Number') or 
                                                   row.get('Claim_Id__c') or 
                                                   row.get('Case_ID'))
                    
                    if not matter_number:
                        matter_number = self.generate_matter_number(project_type, index)
                    
                    amount = self.safe_decimal(row.get('Amount') or row.get('Total_Amount'))
                    if not amount:
                        continue
                    
                    financial_item = {
                        'PK': f'MATTER#{matter_number}',
                        'SK': f'FINANCIAL#{datetime.now(timezone.utc).isoformat()}#{uuid.uuid4().hex[:8]}',
                        
                        'matter_number': matter_number,
                        'salesforce_claim_id': matter_number,
                        'transaction_id': f'FIN{index + 1:04d}',
                        
                        'transaction_type': self.safe_string(row.get('Type', 'EXPENSE')),
                        'amount': amount,
                        'description': self.safe_string(row.get('Description')),
                        'vendor_name': self.safe_string(row.get('Vendor') or row.get('Payee')),
                        'transaction_date': self.safe_string(row.get('Date') or row.get('Transaction_Date')),
                        
                        'billable_to_client': True,
                        'trust_account_number': 'SHERLOCK_IOLTA_001',
                        
                        'GSI1PK': f'MATTER_NUMBER#{matter_number}',
                        'GSI1SK': f'TRANSACTION_DATE#{self.safe_string(row.get("Date", ""))}',
                        
                        'created_date': datetime.now(timezone.utc).isoformat(),
                        'data_source': f'{project_type}_MIGRATION'
                    }
                    
                    self.tables['financial_ledger'].put_item(Item=financial_item)
                    transactions_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing financial record {index}: {str(e)}")
                    continue
            
            logger.info(f"Successfully processed {transactions_processed} financial records for {project_type}")
            return transactions_processed
            
        except Exception as e:
            logger.error(f"Error processing financial info {file_path}: {str(e)}")
            return 0

    def migrate_project_data(self, project_name, base_path):
        """Migrate all data for a specific project"""
        logger.info(f"Starting migration for project: {project_name}")
        
        results = {
            'project': project_name,
            'cases': 0,
            'medical_records': 0,
            'financial_records': 0,
            'errors': []
        }
        
        try:
            # Process Case_Info.xlsx
            case_info_path = os.path.join(base_path, 'Case_Info.xlsx')
            if os.path.exists(case_info_path):
                results['cases'] = self.process_case_info(case_info_path, project_name)
            
            # Process Medical_Records.xlsx
            medical_path = os.path.join(base_path, 'Medical_Records.xlsx')
            if os.path.exists(medical_path):
                results['medical_records'] = self.process_medical_records(medical_path, project_name)
            
            # Process Financial_Info.xlsx
            financial_path = os.path.join(base_path, 'Financial_Info.xlsx')
            if os.path.exists(financial_path):
                results['financial_records'] = self.process_financial_info(financial_path, project_name)
            
        except Exception as e:
            logger.error(f"Error migrating {project_name}: {str(e)}")
            results['errors'].append(str(e))
        
        return results

    def run_migration(self):
        """Run the complete migration process"""
        logger.info("Starting Sherlock AI Data Migration")
        
        # Define project paths
        projects = {
            'NEC': '../../NEC Data Files',
            'HAIR_RELAXER': '../../HAIR RELAXER Watts FM to SF 20241008/HAIR Data Files',
            'ZANTAC': '../../zantac'  # Will need special processing for Zantac
        }
        
        migration_results = {}
        
        for project_name, project_path in projects.items():
            if project_name == 'ZANTAC':
                # Special handling for Zantac files
                logger.info("Zantac files require special processing - will implement separately")
                continue
            
            results = self.migrate_project_data(project_name, project_path)
            migration_results[project_name] = results
        
        # Print summary
        logger.info("Migration Summary:")
        for project, results in migration_results.items():
            logger.info(f"{project}: {results['cases']} cases, {results['medical_records']} medical records, {results['financial_records']} financial records")
        
        return migration_results

if __name__ == "__main__":
    migrator = SherlockDataMigrator()
    results = migrator.run_migration()
    
    # Save results to file
    with open('migration_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    logger.info("Migration completed. Results saved to migration_results.json") 