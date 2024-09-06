import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import PostsRouter from './routes/posts.router.js';
import CommentsRouter from './routes/comments.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlingMiddleware from './middlewares/error-handling.middleware.js';
import ExpressSession from 'express-session';
import ExpressMysqlSession from 'express-mysql-session';
import Dotenv from 'dotenv'

// .env 파일을 읽어서 process.env에 추가
Dotenv.config();

const app = express();
const PORT = 3018;

// 외부 session storagy 사용 문법
const MySQLStore = ExpressMysqlSession(ExpressSession);
// MySQLStore를 이용해 세션 외부 스토리지 선언
const sessionStore = new MySQLStore({
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  expiration: 1000 * 60 * 60 * 24, // 만료 기간 1일
  createDatabaseTable: true, // 세션 테이블을 자동으로 생성
});

app.use(LogMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(
  ExpressSession({
    secret: process.env.SESSION_SECRET_KEY, // 세션 암호키
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1일 동안 쿠키 사용 가능
    },
    store: sessionStore, // 외부 세션 스토리지를 MySQLStore로 설정
  })
);

app.use('/api', [UsersRouter, PostsRouter, CommentsRouter]);
app.use(ErrorHandlingMiddleware); // 에러 처리 미들웨어는 항상 마지막에

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다!');
});
