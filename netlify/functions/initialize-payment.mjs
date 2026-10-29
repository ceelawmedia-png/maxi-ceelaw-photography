export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await request.json();

    const prices = {
      "Bronze Wedding Package": 350000,
      "Silver Wedding Package": 550000,
      "Golden Wedding Package": 700000,
      "Burial Coverage Package": 350000,
      "Birthday Coverage Package": 350000
    };

    const price = prices[data.package];

    if (!price) {
      return new Response(JSON.stringify({ error: "Invalid package selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!data.email || !data.name) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

   const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error("Paystack secret key is not configured");
    }

    const reference = `MAXI-${Date.now()}`;
    const amount = Math.round(price * 0.5 * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: data.email,
        amount,
        reference,
        callback_url: `${new URL(request.url).origin}/payment-success.html`,
        metadata: {
          customer_name: data.name,
          phone: data.phone || "",
          package: data.package,
          event_type: data.eventType || "",
          event_date: data.eventDate || "",
          venue: data.venue || ""
        }
      })
    });

    const result = await response.json();

    if (!response.ok || !result.status || !result.data?.authorization_url) {
      throw new Error(result.message || "Paystack could not initialize payment");
    }

    return new Response(JSON.stringify({
      authorization_url: result.data.authorization_url,
      reference: result.data.reference
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Payment initialization failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
