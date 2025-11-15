// Polyfill localStorage for Zustand persist (createJSONStorage(() => localStorage))
const createMemoryStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

// Attach polyfill to global if not present
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = global;
if (!g.localStorage) {
  g.localStorage = createMemoryStorage();
}

// Mock Supabase client module used by the auth store
// IMPORTANT: Must be before imports for Jest hoisting
jest.mock("../../../src/services/database/supabase.client", () => {
  const auth = {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    signInWithIdToken: jest.fn(),
    signInWithOAuth: jest.fn(),
  };
  return {
    supabase: { auth },
  };
});

// Now import after mock is set up
import { useAuthStore } from "../../../src/store/auth.store";
import { supabase } from "../../../src/services/database/supabase.client";

describe("auth.store unit tests", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
    });

    // Clear mocks between tests
    jest.clearAllMocks();
    // Reset localStorage
    g.localStorage.clear();
  });

  describe("signIn", () => {
    it("signs in successfully with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: { name: "Test User" },
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      await useAuthStore.getState().signIn("test@example.com", "password123");

      // Expectations
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error state when credentials are invalid", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      await expect(
        useAuthStore.getState().signIn("wrong@example.com", "wrong"),
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Invalid credentials");
    });
  });

  describe("signUp", () => {
    it("signs up successfully and sets user state", async () => {
      const mockUser = {
        id: "user-456",
        email: "new@example.com",
        user_metadata: { name: "New User" },
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      await useAuthStore
        .getState()
        .signUp("new@example.com", "StrongPass!23", "New User");

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "StrongPass!23",
        options: {
          data: { name: "New User" },
        },
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        id: "user-456",
        email: "new@example.com",
        name: "New User",
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error state when sign up fails", async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Sign up error" },
      });

      await expect(
        useAuthStore.getState().signUp("bad@example.com", "weak", "Bad User"),
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Sign up error");
    });
  });

  describe("signOut", () => {
    it("clears user state on successful sign out", async () => {
      // Seed store with a user
      useAuthStore.setState({
        user: { id: "user-789", email: "user@voicefit.com", name: "User" },
        isLoading: false,
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await useAuthStore.getState().signOut();

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error state when sign out fails", async () => {
      useAuthStore.setState({
        user: { id: "user-999", email: "keep@voicefit.com", name: "Keep" },
        isLoading: false,
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: "Network error" },
      });

      await expect(useAuthStore.getState().signOut()).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        id: "user-999",
        email: "keep@voicefit.com",
        name: "Keep",
      }); // user unchanged on failure
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Network error");
    });
  });

  describe("checkSession", () => {
    it("restores user from existing supabase session", async () => {
      const supaUser = {
        id: "user-321",
        email: "restore@voicefit.com",
        user_metadata: { name: "Restore" },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: supaUser } },
        error: null,
      });

      await useAuthStore.getState().checkSession();

      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        id: "user-321",
        email: "restore@voicefit.com",
        name: "Restore",
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("clears user and sets error when session check fails", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: "Session error" },
      });

      await useAuthStore.getState().checkSession();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Session error");
    });
  });
});
