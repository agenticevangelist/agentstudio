import { NextRequest } from "next/server";
import { Composio } from "@composio/core";
import OpenAI from "openai";

type UIMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: NextRequest) {
  const { messages, userId, toolkits }: { messages: UIMessage[]; userId: string; toolkits: string[] } = await req.json();
  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    return new Response("COMPOSIO_API_KEY not configured", { status: 500 });
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return new Response("OPENAI_API_KEY not configured", { status: 500 });
  }

  const composio = new Composio({ apiKey });
  const openai = new OpenAI({ apiKey: openaiKey });

  // Normalize toolkit slugs and dedupe
  const normalizedToolkits = Array.from(
    new Set((toolkits || []).filter(Boolean).map((t) => t.toLowerCase()))
  );

  const toolsForCompletions = await composio.tools.get(userId, { toolkits: normalizedToolkits });

  // Stream assistant text to the client with a streaming-first approach that supports tool calls
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Inject a system message to always format responses in Markdown
        const systemMarkdown: UIMessage = {
          role: "system",
          content:
            ""
        };

        const baseMessages = [
          systemMarkdown,
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];

        // Helper to write text to the client
        const write = (text: string) => controller.enqueue(encoder.encode(text));

        // Phase 1: Start a streamed completion with tools enabled
        const phase1 = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: baseMessages,
          tools: toolsForCompletions as any,
          tool_choice: "auto",
          stream: true,
        });

        // Aggregate deltas
        let sawAnyContent = false;
        // toolCallsMap[index] => { id, type, function: { name, arguments } }
        const toolCallsMap = new Map<number, { id?: string; type?: string; function: { name?: string; arguments: string } }>();
        let finishReason: string | null = null;

        for await (const part of phase1) {
          const choice: any = part.choices?.[0] || {};
          const delta: any = choice.delta || {};

          // Stream text deltas immediately
          if (typeof delta.content === "string") {
            sawAnyContent = true;
            write(delta.content);
          }

          // Collect tool_call deltas if present
          const deltaToolCalls = delta.tool_calls as
            | Array<{ index: number; id?: string; type?: string; function?: { name?: string; arguments?: string } }>
            | undefined;
          if (Array.isArray(deltaToolCalls)) {
            for (const tc of deltaToolCalls) {
              const idx = tc.index;
              const current = toolCallsMap.get(idx) || { function: { arguments: "" } };
              if (tc.id) current.id = tc.id;
              if (tc.type) current.type = tc.type;
              if (tc.function) {
                if (tc.function.name) current.function.name = tc.function.name;
                if (typeof tc.function.arguments === "string") {
                  current.function.arguments += tc.function.arguments;
                }
              }
              toolCallsMap.set(idx, current);
            }
          }

          if (choice.finish_reason) {
            finishReason = choice.finish_reason;
          }
        }

        const collectedToolCalls = Array.from(toolCallsMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([_, v]) => ({ id: v.id, type: v.type || "function", function: v.function }));

        const toolsWereRequested = collectedToolCalls.length > 0 || finishReason === "tool_calls";

        if (!toolsWereRequested) {
          // No tools required. We may have streamed text already; just close.
          if (!sawAnyContent) {
            // Model might have returned empty; ensure we don't hang
            write("");
          }
          controller.close();
          return;
        }

        // Phase 2: execute tools, then start a follow-up streamed completion
        write("\n[running tools...]\n");

        const convo: any[] = baseMessages.slice();
        // Include an assistant message that requested tool calls (content can be empty when tool_calls used)
        convo.push({
          role: "assistant",
          content: "",
          tool_calls: collectedToolCalls,
        });

        for (const tc of collectedToolCalls) {
          try {
            const toolName = tc.function.name as string;
            const argsStr = tc.function.arguments || "";
            let parsedArgs: any = {};
            try {
              parsedArgs = argsStr ? JSON.parse(argsStr) : {};
            } catch {
              // If arguments were partially streamed malformed JSON, let the model recover by passing raw text
              parsedArgs = { $raw: argsStr };
            }

            write(`> ${toolName}...\n`);

            const toolResult = await composio.tools.execute(toolName, {
              userId,
              arguments: parsedArgs,
            } as any);

            convo.push({
              role: "tool",
              tool_call_id: tc.id,
              content:
                typeof toolResult === "string"
                  ? toolResult
                  : JSON.stringify(toolResult),
            });

            write(`✔ ${toolName} done\n`);
          } catch (err: any) {
            convo.push({
              role: "tool",
              tool_call_id: tc.id,
              content: `Tool execution failed: ${err?.message || String(err)}`,
            });
            write(`✖ tool failed: ${err?.message || String(err)}\n`);
          }
        }

        write("[generating response...]\n\n");

        const followUp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: convo,
          stream: true,
        });

        for await (const part of followUp) {
          const delta = (part.choices?.[0]?.delta as any) || {};
          const text: string | undefined = delta.content;
          if (text) write(text);
        }

        controller.close();
      } catch (e: any) {
        // Surface an error message to the client before closing
        try {
          controller.enqueue(encoder.encode(`\n[error] ${e?.message || String(e)}\n`));
        } catch {}
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}


