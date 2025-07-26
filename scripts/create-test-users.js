/**
 * Create test users for development
 * Run this script to create test users in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need this for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
  console.error('You can find it in your Supabase project settings under API')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123456',
    username: 'admin',
    display_name: '관리자',
    role: 'admin'
  },
  {
    email: 'user1@example.com',
    password: 'user123456',
    username: 'user1',
    display_name: '일반 사용자 1',
    role: 'user'
  },
  {
    email: 'user2@example.com',
    password: 'user123456',
    username: 'user2',
    display_name: '일반 사용자 2',
    role: 'user'
  }
]

async function createTestUsers() {
  console.log('Creating test users...\n')

  for (const userData of testUsers) {
    try {
      // 1. Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true // Auto-confirm email for development
      })

      if (authError) {
        console.error(`❌ Failed to create auth user ${userData.email}:`, authError.message)
        continue
      }

      console.log(`✅ Created auth user: ${userData.email}`)

      // 2. Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          username: userData.username,
          display_name: userData.display_name,
          role: userData.role
        })

      if (profileError) {
        console.error(`❌ Failed to create profile for ${userData.email}:`, profileError.message)
        // Try to clean up the auth user
        await supabase.auth.admin.deleteUser(authUser.user.id)
        continue
      }

      console.log(`✅ Created profile: ${userData.username} (${userData.role})`)
      console.log(`   Email: ${userData.email}`)
      console.log(`   Password: ${userData.password}`)
      console.log('')

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error)
    }
  }

  console.log('\n✅ Test users creation completed!')
  console.log('\nYou can now login with:')
  console.log('- Admin: admin@example.com / admin123456')
  console.log('- User1: user1@example.com / user123456')
  console.log('- User2: user2@example.com / user123456')
}

// Run the script
createTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })