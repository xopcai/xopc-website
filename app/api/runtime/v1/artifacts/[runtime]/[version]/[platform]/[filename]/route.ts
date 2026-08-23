import {
  runtimeDownloadErrorResponse,
  serveRuntimeDownloadArtifact,
} from "@/lib/runtime-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    runtime: string;
    version: string;
    platform: string;
    filename: string;
  }>;
};

export async function GET(request: Request, { params }: Context) {
  try {
    const values = await params;
    return await serveRuntimeDownloadArtifact(
      request,
      values.runtime,
      values.version,
      values.platform,
      values.filename,
    );
  } catch (error) {
    return runtimeDownloadErrorResponse(error);
  }
}

export async function HEAD(request: Request, context: Context) {
  return await GET(request, context);
}
