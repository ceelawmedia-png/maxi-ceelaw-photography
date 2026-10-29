export default async (request) => {
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    let reference;

    if (request.method === "GET") {
      reference = new URL(request.url).searchParams.get("reference");
    } else {
      const data = await request.json();
      reference = data.reference;
    }

    if (!reference) {
      return new Response(JSON.stringify({ error: "Payment reference is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const secretKey = Netlify.env.get("PAYSTACK_SECRET_KEY");

    if (!secretKey) {
      throw new Error("Paystack secret key is not configured");
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || "Could not verify payment");
    }

    return new Response(JSON.stringify({
      verified: result.data.status === "success",
      status: result.data.status,
      reference: result.data.reference,
      amount: result.data.amount,
      currency: result.data.currency
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message || "Payment verification failed"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
