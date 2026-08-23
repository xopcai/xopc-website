import {
  resolveRuntimeDownloadDescriptor,
  runtimeDownloadErrorResponse,
} from "@/lib/runtime-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicRequestOrigin(request: Request): string {
  const internalUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
  const host = request.headers.get("host")?.trim() || forwardedHost || internalUrl.host;
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
  const protocol = forwardedProto === "http" || forwardedProto === "https"
    ? forwardedProto
    : internalUrl.protocol.replace(/:$/, "");

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return internalUrl.origin;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const descriptor = await resolveRuntimeDownloadDescriptor(
      publicRequestOrigin(request),
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
