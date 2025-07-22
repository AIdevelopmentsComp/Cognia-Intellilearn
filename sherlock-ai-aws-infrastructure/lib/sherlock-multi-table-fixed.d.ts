import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
export declare class SherlockMultiTableStack extends cdk.Stack {
    readonly casesTable: dynamodb.Table;
    readonly partiesTable: dynamodb.Table;
    readonly medicalTable: dynamodb.Table;
    readonly courtTable: dynamodb.Table;
    readonly documentsTable: dynamodb.Table;
    readonly financialTable: dynamodb.Table;
    readonly kmsKey: kms.Key;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
