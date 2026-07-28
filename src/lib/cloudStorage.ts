import type { AppData } from "../types";
import { supabase } from "./supabase";

const TABLE_NAME = "user_app_data";

interface UserAppDataRow {
  data: AppData;
  updated_at: string;
}

export interface CloudAppData {
  data: AppData;
  updatedAt: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

export async function loadCloudData(userId: string): Promise<CloudAppData | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle<UserAppDataRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    data: data.data,
    updatedAt: data.updated_at,
  };
}

export async function saveCloudData(userId: string, appData: AppData): Promise<string> {
  const client = requireSupabase();
  const updatedAt = new Date().toISOString();
  const { error } = await client.from(TABLE_NAME).upsert({
    user_id: userId,
    data: appData,
    updated_at: updatedAt,
  });

  if (error) throw error;
  return updatedAt;
}
