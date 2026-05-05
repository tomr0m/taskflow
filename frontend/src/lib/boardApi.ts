import { apiClient } from './apiClient';

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface BoardMemberUser {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface BoardMember {
  id: number;
  userId: number;
  role: Role;
  createdAt: string;
  user: BoardMemberUser;
}

export interface Board {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  memberCount: number;
  myRole: Role;
  members?: BoardMember[];
  createdAt: string;
  updatedAt: string;
}

export const boardApi = {
  list: () => apiClient.get<{ boards: Board[] }>('/boards').then((r) => r.data.boards),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<{ board: Board }>('/boards', data).then((r) => r.data.board),

  get: (id: number) => apiClient.get<{ board: Board }>(`/boards/${id}`).then((r) => r.data.board),

  update: (id: number, data: { name?: string; description?: string }) =>
    apiClient.patch<{ board: Board }>(`/boards/${id}`, data).then((r) => r.data.board),

  delete: (id: number) => apiClient.delete(`/boards/${id}`),

  inviteMember: (boardId: number, data: { email: string; role: Exclude<Role, 'OWNER'> }) =>
    apiClient
      .post<{ member: BoardMember }>(`/boards/${boardId}/members`, data)
      .then((r) => r.data.member),

  updateMemberRole: (boardId: number, userId: number, role: Exclude<Role, 'OWNER'>) =>
    apiClient
      .patch<{ member: BoardMember }>(`/boards/${boardId}/members/${userId}`, { role })
      .then((r) => r.data.member),

  removeMember: (boardId: number, userId: number) =>
    apiClient.delete(`/boards/${boardId}/members/${userId}`),
};
