import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SchedulerStackProps extends cdk.StackProps {
  environment: string;
  apiUrl: string;
}

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackProps) {
    super(scope, id, props);

    // Create Lambda function for scheduled strategy execution
    const schedulerFunction = new lambda.Function(this, 'SchedulerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const https = require('https');

        exports.handler = async (event) => {
          console.log('Executing scheduled strategy run:', event);

          // This would call your API to execute all enabled strategies
          // Implementation would be in the backend

          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Strategy execution triggered' })
          };
        };
      `),
      timeout: cdk.Duration.minutes(5),
      environment: {
        API_URL: props.apiUrl,
        ENVIRONMENT: props.environment,
      },
    });

    // Market hours: Monday-Friday, 9:30 AM - 4:00 PM ET
    // Cron format: minute hour day-of-month month day-of-week year
    // Run every 15 minutes during market hours
    const marketHoursRule = new events.Rule(this, 'MarketHoursRule', {
      schedule: events.Schedule.cron({
        minute: '*/15',
        hour: '14-20', // 9:30 AM - 4:00 PM ET = 14:30 - 21:00 UTC (approximation)
        weekDay: 'MON-FRI',
      }),
      description: 'Execute strategies every 15 minutes during market hours',
      enabled: props.environment === 'production',
    });

    marketHoursRule.addTarget(new targets.LambdaFunction(schedulerFunction));

    // End of day processing: Run at 5:00 PM ET (22:00 UTC)
    const endOfDayRule = new events.Rule(this, 'EndOfDayRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '22', // 5:00 PM ET = 22:00 UTC
        weekDay: 'MON-FRI',
      }),
      description: 'End of day portfolio snapshot and analytics',
      enabled: props.environment === 'production',
    });

    endOfDayRule.addTarget(new targets.LambdaFunction(schedulerFunction));

    // Pre-market check: Run at 8:00 AM ET (13:00 UTC)
    const preMarketRule = new events.Rule(this, 'PreMarketRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '13', // 8:00 AM ET = 13:00 UTC
        weekDay: 'MON-FRI',
      }),
      description: 'Pre-market preparation and data sync',
      enabled: props.environment === 'production',
    });

    preMarketRule.addTarget(new targets.LambdaFunction(schedulerFunction));

    // Outputs
    new cdk.CfnOutput(this, 'SchedulerFunctionArn', {
      value: schedulerFunction.functionArn,
      description: 'Scheduler Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'MarketHoursRuleArn', {
      value: marketHoursRule.ruleArn,
      description: 'Market hours EventBridge rule ARN',
    });
  }
}
