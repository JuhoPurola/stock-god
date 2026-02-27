import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface DatabaseStackProps extends cdk.StackProps {
  environment: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly dbProxy: rds.DatabaseProxy;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create VPC with single NAT Gateway
    // Cost: ~$32/month for 1 NAT Gateway vs $64 for 2
    // Required for Lambda to access external APIs (Alpaca, Alpha Vantage)
    this.vpc = new ec2.Vpc(this, 'Vpc2', { // Changed ID to force new VPC creation
      maxAzs: 2,
      natGateways: 1, // Single NAT Gateway for cost optimization
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // With NAT for internet access
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Isolated for database
          cidrMask: 24,
        },
      ],
    });

    // Add VPC Endpoints for AWS services to avoid NAT Gateway charges for AWS API calls
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Create security group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // Create security group for database
    this.securityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Stock Picker database',
      allowAllOutbound: false,
    });

    // Allow Lambda to access database
    this.securityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access database'
    );

    // Create database credentials secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `stock-picker/${props.environment}/database`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'stock_picker',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16, // Use latest 16.x (16.11)
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        props.environment === 'production' ? ec2.InstanceSize.SMALL : ec2.InstanceSize.MICRO
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.securityGroup],
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      databaseName: 'stock_picker',
      allocatedStorage: props.environment === 'production' ? 100 : 20,
      maxAllocatedStorage: props.environment === 'production' ? 200 : 50,
      backupRetention: cdk.Duration.days(props.environment === 'production' ? 7 : 1),
      deleteAutomatedBackups: props.environment !== 'production',
      deletionProtection: props.environment === 'production',
      removalPolicy: props.environment === 'production'
        ? cdk.RemovalPolicy.SNAPSHOT
        : cdk.RemovalPolicy.DESTROY,
      storageEncrypted: true,
      multiAz: props.environment === 'production',
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['postgresql'],
    });

    // Migration Lambda - for running schema initialization
    const migrationLambda = new lambdaNodejs.NodejsFunction(this, 'MigrationFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, '../../../packages/backend/src/migrate.ts'),
      handler: 'handler',
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.lambdaSecurityGroup],
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        DATABASE_SECRET_ARN: this.databaseSecret.secretArn,
        DATABASE_HOST: this.database.dbInstanceEndpointAddress,
      },
      bundling: {
        minify: false, // Don't minify to preserve error messages
        sourceMap: true,
        target: 'node20',
        externalModules: ['@aws-sdk/*'], // AWS SDK is available in Lambda runtime
        loader: {
          '.sql': 'text', // Bundle SQL files as text
        },
      },
    });

    // Grant migration Lambda access to secrets and database
    this.databaseSecret.grantRead(migrationLambda);
    this.database.connections.allowDefaultPortFrom(migrationLambda);

    // Create RDS Proxy for connection pooling
    // Benefits:
    // - Pools database connections efficiently for Lambda
    // - Prevents connection exhaustion
    // - Enables connection reuse across Lambda invocations
    // - Improves cold start performance
    this.dbProxy = new rds.DatabaseProxy(this, 'DatabaseProxy', {
      proxyTarget: rds.ProxyTarget.fromInstance(this.database),
      secrets: [this.databaseSecret],
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [this.securityGroup],
      dbProxyName: `stock-picker-${props.environment}-proxy`,
      requireTLS: true,
      maxConnectionsPercent: 90, // Use up to 90% of database max connections
      maxIdleConnectionsPercent: 50,
      idleClientTimeout: cdk.Duration.minutes(30),
      // IAM auth is supported but we'll use secret for simplicity
      iamAuth: false,
    });

    // Allow Lambda to access RDS Proxy
    this.dbProxy.connections.allowFrom(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access RDS Proxy'
    );

    // Outputs - Keep exports for now to avoid CloudFormation dependency issues
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'Database endpoint address',
      exportName: `${id}-Endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'Database credentials secret ARN',
      exportName: `${id}-SecretArn`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${id}-VpcId`,
    });

    new cdk.CfnOutput(this, 'MigrationFunctionName', {
      value: migrationLambda.functionName,
      description: 'Migration Lambda function name',
      exportName: `${id}-MigrationFunction`,
    });

    new cdk.CfnOutput(this, 'DatabaseProxyEndpoint', {
      value: this.dbProxy.endpoint,
      description: 'RDS Proxy endpoint for Lambda connections',
      exportName: `${id}-ProxyEndpoint`,
    });
  }
}
