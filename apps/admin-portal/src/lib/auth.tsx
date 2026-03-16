import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useListProfiles } from "@workspace/api-client-react";
import type { Profile } from "@workspace/api-client-react";

interface AuthContextType {
  adminProfile: Profile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  adminProfile: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: profiles = [], isLoading } = useListProfiles();
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isLoading) {
      // Procura o perfil admin na lista
      const admin = profiles.find(p => p.role === "admin");
      if (admin) {
        setAdminProfile(admin);
        localStorage.setItem("activeProfileId", admin.id);
      } else {
        // Se não tiver admin, usa o primeiro perfil (para desenvolvimento)
        if (profiles.length > 0) {
          setAdminProfile(profiles[0]);
          localStorage.setItem("activeProfileId", profiles[0].id);
        }
      }
    }
  }, [profiles, isLoading]);

  return (
    <AuthContext.Provider value={{ adminProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Intercept fetch globally to inject x-profile-id for all API requests
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const profileId = localStorage.getItem("activeProfileId");
  if (profileId && typeof input === "string" && input.startsWith("/api")) {
    const headers = new Headers(init?.headers);
    headers.set("x-profile-id", profileId);
    return originalFetch(input, { ...init, headers });
  }
  return originalFetch(input, init);
};
