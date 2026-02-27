#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { SchedulerStack } from '../lib/stacks/scheduler-stack';
import { WebSocketStack } from '../lib/stacks/websocket-stack';

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

// WebSocket Stack (deploy first to get exports)
// Import values from existing Database stack exports
const databaseSecretArn = cdk.Fn.importValue(`${stackPrefix}-Database-SecretArn`);
const vpcId = cdk.Fn.importValue(`${stackPrefix}-Database-VpcId`);
const databaseEndpoint = cdk.Fn.importValue(`${stackPrefix}-Database-Endpoint`);

const webSocketStack = new WebSocketStack(app, `${stackPrefix}-WebSocket`, {
  env,
  environment,
  databaseEndpoint: databaseEndpoint,
  databaseName: 'stockpicker',
  databaseSecretArn: databaseSecretArn,
  vpcId: vpcId,
  privateSubnetIds: [
    cdk.Fn.importValue(`${stackPrefix}-Database:ExportsOutputRefVpc2PrivateSubnet1Subnet34902000FD7B208F`),
    cdk.Fn.importValue(`${stackPrefix}-Database:ExportsOutputRefVpc2PrivateSubnet2Subnet3BA0F39BC92BF43A`),
  ],
  lambdaSecurityGroupId: cdk.Fn.importValue(`${stackPrefix}-Database:ExportsOutputFnGetAttLambdaSecurityGroup0BD9FC99GroupId34A98CFB`),
  description: 'Stock Picker WebSocket Stack - WebSocket API Gateway',
});

// API Stack (with WebSocket integration)
const apiStack = new ApiStack(app, `${stackPrefix}-Api`, {
  env,
  environment,
  database: databaseStack.database,
  dbProxy: databaseStack.dbProxy,
  lambdaSecurityGroup: databaseStack.lambdaSecurityGroup,
  vpc: databaseStack.vpc,
  websocketApiId: '75el4li1o3', // From WebSocket stack deployment
  connectionsTableName: 'stockpicker-production-connections', // From WebSocket stack deployment
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
  vpc: databaseStack.vpc,
  lambdaSecurityGroup: databaseStack.lambdaSecurityGroup,
  databaseSecret: databaseStack.databaseSecret,
  databaseHost: databaseStack.database.instanceEndpoint.hostname,
  description: 'Stock Picker Scheduler Stack - Automated Trading Jobs',
});

// Add dependencies
webSocketStack.addDependency(databaseStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(webSocketStack); // API needs WebSocket for broadcasting
frontendStack.addDependency(apiStack);
schedulerStack.addDependency(apiStack);

// Tags
cdk.Tags.of(app).add('Project', 'StockPicker');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');

app.synth();
