#!/usr/bin/env python3
"""
Simplified Sherlock AI Data Migration Runner
For NEC, HAIR_RELAXER, and ZANTAC projects
"""

import os
import sys
import logging
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import importlib.util
    spec = importlib.util.spec_from_file_location("sherlock_data_loader", "sherlock-data-loader.py")
    loader_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loader_module)
    SherlockDataMigrator = loader_module.SherlockDataMigrator
except Exception as e:
    print(f"ERROR: Cannot import SherlockDataMigrator: {e}")
    print("Make sure sherlock-data-loader.py exists.")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def check_aws_credentials():
    """Check if AWS credentials are properly configured"""
    try:
        import boto3
        sts = boto3.client('sts')
        response = sts.get_caller_identity()
        logger.info(f"AWS Account: {response.get('Account')}")
        logger.info(f"AWS User/Role: {response.get('Arn')}")
        return True
    except Exception as e:
        logger.error(f"AWS credentials not configured: {str(e)}")
        return False

def verify_data_files():
    """Verify that the required data files exist"""
    base_path = os.path.join(os.path.dirname(__file__), '..', '..')
    
    required_files = [
        'NEC Data Files/Case_Info.xlsx',
        'NEC Data Files/Medical_Records.xlsx',
        'NEC Data Files/Financial_Info.xlsx',
        'HAIR RELAXER Watts FM to SF 20241008/HAIR Data Files/Case_Info.xlsx',
        'HAIR RELAXER Watts FM to SF 20241008/HAIR Data Files/Medical_Records.xlsx',
        'HAIR RELAXER Watts FM to SF 20241008/HAIR Data Files/Financial_Info.xlsx'
    ]
    
    missing_files = []
    for file_path in required_files:
        full_path = os.path.join(base_path, file_path)
        if not os.path.exists(full_path):
            missing_files.append(file_path)
    
    if missing_files:
        logger.warning(f"Missing files: {missing_files}")
        return False
    
    logger.info("All required data files found")
    return True

def main():
    """Main migration process"""
    print("=" * 60)
    print("  SHERLOCK AI DATA MIGRATION")
    print("  Mass Tort Case Management System")
    print("  Projects: NEC, HAIR_RELAXER, ZANTAC")
    print("=" * 60)
    print()
    
    # Check prerequisites
    logger.info("Checking prerequisites...")
    
    if not check_aws_credentials():
        print("❌ AWS credentials not configured. Please run 'aws configure' first.")
        return False
    
    if not verify_data_files():
        print("⚠️  Some data files are missing. Migration will continue with available files.")
    
    # Confirm before proceeding
    print(f"\n📋 This will migrate data to Sherlock AI DynamoDB tables:")
    print(f"   • sherlock-cases-main")
    print(f"   • sherlock-parties-roles") 
    print(f"   • sherlock-medical-records")
    print(f"   • sherlock-financial-ledger")
    print(f"\n🔑 Using Matter_Number as primary identifier (maps to Claim_Id__c)")
    
    confirmation = input(f"\n✅ Proceed with migration? (y/N): ")
    if confirmation.lower() != 'y':
        print("❌ Migration cancelled by user")
        return False
    
    # Run migration
    try:
        logger.info("Initializing data migrator...")
        migrator = SherlockDataMigrator()
        
        logger.info("Starting data migration...")
        results = migrator.run_migration()
        
        # Print results
        print("\n" + "=" * 60)
        print("  MIGRATION COMPLETED")
        print("=" * 60)
        
        total_cases = 0
        total_medical = 0
        total_financial = 0
        
        for project, data in results.items():
            cases = data.get('cases', 0)
            medical = data.get('medical_records', 0)
            financial = data.get('financial_records', 0)
            
            print(f"\n📊 {project}:")
            print(f"   Cases: {cases}")
            print(f"   Medical Records: {medical}")
            print(f"   Financial Records: {financial}")
            
            total_cases += cases
            total_medical += medical
            total_financial += financial
        
        print(f"\n🎯 TOTALS:")
        print(f"   Total Cases: {total_cases}")
        print(f"   Total Medical Records: {total_medical}")
        print(f"   Total Financial Records: {total_financial}")
        print(f"   Total Records: {total_cases + total_medical + total_financial}")
        
        print(f"\n✅ Migration completed successfully!")
        print(f"📄 Detailed logs saved to migration log file")
        
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        print(f"\n❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 