#!/usr/bin/env python3
"""
Zantac Data Migration - Special Processor
Handles multi-part Excel files for Zantac cases
"""

import pandas as pd
import boto3
import logging
from datetime import datetime, timezone
from decimal import Decimal
import uuid
import os

logger = logging.getLogger(__name__)

class ZantacMigrator:
    def __init__(self):
        """Initialize Zantac migrator"""
        self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        
        self.tables = {
            'cases_main': self.dynamodb.Table('sherlock-cases-main'),
            'parties_roles': self.dynamodb.Table('sherlock-parties-roles'),
            'medical_records': self.dynamodb.Table('sherlock-medical-records'),
            'documents': self.dynamodb.Table('sherlock-documents')
        }

    def safe_decimal(self, value):
        """Convert value to Decimal safely"""
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

    def generate_zantac_matter_number(self, row_index):
        """Generate Matter_Number for Zantac cases"""
        return f"ZAN2024{str(row_index + 1).zfill(4)}"

    def process_zantac_files(self):
        """Process all Zantac files"""
        logger.info("Starting Zantac migration...")
        
        zantac_files = [
            '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt1.xlsx',
            '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt2.xlsx', 
            '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt3.xlsx',
            '../../zantac/ZANTAC Non-Closed Watts to Sherlock - Supporting Doc Links - 20241101 pt4.xlsx'
        ]
        
        total_cases = 0
        total_documents = 0
        
        for i, file_path in enumerate(zantac_files):
            if not os.path.exists(file_path):
                logger.warning(f"File not found: {file_path}")
                continue
                
            logger.info(f"Processing Zantac file {i+1}/4: {file_path}")
            
            try:
                df = pd.read_excel(file_path)
                logger.info(f"Loaded {len(df)} rows from {file_path}")
                
                # First, let's see what columns are available
                logger.info(f"Columns in file: {list(df.columns)[:10]}...")
                
                cases_processed = 0
                docs_processed = 0
                
                for index, row in df.iterrows():
                    try:
                        # Generate unique Matter_Number for each Zantac case
                        global_index = total_cases + index
                        matter_number = self.generate_zantac_matter_number(global_index)
                        
                        # Extract basic case information
                        case_item = self.create_zantac_case(row, matter_number, global_index)
                        if case_item:
                            self.tables['cases_main'].put_item(Item=case_item)
                            cases_processed += 1
                            
                            # Create injured party
                            party_item = self.create_zantac_party(row, matter_number)
                            if party_item:
                                self.tables['parties_roles'].put_item(Item=party_item)
                            
                            # Create document links if available
                            doc_item = self.create_zantac_document(row, matter_number, global_index)
                            if doc_item:
                                self.tables['documents'].put_item(Item=doc_item)
                                docs_processed += 1
                        
                        if cases_processed % 50 == 0:
                            logger.info(f"Processed {cases_processed} Zantac cases from file {i+1}")
                            
                    except Exception as e:
                        logger.error(f"Error processing Zantac row {index}: {str(e)}")
                        continue
                
                total_cases += cases_processed
                total_documents += docs_processed
                logger.info(f"File {i+1} complete: {cases_processed} cases, {docs_processed} documents")
                
            except Exception as e:
                logger.error(f"Error processing Zantac file {file_path}: {str(e)}")
                continue
        
        logger.info(f"Zantac migration complete: {total_cases} cases, {total_documents} documents")
        return {'cases': total_cases, 'documents': total_documents}

    def create_zantac_case(self, row, matter_number, index):
        """Create main case record for Zantac"""
        try:
            # Try to extract meaningful data from whatever columns exist
            case_item = {
                'PK': f'MATTER#{matter_number}',
                'SK': f'CASE_META#{datetime.now(timezone.utc).isoformat()}',
                
                # Core identifiers
                'matter_number': matter_number,
                'salesforce_claim_id': matter_number,
                'firm_case_id': matter_number,
                
                # Case classification
                'case_type': 'ZANTAC',
                'matter_type': 'MASS_TORT', 
                'litigation_category': 'PRODUCT_LIABILITY',
                
                # Extract whatever client info is available
                'case_status': 'ACTIVE',
                'litigation_phase': 'DISCOVERY',
                
                # GSI attributes
                'GSI1PK': 'CASE_TYPE#ZANTAC',
                'GSI1SK': f'MATTER_NUMBER#{matter_number}',
                'GSI2PK': f'MATTER_NUMBER#{matter_number}',
                'GSI2SK': 'CASE_STATUS#ACTIVE',
                
                # Metadata
                'created_date': datetime.now(timezone.utc).isoformat(),
                'data_source': 'ZANTAC_MIGRATION',
                'migration_batch': datetime.now().strftime('%Y%m%d_%H%M%S')
            }
            
            # Try to extract any available client information from various possible column names
            possible_name_columns = ['Client_Name', 'Name', 'client_name', 'Full_Name', 'Patient_Name']
            possible_phone_columns = ['Phone', 'client_phone', 'Phone_Number', 'Contact_Phone']
            possible_email_columns = ['Email', 'client_email', 'Email_Address', 'Contact_Email']
            
            # Extract name from any available column
            for col in possible_name_columns:
                if col in row and pd.notna(row[col]):
                    case_item['client_name'] = self.safe_string(row[col])
                    break
            
            # Extract phone
            for col in possible_phone_columns:
                if col in row and pd.notna(row[col]):
                    case_item['client_phone'] = self.safe_string(row[col])
                    break
            
            # Extract email
            for col in possible_email_columns:
                if col in row and pd.notna(row[col]):
                    case_item['client_email'] = self.safe_string(row[col])
                    break
            
            # Extract any other relevant fields
            if 'Status' in row:
                case_item['case_status'] = self.safe_string(row['Status']) or 'ACTIVE'
            
            return case_item
            
        except Exception as e:
            logger.error(f"Error creating Zantac case: {str(e)}")
            return None

    def create_zantac_party(self, row, matter_number):
        """Create injured party record for Zantac"""
        try:
            # Extract client name from any available source
            client_name = None
            possible_name_columns = ['Client_Name', 'Name', 'client_name', 'Full_Name', 'Patient_Name']
            
            for col in possible_name_columns:
                if col in row and pd.notna(row[col]):
                    client_name = self.safe_string(row[col])
                    break
            
            if not client_name:
                client_name = "Zantac Patient"  # Default if no name found
            
            party_item = {
                'PK': f'MATTER#{matter_number}',
                'SK': f'PARTY#INJURED_PARTY#{matter_number}IP001#{datetime.now(timezone.utc).isoformat()}',
                
                'matter_number': matter_number,
                'salesforce_claim_id': matter_number,
                'party_id': f'{matter_number}IP001',
                'party_type': 'INJURED_PARTY',
                'full_legal_name': client_name,
                'relationship_to_case': 'DIRECTLY_INJURED',
                'legal_capacity': 'COMPETENT_ADULT',
                
                'GSI1PK': 'PARTY_TYPE#INJURED_PARTY',
                'GSI1SK': f'MATTER_NUMBER#{matter_number}',
                'GSI2PK': f'MATTER_NUMBER#{matter_number}',
                'GSI2SK': 'PARTY_TYPE#INJURED_PARTY',
                
                'created_date': datetime.now(timezone.utc).isoformat(),
                'data_source': 'ZANTAC_MIGRATION'
            }
            
            return party_item
            
        except Exception as e:
            logger.error(f"Error creating Zantac party: {str(e)}")
            return None

    def create_zantac_document(self, row, matter_number, index):
        """Create document record for Zantac supporting docs"""
        try:
            # Look for any document-related columns
            doc_link_columns = [col for col in row.index if 'link' in col.lower() or 'url' in col.lower() or 'document' in col.lower()]
            
            if not doc_link_columns:
                return None
            
            # Create document record
            doc_item = {
                'PK': f'MATTER#{matter_number}',
                'SK': f'DOCUMENT#SUPPORTING_DOC#{datetime.now(timezone.utc).isoformat()}#{uuid.uuid4().hex[:8]}',
                
                'matter_number': matter_number,
                'salesforce_claim_id': matter_number,
                'document_id': f'ZANDOC{index + 1:04d}',
                'document_name': f'Zantac Supporting Documentation - {matter_number}',
                'document_type': 'SUPPORTING_DOCUMENTATION',
                
                'privilege_type': 'WORK_PRODUCT',
                'confidentiality_level': 'CONFIDENTIAL',
                
                'GSI1PK': f'MATTER_NUMBER#{matter_number}',
                'GSI1SK': 'DOCUMENT_TYPE#SUPPORTING_DOCUMENTATION',
                
                'created_date': datetime.now(timezone.utc).isoformat(),
                'data_source': 'ZANTAC_MIGRATION'
            }
            
            # Add any document links found
            document_links = []
            for col in doc_link_columns:
                if pd.notna(row[col]):
                    document_links.append({
                        'column': col,
                        'link': self.safe_string(row[col])
                    })
            
            if document_links:
                doc_item['document_links'] = document_links
                return doc_item
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating Zantac document: {str(e)}")
            return None

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrator = ZantacMigrator()
    results = migrator.process_zantac_files()
    print(f"Zantac Migration Results: {results}") 