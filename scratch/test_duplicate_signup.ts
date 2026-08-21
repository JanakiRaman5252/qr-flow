async function testDuplicate() {
  const email = 'tbcjanakiraman@gmail.com'
  console.log('Posting duplicate signup for:', email)
  
  const res = await fetch('http://localhost:3000/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test',
      email: email,
      password: 'Password123!',
    }),
  })

  console.log('Response Status:', res.status, res.statusText)
  const text = await res.text()
  console.log('Response Body:', text)
}

testDuplicate()
