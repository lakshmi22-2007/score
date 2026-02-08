import { supabase } from './supabase';
import type { Score } from '../types/score';

type ApiResponse<T = any> = {
  data?: T;
  error?: string;
};

export class ApiClient {
  // Scores API
  async getScores(): Promise<ApiResponse<Score[]>> {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('score', { ascending: false });

      if (error) return { error: error.message };
      return { data: data || [] };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to fetch scores' };
    }
  }

  async deleteScore(id: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };
      return { data: true };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete score' };
    }
  }

  async updateScore(id: string, updates: Partial<Score>): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('scores')
        .update(updates)
        .eq('id', id);

      if (error) return { error: error.message };
      return { data: true };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update score' };
    }
  }

  // Teams API
  async getTeams(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return { error: error.message };
      return { data: data || [] };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to fetch teams' };
    }
  }

  // Saved Code API
  async getAllSavedCodes(): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('saved_code')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) return { error: error.message };
      return { data: data || [] };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to fetch saved codes' };
    }
  }

  async getSavedCode(userName: string): Promise<ApiResponse> {
    try {
      const { data, error } = await supabase
        .from('saved_code')
        .select('*')
        .eq('user_name', userName)
        .single();

      if (error) return { error: error.message };
      return { data };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to fetch saved code' };
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
