import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

interface WebSocketStackProps extends cdk.StackProps {
  environment: 'development' | 'staging' | 'production';
  databaseEndpoint: string | cdk.IResolvable;
  databaseName: string;
  databaseSecretArn: string | cdk.IResolvable;
  vpcId: string | cdk.IResolvable;
  privateSubnetIds: (string | cdk.IResolvable)[];
  lambdaSecurityGroupId: string | cdk.IResolvable;
}

export class WebSocketStack extends cdk.Stack {
  public readonly webSocketUrl: string;
  public readonly webSocketApi: apigatewayv2.WebSocketApi;
  public readonly connectionsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: WebSocketStackProps) {
    super(scope, id, props);

    // DynamoDB table for WebSocket connection management
    this.connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: `stockpicker-${props.environment}-connections`,
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: props.environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by userId
    this.connectionsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for querying by portfolioId
    this.connectionsTable.addGlobalSecondaryIndex({
      indexName: 'PortfolioIdIndex',
      partitionKey: { name: 'portfolioId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
    });

    // Common Lambda environment variables
    // Note: WebSocket Lambdas don't need VPC or database access
    // They only need DynamoDB for connection management and Auth0 for authentication
    const commonEnvironment: { [key: string]: string } = {
      ENVIRONMENT: props.environment,
      CONNECTIONS_TABLE_NAME: this.connectionsTable.tableName,
      // Auth0 configuration
      AUTH0_DOMAIN: 'arvopurola1.eu.auth0.com',
      AUTH0_AUDIENCE: 'https://stockpicker-api',
    };

    // WebSocket Connect Handler (no VPC - needs internet for Auth0 JWKS)
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      functionName: `stockpicker-${props.environment}-websocket-connect`,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handleConnect',
      code: lambda.Code.fromAsset('api-lambda.zip'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // WebSocket Disconnect Handler (no VPC - only needs DynamoDB)
    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      functionName: `stockpicker-${props.environment}-websocket-disconnect`,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handleDisconnect',
      code: lambda.Code.fromAsset('api-lambda.zip'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // WebSocket Default Handler (for incoming messages - no VPC)
    const defaultHandler = new lambda.Function(this, 'DefaultHandler', {
      functionName: `stockpicker-${props.environment}-websocket-default`,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handleMessage',
      code: lambda.Code.fromAsset('api-lambda.zip'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant DynamoDB permissions to all handlers
    this.connectionsTable.grantReadWriteData(connectHandler);
    this.connectionsTable.grantReadWriteData(disconnectHandler);
    this.connectionsTable.grantReadWriteData(defaultHandler);

    // Create WebSocket API
    this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
      apiName: `stockpicker-${props.environment}-websocket`,
      description: `Stock Picker WebSocket API for ${props.environment}`,
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', connectHandler),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration('DefaultIntegration', defaultHandler),
      },
    });

    // Create WebSocket Stage
    const stage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: this.webSocketApi,
      stageName: props.environment,
      autoDeploy: true,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
    });

    // Store WebSocket URL
    this.webSocketUrl = stage.url;

    // Grant API Gateway Management API permissions for sending messages
    const apiGatewayManagementPolicy = new iam.PolicyStatement({
      actions: ['execute-api:ManageConnections'],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.apiId}/${props.environment}/POST/@connections/*`,
      ],
    });

    // These handlers need to send messages back to clients
    defaultHandler.addToRolePolicy(apiGatewayManagementPolicy);

    // Export WebSocket API details for use in other stacks
    new cdk.CfnOutput(this, 'WebSocketApiId', {
      value: this.webSocketApi.apiId,
      exportName: `stockpicker-${props.environment}-websocket-api-id`,
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: this.webSocketUrl,
      exportName: `stockpicker-${props.environment}-websocket-url`,
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: this.connectionsTable.tableName,
      exportName: `stockpicker-${props.environment}-connections-table-name`,
    });

    // Export connection table ARN for Lambda permissions in other stacks
    new cdk.CfnOutput(this, 'ConnectionsTableArn', {
      value: this.connectionsTable.tableArn,
      exportName: `stockpicker-${props.environment}-connections-table-arn`,
    });
  }
}
