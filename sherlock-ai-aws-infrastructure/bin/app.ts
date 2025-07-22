#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SherlockAILegalDatabaseStack } from '../lib/sherlock-ai-stack';
import { SherlockCognitoAuthStack } from '../lib/sherlock-cognito-stack';
import { SherlockMultiTableStack } from '../lib/sherlock-multi-table-stack';

const app = new cdk.App();

// Main database stack
const databaseStack = new SherlockAILegalDatabaseStack(app, 'SherlockAILegalDatabaseStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1', // Primary region for legal operations
  },
  description: 'Sherlock AI Legal Case Management System - Mass Tort & Single Event Cases',
  tags: {
    Project: 'SherlockAI',
    Environment: 'Production',
    LawFirm: 'WattsLawFirm',
    DataClassification: 'AttorneyClientPrivileged',
    ComplianceRequirement: 'ABA-Rules-HIPAA-SOX',
    RetentionPeriod: '7Years',
  },
});

// Cognito authentication and authorization stack
const authStack = new SherlockCognitoAuthStack(app, 'SherlockCognitoAuthStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Sherlock AI Authentication & Authorization - Cognito + Advanced Permissions',
  tags: {
    Project: 'SherlockAI',
    Component: 'Authentication',
    Environment: 'Production',
    LawFirm: 'WattsLawFirm',
    DataClassification: 'UserCredentials',
    ComplianceRequirement: 'SOC2-Type2-ABA-Rules',
    SecurityLevel: 'Critical',
  },
});

// Multi-table specialized architecture stack
const multiTableStack = new SherlockMultiTableStack(app, 'SherlockMultiTableStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Sherlock AI Multi-Table Architecture - Specialized DynamoDB Tables for Legal Data',
  tags: {
    Project: 'SherlockAI',
    Component: 'DataPersistence',
    Environment: 'Production',
    LawFirm: 'WattsLawFirm',
    DataClassification: 'AttorneyClientPrivileged',
    ComplianceRequirement: 'ABA-Rules-HIPAA-WorkProduct',
    Architecture: 'MultiTableSpecialized',
  },
});

// Add dependencies - auth stack can reference database resources if needed
// authStack.addDependency(databaseStack);
// multiTableStack.addDependency(databaseStack); // Keep legacy table during transition

// Global tags
cdk.Tags.of(app).add('CreatedBy', 'CDK-SherlockAI-V2');
cdk.Tags.of(app).add('CostCenter', 'Legal-Technology');
cdk.Tags.of(app).add('BusinessUnit', 'MassTortLitigation');
cdk.Tags.of(app).add('DeploymentDate', new Date().toISOString().split('T')[0]);
cdk.Tags.of(app).add('Owner', 'WattsLawFirm-TechTeam'); 