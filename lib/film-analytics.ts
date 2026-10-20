import { trackProductEvent } from "@/lib/product-events";

// A replay or pause/resume belongs to the same mounted viewing session.
// played ranges exclude skipped sections, so seeking to the end is not completion.
export function createFilmAnalytics(method: string) {
  let started = false;
  let completed = false;
  return {
    started() {
      if (started) return;
      started = true;
      trackProductEvent("film_started", { method });
    },
    ended(video: Pick<HTMLVideoElement, "duration" | "played">) {
      if (!started || completed || !Number.isFinite(video.duration) || video.duration <= 0) return;
      let watched = 0;
      for (let index = 0; index < video.played.length; index++) {
        watched += video.played.end(index) - video.played.start(index);
      }
      if (watched / video.duration < 0.9) return;
      completed = true;
      trackProductEvent("film_completed", { method });
    },
  };
}
