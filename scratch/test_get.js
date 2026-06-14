async function test() {
  const getRes = await fetch('http://localhost:5000/api/edukasi');
  console.log("GET Status:", getRes.status);
  const result = await getRes.text();
  console.log("GET Result:", result);
}
test();
