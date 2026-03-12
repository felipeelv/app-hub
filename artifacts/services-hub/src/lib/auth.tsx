import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Profile, useListProfiles } from "@workspace/api-client-react";

interface AuthContextType {
  activeProfile: Profile | null;
  profiles: Profile[];
  setActiveProfileId: (id: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  activeProfile: null,
  profiles: [],
  setActiveProfileId: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: profiles = [], isLoading } = useListProfiles();
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    return localStorage.getItem("activeProfileId");
  });

  const setActiveProfileId = (id: string) => {
    localStorage.setItem("activeProfileId", id);
    setActiveProfileIdState(id);
    // Reload to refresh all queries with new header
    window.location.href = "/";
  };

  useEffect(() => {
    if (!isLoading && profiles.length > 0 && !activeProfileId) {
      setActiveProfileId(profiles[0].id);
    }
  }, [profiles, isLoading, activeProfileId]);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  return (
    <AuthContext.Provider value={{ activeProfile, profiles, setActiveProfileId, isLoading }}>
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
