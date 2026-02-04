function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

type AnalyzeRequestBody = {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
};

function safeJsonParse<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true as const, value: JSON.parse(text) as T };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

export async function action({ request }: { request: Request }) {
  if (request.method.toUpperCase() !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: AnalyzeRequestBody;
  try {
    body = (await request.json()) as AnalyzeRequestBody;
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { resumeText, jobTitle, jobDescription } = body ?? {};
  if (!resumeText || !jobTitle || !jobDescription) {
    return json({ error: "Missing resumeText/jobTitle/jobDescription" }, { status: 400 });
  }

  const host = process.env.OLLAMA_HOST?.trim() || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL?.trim() || "lfm2.5-thinking:latest";

  const prompt = `You are an expert in ATS (Applicant Tracking System) and resume analysis.
Please analyze and rate this resume and suggest how to improve it.
Be thorough and detailed. If there is a lot to improve, don't hesitate to give low scores.
Use the job title and job description to tailor the feedback.

Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with this shape:
{
  "overallScore": number,
  "ATS": { "score": number, "tips": { "type": "good" | "improve", "tip": string }[] },
  "toneAndStyle": { "score": number, "tips": { "type": "good" | "improve", "tip": string, "explanation": string }[] },
  "content": { "score": number, "tips": { "type": "good" | "improve", "tip": string, "explanation": string }[] },
  "structure": { "score": number, "tips": { "type": "good" | "improve", "tip": string, "explanation": string }[] },
  "skills": { "score": number, "tips": { "type": "good" | "improve", "tip": string, "explanation": string }[] }
}

Job title: ${jobTitle}
Job description: ${jobDescription}

Resume:
${resumeText}`;

  const ollamaResp = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: "Return JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const rawText = await ollamaResp.text();
  if (!ollamaResp.ok) {
    return json(
      { error: `Ollama error ${ollamaResp.status} ${ollamaResp.statusText}`, details: rawText },
      { status: 502 }
    );
  }

  // Ollama returns JSON; message content is a string with JSON.
  const parsedOuter = safeJsonParse<any>(rawText);
  if (!parsedOuter.ok) {
    const details = "error" in parsedOuter ? parsedOuter.error : "Unknown parse error";
    return json(
      { error: "Failed to parse Ollama response", details, raw: rawText },
      { status: 502 }
    );
  }

  const content: string | undefined = parsedOuter.value?.message?.content;
  if (!content) {
    return json({ error: "Ollama response missing message.content", raw: parsedOuter.value }, { status: 502 });
  }

  const direct = safeJsonParse<Feedback>(content.trim());
  if (direct.ok) return json(direct.value);
  const directError = "error" in direct ? direct.error : "Invalid JSON";

  const extracted = extractFirstJsonObject(content);
  if (extracted) {
    const extractedParsed = safeJsonParse<Feedback>(extracted);
    if (extractedParsed.ok) return json(extractedParsed.value);
  }

  return json(
    {
      error: "Model did not return valid JSON",
      details: directError,
      contentPreview: content.slice(0, 1000),
    },
    { status: 502 }
  );
}

