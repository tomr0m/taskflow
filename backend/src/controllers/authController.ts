import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SignupSchema, LoginSchema } from '../schemas/auth.js';
import { prisma } from '../lib/db.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { generateToken } from '../lib/jwt.js';

export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = SignupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      res.status(409).json({
        error: { message: 'Email already registered', code: 'EMAIL_EXISTS' },
      });
      return;
    }

    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
      },
    });

    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' },
      });
      return;
    }

    res.status(500).json({
      error: { message: 'Signup failed', code: 'SIGNUP_ERROR' },
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      res.status(401).json({
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const passwordMatch = await comparePassword(body.password, user.password);

    if (!passwordMatch) {
      res.status(401).json({
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        error: { message: error.errors[0].message, code: 'VALIDATION_ERROR' },
      });
      return;
    }

    res.status(500).json({
      error: { message: 'Login failed', code: 'LOGIN_ERROR' },
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: { message: 'Unauthorized', code: 'NO_USER' },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: { message: 'Failed to fetch user', code: 'FETCH_USER_ERROR' },
    });
  }
};
