import { apiClient } from './apiClient';

export type ItemType = 'TASK' | 'MEETING' | 'REMINDER' | 'DEADLINE' | 'EVENT';
export type ItemStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type ItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ItemUser {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Item {
  id: number;
  boardId: number;
  type: ItemType;
  title: string;
  description?: string;
  status: ItemStatus;
  priority: ItemPriority;
  startDate?: string;
  endDate?: string;
  assigneeId?: number;
  assignee?: ItemUser;
  createdById: number;
  createdBy: ItemUser;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemData {
  type: ItemType;
  title: string;
  description?: string;
  status?: ItemStatus;
  priority?: ItemPriority;
  startDate?: string | null;
  endDate?: string | null;
  assigneeId?: number | null;
}

export interface UpdateItemData {
  type?: ItemType;
  title?: string;
  description?: string | null;
  status?: ItemStatus;
  priority?: ItemPriority;
  startDate?: string | null;
  endDate?: string | null;
  assigneeId?: number | null;
}

export interface ListItemsParams {
  type?: ItemType;
  status?: ItemStatus;
  assigneeId?: number;
}

export const itemApi = {
  list: (boardId: number, params?: ListItemsParams) =>
    apiClient
      .get<{ items: Item[] }>(`/boards/${boardId}/items`, { params })
      .then((r) => r.data.items),

  create: (boardId: number, data: CreateItemData) =>
    apiClient
      .post<{ item: Item }>(`/boards/${boardId}/items`, data)
      .then((r) => r.data.item),

  get: (boardId: number, itemId: number) =>
    apiClient
      .get<{ item: Item }>(`/boards/${boardId}/items/${itemId}`)
      .then((r) => r.data.item),

  update: (boardId: number, itemId: number, data: UpdateItemData) =>
    apiClient
      .patch<{ item: Item }>(`/boards/${boardId}/items/${itemId}`, data)
      .then((r) => r.data.item),

  delete: (boardId: number, itemId: number) =>
    apiClient.delete(`/boards/${boardId}/items/${itemId}`),
};
