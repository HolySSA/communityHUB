import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

/** 댓글 생성 API **/

// 사용자 검증 미들웨어를 거친 후 실행
router.post('/posts/:postId/comments', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;
    const { postId } = req.params;

    const { content } = req.body;

    // 게시글 불러오기
    const post = await prisma.posts.findFirst({
      where: {
        postId: +postId,
      },
    });
    // 게시글 존재 X 시
    if (!post)
      return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });

    const comment = await prisma.comments.create({
      data: {
        userId: +userId, // 댓글 작성자 ID
        postId: +postId, // 댓글 작성 게시글 ID
        content: content, // 댓글 내용
      },
    });

    return res.status(201).json({ data: comment });
  }
);

/** 댓글 조회 API **/
router.get('/posts/:postId/comments', async (req, res, next) => {
  const { postId } = req.params;

  // 게시글 불러오기
  const post = await prisma.posts.findFirst({
    where: {
      postId: +postId,
    },
  });
  // 게시글 존재 X 시
  if (!post)
    return res.status(404).json({ message: '게시글이 존재하지 않습니다.' });

  // 댓글 목록 조회
  const comments = await prisma.comments.findMany({
    // 해당 게시글 찾는 조건
    where: {
      postId: +postId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.status(200).json({ data: comments });
});

export default router;
