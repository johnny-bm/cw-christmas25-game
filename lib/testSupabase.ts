// Test script for Supabase connection
// Run this in your browser console to test the connection

import { supabase, isSupabaseConfigured } from './supabase';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check if configured
  console.log('1. Configuration Check:');
  console.log(`   ✓ Supabase Configured: ${isSupabaseConfigured}`);
  
  if (!isSupabaseConfigured) {
    console.log('\n❌ Supabase is not configured.');
    console.log('📝 Follow the instructions in QUICK_START.md to set up Supabase.');
    return;
  }

  if (!supabase) {
    console.log('\n❌ Supabase client is not initialized.');
    return;
  }

  // Test connection by fetching scores
  console.log('\n2. Database Connection Test:');
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('   💡 Make sure you created the "scores" table using the SQL in QUICK_START.md');
      return;
    }

    console.log('   ✓ Successfully connected to database');
    console.log(`   ✓ Found ${data?.length || 0} score(s) in database`);

    // Test insert (will actually add a test score)
    console.log('\n3. Insert Test:');
    const { data: insertData, error: insertError } = await supabase
      .from('scores')
      .insert({
        player_name: 'Test Player',
        distance: 999
      })
      .select()
      .single();

    if (insertError) {
      console.log(`   ❌ Error: ${insertError.message}`);
      console.log('   💡 Check that your RLS policies allow inserts');
      return;
    }

    console.log('   ✓ Successfully inserted test score');
    console.log(`   ✓ Score ID: ${insertData.id}`);

    console.log('\n✅ All tests passed! Supabase is working correctly.');
    console.log('🎮 Your leaderboard is now LIVE!');

  } catch (err) {
    console.log(`\n❌ Unexpected error: ${err}`);
  }
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('💡 Run testSupabaseConnection() to test your Supabase setup');
}
