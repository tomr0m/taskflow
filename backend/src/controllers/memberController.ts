import { Response } from 'express';
import { BoardRequest } from '../middleware/permissions';
import { prisma } from '../lib/db';
import { InviteMemberSchema, UpdateMemberRoleSchema } from '../schemas/board';
import { Role } from '@prisma/client';

export const inviteMember = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const body = InviteMemberSchema.parse(req.body);
    const boardId = parseInt(req.params.id);
    const callerRole = req.boardMember!.role;

    // ADMINs can only invite MEMBER/VIEWER
    if (callerRole === 'ADMIN' && body.role === 'ADMIN') {
      res.status(403).json({ error: { message: 'ADMINs can only invite MEMBER or VIEWER', code: 'FORBIDDEN' } });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (!targetUser) {
      res.status(404).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
      return;
    }

    const existing = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUser.id } },
    });
    if (existing) {
      res.status(409).json({ error: { message: 'User is already a member', code: 'ALREADY_MEMBER' } });
      return;
    }

    const member = await prisma.boardMember.create({
      data: { boardId, userId: targetUser.id, role: body.role as Role },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });

    res.status(201).json({
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: member.user,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ error: { message: 'Failed to invite member', code: 'INVITE_ERROR' } });
  }
};

export const updateMemberRole = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const body = UpdateMemberRoleSchema.parse(req.body);
    const boardId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    const target = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });

    if (!target) {
      res.status(404).json({ error: { message: 'Member not found', code: 'MEMBER_NOT_FOUND' } });
      return;
    }

    if (target.role === 'OWNER') {
      res.status(403).json({ error: { message: 'Cannot change OWNER role', code: 'FORBIDDEN' } });
      return;
    }

    const updated = await prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId: targetUserId } },
      data: { role: body.role as Role },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });

    res.json({
      member: {
        id: updated.id,
        userId: updated.userId,
        role: updated.role,
        createdAt: updated.createdAt,
        user: updated.user,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ error: { message: 'Failed to update member role', code: 'UPDATE_ERROR' } });
  }
};

export const removeMember = async (req: BoardRequest, res: Response): Promise<void> => {
  try {
    const boardId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const callerRole = req.boardMember!.role;
    const callerId = req.user!.id;

    const target = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });

    if (!target) {
      res.status(404).json({ error: { message: 'Member not found', code: 'MEMBER_NOT_FOUND' } });
      return;
    }

    if (target.role === 'OWNER') {
      res.status(403).json({ error: { message: 'Cannot remove the board owner', code: 'FORBIDDEN' } });
      return;
    }

    // ADMIN can only remove MEMBER/VIEWER (not other ADMINs)
    if (callerRole === 'ADMIN' && target.role === 'ADMIN' && callerId !== targetUserId) {
      res.status(403).json({ error: { message: 'ADMINs cannot remove other ADMINs', code: 'FORBIDDEN' } });
      return;
    }

    await prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });

    res.json({ message: 'Member removed' });
  } catch {
    res.status(500).json({ error: { message: 'Failed to remove member', code: 'REMOVE_ERROR' } });
  }
};
