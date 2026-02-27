import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface SchedulerStackProps extends cdk.StackProps {
  environment: string;
  vpc: ec2.Vpc;
  lambdaSecurityGroup: ec2.SecurityGroup;
  databaseSecret: secretsmanager.Secret;
  databaseHost: string;
}

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackProps) {
    super(scope, id, props);

    // Common Lambda configuration
    const commonLambdaConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [props.lambdaSecurityGroup],
      environment: {
        NODE_ENV: props.environment,
        DATABASE_HOST: props.databaseHost,
        DATABASE_SECRET_ARN: props.databaseSecret.secretArn,
      },
    };

    // 1. Strategy Execution Lambda (every 15 minutes during market hours)
    const strategyExecutionFunction = new lambda.Function(this, 'StrategyExecutionFunction', {
      ...commonLambdaConfig,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../packages/backend/dist-lambda/strategy-execution.zip'),
      description: 'Executes trading strategies and places orders',
    });

    // 2. Order Status Poller Lambda (every 1 minute)
    const orderStatusFunction = new lambda.Function(this, 'OrderStatusFunction', {
      ...commonLambdaConfig,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../packages/backend/dist-lambda/order-status.zip'),
      description: 'Checks pending order status and updates fills',
      timeout: cdk.Duration.minutes(2),
    });

    // 3. Position Sync Lambda (every 5 minutes)
    const positionSyncFunction = new lambda.Function(this, 'PositionSyncFunction', {
      ...commonLambdaConfig,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../packages/backend/dist-lambda/position-sync.zip'),
      description: 'Syncs positions with broker',
    });

    // 4. Price Update Lambda (every 5 minutes during market hours)
    const priceUpdateFunction = new lambda.Function(this, 'PriceUpdateFunction', {
      ...commonLambdaConfig,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../packages/backend/dist-lambda/price-update.zip'),
      description: 'Updates stock prices and checks alerts',
    });

    // 5. Portfolio Snapshot Lambda (end of day)
    const portfolioSnapshotFunction = new lambda.Function(this, 'PortfolioSnapshotFunction', {
      ...commonLambdaConfig,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../packages/backend/dist-lambda/portfolio-snapshot.zip'),
      description: 'Creates end-of-day portfolio snapshots',
    });

    // Grant Secrets Manager read access to all functions
    const functions = [
      strategyExecutionFunction,
      orderStatusFunction,
      positionSyncFunction,
      priceUpdateFunction,
      portfolioSnapshotFunction,
    ];

    functions.forEach((fn) => {
      props.databaseSecret.grantRead(fn);

      // Grant VPC execution permissions
      fn.role?.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
      );
    });

    // EventBridge Rules

    // 1. Strategy Execution: Every 15 minutes during market hours
    const strategyExecutionRule = new events.Rule(this, 'StrategyExecutionRule', {
      schedule: events.Schedule.cron({
        minute: '*/15',
        hour: '14-20', // 9:30 AM - 4:00 PM ET ≈ 14:30 - 21:00 UTC
        weekDay: 'MON-FRI',
      }),
      description: 'Execute trading strategies every 15 minutes during market hours',
      enabled: true,
    });
    strategyExecutionRule.addTarget(new targets.LambdaFunction(strategyExecutionFunction));

    // 2. Order Status Check: Every 1 minute
    const orderStatusRule = new events.Rule(this, 'OrderStatusRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      description: 'Check pending order status every minute',
      enabled: true,
    });
    orderStatusRule.addTarget(new targets.LambdaFunction(orderStatusFunction));

    // 3. Position Sync: Every 5 minutes
    const positionSyncRule = new events.Rule(this, 'PositionSyncRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      description: 'Sync positions with broker every 5 minutes',
      enabled: true,
    });
    positionSyncRule.addTarget(new targets.LambdaFunction(positionSyncFunction));

    // 4. Price Update: Every 5 minutes during market hours
    const priceUpdateRule = new events.Rule(this, 'PriceUpdateRule', {
      schedule: events.Schedule.cron({
        minute: '*/5',
        hour: '14-20', // Market hours
        weekDay: 'MON-FRI',
      }),
      description: 'Update stock prices every 5 minutes during market hours',
      enabled: true,
    });
    priceUpdateRule.addTarget(new targets.LambdaFunction(priceUpdateFunction));

    // 5. Portfolio Snapshot: End of day at 4:05 PM ET (21:05 UTC)
    const portfolioSnapshotRule = new events.Rule(this, 'PortfolioSnapshotRule', {
      schedule: events.Schedule.cron({
        minute: '5',
        hour: '21', // 4:05 PM ET = 21:05 UTC
        weekDay: 'MON-FRI',
      }),
      description: 'Create end-of-day portfolio snapshots',
      enabled: true,
    });
    portfolioSnapshotRule.addTarget(new targets.LambdaFunction(portfolioSnapshotFunction));

    // Outputs
    new cdk.CfnOutput(this, 'StrategyExecutionFunctionArn', {
      value: strategyExecutionFunction.functionArn,
      description: 'Strategy execution Lambda ARN',
    });

    new cdk.CfnOutput(this, 'OrderStatusFunctionArn', {
      value: orderStatusFunction.functionArn,
      description: 'Order status poller Lambda ARN',
    });

    new cdk.CfnOutput(this, 'PositionSyncFunctionArn', {
      value: positionSyncFunction.functionArn,
      description: 'Position sync Lambda ARN',
    });

    new cdk.CfnOutput(this, 'PriceUpdateFunctionArn', {
      value: priceUpdateFunction.functionArn,
      description: 'Price update Lambda ARN',
    });

    new cdk.CfnOutput(this, 'PortfolioSnapshotFunctionArn', {
      value: portfolioSnapshotFunction.functionArn,
      description: 'Portfolio snapshot Lambda ARN',
    });
  }
}
