import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPPORT_EMAIL = "findcarewa@gmail.com";

interface RequestPayload {
  type: "resource_request" | "feedback";
  data: {
    id?: string;
    category?: string;
    name?: string;
    city?: string;
    details?: string;
    message?: string;
    feedback_type?: string;
    resource_name?: string;
    contact_email?: string | null;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: RequestPayload = await req.json();
    const { type, data } = body;

    let subject: string;
    let html: string;

    if (type === "resource_request") {
      subject = `New Resource Request: ${data.name || "Unknown"}`;
      html = `
        <h2>New Resource Request</h2>
        <p><strong>Resource Name:</strong> ${data.name || "Not provided"}</p>
        <p><strong>Category:</strong> ${data.category || "Not provided"}</p>
        <p><strong>City:</strong> ${data.city || "Not provided"}</p>
        <h3>Details:</h3>
        <p style="white-space: pre-wrap;">${data.details || "No details provided"}</p>
        ${data.contact_email ? `<p><strong>Contact Email:</strong> ${data.contact_email}</p>` : ""}
        <hr />
        <p style="color: #666; font-size: 12px;">Submitted via FindCare Washington</p>
      `;
    } else if (type === "feedback") {
      subject = `New Feedback: ${data.feedback_type || "General"}`;
      html = `
        <h2>New Feedback Received</h2>
        <p><strong>Type:</strong> ${data.feedback_type || "Not specified"}</p>
        ${data.resource_name ? `<p><strong>Resource:</strong> ${data.resource_name}</p>` : ""}
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${data.message || "No message provided"}</p>
        ${data.contact_email ? `<p><strong>Contact Email:</strong> ${data.contact_email}</p>` : ""}
        <hr />
        <p style="color: #666; font-size: 12px;">Submitted via FindCare Washington</p>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FindCare <onboarding@resend.dev>",
        to: [SUPPORT_EMAIL],
        subject,
        html,
        reply_to: data.contact_email || undefined,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error("Resend API error:", errText);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Send notification error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
