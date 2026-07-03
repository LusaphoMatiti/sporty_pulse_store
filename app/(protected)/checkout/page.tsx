"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

type PayFastFields = Record<string, string>;

const CheckoutPage = () => {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const orderId = searchParams.get("orderId");
  const cartId = searchParams.get("cartId");

  const [actionUrl, setActionUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<PayFastFields | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: ask our backend for a signed set of PayFast fields.
  useEffect(() => {
    if (!orderId || !cartId) {
      setError("Missing order details. Please return to your cart.");
      return;
    }

    const initiatePayment = async () => {
      try {
        const response = await axios.post("/api/payment", {
          orderId,
          cartId,
        });
        setActionUrl(response.data.actionUrl);
        setFields(response.data.fields);
      } catch (err) {
        console.error(err);
        setError("Could not start checkout. Please try again.");
      }
    };

    initiatePayment();
  }, [orderId, cartId]);

  // Step 2: once we have the signed fields, auto-submit a hidden form
  // to redirect the customer to PayFast's hosted payment page.
  // (PayFast is a redirect flow, not an embeddable widget like Stripe was.)
  useEffect(() => {
    if (actionUrl && fields && formRef.current) {
      formRef.current.submit();
    }
  }, [actionUrl, fields]);

  if (error) {
    return (
      <div id="checkout" className="py-16 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div id="checkout" className="py-16 text-center">
      <p>Redirecting you to secure payment...</p>

      {actionUrl && fields && (
        <form ref={formRef} action={actionUrl} method="POST" className="hidden">
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
};

export default CheckoutPage;
