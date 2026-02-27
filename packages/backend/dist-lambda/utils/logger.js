/**
 * Winston logger configuration
 */
import winston from 'winston';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'stock-picker-backend' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ level, message, timestamp, ...meta }) => {
                const metaStr = Object.keys(meta).length
                    ? `\n${JSON.stringify(meta, null, 2)}`
                    : '';
                return `${timestamp} [${level}]: ${message}${metaStr}`;
            })),
        }),
    ],
});
// If we're not in production and not in Lambda, log to file as well
// Lambda has read-only filesystem, so we skip file logging there
if (process.env.NODE_ENV !== 'production' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
    }));
}
//# sourceMappingURL=logger.js.map