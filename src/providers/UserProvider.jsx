"use client"; 

import { createContext, useState, useEffect, useContext } from "react";
import { createClient } from "@/libs/supabase/client"; 
import analytics, { trackRetention } from "@/libs/utils/analytics"; 

function sanitizeValue(value) {
  return value === undefined ? null : value;
}

function extractProfileProperties(profile, user = null) {
  let p = profile || {};
  return {
    created_at: sanitizeValue(p.created_at || user?.created_at),
    has_access: !!p.has_access,
    is_paying: !!p.has_access, 
    plan_name: sanitizeValue(p.plan_name),
    subscription_status: sanitizeValue(p.subscription_status),
    is_lifetime: !!p.is_lifetime,
    is_legacy_user: !!p.is_legacy_user,
    is_partner: !!p.is_partner,
    is_super_admin: !!p.is_super_admin,
    founding_member_since: sanitizeValue(p.founding_member_since),
    current_team_id: sanitizeValue(p.current_team_id),
    onboarding_completed: !!p.onboarding_completed,
    preferred_platform: sanitizeValue(p.preferred_platform),
    ft_source: sanitizeValue(p.ft_source),
    ft_medium: sanitizeValue(p.ft_medium),
    ft_campaign: sanitizeValue(p.ft_campaign),
    ft_channel: sanitizeValue(p.ft_channel),
    ft_at: sanitizeValue(p.ft_at)
  };
}

function identifyPostHogUser(userId, profile, user) {
  let posthog = window.posthog;
  if (!posthog || typeof posthog.identify !== "function") return;
  
  let properties = extractProfileProperties(profile, user);
  if (typeof posthog.get_distinct_id === "function" && posthog.get_distinct_id() === userId) {
    if (typeof posthog.setPersonProperties === "function") {
      posthog.setPersonProperties(properties);
    }
  } else {
    posthog.identify(userId, properties);
  }
}

const UserContext = createContext({
  user: null,
  profile: null,
  loading: true,
  hasAccess: false,
  isAuthenticated: false,
  updateProfile: async () => {},
  refreshProfile: async () => {}
});

export function UserProvider({
  children,
  initialUser = null,
  initialProfile = null
}) {
  let [user, setUser] = useState(initialUser);
  let [profile, setProfile] = useState(initialProfile);
  let [loading, setLoading] = useState(false);
  let supabase = createClient();

  let fetchUserData = async () => {
    try {
      let {
        data: { user: authUser },
        error: authError
      } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setUser(authUser);
      let { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
        
      if (profileData) {
        setProfile(profileData);
        identifyPostHogUser(authUser.id, profileData, authUser);
        if (authUser.created_at) {
          trackRetention(authUser.id, authUser.created_at);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  let updateProfile = async (updates) => {
    if (!user) {
      return { error: "No user logged in" };
    }
    
    setProfile(prev => ({
      ...prev,
      ...updates
    }));
    
    try {
      let { data: updatedData, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setProfile(updatedData);
      analytics.user.profileUpdated(Object.keys(updates || {}));
      
      if (updates && updates.theme_preference) {
        analytics.user.themeChanged(updates.theme_preference);
      }
      
      if (window.posthog?.setPersonProperties) {
        window.posthog.setPersonProperties(extractProfileProperties(updatedData, user));
      }
      
      return { data: updatedData, error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfile(profile); 
      return { data: null, error: error };
    }
  };

  let refreshProfile = async () => {
    if (user) {
      try {
        let { data: refreshedProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (refreshedProfile) {
          setProfile(refreshedProfile);
        }
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
    
    let {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        let provider;
        (function trackSignIn(userId, providerName) {
          if (userId) {
            try {
              let sessionKey = `anm_signed_in:${userId}`;
              if (sessionStorage.getItem(sessionKey)) return;
              sessionStorage.setItem(sessionKey, "1");
            } catch (e) {}
            analytics.user.signedIn(providerName);
          }
        })(
          session?.user?.id,
          (provider = session?.user?.app_metadata?.provider) && provider !== "email" ? provider : "magic_link"
        );
        fetchUserData();
      } else if (event === "TOKEN_REFRESHED") {
        fetchUserData();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        try {
          for (let i = sessionStorage.length - 1; i >= 0; i--) {
            let key = sessionStorage.key(i);
            if (key && key.startsWith("anm_signed_in:")) {
              sessionStorage.removeItem(key);
            }
          }
        } catch (e) {}
        analytics.user.signedOut();
        analytics.reset();
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    
    let channel = supabase
      .channel(`user_profile_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          setProfile(payload.new);
          identifyPostHogUser(user.id, payload.new, user);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase]);

  let computedHasAccess = !loading && (profile?.has_access || false);
  let computedIsAuthenticated = !loading && !!user;

  return (
    <UserContext.Provider
      value={{
        user: user,
        profile: profile,
        loading: loading,
        hasAccess: computedHasAccess,
        isAuthenticated: computedIsAuthenticated,
        updateProfile: updateProfile,
        refreshProfile: refreshProfile
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  let context = useContext(UserContext);
  if (context === undefined) {
    throw Error("useUser must be used within a UserProvider");
  }
  return context;
}
