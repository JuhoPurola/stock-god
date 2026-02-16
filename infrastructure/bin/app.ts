#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { SchedulerStack } from '../lib/stacks/scheduler-stack';

const app = new cdk.App();

// Get environment from context
const environment = app.node.tryGetContext('environment') || 'staging';
const account = '865097414780';
const region = 'eu-west-1';

const env = {
  account,
  region,
};

const stackPrefix = `StockPicker-${environment}`;

// Database Stack
const databaseStack = new DatabaseStack(app, `${stackPrefix}-Database`, {
  env,
  environment,
  description: 'Stock Picker Database Stack - PostgreSQL RDS',
});

// API Stack
const apiStack = new ApiStack(app, `${stackPrefix}-Api`, {
  env,
  environment,
  database: databaseStack.database,
  dbProxy: databaseStack.dbProxy,
  lambdaSecurityGroup: databaseStack.lambdaSecurityGroup,
  vpc: databaseStack.vpc,
  description: 'Stock Picker API Stack - Lambda + API Gateway',
});

// Frontend Stack
const frontendStack = new FrontendStack(app, `${stackPrefix}-Frontend`, {
  env,
  environment,
  apiUrl: apiStack.apiUrl,
  description: 'Stock Picker Frontend Stack - S3 + CloudFront',
});

// Scheduler Stack
const schedulerStack = new SchedulerStack(app, `${stackPrefix}-Scheduler`, {
  env,
  environment,
  apiUrl: apiStack.apiUrl,
  description: 'Stock Picker Scheduler Stack - EventBridge Rules',
});

// Add dependencies
apiStack.addDependency(databaseStack);
frontendStack.addDependency(apiStack);
schedulerStack.addDependency(apiStack);

// Tags
cdk.Tags.of(app).add('Project', 'StockPicker');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');

app.synth();
