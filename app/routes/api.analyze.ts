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

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return json(
      { error: "OPENROUTER_API_KEY environment variable is not configured" },
      { status: 500 }
    );
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
  const baseUrl = process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1";

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

  try {
    const openRouterResp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that always responds with valid JSON only. Never include markdown formatting or code blocks in your responses.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const rawText = await openRouterResp.text();
    if (!openRouterResp.ok) {
      return json(
        { error: `OpenRouter API error ${openRouterResp.status} ${openRouterResp.statusText}`, details: rawText },
        { status: 502 }
      );
    }

    const parsedOuter = safeJsonParse<any>(rawText);
    if (!parsedOuter.ok) {
      const details = "error" in parsedOuter ? parsedOuter.error : "Unknown parse error";
      return json(
        { error: "Failed to parse OpenRouter API response", details, raw: rawText },
        { status: 502 }
      );
    }

    const content = parsedOuter.value?.choices?.[0]?.message?.content;
    if (!content) {
      return json(
        { error: "OpenRouter API response missing choices[0].message.content", raw: parsedOuter.value },
        { status: 502 }
      );
    }

    // Try parsing the content directly as JSON
    const direct = safeJsonParse<Feedback>(content.trim());
    if (direct.ok) return json(direct.value);
    const directError = "error" in direct ? direct.error : "Invalid JSON";

    // Try extracting JSON from the content
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
  } catch (error) {
    return json(
      {
        error: "Failed to call OpenRouter API",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
