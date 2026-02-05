import { supabase } from '../config/supabase.js';

export async function saveAd(adData, platform = 'meta') {
  const { data, error } = await supabase
    .from('ad_archives')
    .insert({
      platform,
      search_type: adData.searchType,
      search_query: adData.searchQuery,
      advertiser_name: adData.advertiserName,
      ad_creative_body: adData.adText,
      ad_creative_link_title: adData.linkTitle,
      ad_creative_link_description: adData.linkDescription,
      started_running_date: adData.startedRunningDate,
      media_type: adData.imageUrls?.length > 1 ? 'carousel' : 'image',
      platform_specific_data: adData.platformData || {}
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Duplicate
      console.log('⚠️  Duplicate ad, skipping...');
      return null;
    }
    throw error;
  }

  return data.id;
}

export async function saveMedia(adId, mediaData) {
  const { error } = await supabase
    .from('ad_media')
    .insert({
      ad_id: adId,
      ...mediaData
    });

  if (error) throw error;
}

export async function updateJobStatus(jobId, status, totalAds = 0) {
  const updates = { status };

  if (status === 'processing') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.total_ads_saved = totalAds;
  }

  const { error } = await supabase
    .from('scrape_jobs')
    .update(updates)
    .eq('job_id', jobId);

  if (error) console.error('Error updating job status:', error);
}

export async function createJob(jobId, searchType, searchQuery) {
  const { error } = await supabase
    .from('scrape_jobs')
    .insert({
      job_id: jobId,
      search_type: searchType,
      search_query: searchQuery,
      status: 'pending'
    });

  if (error) throw error;
}
