/**
 * Lambda handler for API Gateway
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export { handleConnect, handleDisconnect, handleMessage, } from './handlers/websocket.handler.js';
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=lambda.d.ts.map