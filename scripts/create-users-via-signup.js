/**
 * Create test users via the signup API
 * This script uses the public signup endpoint to create users
 */

const API_URL = 'http://localhost:3000'

const testUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123456',
    username: 'admin',
    display_name: '관리자'
  },
  {
    email: 'user1@example.com', 
    password: 'user123456',
    username: 'user1',
    display_name: '일반 사용자 1'
  },
  {
    email: 'user2@example.com',
    password: 'user123456',
    username: 'user2', 
    display_name: '일반 사용자 2'
  }
]

async function signupUser(userData) {
  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username,
        displayName: userData.display_name
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed')
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function createAllUsers() {
  console.log('Creating test users via signup API...\n')
  
  // Make sure the dev server is running
  try {
    const healthCheck = await fetch(API_URL)
    if (!healthCheck.ok) {
      throw new Error('Server not responding')
    }
  } catch (error) {
    console.error('❌ Error: Development server is not running at', API_URL)
    console.error('Please start the dev server with: npm run dev')
    return
  }

  for (const userData of testUsers) {
    console.log(`Creating user: ${userData.email}...`)
    const result = await signupUser(userData)
    
    if (result.success) {
      console.log(`✅ Successfully created: ${userData.email}`)
      console.log(`   Username: ${userData.username}`)
      console.log(`   Password: ${userData.password}`)
    } else {
      console.log(`❌ Failed to create ${userData.email}: ${result.error}`)
    }
    console.log('')
  }

  console.log('\n📝 Note: The first user (admin@example.com) needs to be manually')
  console.log('   promoted to admin role in Supabase dashboard or by running:')
  console.log('   UPDATE profiles SET role = \'admin\' WHERE username = \'admin\';')
}

// Run the script
createAllUsers()