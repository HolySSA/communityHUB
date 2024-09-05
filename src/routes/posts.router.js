import express from 'express';
import { prisma } from '../utils/prisma/index.js'
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

/** 게시글 목록 조회 API **/
router.get('/posts', async (req, res, next) => {
  // 목록이므로 데이터 여러개 find -> findMany
  const posts = await prisma.posts.findMany({
    select: {
      // select는 true로 표현
      postId: true,
      userId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc', // 게시글을 최신순으로 정렬.
    },
  });

  return res.status(200).json({ data: posts });
});

/** 게시글 상세 조회 API **/
router.get('/posts/:postId', async (req, res, next) => {
  // postId 가져오기
  const { postId } = req.params;
  // 상세 조회는 한 개의 데이터 -> findFirst
  const post = await prisma.posts.findFirst({
    where: {
      postId: +postId,
    },
    select: {
      postId: true,
      userId: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: post });
});

export default router;
