import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Include credentials for CORS
});

// Log API URL in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 API Base URL:", API_URL);
}

// Request interceptor để thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === "development") {
      console.log("✅ API Success:", response.config?.url, response.status);
    }
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.code === "ECONNABORTED" || error.message === "Network Error" || !error.response) {
      console.error("❌ Network error - Server might be down:", error.message);
      console.error("💡 Check if server is running on:", API_URL);
      // Don't redirect on network errors for public endpoints
      if (error.config?.url?.includes("/dictionary") || error.config?.url?.includes("/exercises")) {
        // These are public endpoints, don't redirect
        return Promise.reject({
          ...error,
          isNetworkError: true,
          message: "Không thể kết nối tới server. Vui lòng kiểm tra server có đang chạy không.",
        });
      }
    }

    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ - chỉ redirect nếu không phải public endpoint
      const isPublicEndpoint = error.config?.url?.includes("/dictionary") ||
        error.config?.url?.includes("/exercises") ||
        error.config?.url?.includes("/health");

      if (!isPublicEndpoint) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login page nếu đang ở client-side
        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }
      }
    }

    // Log error for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("❌ API Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        code: error.code,
      });
    }

    return Promise.reject(error);
  }
);

// API Service wrapper for easier usage
export const apiService = {
  dictionary: {
    searchWords: async (params: { word: string }) => {
      return api.get("/dictionary", { params });
    },
    getWordById: async (id: string) => {
      return api.get(`/dictionary/word/${id}`);
    },
    getCategories: async () => {
      return api.get("/dictionary/categories");
    },
    getWordsByCategory: async (category: string) => {
      return api.get(`/dictionary/category/${category}`);
    },
  },
  exercises: {
    getRandom: async () => {
      return api.get("/exercises/random");
    },
    getAll: async () => {
      return api.get("/exercises");
    },
    getById: async (id: string) => {
      return api.get(`/exercises/${id}`);
    },
  },
  games: {
    saveSession: async (data: {
      gameMode: string;
      difficulty?: string;
      score?: number;
      correctAnswers?: number;
      wrongAnswers?: number;
      totalQuestions?: number;
      timeSpent?: number;
      exercises?: string[];
      answers?: any[];
    }) => {
      return api.post("/games/sessions", data);
    },
    startSession: async (data: {
      gameMode: string;
      difficulty?: string;
    }) => {
      return api.post("/games/start", data);
    },
    getHistory: async (params?: {
      page?: number;
      limit?: number;
      gameMode?: string;
      difficulty?: string;
    }) => {
      return api.get("/profile/game-history", { params });
    },
  },
  admin: {
    loginAdmin: async (data: { email: string; password: string }) => {
      return api.post("/admin/login", data);
    },
    getAllUsers: async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      isActive?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      return api.get("/admin/users", { params });
    },
    getUserById: async (id: string) => {
      return api.get(`/admin/users/${id}`);
    },
    getUserActivities: async (
      id: string,
      params?: {
        page?: number;
        limit?: number;
        action?: string;
      }
    ) => {
      return api.get(`/admin/users/${id}/activities`, { params });
    },
    deleteUser: async (id: string) => {
      return api.delete(`/admin/users/${id}`);
    },
    getSystemStats: async () => {
      return api.get("/admin/stats");
    },
    getMe: async () => {
      return api.get("/admin/me");
    },
  },
  profile: {
    getProfile: async () => {
      return api.get("/profile");
    },
    getStats: async (params?: { period?: string }) => {
      return api.get("/profile/stats", { params });
    },
    getAchievements: async () => {
      return api.get("/profile/achievements");
    },
  },
  leaderboard: {
    getLeaderboard: async (params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
    }) => {
      return api.get("/leaderboard", { params });
    },
    getUserRank: async () => {
      return api.get("/leaderboard/rank");
    },
  },
  translations: {
    create: async (data: {
      inputText: string;
      outputSign: string;
      direction: "text-to-sign" | "sign-to-text";
    }) => {
      return api.post("/translations", data);
    },
    getUserTranslations: async () => {
      return api.get("/translations");
    },
    delete: async (id: string) => {
      return api.delete(`/translations/${id}`);
    },
    translate: async (data: {
      text: string;
      text_language?: "english" | "urdu" | "hindi";
      sign_language?: string;
      output_format?: "video" | "landmarks";
    }) => {
      return api.post("/translations/translate", data);
    },
    signToText: async (data: {
      landmarks: number[][][] | number[][][][]; // Single sign or sequence
      sign_language?: string;
      videoUrl?: string;
      mode?: "single" | "sequence";
    }) => {
      return api.post("/translations/sign-to-text", data);
    },
  },
  auth: {
    updateProfile: async (data: { name?: string; email?: string }) => {
      return api.put("/users/profile", data);
    },
    changePassword: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return api.put("/users/password", data);
    },
    getMe: async () => {
      return api.get("/users/me");
    },

    googleLogin: async (data: {
      email: string;
      name: string;
      googleId: string;
      avatar?: string
    }) => {
      return api.post("/users/google-login", data);
    },
    uploadAvatar: async (formData: FormData) => {
      return api.post("/users/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  },
};

export default api;