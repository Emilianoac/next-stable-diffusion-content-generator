import { NextResponse } from "next/server";
import { ImageParamsSchema } from "@/lib/zodValidation"

export async function POST(req: Request) {
  const body = await req.json()

    // Validate the request body
    const validatedParams = ImageParamsSchema.safeParse(body)
    if (!validatedParams.success) {
      const errors = validatedParams.error.errors.map((error) => `Error: ${error.message}`).join(", ")
      return NextResponse.json({ message: errors, status: 400 },  
        { status: 400 }
      )
    }

  // Function to create an image using the stability AI API
  async function createImage(params: ImageParams) {
    const apiEngine = "stable-diffusion-xl-1024-v1-0"
    const apiHost = "https://api.stability.ai"
    const apiKey = process.env.STABLE_DIFFUSION_KEY
  
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    }

    const body = {
      steps: params.steps,
      width: 1024,
      height: 1024,
      seed: params.seed,
      samples: 1,
      cfg_scale: params.cfg_scale,
      text_prompts: [
        { text: params.prompt, weight: 0.5 },
        { text: params.negative_prompt ? params.negative_prompt : "ugly, deformed, poor quality, blurry, bad anatomy", weight: -1}
      ],
      style_presets: params.style_preset
    } 

    const res = await fetch(`${apiHost}/v1/generation/${apiEngine}/text-to-image`, {
      headers: headers,
      method: "POST",
      body: JSON.stringify(body)
    })

    if (res.status != 200) {
      const error = await res.json()
      // Create a custom error message when the prompt contains invalid words for stability AI
      if (error.name === "invalid_prompts") {
        return NextResponse.json({
            message: `stability.ai API considers that your prompt may be inappropriate according to 
            its guidelines. Please try again with different prompts.
            `,
            status: 400
          },
          { status: 400 }
        )
      }
      // Throw a generic error message when the request fails
      return new NextResponse("Stability AI: Internal server error. Please try again later.", { status: 500 })
    }

    const data = await res.json()

    // Check if the response contains the expected data
    if (data.artifacts[0].base64 && data.artifacts[0].seed) {
      if (data.artifacts[0].finishReason !== "CONTENT_FILTERED") {
        return data
      } else {
        return NextResponse.json({
            message: `stability.ai API considers that your prompt may be inappropriate according to 
            its guidelines. Please try again with different prompts`,
            status: 400
          },
          { status: 400 }
        )
      }
    }
  }

  const data = await createImage(body)

  return NextResponse.json({
    seed: data.artifacts[0].seed,
    base64: data.artifacts[0].base64
  })
}