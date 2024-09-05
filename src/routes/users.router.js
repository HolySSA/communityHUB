import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/** Users-UserInfos 회원가입 API **/
router.post('/sign-up', async (req, res, next) => {
  // body 로부터 email, password, name, age, gender, profileImage 전달 받기
  const { email, password, name, age, gender, profileImage } = req.body;

  const isExistUser = await prisma.users.findFirst({
    where: { email },
  });

  // 동일한 email을 가진 사용자 유무 체크
  if (isExistUser) {
    return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
  }

  // Users 테이블 email, password를 이용해 사용자 생성
  const saltRounds = 10; // salt를 얼마나 복잡하게 만들지 결정.
  const hashedPassword = await bcrypt.hash(password, saltRounds); // bcrypt를 이용해서 암호화 하기
  const user = await prisma.users.create({
    data: {
      email: email, // 생략 가능 (email,)
      password: hashedPassword,
    },
  });

  // UserInfos 테이블 name, age, gender, profileImage를 이용해 사용자 정보 생성
  const userInfo = await prisma.userInfos.create({
    data: {
      userId: user.userId,
      name,
      age,
      gender,
      profileImage,
    },
  });

  return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
});

/** Users 로그인 API **/
router.post('/sign-in', async (req, res, next) => {
  // 클라이언트의 body 로부터 email, password 전달 받기
  const { email, password } = req.body;

  const user = await prisma.users.findFirst({ where: { email } });

  // 전달 받은 이메일을 토대로 해당 이메일 유무 확인.
  if (!user)
    return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
  // 전달 받은 함호화된 비밀번호를 토대로 복호화하여 비밀번호 일치 여부 확인.
  if (!(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

  // 로그인 성공 시 userId를 기반으로 유저 토큰(jwt) 생성
  const token = jwt.sign(
    {
      userId: user.userId,
    },
    'custom-secret-key'
  );

  // 유저에게 'authorization'(인가) 라는 쿠키값 제공
  res.cookie('authorization', `Bearer ${token}`);

  return res.status(200).json({ message: '로그인에 성공하였습니다.' });
});

/** Users 조회 API **/
// authMiddleware 미들웨어로 로그인된 사용자 검증
router.get('/users', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      userInfos: {
        // 1:1 관계를 맺고있는 UserInfos 테이블 조회.
        select: {
          name: true,
          age: true,
          gender: true,
          profileImage: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});

export default router;
