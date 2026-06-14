async function test() {
  // Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log("Token:", token);

  // Insert Edukasi
  const form = {
    title: 'Test Edukasi',
    type: 'Artikel',
    category: 'Pupuk',
    readTime: '5 menit',
    imageUrl: 'test',
    content: 'test content',
    link: 'http://test.com'
  };

  const insertRes = await fetch('http://localhost:5000/api/edukasi', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(form)
  });

  console.log("Status:", insertRes.status);
  const result = await insertRes.text();
  console.log("Result:", result);
}

test();
