(() => {
  const form = document.getElementById("bookingForm");
  if (!form || document.getElementById("paystackDepositButton")) return;

  const payButton = document.createElement("button");
  payButton.type = "button";
  payButton.id = "paystackDepositButton";
  payButton.className = "btn fullwidth";
  payButton.style.marginTop = "10px";
  payButton.textContent = "Pay 50% Deposit with Paystack";
  const whatsappButton = form.querySelector('button[type="submit"]');
  if (whatsappButton) whatsappButton.insertAdjacentElement("afterend", payButton);
  else form.appendChild(payButton);

  const prices = {
    "Bronze Wedding Package": 350000,
    "Silver Wedding Package": 550000,
    "Golden Wedding Package": 700000,
    "Burial Coverage Package": 350000,
    "Birthday Coverage Package": 350000
  };

  payButton.addEventListener("click", async () => {
    if (!form.reportValidity()) return;
    const packageName = document.getElementById("package")?.value || "";
    if (!prices[packageName]) {
      alert("Online payment is available for fixed-price packages only. Please use WhatsApp to request a quote for other events.");
      return;
    }
    const emailInput = document.getElementById("email");
    if (!emailInput?.value.trim()) {
      alert("Please enter your email address so Paystack can send your receipt.");
      emailInput?.focus();
      return;
    }

    payButton.disabled = true;
    const oldText = payButton.textContent;
    payButton.textContent = "Connecting to Paystack…";
    try {
      const response = await fetch("/.netlify/functions/initialize-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: packageName,
          eventType: document.getElementById("eventType")?.value || "",
          eventDate: document.getElementById("date")?.value || "",
          name: document.getElementById("name")?.value || "",
          phone: document.getElementById("phone")?.value || "",
          email: emailInput.value.trim(),
          venue: document.getElementById("venue")?.value || ""
        })
      });
      const result = await response.json();
      if (!response.ok || !result.authorization_url) throw new Error(result.error || "Could not start payment.");
      window.location.assign(result.authorization_url);
    } catch (error) {
      alert(error.message || "Could not start payment. Please try WhatsApp instead.");
      payButton.disabled = false;
      payButton.textContent = oldText;
    }
  });
})();
