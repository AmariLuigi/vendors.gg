const API_BASE_URL = '/api';

// Items API (legacy - keeping for backward compatibility)
export const itemsAPI = {
  getAll: () => fetch(`${API_BASE_URL}/listings`).then(res => res.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/listings/${id}`).then(res => res.json()),
  create: (data: any) => fetch(`${API_BASE_URL}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  update: (id: string, data: any) => fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  delete: (id: string) => fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
};

// Listings API
export const listingsAPI = {
  getAll: () => fetch(`${API_BASE_URL}/listings`).then(res => res.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/listings/${id}`).then(res => res.json()),
  create: (data: any) => fetch(`${API_BASE_URL}/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  update: (id: string, data: any) => fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  delete: (id: string) => fetch(`${API_BASE_URL}/listings/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
  uploadImages: (id: string, formData: FormData) => fetch(`${API_BASE_URL}/listings/${id}/images`, {
    method: 'POST',
    body: formData
  }).then(res => res.json()),
};

// Conversations API
export const conversationsAPI = {
  getAll: () => fetch(`${API_BASE_URL}/conversations`).then(res => res.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/conversations/${id}`).then(res => res.json()),
  create: (data: {
    sellerId: string;
    listingId?: string;
    orderId?: string;
    initialMessage?: string;
  }) => fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  updateStatus: (id: string, status: string) => fetch(`${API_BASE_URL}/conversations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(res => res.json()),
  archive: (id: string) => fetch(`${API_BASE_URL}/conversations/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
};

// Messages API
export const messagesAPI = {
  getByConversation: (conversationId: string, page = 1, limit = 50) => 
    fetch(`${API_BASE_URL}/messages?conversationId=${conversationId}&page=${page}&limit=${limit}`)
      .then(res => res.json()),
  send: (data: {
    conversationId: string;
    content: string;
    messageType?: string;
    attachments?: string[];
  }) => fetch(`${API_BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  update: (id: string, content: string) => fetch(`${API_BASE_URL}/messages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  }).then(res => res.json()),
  delete: (id: string) => fetch(`${API_BASE_URL}/messages/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
  markAsRead: (id: string) => fetch(`${API_BASE_URL}/messages/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  }).then(res => res.json()),
};

// Games API
export const gamesAPI = {
  getAll: () => fetch(`${API_BASE_URL}/games`).then(res => res.json()),
  getById: (id: string) => fetch(`${API_BASE_URL}/games/${id}`).then(res => res.json()),
};

// Categories API
export const categoriesAPI = {
  getAll: () => fetch(`${API_BASE_URL}/categories`).then(res => res.json()),
  getByGame: (gameId: string) => fetch(`${API_BASE_URL}/categories?gameId=${gameId}`).then(res => res.json()),
};

// Servers API
export const serversAPI = {
  getAll: () => fetch(`${API_BASE_URL}/servers`).then(res => res.json()),
  getByGame: (gameId: string) => fetch(`${API_BASE_URL}/servers?gameId=${gameId}`).then(res => res.json()),
};

// Leagues API
export const leaguesAPI = {
  getAll: () => fetch(`${API_BASE_URL}/leagues`).then(res => res.json()),
  getByGame: (gameId: string) => fetch(`${API_BASE_URL}/leagues?gameId=${gameId}`).then(res => res.json()),
};