import axios from 'axios';

const AI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export const generateQuestions = async (prompt, type, count) => {
    const systemPrompt = `You are an expert educational test question generator. Generate ${count} ${type.toUpperCase()} questions about ${prompt}. 
    
    Format the response as a JSON array with the following structure for each question:
    For MCQ:
    {
      "type": "mcq",
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "correct option text",
      "points": 1
    }
    
    For Written:
    {
      "type": "written",
      "question": "question text",
      "correctAnswer": "model answer that will be used for grading",
      "points": 1
    }
    
    For Mixed, use either format as appropriate.
    IMPORTANT: Return ONLY the JSON array, no additional text or explanations.`;

    try {
        if (!AI_API_KEY) {
            throw new Error('OpenAI API key not found');
        }

        const response = await axios({
            method: 'post',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Generate ${count} ${type} questions about: ${prompt}. Make sure to format as specified JSON.`
                    }
                ],
                temperature: 0.7
            }
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from OpenAI');
        }

        const result = response.data.choices[0].message.content;

        try {
            // Try to parse the response as JSON
            const questions = JSON.parse(result);

            // Validate the questions format
            if (!Array.isArray(questions)) {
                throw new Error('Response is not an array');
            }

            // Ensure each question has the required properties
            return questions.map(q => ({
                type: q.type || type,
                question: q.question || '',
                options: q.type === 'mcq' ? (q.options || ['', '', '', '']) : [],
                correctAnswer: q.type === 'mcq' ? (q.correctAnswer || '') : (q.correctAnswer || ''),
                points: q.points || 1
            }));
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            // Fallback format if parsing fails
            return [{
                type: type,
                question: result,
                options: type === 'mcq' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : [],
                correctAnswer: type === 'mcq' ? 'Option 1' : '',
                points: 1
            }];
        }

    } catch (error) {
        console.error('AI Generation Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to generate questions');
    }
};