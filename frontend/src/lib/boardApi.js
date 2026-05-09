import { apiClient } from './apiClient';
export const boardApi = {
    list: () => apiClient.get('/boards').then((r) => r.data.boards),
    create: (data) => apiClient.post('/boards', data).then((r) => r.data.board),
    get: (id) => apiClient.get(`/boards/${id}`).then((r) => r.data.board),
    update: (id, data) => apiClient.patch(`/boards/${id}`, data).then((r) => r.data.board),
    delete: (id) => apiClient.delete(`/boards/${id}`),
    inviteMember: (boardId, data) => apiClient
        .post(`/boards/${boardId}/members`, data)
        .then((r) => r.data.member),
    updateMemberRole: (boardId, userId, role) => apiClient
        .patch(`/boards/${boardId}/members/${userId}`, { role })
        .then((r) => r.data.member),
    removeMember: (boardId, userId) => apiClient.delete(`/boards/${boardId}/members/${userId}`),
};
