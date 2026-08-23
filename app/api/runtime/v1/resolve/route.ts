import {
  resolveRuntimeDownloadDescriptor,
  runtimeDownloadErrorResponse,
} from "@/lib/runtime-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const descriptor = await resolveRuntimeDownloadDescriptor(
      url.origin,
      url.searchParams.get("runtime") ?? "",
      url.searchParams.get("version") ?? "",
      url.searchParams.get("platform") ?? "",
    );
    return Response.json(descriptor, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    return runtimeDownloadErrorResponse(error);
  }
}
