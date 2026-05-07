import { Response } from 'express';
import { BoardRequest } from '../middleware/permissions';
import { prisma } from '../lib/db';
import { getIo } from '../lib/socket';
import { CreateItemSchema, UpdateItemSchema } from '../schemas/item';
import { ItemType, ItemStatus } from '@prisma/client';
import { ZodError } from 'zod';

const itemInclude = {
  assignee: { select: { id: true, email: true, name: true, avatarUrl: true } },
  createdBy: { select: { id: true, email: true, name: true, avatarUrl: true } },
};

export const listItems = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const boardId = req.boardMember!.boardId;
    const { type, status, assigneeId } = req.query;

    const where: Record<string, unknown> = { boardId };
    if (type) where.type = type as ItemType;
    if (status) where.status = status as ItemStatus;
    if (assigneeId) where.assigneeId = parseInt(assigneeId as string);

    const items = await prisma.item.findMany({
      where,
      include: itemInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ items });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch items', code: 'FETCH_ERROR' } });
  }
};

export const createItem = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const body = CreateItemSchema.parse(req.body);
    const boardId = req.boardMember!.boardId;
    const userId = req.user!.id;

    if (body.assigneeId) {
      const member = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId: body.assigneeId } },
      });
      if (!member) {
        res.status(400).json({ error: { message: 'Assignee is not a board member', code: 'INVALID_ASSIGNEE' } });
        return;
      }
    }

    const item = await prisma.item.create({
      data: {
        boardId,
        createdById: userId,
        type: body.type,
        title: body.title,
        description: body.description ?? null,
        status: body.status,
        priority: body.priority,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        assigneeId: body.assigneeId ?? null,
      },
      include: itemInclude,
    });

    // Emit to all board members (including the creator — frontend deduplicates by ID)
    getIo().to(`board:${boardId}`).emit('item:created', { item: item as unknown as Record<string, unknown> });

    res.status(201).json({ item });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ error: { message: 'Failed to create item', code: 'CREATE_ERROR' } });
  }
};

export const getItem = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const boardId = req.boardMember!.boardId;
    const itemId = parseInt(req.params.itemId);

    const item = await prisma.item.findFirst({
      where: { id: itemId, boardId },
      include: itemInclude,
    });

    if (!item) {
      res.status(404).json({ error: { message: 'Item not found', code: 'NOT_FOUND' } });
      return;
    }

    res.json({ item });
  } catch {
    res.status(500).json({ error: { message: 'Failed to fetch item', code: 'FETCH_ERROR' } });
  }
};

export const updateItem = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const body = UpdateItemSchema.parse(req.body);
    const boardId = req.boardMember!.boardId;
    const userId = req.user!.id;
    const role = req.boardMember!.role;
    const itemId = parseInt(req.params.itemId);

    const existing = await prisma.item.findFirst({ where: { id: itemId, boardId } });
    if (!existing) {
      res.status(404).json({ error: { message: 'Item not found', code: 'NOT_FOUND' } });
      return;
    }

    if (role === 'MEMBER' && existing.createdById !== userId) {
      res.status(403).json({ error: { message: 'You can only edit items you created', code: 'FORBIDDEN' } });
      return;
    }

    if (body.assigneeId) {
      const member = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId: body.assigneeId } },
      });
      if (!member) {
        res.status(400).json({ error: { message: 'Assignee is not a board member', code: 'INVALID_ASSIGNEE' } });
        return;
      }
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...('startDate' in body && { startDate: body.startDate }),
        ...('endDate' in body && { endDate: body.endDate }),
        ...('assigneeId' in body && { assigneeId: body.assigneeId }),
      },
      include: itemInclude,
    });

    getIo().to(`board:${boardId}`).emit('item:updated', {
      item: item as unknown as Record<string, unknown>,
      actorId: userId,
    });

    res.json({ item });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ error: { message: 'Failed to update item', code: 'UPDATE_ERROR' } });
  }
};

export const deleteItem = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const boardId = req.boardMember!.boardId;
    const userId = req.user!.id;
    const role = req.boardMember!.role;
    const itemId = parseInt(req.params.itemId);

    const existing = await prisma.item.findFirst({ where: { id: itemId, boardId } });
    if (!existing) {
      res.status(404).json({ error: { message: 'Item not found', code: 'NOT_FOUND' } });
      return;
    }

    if (role === 'MEMBER' && existing.createdById !== userId) {
      res.status(403).json({ error: { message: 'You can only delete items you created', code: 'FORBIDDEN' } });
      return;
    }

    await prisma.item.delete({ where: { id: itemId } });

    getIo().to(`board:${boardId}`).emit('item:deleted', {
      id: itemId,
      title: existing.title,
      actorId: userId,
    });

    res.json({ message: 'Item deleted' });
  } catch {
    res.status(500).json({ error: { message: 'Failed to delete item', code: 'DELETE_ERROR' } });
  }
};
