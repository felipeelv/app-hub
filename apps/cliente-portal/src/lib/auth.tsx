import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useListProfiles } from "@workspace/api-client-react";

export interface Profile {
  id: string;
  name: string;
  role: "admin" | "requester" | "provider";
  companyId: string;
  companyName: string;
}

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
      // Se não tiver perfil ativo, procura por um perfil requester
      const requesterProfile = profiles.find(p => p.role === "requester");
      if (requesterProfile) {
        setActiveProfileId(requesterProfile.id);
      } else {
        setActiveProfileId(profiles[0].id);
      }
    }
  }, [profiles, isLoading, activeProfileId]);

  // Verifica se o perfil ativo é requester, senão retorna null
  const activeProfileRaw = profiles.find(p => p.id === activeProfileId) || null;
  const activeProfile = activeProfileRaw?.role === "requester" ? activeProfileRaw : null;

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
