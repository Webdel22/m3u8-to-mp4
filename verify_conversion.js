
async function verify() {
    try {
        const res = await fetch('http://localhost:3000/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' })
        });
        const data = await res.json();
        console.log('Job ID:', data.id);

        if (!data.id) {
            console.error("Failed to get job ID", data);
            return;
        }

        // Wait 5s
        await new Promise(r => setTimeout(r, 5000));

        const statusRes = await fetch(`http://localhost:3000/api/status/${data.id}`);
        const statusData = await statusRes.json();
        console.log('Status Result:', JSON.stringify(statusData, null, 2));
    } catch (e) {
        console.error(e);
    }
}

verify();
