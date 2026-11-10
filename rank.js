// netlify/functions/rank.js
// Upgraded Groq AI Resume Ranking Function with Batch JSON Support + Automatic Model Fallback

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { job, combinedResumes } = JSON.parse(event.body || "{}");
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Server GROQ_API_KEY environment variable is not configured in Netlify!" })
      };
    }

    if (!job || !combinedResumes) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Both job description and candidate resumes are required." })
      };
    }

    const systemPrompt = `You are an expert Technical Recruiter and HR Hiring Manager.
Evaluate each uploaded candidate resume against the provided Job Requirements.
Return ONLY valid JSON matching this exact structure (no markdown code fences):
{
  "candidates": [
    {
      "fileName": "exact file name from input",
      "score": 88,
      "status": "Eligible",
      "matchedSkills": ["React", "TypeScript", "Node.js"],
      "missingSkills": ["AWS", "Docker"],
      "summary": "1-2 concise sentences explaining candidate experience and fit."
    }
  ]
}`;

    const userPrompt = `Job Requirements:\n${job}\n\nCandidate Resumes:\n${combinedResumes}`;

    // Try primary Groq model first, fallback to llama-3.3-70b-versatile if needed
    const modelsToTry = ["openai/gpt-oss-20b", "llama-3.3-70b-versatile"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: modelName,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });

      const data = await response.json();

      if (response.ok && data?.choices?.[0]?.message?.content) {
        let parsed = null;
        try {
          parsed = JSON.parse(data.choices[0].message.content);
        } catch (e) {
          parsed = null;
        }

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed && Array.isArray(parsed.candidates) ? parsed : data)
        };
      }
      lastError = data?.error?.message || "Groq API error";
    }

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: lastError })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};