import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireBoardAccess, requireRole, requireMinRole } from '../middleware/permissions.js';
import { listBoards, createBoard, getBoard, updateBoard, deleteBoard } from '../controllers/boardController.js';
import { inviteMember, updateMemberRole, removeMember } from '../controllers/memberController.js';
import { listItems, createItem, getItem, updateItem, deleteItem } from '../controllers/itemController.js';

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

router.get('/:id/items', requireBoardAccess, listItems);
router.post('/:id/items', requireBoardAccess, requireMinRole('MEMBER'), createItem);
router.get('/:id/items/:itemId', requireBoardAccess, getItem);
router.patch('/:id/items/:itemId', requireBoardAccess, requireMinRole('MEMBER'), updateItem);
router.delete('/:id/items/:itemId', requireBoardAccess, requireMinRole('MEMBER'), deleteItem);

export default router;
