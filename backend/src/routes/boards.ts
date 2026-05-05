import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireBoardAccess, requireRole, requireMinRole } from '../middleware/permissions';
import { listBoards, createBoard, getBoard, updateBoard, deleteBoard } from '../controllers/boardController';
import { inviteMember, updateMemberRole, removeMember } from '../controllers/memberController';

const router = Router();

router.use(authMiddleware);

router.get('/', listBoards);
router.post('/', createBoard);

router.get('/:id', requireBoardAccess, getBoard);
router.patch('/:id', requireBoardAccess, requireMinRole('ADMIN'), updateBoard);
router.delete('/:id', requireBoardAccess, requireRole('OWNER'), deleteBoard);

router.post('/:id/members', requireBoardAccess, requireMinRole('ADMIN'), inviteMember);
router.patch('/:id/members/:userId', requireBoardAccess, requireRole('OWNER'), updateMemberRole);
router.delete('/:id/members/:userId', requireBoardAccess, requireMinRole('ADMIN'), removeMember);

export default router;
