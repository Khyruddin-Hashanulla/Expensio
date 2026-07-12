import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const transports = [
  new winston.transports.Console({
    format: isProduction
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
];

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/app.log',
      format: winston.format.json(),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
    })
  );
}

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true })),
  transports,
});
