import { useAuth } from "@/lib/auth";
import { Users, Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeProfile) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors text-left"
      >
        <div className="flex items-center space-x-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {activeProfile.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize truncate">
              {activeProfile.role} • {activeProfile.companyName}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-sidebar-foreground/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 border-b border-border/50 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground px-2">Switch Profile</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => {
                  setActiveProfileId(profile.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                  activeProfile.id === profile.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{profile.name}</p>
                  <p className="text-xs opacity-70 capitalize">{profile.role} • {profile.companyName}</p>
                </div>
                {activeProfile.id === profile.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
