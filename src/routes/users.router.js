import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

/** Users-UserInfos 회원가입 API **/
router.post('/sign-up', async (req, res, next) => {
  try {
    // throw new Error('에러 핸들링 미들웨어 테스트');

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

    // 트랜잭션 적용
    const [user, userInfo] = await prisma.$transaction(
      async (tx) => {
        const user = await tx.users.create({
          data: {
            email: email, // 생략 가능 (email,)
            password: hashedPassword,
          },
        });

        //throw new Error('고의로 발생시킨 트랜잭션 에러');

        // UserInfos 테이블 name, age, gender, profileImage를 이용해 사용자 정보 생성
        const userInfo = await tx.userInfos.create({
          data: {
            userId: user.userId,
            name,
            age,
            gender,
            profileImage,
          },
        });

        return [user, userInfo];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    // 에러 처리 미들웨어로 전달
    next(err);
  }
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

  /* JWT(토큰) 할당하고 쿠키로 사용자에게 전달하는 대신 express-session 사용
  // 로그인 성공 시 userId를 기반으로 유저 토큰(jwt) 생성
  const token = jwt.sign(
    {
      userId: user.userId,
    },
    'custom-secret-key'
  );

  // 유저에게 'authorization'(인가) 라는 쿠키값 제공
  res.cookie('authorization', `Bearer ${token}`);
  */

  // express-session을 이용하여 세션 정보에 userId 할당
  req.session.userId = user.userId;

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

/** 사용자 정보 변경 API **/

// 사용자 검증 미들웨어로 검증 후 실행
router.patch('/users', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const updatedData = req.body;

  // 유저 정보 가져오기
  const userInfo = await prisma.userInfos.findFirst({
    where: { userId: +userId },
  });
  // UserInfo 존재 X 시
  if (!userInfo)
    return res.status(404).json({ message: '사용자 정보가 존재하지 않습니다.' });

  await prisma.$transaction(
    async (tx) => {
      await tx.userInfos.update({
        data: {
          // spread operator를 이용해서 데이터 업데이트
          ...updatedData,
        },
        where: {
          userId: +userId,
        },
      });

      for (let key in updatedData) {
        // 수정된 데이터가 존재할 경우
        if (userInfo[key] !== updatedData[key]) {
          await tx.userHistories.create({
            data: {
              userId: +userId,
              changedField: key,
              oldValue: String(userInfo[key]),
              newValue: String(updatedData[key]),
            },
          });
        }
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );

  return res.status(200).json({ message: '사용자 정보 변경에 성공하였습니다.' });
});

export default router;
