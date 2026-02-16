import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  environment: string;
  database: rds.DatabaseInstance;
  dbProxy: rds.DatabaseProxy;
  lambdaSecurityGroup: ec2.SecurityGroup;
  vpc: ec2.Vpc;
}

export class ApiStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly api: apigatewayv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create secrets for external APIs
    const alpacaSecret = new secretsmanager.Secret(this, 'AlpacaSecret', {
      secretName: `stock-picker/${props.environment}/alpaca`,
      description: 'Alpaca API credentials',
    });

    const alphaVantageSecret = new secretsmanager.Secret(this, 'AlphaVantageSecret', {
      secretName: `stock-picker/${props.environment}/alpha-vantage`,
      description: 'Alpha Vantage API key',
    });

    // Create Lambda function for API
    // Cost optimizations:
    // - ARM architecture (20% cheaper + 34% faster)
    // - 256 MB memory (50% cost reduction, monitor and adjust)
    // - Node 20.x (latest LTS)
    // Using NodejsFunction for proper esbuild bundling of monorepo dependencies
    const apiFunction = new lambdaNodejs.NodejsFunction(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64, // Cost optimization: 20% cheaper
      entry: path.join(__dirname, '../../../packages/backend/src/lambda.ts'),
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node20',
        externalModules: ['@aws-sdk/*'], // AWS SDK v3 is available in Lambda runtime
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Use NAT Gateway for external APIs
      },
      securityGroups: [props.lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(60), // Increased for cold starts with VPC initialization
      memorySize: 256, // Cost optimization: reduced from 512 MB
      logRetention: logs.RetentionDays.THREE_DAYS, // Cost optimization: reduce log storage
      environment: {
        NODE_ENV: props.environment,
        DATABASE_SECRET_ARN: props.database.secret!.secretArn,
        // Use RDS Proxy endpoint for connection pooling
        DATABASE_HOST: props.dbProxy.endpoint,
        ALPACA_SECRET_ARN: alpacaSecret.secretArn,
        ALPHA_VANTAGE_SECRET_ARN: alphaVantageSecret.secretArn,
      },
    });

    // Grant Lambda access to secrets
    props.database.secret!.grantRead(apiFunction);
    alpacaSecret.grantRead(apiFunction);
    alphaVantageSecret.grantRead(apiFunction);

    // Grant Lambda access to database via RDS Proxy
    props.dbProxy.grantConnect(apiFunction);

    // Create HTTP API (70% cheaper than REST API)
    // Cost optimization: $1.00 per million requests vs $3.50 for REST API
    this.api = new apigatewayv2.HttpApi(this, 'Api', {
      apiName: `stock-picker-${props.environment}`,
      description: 'Stock Picker HTTP API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'x-user-id',
        ],
      },
    });

    // Create Lambda integration with proxy (using payload format 1.0 for compatibility)
    const integration = new apigatewayv2Integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      apiFunction,
      {
        payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_1_0,
      }
    );

    // Add catch-all route to proxy all requests to Lambda
    this.api.addRoutes({
      path: '/{proxy+}',
      methods: [
        apigatewayv2.HttpMethod.GET,
        apigatewayv2.HttpMethod.POST,
        apigatewayv2.HttpMethod.PUT,
        apigatewayv2.HttpMethod.DELETE,
      ],
      integration,
    });

    // Store API URL
    this.apiUrl = this.api.url || '';

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'API Gateway URL',
      exportName: `${id}-Url`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.apiId,
      description: 'API Gateway ID',
      exportName: `${id}-Id`,
    });

    new cdk.CfnOutput(this, 'AlpacaSecretArn', {
      value: alpacaSecret.secretArn,
      description: 'Alpaca credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'AlphaVantageSecretArn', {
      value: alphaVantageSecret.secretArn,
      description: 'Alpha Vantage secret ARN',
    });
  }
}
