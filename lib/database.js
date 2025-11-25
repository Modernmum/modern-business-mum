/**
 * Database Client - Supabase Integration
 * Handles all database operations for the Zero to Legacy Engine
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * OPPORTUNITIES TABLE OPERATIONS
 */

export const createOpportunity = async (opportunityData) => {
  const { data, error } = await supabase
    .from('opportunities')
    .insert([opportunityData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOpportunities = async (filters = {}) => {
  let query = supabase.from('opportunities').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.niche) {
    query = query.eq('niche', filters.niche);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateOpportunityStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('opportunities')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOpportunityById = async (id) => {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * PRODUCTS TABLE OPERATIONS
 */

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProducts = async (filters = {}) => {
  let query = supabase.from('products').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.niche) {
    query = query.eq('niche', filters.niche);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateProductStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProductById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * LISTINGS TABLE OPERATIONS
 */

export const createListing = async (listingData) => {
  const { data, error } = await supabase
    .from('listings')
    .insert([listingData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getListings = async (filters = {}) => {
  let query = supabase.from('listings').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.platform) {
    query = query.eq('platform', filters.platform);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateListing = async (id, updates) => {
  const { data, error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * TRANSACTIONS TABLE OPERATIONS
 */

export const createTransaction = async (transactionData) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTransactions = async (filters = {}) => {
  let query = supabase.from('transactions').select('*');

  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.listing_id) {
    query = query.eq('listing_id', filters.listing_id);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order('transaction_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/**
 * SYSTEM LOGS OPERATIONS
 */

export const logAction = async (agent, action, status, details = {}) => {
  const logData = {
    agent,
    action,
    status,
    details,
  };

  const { data, error } = await supabase
    .from('system_logs')
    .insert([logData])
    .select()
    .single();

  if (error) {
    console.error('Failed to write log to database:', error);
    return null;
  }

  return data;
};

export const getSystemLogs = async (filters = {}) => {
  let query = supabase.from('system_logs').select('*');

  if (filters.agent) {
    query = query.eq('agent', filters.agent);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(100);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/**
 * ANALYTICS & STATS
 */

export const getSystemStats = async () => {
  const [opportunities, products, listings, transactions] = await Promise.all([
    supabase.from('opportunities').select('status', { count: 'exact', head: true }),
    supabase.from('products').select('status', { count: 'exact', head: true }),
    supabase.from('listings').select('status, sales, revenue', { count: 'exact' }),
    supabase.from('transactions').select('amount', { count: 'exact' }),
  ]);

  // Calculate totals
  const totalRevenue = listings.data?.reduce((sum, listing) => sum + (parseFloat(listing.revenue) || 0), 0) || 0;
  const totalSales = listings.data?.reduce((sum, listing) => sum + (listing.sales || 0), 0) || 0;

  return {
    opportunities: opportunities.count || 0,
    products: products.count || 0,
    listings: listings.count || 0,
    transactions: transactions.count || 0,
    totalRevenue: totalRevenue.toFixed(2),
    totalSales,
  };
};

/**
 * UTILITY FUNCTIONS
 */

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('system_logs').select('id').limit(1);
    if (error) throw error;
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export default {
  supabase,
  // Opportunities
  createOpportunity,
  getOpportunities,
  updateOpportunityStatus,
  getOpportunityById,
  // Products
  createProduct,
  getProducts,
  updateProductStatus,
  getProductById,
  // Listings
  createListing,
  getListings,
  updateListing,
  // Transactions
  createTransaction,
  getTransactions,
  // Logs
  logAction,
  getSystemLogs,
  // Stats
  getSystemStats,
  testConnection,
};
