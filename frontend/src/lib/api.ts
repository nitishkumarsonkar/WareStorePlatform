const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('warestore_token');
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('warestore_token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('warestore_token');
      localStorage.removeItem('warestore_user');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // --- Auth & OTP ---
  async sendOtp(identifier: string, type: 'phone' | 'email', role: 'builder' | 'vendor') {
    return this.request<{
      success: boolean;
      message: string;
      expiresInSeconds: number;
      devOtp?: string;
    }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, type, role }),
    });
  }

  async verifyOtp(identifier: string, otp: string, type: 'phone' | 'email', role: 'builder' | 'vendor') {
    const res = await this.request<{
      token: string;
      refreshToken: string;
      user: any;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, type, role }),
    });

    if (res.token) {
      this.setToken(res.token);
      localStorage.setItem('warestore_user', JSON.stringify(res.user));
    }
    return res;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // --- KYC ---
  async submitBuilderKyc(payload: {
    firstName: string;
    lastName: string;
    email?: string;
    addressText: string;
    latitude: number;
    longitude: number;
    idProofUrl?: string;
    idProofType?: string;
  }) {
    return this.request<{ success: boolean; message: string; profile: any }>('/kyc/builder', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async submitVendorKyc(payload: {
    businessName: string;
    yearEstablished: number;
    panNumber: string;
    gstNumber: string;
    addressText: string;
    latitude: number;
    longitude: number;
    catalogCategories: string[];
    idProofUrl?: string;
    gstCertUrl?: string;
  }) {
    return this.request<{ success: boolean; message: string; profile: any }>('/kyc/vendor', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Builder Projects ---
  async createProject(payload: any) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProjects(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/projects${query}`);
  }

  async getProjectDetails(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async getProjectLeaderboard(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/bids`);
  }

  async updateProjectStatus(id: string, status: 'closed' | 'cancelled') {
    return this.request<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async acceptBid(bidId: string) {
    return this.request<{ success: boolean; message: string }>(`/bids/${bidId}/accept`, {
      method: 'POST',
    });
  }

  // --- Vendor Marketplace ---
  async getMarketplaceFeed(params: {
    distance_km?: number;
    category?: string;
    sub_item?: string;
    search?: string;
    sort_by?: string;
  }) {
    const sp = new URLSearchParams();
    if (params.distance_km !== undefined) sp.append('distance_km', params.distance_km.toString());
    if (params.category) sp.append('category', params.category);
    if (params.sub_item) sp.append('sub_item', params.sub_item);
    if (params.search) sp.append('search', params.search);
    if (params.sort_by) sp.append('sort_by', params.sort_by);

    return this.request<any[]>(`/marketplace/feed?${sp.toString()}`);
  }

  async submitBid(payload: {
    projectId: string;
    baseUnitPrice: number;
    transportFee?: number;
    taxRatePercent?: number;
    deliveryTimelineDays?: number;
    remarks?: string;
  }) {
    return this.request<any>('/bids', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getVendorHistory(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/vendor/history${query}`);
  }

  // --- Bid Completion ---
  async completeBid(bidId: string) {
    return this.request<{ success: boolean; message: string }>(`/bids/${bidId}/complete`, {
      method: 'POST',
    });
  }

  // --- Ratings & Reviews ---
  async submitRating(payload: { bidId: string; score: number; review?: string }) {
    return this.request<any>('/ratings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getRatingsForBid(bidId: string) {
    return this.request<any[]>(`/ratings/bid/${bidId}`);
  }

  async getRatingsForUser(userId: string) {
    return this.request<any[]>(`/ratings/user/${userId}`);
  }

  async checkRatingStatus(bidId: string) {
    return this.request<{ hasRated: boolean }>(`/ratings/bid/${bidId}/status`);
  }

  // --- Upload ---
  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('document', file);

    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Document upload failed.');
    }
    return data;
  }
}

export const api = new ApiClient();
