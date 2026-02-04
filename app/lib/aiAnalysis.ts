export async function analyzeResume(
    resumeText: string,
    jobTitle: string,
    jobDescription: string
): Promise<Feedback> {
    try {
        const response = await fetch("/api/analyze", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resumeText, jobTitle, jobDescription }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Analyze API error: ${response.status} ${response.statusText}. ${errText}`);
        }

        return (await response.json()) as Feedback;
    } catch (error) {
        console.error('AI Analysis error:', error);
        throw error;
    }
}
