import { ExtractionResult, GroupRequest, GroupResult, PreviewMetadata } from '../types/pdf';
import { API_BASE_URL } from '@/constants';

const API_BASE = `${API_BASE_URL}/api/pdf`;

export async function extractPdf(file: File, selectedPages?: number[], clerkId?: string): Promise<ExtractionResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (selectedPages && selectedPages.length > 0) {
    formData.append('pages', JSON.stringify(selectedPages));
  }
  if (clerkId) {
    formData.append('clerkId', clerkId);
  }
  
  const response = await fetch(`${API_BASE}/extract?t=${Date.now()}`, {
    method: 'POST',
    body: formData,
  });

  
  if (!response.ok) {
    const errorText = await response.text();
    // Try to parse JSON error if possible
    try {
      const err = JSON.parse(errorText);
      throw new Error(err.detail || `Extraction failed: ${response.statusText}`);
    } catch {
      throw new Error(`Extraction failed: ${errorText}`);
    }
  }
  
  return response.json();
}

export async function groupFields(request: GroupRequest): Promise<GroupResult> {
  const response = await fetch(`${API_BASE}/group-fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Grouping failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchPreviewMetadata(file: File): Promise<PreviewMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/preview-metadata`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch preview metadata: ${response.statusText}`);
  }
  
  return response.json();
}

export interface UserProfile {
  clerk_id: string;
  email: string;
  tokens_balance: number;
  referred_by: string | null;
  referrals_count: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
  comment?: string;
}


export async function fetchUserProfile(clerkId: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/users/profile/${clerkId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return response.json();
}

export async function fetchUserTransactions(clerkId: string): Promise<{ transactions: Transaction[] }> {
  const response = await fetch(`${API_BASE_URL}/api/users/transactions/${clerkId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user transactions');
  }
  return response.json();
}

