import axios from 'axios';
import { supabase } from '../config/supabase';
import * as supabaseService from './supabaseService';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// ========================================
// 스크래핑 API (백엔드 필수)
// ========================================

export async function scrapeByKeyword(keyword, platform = 'meta') {
  const { data } = await api.post('/api/scrape/keyword', { keyword, platform });
  return data;
}

export async function scrapeByAdvertiser(advertiser, platform = 'meta') {
  const { data } = await api.post('/api/scrape/advertiser', { advertiser, platform });
  return data;
}

export async function getJobStatus(jobId) {
  const { data } = await api.get(`/api/jobs/${jobId}`);
  return data;
}

// ========================================
// 읽기 API (Supabase 직접 호출)
// ========================================

export async function getAds(filters = {}) {
  return supabaseService.getAds(filters);
}

export async function getAdById(id) {
  return supabaseService.getAdById(id);
}

export async function deleteAd(id) {
  return supabaseService.deleteAd(id);
}

export async function getJobs(limit = 10) {
  return supabaseService.getJobs(limit);
}

export async function getSearchHistory() {
  return supabaseService.getSearchHistory();
}

export async function saveSearchHistory(searchType, searchQuery, advertiserId) {
  return supabaseService.saveSearchHistory(searchType, searchQuery, advertiserId);
}

export async function getPopularSearches(limit = 20) {
  return supabaseService.getPopularSearches(limit);
}

// getStats()는 사용하지 않으므로 제거됨
