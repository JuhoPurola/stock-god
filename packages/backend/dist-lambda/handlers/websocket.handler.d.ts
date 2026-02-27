/**
 * WebSocket connection handlers for real-time updates
 */
/**
 * Handle WebSocket connect event
 * Authenticates user and stores connection in DynamoDB
 */
export declare function handleConnect(event: any): Promise<any>;
/**
 * Handle WebSocket disconnect event
 * Removes connection from DynamoDB
 */
export declare function handleDisconnect(event: any): Promise<any>;
/**
 * Handle incoming WebSocket messages
 * Routes messages based on action type
 */
export declare function handleMessage(event: any): Promise<any>;
//# sourceMappingURL=websocket.handler.d.ts.map