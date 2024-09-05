import winston from 'winston';

// winston을 이용해 logger 생성
const logger = winston.createLogger({
  level: 'info', // error, warn, debug 가능
  format: winston.format.json(), // json 형태
  transports: [
    new winston.transports.Console(), // 콘솔에 출력
  ],
});

export default function (req, res, next) {
  const start = new Date().getTime(); // 현재 시간(호출한 시간)

  res.on('finish', () => {
    const duration = new Date().getTime() - start; // 처리 시간
    logger.info(
      `Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`
    );
  });

  // 다음 미들웨어 실행
  next();
}
