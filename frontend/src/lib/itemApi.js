import { apiClient } from './apiClient';
export const itemApi = {
    list: (boardId, params) => apiClient
        .get(`/boards/${boardId}/items`, { params })
        .then((r) => r.data.items),
    create: (boardId, data) => apiClient
        .post(`/boards/${boardId}/items`, data)
        .then((r) => r.data.item),
    get: (boardId, itemId) => apiClient
        .get(`/boards/${boardId}/items/${itemId}`)
        .then((r) => r.data.item),
    update: (boardId, itemId, data) => apiClient
        .patch(`/boards/${boardId}/items/${itemId}`, data)
        .then((r) => r.data.item),
    delete: (boardId, itemId) => apiClient.delete(`/boards/${boardId}/items/${itemId}`),
};
