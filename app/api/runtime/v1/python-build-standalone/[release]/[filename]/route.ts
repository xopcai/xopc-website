import {
  runtimeDownloadErrorResponse,
  servePythonBuildStandalone,
} from "@/lib/runtime-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ release: string; filename: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const { release, filename } = await params;
    return await servePythonBuildStandalone(request, release, filename);
  } catch (error) {
    return runtimeDownloadErrorResponse(error);
  }
}

export async function HEAD(request: Request, context: Context) {
  return await GET(request, context);
}
