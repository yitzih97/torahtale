import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getUpcomingParshaLive } from "../_shared/parsha.ts";
import { addDaysISO, booksPerRelease, hourET, todayET } from "../_shared/subscription.ts";

// Monday 9am-ET release. Triggered by the release-subscription-books GitHub
// Actions cron (and re-runnable safely by an admin). For each active subscription
// that has paid credit (books_remaining > 0) and is due (next_release_date <=
// today ET), mint that plan's BATCH of books - one for the weekly plan, four for
// the Parsha Series and the Year Bundle (see booksPerRelease) - then decrement
// the credit by what was minted and advance next_release_date past the weeks the
// batch covers. Idempotent: a second call the same day finds next_release_date
// already advanced and does nothing, so the twin 13:00/14:00-UTC cron firings
// can't double-release.
//
// The batch matters beyond tidiness: the Parsha Series is SOLD as "4 books a
// month in one delivery", so its four books must exist together and carry one
// shipmentBatchId, which is what lets them be printed and shipped as a single
// parcel rather than four.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-cron-secret, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  if (!CRON_SECRET) {
    console.error("CRON_SECRET not configured - refusing to run.");
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Release at 9am ET sharp. The cron fires at both 13:00 & 14:00 UTC so exactly
  // one of them lands on 9am ET whether it's EST or EDT; the earlier (8am EST in
  // winter) is refused here. ?force=1 bypasses for manual/admin runs.
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (!force && hourET() < 9) {
    return new Response(JSON.stringify({ ok: true, skipped: "before 9am ET", hourET: hourET() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = todayET();
    const { data: due, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .gt("books_remaining", 0)
      .not("next_release_date", "is", null)
      .lte("next_release_date", today)
      .limit(2000);
    if (error) throw error;

    const released: Array<{ subscriptionId: string; bookIds: string[]; shipmentBatchId: string }> = [];

    for (const sub of due || []) {
      const releaseDate: string = (sub as any).next_release_date;
      const bookConfig = ((sub as any).book_config as Record<string, unknown>) || {};

      // Never mint more than the credit actually paid for: a subscription with 2
      // books left on a 4-book plan gets 2, not a fifth week on the house.
      const batchSize = Math.max(
        1,
        Math.min(booksPerRelease((sub as any).frequency), Number((sub as any).books_remaining) || 1),
      );
      // One id shared by every book in the batch - printify-submit groups on this
      // to place ONE order for the set. Derived from the subscription + release
      // date rather than random so a partially-failed run regroups identically.
      const shipmentBatchId = `${(sub as any).id}:${releaseDate}`;
      const mintedIds: string[] = [];

      for (let i = 0; i < batchSize; i++) {
        // Each book in the batch is the parsha of ITS week, a week apart, so a
        // month's parcel holds four consecutive parshiyos.
        const bookDate = addDaysISO(releaseDate, i * 7);
        const parsha = await getUpcomingParshaLive(new Date(`${bookDate}T12:00:00Z`));
        if (!parsha) {
          console.error(`PARSHA_CALENDAR exhausted for release ${bookDate} (sub ${(sub as any).id}) - book minted with no portion; extend the calendar.`);
        }

        const { data: newBook, error: insErr } = await supabase.from("books").insert({
          user_id: (sub as any).user_id,
          child_id: (sub as any).child_id,
          child_name: (sub as any).child_name,
          torah_portion: parsha,
          art_style: (sub as any).art_style,
          language: (sub as any).language,
          status: "paid",
          paid_at: new Date().toISOString(),
          shipping_data: (sub as any).shipping_data ?? null,
          story_data: {
            ...bookConfig,
            source: "subscription",
            subscriptionId: (sub as any).id,
            frequency: (sub as any).frequency,
            parsha,
            releaseDate: bookDate,
            // Shared by the whole month's set - the handle printify-submit uses to
            // ship them as one parcel.
            shipmentBatchId,
            batchIndex: i,
            batchSize,
          },
        } as any).select("id").single();
        if (insErr) {
          console.error(`Failed to mint book ${i + 1}/${batchSize} for sub ${(sub as any).id}:`, insErr);
          // Stop this subscription's batch here and credit only what was minted,
          // rather than abandoning books already inserted.
          break;
        }
        mintedIds.push(newBook!.id);

        // Auto-start server-side generation for the freshly minted book (no admin
        // "Play" needed). Best-effort - generate-book returns 202 immediately.
        if (newBook?.id) {
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-book`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
                "x-cron-secret": Deno.env.get("CRON_SECRET") || "",
              },
              body: JSON.stringify({ bookId: newBook.id }),
            });
          } catch (e) {
            console.error("auto-generate trigger failed for", newBook.id, e);
          }
        }

      }

      if (!mintedIds.length) continue; // leave credit + date untouched; next run retries

      // Advance past every week this batch covers, so a monthly subscriber's next
      // parcel is a month out rather than a week.
      const nextDate = addDaysISO(releaseDate, 7 * mintedIds.length);
      await supabase.from("subscriptions").update({
        books_remaining: Math.max(0, ((sub as any).books_remaining || mintedIds.length) - mintedIds.length),
        next_release_date: nextDate,
        next_delivery_date: nextDate, // keep the dashboard timeline in sync
        updated_at: new Date().toISOString(),
      } as any).eq("id", (sub as any).id);

      released.push({ subscriptionId: (sub as any).id, bookIds: mintedIds, shipmentBatchId });
    }

    const bookCount = released.reduce((n, r) => n + r.bookIds.length, 0);
    console.log(`release-subscription-books: ${bookCount} book(s) in ${released.length} batch(es) released for ${today}`);
    return new Response(JSON.stringify({ ok: true, date: today, released }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("release-subscription-books error:", e);
    return new Response(JSON.stringify({ error: "Release failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
