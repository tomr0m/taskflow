import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../lib/db.js';
import { Role } from '@prisma/client';

export interface BoardRequest extends AuthRequest {
  boardMember?: {
    role: Role;
    boardId: number;
  };
}

export const requireBoardAccess = async (
  req: BoardRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const boardId = parseInt(req.params.id);
  const userId = req.user!.id;

  if (isNaN(boardId)) {
    res.status(400).json({ error: { message: 'Invalid board ID', code: 'INVALID_ID' } });
    return;
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    res.status(404).json({ error: { message: 'Board not found', code: 'BOARD_NOT_FOUND' } });
    return;
  }

  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });

  if (!member) {
    res.status(403).json({ error: { message: 'Access denied', code: 'FORBIDDEN' } });
    return;
  }

  req.boardMember = { role: member.role, boardId };
  next();
};

const ROLE_RANK: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const requireRole = (...roles: Role[]) => {
  return (req: BoardRequest, res: Response, next: NextFunction): void => {
    const memberRole = req.boardMember?.role;
    if (!memberRole || !roles.includes(memberRole)) {
      res.status(403).json({ error: { message: 'Insufficient permissions', code: 'FORBIDDEN' } });
      return;
    }
    next();
  };
};

export const requireMinRole = (minRole: Role) => {
  return (req: BoardRequest, res: Response, next: NextFunction): void => {
    const memberRole = req.boardMember?.role;
    if (!memberRole || ROLE_RANK[memberRole] < ROLE_RANK[minRole]) {
      res.status(403).json({ error: { message: 'Insufficient permissions', code: 'FORBIDDEN' } });
      return;
    }
    next();
  };
};
