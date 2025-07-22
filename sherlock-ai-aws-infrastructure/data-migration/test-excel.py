#!/usr/bin/env python3
"""
Test script to verify Excel file reading
"""

import pandas as pd
import os
from pathlib import Path

def test_excel_files():
    """Test reading Excel files"""
    
    # Test paths
    base_path = Path(__file__).parent / '..' / '..'
    
    test_files = [
        base_path / 'NEC Data Files' / 'Case_Info.xlsx',
        base_path / 'HAIR RELAXER Watts FM to SF 20241008' / 'HAIR Data Files' / 'Case_Info.xlsx'
    ]
    
    for file_path in test_files:
        print(f"Testing file: {file_path}")
        print(f"Exists: {file_path.exists()}")
        
        if file_path.exists():
            try:
                df = pd.read_excel(file_path)
                print(f"Rows: {len(df)}")
                print(f"Columns: {list(df.columns)[:10]}...")  # Show first 10 columns
                
                # Show first few rows of key columns
                key_columns = ['Matter_Number', 'Claim_Id__c', 'Case_ID', 'Client_Name', 'First_Name']
                available_columns = [col for col in key_columns if col in df.columns]
                
                if available_columns:
                    print(f"Sample data from {available_columns}:")
                    print(df[available_columns].head(3).to_string())
                else:
                    print("No key columns found. All columns:")
                    print(list(df.columns))
                    
            except Exception as e:
                print(f"Error reading file: {e}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_excel_files() 