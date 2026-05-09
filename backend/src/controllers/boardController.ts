import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { BoardRequest } from '../middleware/permissions.js';
import { prisma } from '../lib/db.js';
import { CreateBoardSchema, UpdateBoardSchema } from '../schemas/board.js';

export const listBoards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memberships = await prisma.boardMember.findMany({
      where: { userId },
      include: {
        board: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { board: { updatedAt: 'desc' } },
    });

    const boards = memberships.map((m) => ({
      id: m.board.id,
      name: m.board.name,
      description: m.board.description,
      ownerId: m.board.ownerId,
      memberCount: m.board._count.members,
      myRole: m.role,
      createdAt: m.board.createdAt,
      updatedAt: m.board.updatedAt,
    }));

    res.json({ boards });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch boards', code: 'FETCH_ERROR' } });
  }
};

export const createBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = CreateBoardSchema.parse(req.body);
    const userId = req.user!.id;

    const board = await prisma.board.create({
      data: {
        name: body.name,
        description: body.description,
        ownerId: userId,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: { _count: { select: { members: true } } },
    });

    res.status(201).json({
      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        ownerId: board.ownerId,
        memberCount: board._count.members,
        myRole: 'OWNER',
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ error: { message: 'Failed to create board', code: 'CREATE_ERROR' } });
  }
};

export const getBoard = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const boardId = parseInt(req.params.id);
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: { include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } } },
        _count: { select: { members: true } },
      },
    });

    res.json({
      board: {
        id: board!.id,
        name: board!.name,
        description: board!.description,
        ownerId: board!.ownerId,
        memberCount: board!._count.members,
        myRole: req.boardMember!.role,
        members: board!.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          createdAt: m.createdAt,
          user: m.user,
        })),
        createdAt: board!.createdAt,
        updatedAt: board!.updatedAt,
      },
    });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch board', code: 'FETCH_ERROR' } });
  }
};

export const updateBoard = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const body = UpdateBoardSchema.parse(req.body);
    const boardId = parseInt(req.params.id);

    const board = await prisma.board.update({
      where: { id: boardId },
      data: body,
      include: { _count: { select: { members: true } } },
    });

    res.json({
      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        ownerId: board.ownerId,
        memberCount: board._count.members,
        myRole: req.boardMember!.role,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ error: { message: 'Failed to update board', code: 'UPDATE_ERROR' } });
  }
};

export const deleteBoard = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const boardId = parseInt(req.params.id);
    await prisma.board.delete({ where: { id: boardId } });
    res.json({ message: 'Board deleted' });
  } catch {
    res.status(500).json({ error: { message: 'Failed to delete board', code: 'DELETE_ERROR' } });
  }
};
