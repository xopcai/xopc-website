import { serveVoiceModelFile, voiceModelErrorResponse } from "@/lib/voice-model-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Context) {
  try {
    return await serveVoiceModelFile(request, (await params).path);
  } catch (error) {
    return voiceModelErrorResponse(error);
  }
}

export async function HEAD(request: Request, context: Context) {
  return GET(request, context);
}
