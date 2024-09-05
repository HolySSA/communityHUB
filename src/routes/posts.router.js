import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/** 게시글 생성 API **/

// authMiddleware : 사용자 검증 미들웨어
router.post('/posts', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  // 클라이언트로 body 로부터  title, content 전달받기
  const { title, content } = req.body;

  const post = await prisma.posts.create({
    data: {
      userId: +userId,
      title,
      content,
    },
  });

  return res.status(201).json({ data: post });
});

export default router;
