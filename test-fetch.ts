import fetch from "node-fetch";

async function testApi() {
    const res = await fetch('http://localhost:3000/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            expense: {
                user: "Sophie",
                amount: 10,
                description: "Backend local test fetch",
                category: "Divers"
            }
        })
    });
    console.log(res.status);
    console.log(await res.text());
}
testApi();
