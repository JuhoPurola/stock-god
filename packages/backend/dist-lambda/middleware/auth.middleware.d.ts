/**
 * Auth0 JWT validation middleware
 */
import type { APIGatewayProxyEvent } from 'aws-lambda';
interface Auth0User {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
}
/**
 * Extract and validate Auth0 JWT token from API Gateway event
 */
export declare function validateAuth0Token(event: APIGatewayProxyEvent): Promise<{
    userId: string;
    user: Auth0User;
} | null>;
/**
 * Get user ID from event (supports both Auth0 and legacy x-user-id header)
 */
export declare function getUserIdFromEvent(event: APIGatewayProxyEvent): Promise<string | null>;
/**
 * Verify Auth0 token from raw token string (for WebSocket connections)
 */
export declare function verifyAuth0Token(token: string): Promise<Auth0User | null>;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map