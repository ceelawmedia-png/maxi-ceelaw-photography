
const PACKAGES = {
  bronze: { name: "Bronze", price: 350000 },
  silver: { name: "Silver", price: 550000 },
  golden: { name: "Golden", price: 700000 },
  burial: { name: "Burial Photography", price: 350000 },
  birthday: { name: "Birthday Photography", price: 350000 },
};

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
  };

  const respond = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data),
  });

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed." });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const siteUrl =
    process.env.URL || process.env.DEPLOY_PRIME_URL;

  if (!secretKey || !siteUrl) {
    return respond(500, {
      error: "Payment configuration is incomplete.",
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const email =
      typeof body.email === "string"
        ? body.email.trim()
        : "";

    const selectedPackage =
      body.package ||
      body.packageName ||
      body.package_name;

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return respond(400, {
        error: "Please provide a valid email address.",
      });
    }

    if (typeof selectedPackage !== "string") {
      return respond(400, {
        error: "Please select a photography package.",
      });
    }

    const packageKey = selectedPackage
      .trim()
      .toLowerCase();

    const selected = PACKAGES[packageKey];

    if (!selected) {
      return respond(400, {
        error:
          "Invalid package. Custom quotes must be arranged through WhatsApp.",
      });
    }

    // Charge a 50% deposit. Paystack accepts amounts in kobo.
    const amount = Math.round(selected.price * 50);

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          currency: "NGN",
          callback_url:
            `${siteUrl.replace(/\/+$/, "")}/payment-success.html`,
          metadata: {
            photography_package: selected.name,
            full_package_price_naira: selected.price,
            deposit_percentage: 50,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      return respond(502, {
        error:
          result.message ||
          "Unable to initialize payment. Please try again.",
      });
    }

    return respond(200, {
      status: true,
      authorization_url: result.data.authorization_url,
      reference: result.data.reference,
      access_code: result.data.access_code,
    });
  } catch (error) {
    return respond(400, {
      error: "Unable to process the request. Please check your details.",
    });
  }
};
