export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, system } = body;

    const aiCtoMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : msg.content?.map((c: any) => c.text || "").join("") || "",
    }));

    const response = await fetch("http://localhost:8081/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: aiCtoMessages,
        system,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(error, { status: response.status });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "text", text: content })}\n\n`));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch {
          // Stream error
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
