import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { words } = await req.json();
    console.log('API received words:', words);

    if (!words || !Array.isArray(words) || words.length === 0) {
      console.log('Invalid words array received:', words);
      return NextResponse.json(
        { error: 'Please provide an array of words' },
        { status: 400 }
      );
    }

    const prompt = `You are a spelling teacher. I will give you a list of words, and I want you to:
1. Analyze the words to determine the common theme, spelling pattern, or learning objective
2. Generate 10 new words that follow the same pattern or theme
3. For each word, provide a short, child-friendly hint or definition
4. Return the response in JSON format with fields: theme, words (array of objects with word and hint properties)

Here are the words to analyze: ${words.join(', ')}

Please ensure:
- Words are age-appropriate and at a similar difficulty level
- Hints are clear and helpful for children
- No duplicate words from the original list
- All words follow the identified pattern/theme
- Response must be valid JSON format only, no additional text`;

    console.log('Sending prompt to Claude:', prompt);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        temperature: 0.7,
        system: "You are a helpful spelling teacher. Always respond in valid JSON format only, with no additional text.",
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Get the response content
      const content = message.content[0].type === 'text' 
        ? message.content[0].text 
        : '';
        
      console.log('Received response from Claude:', content);
      let wordList;

      try {
        // Try parsing the entire response as JSON first
        wordList = JSON.parse(content);
        console.log('Successfully parsed response as JSON:', wordList);
      } catch (parseError) {
        console.error('Failed to parse response as JSON, trying to extract JSON:', parseError);
        // If that fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in response');
          throw new Error('No JSON found in response');
        }
        wordList = JSON.parse(jsonMatch[0]);
        console.log('Successfully extracted and parsed JSON:', wordList);
      }

      // Validate the response format
      if (!wordList.theme || !Array.isArray(wordList.words) || wordList.words.length === 0) {
        console.error('Invalid response format:', wordList);
        throw new Error('Invalid response format from AI');
      }

      return NextResponse.json(wordList);
    } catch (claudeError: any) {
      console.error('Error with Claude API:', claudeError);
      throw new Error(`Claude API error: ${claudeError.message}`);
    }
  } catch (error: any) {
    console.error('Error in generate-words API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate word list' },
      { status: 500 }
    );
  }
} 