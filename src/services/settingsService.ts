import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  notification_preferences: Record<string, boolean>;
  privacy_preferences: Record<string, boolean>;
  teaching_preferences: Record<string, string | boolean>;
  payment_preferences: Record<string, string>;
  language: string;
  time_zone: string;
}

export const defaultUserSettings: UserSettings = {
  notification_preferences: {},
  privacy_preferences: {},
  teaching_preferences: {},
  payment_preferences: {},
  language: "english",
  time_zone: "UTC",
};

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const { data, error } = await supabase
    .from("user_settings")
    .select("notification_preferences, privacy_preferences, teaching_preferences, payment_preferences, language, time_zone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? { ...defaultUserSettings, ...data } : defaultUserSettings;
};

export const saveUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> => {
  const { error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) throw error;
};
