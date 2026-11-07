import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TeamPermissions {
  orders?: boolean;
  products?: boolean;
  full_access?: boolean;
}

interface AdminContextType {
  isAdmin: boolean;
  isTeamMember: boolean;
  teamPermissions: TeamPermissions | null;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [teamPermissions, setTeamPermissions] = useState<TeamPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setIsTeamMember(false);
      setTeamPermissions(null);
      setLoading(false);
      return;
    }

    checkAccess();
  }, [user, authLoading]);

  const checkAccess = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsTeamMember(false);
      setTeamPermissions(null);
      setLoading(false);
      return;
    }

    try {
      // Check admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleError && roleData) {
        setIsAdmin(true);
        setIsTeamMember(false);
        setTeamPermissions(null);
        setLoading(false);
        return;
      }

      // Check team member by email
      if (user.email) {
        const { data: teamData, error: teamError } = await supabase
          .from("admin_team_members")
          .select("permissions, status")
          .eq("email", user.email.toLowerCase())
          .eq("status", "active")
          .maybeSingle();

        if (!teamError && teamData) {
          setIsAdmin(false);
          setIsTeamMember(true);
          setTeamPermissions(teamData.permissions as TeamPermissions);
          setLoading(false);
          return;
        }
      }

      setIsAdmin(false);
      setIsTeamMember(false);
      setTeamPermissions(null);
    } catch (error) {
      console.error("Error checking admin/team access:", error);
      setIsAdmin(false);
      setIsTeamMember(false);
      setTeamPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, isTeamMember, teamPermissions, loading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
