import { NextResponse } from "next/server";

// Add backup models in case of rate limiting
const MODELS = [
  "prompthero/openjourney-v4",
  "stabilityai/stable-diffusion-2",
  "runwayml/stable-diffusion-v1-5"
];

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const token = process.env.HUGGINGFACE_API_KEY;
    console.log('Token starts with:', token?.substring(0, 4));

    // Try each model until one works
    let success = false;
    let images: string[] = [];
    let lastError = '';

    for (const model of MODELS) {
      if (success) break;

      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: prompt,
              options: {
                wait_for_model: true,
                num_images: 4  // Generate multiple images
              }
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error with model ${model}:`, errorText);
          lastError = errorText;
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        images.push(imageUrl);
        success = true;

      } catch (modelError) {
        console.error(`Error with model ${model}:`, modelError);
        lastError = modelError instanceof Error ? modelError.message : 'Unknown error';
        continue;
      }
    }

    if (!success) {
      throw new Error(`All models failed. Last error: ${lastError}`);
    }

    return NextResponse.json({ output: images });
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate image', 
        details: error instanceof Error ? error.message : 'Unknown error',
        tokenPresent: !!process.env.HUGGINGFACE_API_KEY
      },
      { status: 500 }
    );
  }
} 