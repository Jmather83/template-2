import { NextResponse } from "next/server";
import Replicate from "replicate";

// Add console log to verify API token
console.log('REPLICATE_API_TOKEN exists:', !!process.env.REPLICATE_API_TOKEN);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    try {
      const output = await replicate.run(
        "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        {
          input: {
            prompt,
            negative_prompt: "ugly, deformed, disfigured, poor quality, blurry",
            num_outputs: 1,
            num_inference_steps: 25,
            guidance_scale: 7.5,
            scheduler: "DPMSolverMultistep",
          },
        }
      );
      console.log('Replicate API response:', output);

      return NextResponse.json({ output });
    } catch (replicateError) {
      console.error('Replicate API error:', replicateError);
      return NextResponse.json(
        { error: 'Image generation failed', details: replicateError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Route handler error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
