import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

/** 사용자 인증 미들웨어 **/
export default async function (req, res, next) {
  try {
    // 클라이언트의 쿠키에서 authorization 전달 받기
    const { authorization } = req.cookies;

    if (!authorization)
      throw new Error('요청한 사용자의 토큰이 존재하지 않습니다.');

    // authorization은 `Bearer 토큰명` 으로 구성되어 있기 때문에 split으로 구조분해할당.
    const [tokenType, token] = authorization.split(' ');

    // 쿠키가 Bearer 토큰 형식인지 확인
    if (tokenType !== 'Bearer')
      throw new Error('토큰 타입이 Bearer 형식이 아닙니다.');

    // 서버에서 발급한 JWT가 맞는지 검증 - jwt.verify() 에서 토큰이 일치하지 않는다면 error -> catch로 이동
    const decodedToken = jwt.verify(token, 'custom-secret-key');

    const userId = decodedToken.userId;
    const user = await prisma.users.findFirst({
      where: {
        userId: +userId, // userId를 Number 형식으로 변경
      },
    });

    if (!user) throw new Error('토큰 사용자가 존재하지 않습니다.');

    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return res.status(401).json({ message: '토큰이 만료되었습니다.' });
    if (error.name === 'JsonWebTokenError')
      return res.status(401).json({ message: '토큰이 조작되었습니다.' });

    return res.status(400).json({ message: error.message });
  }
}
