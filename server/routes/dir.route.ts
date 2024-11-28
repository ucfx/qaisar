import express from 'express';
import { wrapRoute } from '@/util/wrapRouter';
import { openDir } from '@/lib/commands';
const router = express.Router();

router.post('/', wrapRoute(async (req, res) => {
  const { dir } = req.body;
  console.log('dir', dir)
  const opened = await openDir(dir);
  res.status(200).json({success: opened});
}));


export default router;