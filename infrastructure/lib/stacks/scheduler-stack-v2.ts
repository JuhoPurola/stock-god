import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface SchedulerStackV2Props extends cdk.StackProps {
  environment: string;
  vpc: ec2.IVpc;
  lambdaSecurityGroup: ec2.ISecurityGroup;
  databaseHost: string;
  databaseSecretArn: string;
  websocketApiEndpoint: string;
  connectionsTableName: string;
  alpacaSecretArn: string;
}

export class SchedulerStackV2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackV2Props) {
    super(scope, id, props);

    const commonEnv = {
      DATABASE_HOST: props.databaseHost,
      DATABASE_SECRET_ARN: props.databaseSecretArn,
      WEBSOCKET_API_ENDPOINT: props.websocketApiEndpoint,
      CONNECTIONS_TABLE_NAME: props.connectionsTableName,
      ALPACA_SECRET_ARN: props.alpacaSecretArn,
      NODE_ENV: props.environment,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    };

    const commonConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.lambdaSecurityGroup],
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node20',
        externalModules: ['@aws-sdk/*', 'pg-native'],
        loader: {
          '.sql': 'text',
        },
      },
    };

    // 1. Strategy Execution Function (every 15 minutes during market hours)
    const strategyExecutionFunction = new lambdaNodejs.NodejsFunction(this, 'StrategyExecutionFunction', {
      ...commonConfig,
      entry: path.join(__dirname, '../../../packages/backend/src/handlers/scheduled-strategy-execution.handler.ts'),
      handler: 'handler',
      environment: commonEnv,
      description: 'Evaluates enabled strategies and executes trades',
    });

    const strategyExecutionRule = new events.Rule(this, 'StrategyExecutionRule', {
      schedule: events.Schedule.expression('cron(*/15 13-20 ? * MON-FRI *)'),
      description: 'Execute strategies every 15 minutes during market hours (9:30 AM - 4 PM ET)',
      enabled: props.environment === 'production',
    });

    strategyExecutionRule.addTarget(new targets.LambdaFunction(strategyExecutionFunction));

    // 2. Order Status Check Function (every 1 minute during market hours)
    const orderStatusFunction = new lambdaNodejs.NodejsFunction(this, 'OrderStatusFunction', {
      ...commonConfig,
      entry: path.join(__dirname, '../../../packages/backend/src/handlers/scheduled-order-status.handler.ts'),
      handler: 'handler',
      environment: commonEnv,
      description: 'Polls pending orders and updates their status',
    });

    const orderStatusRule = new events.Rule(this, 'OrderStatusRule', {
      schedule: events.Schedule.expression('cron(* 13-20 ? * MON-FRI *)'),
      description: 'Check order status every 1 minute during market hours',
      enabled: props.environment === 'production',
    });

    orderStatusRule.addTarget(new targets.LambdaFunction(orderStatusFunction));

    // 3. Position Sync Function (every 5 minutes during market hours)
    const positionSyncFunction = new lambdaNodejs.NodejsFunction(this, 'PositionSyncFunction', {
      ...commonConfig,
      entry: path.join(__dirname, '../../../packages/backend/src/handlers/scheduled-position-sync.handler.ts'),
      handler: 'handler',
      environment: commonEnv,
      description: 'Syncs positions with broker to ensure consistency',
    });

    const positionSyncRule = new events.Rule(this, 'PositionSyncRule', {
      schedule: events.Schedule.expression('cron(*/5 13-20 ? * MON-FRI *)'),
      description: 'Sync positions every 5 minutes during market hours',
      enabled: props.environment === 'production',
    });

    positionSyncRule.addTarget(new targets.LambdaFunction(positionSyncFunction));

    // 4. Price Update Function (every 5 minutes during market hours)
    const priceUpdateFunction = new lambdaNodejs.NodejsFunction(this, 'PriceUpdateFunction', {
      ...commonConfig,
      entry: path.join(__dirname, '../../../packages/backend/src/handlers/scheduled-price-update.handler.ts'),
      handler: 'handler',
      environment: commonEnv,
      description: 'Fetches latest quotes and updates position values',
    });

    const priceUpdateRule = new events.Rule(this, 'PriceUpdateRule', {
      schedule: events.Schedule.expression('cron(*/5 13-20 ? * MON-FRI *)'),
      description: 'Update prices every 5 minutes during market hours',
      enabled: props.environment === 'production',
    });

    priceUpdateRule.addTarget(new targets.LambdaFunction(priceUpdateFunction));

    // 5. Portfolio Snapshot Function (4:05 PM ET end of day)
    const portfolioSnapshotFunction = new lambdaNodejs.NodejsFunction(this, 'PortfolioSnapshotFunction', {
      ...commonConfig,
      entry: path.join(__dirname, '../../../packages/backend/src/handlers/scheduled-portfolio-snapshot.handler.ts'),
      handler: 'handler',
      environment: commonEnv,
      description: 'Creates daily snapshots of portfolio performance',
    });

    const portfolioSnapshotRule = new events.Rule(this, 'PortfolioSnapshotRule', {
      schedule: events.Schedule.expression('cron(5 20 ? * MON-FRI *)'),
      description: 'Create portfolio snapshots at 4:05 PM ET (20:05 UTC)',
      enabled: props.environment === 'production',
    });

    portfolioSnapshotRule.addTarget(new targets.LambdaFunction(portfolioSnapshotFunction));

    // 6. Alert Price Check Function (every 5 minutes during market hours)
    const alertPriceCheckFunction = new lambdaNodejs.NodejsFunction(this, 'AlertPriceCheckFunction', {
      ...commonConfig,
      entry: path.join(__dirname, '../../../packages/backend/src/handlers/scheduled-alert-price-check.handler.ts'),
      handler: 'handler',
      environment: commonEnv,
      description: 'Checks active price alerts and triggers notifications',
    });

    const alertPriceCheckRule = new events.Rule(this, 'AlertPriceCheckRule', {
      schedule: events.Schedule.expression('cron(*/5 13-20 ? * MON-FRI *)'),
      description: 'Check price alerts every 5 minutes during market hours',
      enabled: props.environment === 'production',
    });

    alertPriceCheckRule.addTarget(new targets.LambdaFunction(alertPriceCheckFunction));

    // Grant permissions to all functions
    const functions = [
      strategyExecutionFunction,
      orderStatusFunction,
      positionSyncFunction,
      priceUpdateFunction,
      portfolioSnapshotFunction,
      alertPriceCheckFunction,
    ];

    functions.forEach((fn) => {
      // Grant database secret read access
      fn.addToRolePolicy(
        new cdk.aws_iam.PolicyStatement({
          actions: ['secretsmanager:GetSecretValue'],
          resources: [
            props.databaseSecretArn,
            props.alpacaSecretArn,
            `${props.alpacaSecretArn}-*`, // For versioned secrets
            `${props.databaseSecretArn}-*`,
          ],
        })
      );

      // Grant DynamoDB access for WebSocket connections
      fn.addToRolePolicy(
        new cdk.aws_iam.PolicyStatement({
          actions: [
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
          ],
          resources: [
            `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.connectionsTableName}`,
            `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.connectionsTableName}/*`,
          ],
        })
      );

      // Grant API Gateway Management API access for WebSocket
      fn.addToRolePolicy(
        new cdk.aws_iam.PolicyStatement({
          actions: ['execute-api:ManageConnections', 'execute-api:Invoke'],
          resources: [`arn:aws:execute-api:${this.region}:${this.account}:*/*`],
        })
      );
    });

    // Outputs
    new cdk.CfnOutput(this, 'StrategyExecutionFunctionArn', {
      value: strategyExecutionFunction.functionArn,
      description: 'Strategy Execution Lambda ARN',
    });

    new cdk.CfnOutput(this, 'OrderStatusFunctionArn', {
      value: orderStatusFunction.functionArn,
      description: 'Order Status Check Lambda ARN',
    });

    new cdk.CfnOutput(this, 'PositionSyncFunctionArn', {
      value: positionSyncFunction.functionArn,
      description: 'Position Sync Lambda ARN',
    });

    new cdk.CfnOutput(this, 'PriceUpdateFunctionArn', {
      value: priceUpdateFunction.functionArn,
      description: 'Price Update Lambda ARN',
    });

    new cdk.CfnOutput(this, 'PortfolioSnapshotFunctionArn', {
      value: portfolioSnapshotFunction.functionArn,
      description: 'Portfolio Snapshot Lambda ARN',
    });

    new cdk.CfnOutput(this, 'AlertPriceCheckFunctionArn', {
      value: alertPriceCheckFunction.functionArn,
      description: 'Alert Price Check Lambda ARN',
    });
  }
}
