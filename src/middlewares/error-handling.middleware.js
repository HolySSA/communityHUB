export default function (err, req, res, next) {
  // 에러를 출력.
  console.error(err);

  // 클라이언트에게 에러 메시지를 전달.
  res.status(500).json({ errorMessage: '서버 내부에서 에러가 발생했습니다.' });
}