async function testApi() {
    try {
        const res = await fetch('http://localhost:3000/api/batch-id');
        const data = await res.json();
        console.log("API Response:", data);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testApi();
