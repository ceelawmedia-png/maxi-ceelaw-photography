
export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const respond = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data),
  });

  if (event.httpMethod !== "GET" &&
      event.httpMethod !== "POST") {
    return respond(405, {
      error: "Method not allowed.",
    });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return respond(500, {
      error: "Payment verification is not configured.",
    });
  }

  try {
    let reference = "";

    if (event.httpMethod === "GET") {
      reference = event.queryStringParameters?.reference || "";
    } else {
      const body = JSON.parse(event.body || "{}");
      reference = body.reference || "";
    }

    if (
      typeof reference !== "string" ||
      !/^[A-Za-z0-9._=-]{1,100}$/.test(reference)
    ) {
      return respond(400, {
        error: "A valid transaction reference is required.",
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status || !result.data) {
      return respond(502, {
        error: "Unable to verify this payment. Please try again.",
      });
    }

    const transaction = result.data;

    if (transaction.status !== "success") {
      return respond(200, {
        verified: false,
        status: transaction.status,
        message: "Payment has not been confirmed as successful.",
      });
    }

    return respond(200, {
      verified: true,
      status: transaction.status,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      paid_at: transaction.paid_at,
      email: transaction.customer?.email || null,
      package: transaction.metadata?.photography_package || null,
    });
  } catch (error) {
    return respond(500, {
      error: "An error occurred while verifying payment.",
    });
  }
};
  
