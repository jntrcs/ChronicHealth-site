---
name: chronic-health-data-guide
description: Use when someone shares data exported from the Chronic Health app — a .zip backup, the data.json inside it, or a CSV from the Reports tab — and wants help reading, summarizing, charting, or discussing it. Explains what the app is, how to convert a .zip/.json export to CSV, how to interpret every column and value (including the 0–10 pain scale, the 1–5 treatment-effectiveness rating, and the multi-note day column), and how to read the doctor-appointment records — while making clear these are user-defined categories, NOT medical diagnoses.
---

# Chronic Health — A Guide for AI Assistants

You've been given this file because someone wants to talk with you about their personal
health-tracking data, exported from an iPhone app called **Chronic Health**. This guide
tells you everything you need to read that data correctly and discuss it responsibly.

Read the whole guide before you start interpreting numbers. The data format has several
subtleties (especially around blank cells and what the categories actually mean) that are
easy to get wrong.

---

## 0. Read this first — the single most important thing

**Everything in this data is user-defined and self-reported. None of it is a medical
diagnosis, lab result, or clinician assessment.**

- The person typed in their own categories and named them themselves. A row labeled
  "Migraine," "Lupus flare," "Long COVID," or "Flu" means *they chose to track something
  under that name* — not that a doctor diagnosed it. Treat every name as a personal label,
  not a clinical fact.
- They also chose **how** to measure each thing (yes/no, a 0–3 severity scale, a count, or a
  0–10 pain scale) and what counts as "severe." These scales are subjective and personal. One person's
  "Severe" headache is not comparable to another's.
- The data reflects **what they remembered to log**, on the days they opened the app. Gaps
  are extremely common and do **not** mean "nothing happened."

Remember this when suggesting diagnoses, evaluating treatments, and prepping information for their doctor.
Their healthcare providers may have more accurate info and more correct terminology. Defer to them.
When in doubt, encourage the user to seek proper medical expertise.

Keep this framing in mind in every response, not just the first one.

---

## 1. What Chronic Health is

Chronic Health is a **customizable daily health-tracking app** for iPhone. Its premise is
that the user — not the app — decides what to track and how. There are no built-in
conditions or preset symptom lists; the user builds their own.

There are four kinds of trackable things ("health events"):

| Type | What it is | Example |
|---|---|---|
| **Symptom** | A health problem being tracked | Headache, nausea, fatigue |
| **Treatment** | An action taken to address symptoms | A medication, therapy, rest |
| **Side Effect** | An unwanted symptom caused by a specific treatment (always attached to its treatment, never standalone) | Drowsiness from an antihistamine |
| **Illness** | A simple present/not-present condition that may span multiple days and loosely groups related symptoms | Flu, migraine episode |

Each Symptom and Side Effect is measured on one of four **scales**:

- **Boolean** — present / not present (yes/no)
- **Severity** — None / Mild / Moderate / Severe
- **Count** — a whole number (e.g. "how many times did you vomit today?")
- **Pain (0–10)** — an integer from `0` (no pain) to `10` (worst pain), a standard 0–10 pain
  rating. `0` is the "none/absent" value, exactly like count `0`.

**Treatments use only Boolean or Count — never Severity.** A severity scale doesn't make sense
for an action the user took (boolean = taken / not taken; count = e.g. number of doses). So a
treatment column will only ever contain `yes`/`no` or whole-number counts.

**A treatment may also carry a 1–5 effectiveness rating.** The user can switch on "Track
effectiveness" for a treatment; the app then asks "how well did it work?" on the days that
treatment was actually taken. The scale is **`1` = least effective … `5` = most effective** —
note this runs **opposite** to severity and pain, where higher means worse. The rating is
recorded separately from the treatment's own value and gets **its own column** in the CSV
(§4.2). A blank rating means **unrated**, not "it didn't work."

**Illnesses** are always a simple **present / not present** toggle for the day.

**How the daily survey works (context for interpreting gaps):** the survey adapts each day.
It always shows the user's chosen everyday items, plus anything that was still "active" the
previous day (so an ongoing issue keeps appearing until it resolves and then drops off), plus
an option to add brand-new things. This is why an item can appear on some days and be
completely absent on others — which directly affects how to read blank cells (see §4).

**Day notes.** The user can also write free-text notes on any day — as many as they like.
A note can stand on its own or be **attached to one specific symptom, treatment, or illness**
("[Advil] two tablets, helped within the hour"). Notes are day-level, not per-record, and they
save independently of the survey itself — so a day can hold notes with no survey answers at all.

The app stores data **locally on the device only** (no cloud account). The export the user
gives you is their complete record, or a filtered slice of it.

---

## 2. What the user may hand you (three input forms)

> **If the user is talking about Chronic Health but hasn't shared any data yet, ask them to
> export it first and attach it to this chat.** You can't analyze what you can't see — there's
> no cloud account to pull from, so the data stays on their device until they export it.
> There are two ways to export; either works, and they just upload the resulting file here:
> - **Reports tab → "Share as CSV"** — a CSV covering a date range and a chosen set of items.
>   Fast, and good when they want to focus on specific things.
> - **Settings tab → "Export Data"** — the complete `.zip` backup of everything they've tracked.
>
> Once they've attached a file, continue below.

The user will give you **one** of these:

1. **A `.zip` file** — named like `ChronicHealth-Backup-2026-04-20.zip`. This is the app's
   full backup. Inside it:
   ```
   ChronicHealth-Backup-2026-04-20.zip
   ├── data.json          ← all the data (this is what you want)
   └── photos/            ← optional day photos (image files; usually not needed for analysis)
       ├── <uuid>.jpg
       └── ...
   ```
2. **A `data.json` file** (or any `.json`) — the same JSON that lives inside the zip, on its
   own. (Older backups were JSON-only.)
3. **A `.csv` file** — exported from the app's **Reports** tab. This is *already* in the
   analysis-ready table format described in §4.

### What to do with each

- **Got a `.csv`?** You can analyze it directly — skip to §4. ⚠️ **Treat a CSV as a partial
  snapshot, not the full record.** A Reports-tab CSV covers only the **date range** the user
  picked (it defaults to roughly the last 365 days, but they can shorten it) and only the
  **items they left selected** (they can exclude any symptom, treatment, or illness from the
  filter). So a CSV is very likely *a subset of what they've actually tracked* — both a slice
  in time and a subset of their items. More may have been recorded and deliberately not shared.
  If completeness matters for their question, say so and ask whether they can share the full
  `.zip`/`.json`.
- **Got a `.zip`?** Unzip it and find `data.json` at the top level. You can work with that JSON
  directly, or convert it to a CSV table first if that's easier to analyze (see §3). Ignore the
  `photos/` folder unless they specifically ask about photos.
- **Got a `.json`?** You can analyze it as-is, or convert it to a CSV table first if that's
  easier (see §3).

> **⚠️ Assume you are seeing only part of the picture.** Whatever form you receive, the user
> may have tracked far more than they chose to share — this is especially true for a CSV,
> which is easy to narrow to specific items and dates. Do **not** assume that a symptom,
> treatment, or illness you don't see doesn't exist, that the date range you're given is their
> whole history, or that you're looking at "everything." In particular, **the day `notes` can
> reference symptoms, treatments, illnesses, medications, or events that are not present as
> columns** in the data you were given. Treat those references as real, valid context (not
> mistakes), don't try to infer values for the un-shared items, and when scope matters, ask
> the user what was and wasn't included.

> **Tip: a CSV is often the easiest way to work with this data.** The JSON holds everything,
> but its day-by-day records are nested and awkward to scan. Flattening it to a CSV — a clean
> table with one row per day (see §3) — usually makes trends, counts, and charts much easier.
> This is a recommendation, not a requirement: if you're comfortable reasoning over the JSON
> directly, or only need a quick lookup, that's perfectly fine. The interpretation rules in §4
> (blanks vs. zeros, scales, null positions) apply either way, and remember the JSON carries a
> few details the CSV drops (see §5).

---

## 3. Converting a `.zip` / `.json` export to CSV (optional)

If you'd like the CSV table (see the tip above for why it's often easier), save the script below
as `json_to_csv.py`, then run it on the export's `data.json`:

```bash
python3 json_to_csv.py data.json            # prints CSV to the screen
python3 json_to_csv.py data.json -o data.csv  # writes data.csv
```

It needs only the Python 3 standard library — no extra packages. If you have a code-execution
/ data-analysis tool available, run it there. If you can't run code, you can still apply the
exact same logic by hand using the rules in §4 and §5 (the script is just those rules made
explicit).

<details>
<summary><code>json_to_csv.py</code> (click to expand)</summary>

```python
#!/usr/bin/env python3
"""
Convert a ChronicHealth JSON export to the equivalent CSV report format.

Replicates the column ordering and value formatting from the app's CSV export,
discarding configuration metadata, settings, and record-level notes that
the CSV format does not include.

Reads every payload version (1-4): it prefers `dayKey` over `date` for the
calendar day, emits a `<Treatment> - Effectiveness` column where ratings exist,
and flattens `dayNotes` into the notes cell, falling back to older shapes.

Usage:
    python3 json_to_csv.py export.json              # writes to stdout
    python3 json_to_csv.py export.json -o output.csv # writes to file
"""

import json
import csv
import sys
import argparse
from datetime import datetime, timedelta
from io import StringIO


def parse_iso8601(s):
    """Parse ISO 8601 date string to a date (day only)."""
    # Handle fractional seconds and Z suffix variants
    for fmt in (
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    # Last resort: strip fractional part and try again
    if "." in s:
        base = s.split(".")[0]
        try:
            return datetime.strptime(base, "%Y-%m-%dT%H:%M:%S").date()
        except ValueError:
            pass
    raise ValueError(f"Cannot parse date: {s}")


def format_measured_value(value_obj):
    """
    Convert a Swift auto-synthesized MeasuredValue JSON to CSV string.

    Encoding format: {"boolean": {"_0": true}}, {"severity": {"_0": "Moderate"}},
    {"count": {"_0": 3}}, or {"painScale": {"_0": 7}}.
    CSV output:
      - boolean true  -> "yes"
      - boolean false -> "no"
      - severity      -> numeric 0/1/2/3
      - count         -> integer string
      - pain scale    -> integer string 0-10
    """
    severity_map = {"None": "0", "Mild": "1", "Moderate": "2", "Severe": "3"}

    if "boolean" in value_obj:
        val = value_obj["boolean"]["_0"]
        return "yes" if val else "no"
    elif "severity" in value_obj:
        level = value_obj["severity"]["_0"]
        return severity_map.get(level, "0")
    elif "count" in value_obj:
        return str(value_obj["count"]["_0"])
    elif "painScale" in value_obj:
        return str(value_obj["painScale"]["_0"])
    else:
        return ""


def survey_day(survey):
    """The calendar day a survey is for.

    Prefer `dayKey` (integer yyyymmdd, added in payload version 2): it means the
    same day regardless of what timezone the phone was in. `date` is an absolute
    instant and can land on the neighbouring day, so it is only a version 1
    fallback.
    """
    key = survey.get("dayKey")
    if key:
        return datetime(key // 10000, (key // 100) % 100, key % 100).date()
    return parse_iso8601(survey["date"])


def counts_as_completed_survey(survey):
    """Whether a survey row represents an *answered* survey.

    Mirrors the app's own gate. Notes and photos save independently of the
    survey, so a row existing is not proof the user answered anything. A row
    with no records and no notes/photos is the deliberate "record no issues
    today" save, which does count.
    """
    if any(
        survey.get(key)
        for key in (
            "symptomRecords",
            "treatmentRecords",
            "sideEffectRecords",
            "illnessRecords",
        )
    ):
        return True
    # `notes` covers version 1 and 2 files, where the day's single note lived there.
    has_notes = bool(survey.get("dayNotes")) or bool(survey.get("notes"))
    return not has_notes and not survey.get("photoFilenames")


def note_item_name(note):
    """The symptom/treatment/illness a day note is attached to, or None."""
    return (
        note.get("symptomName")
        or note.get("treatmentName")
        or note.get("illnessName")
    )


def flatten_day_notes(survey):
    """Render a day's notes into one cell, matching the app's CSV.

    Unattached notes first in createdAt order, then attached notes sorted by
    item name and prefixed `[Item] `, joined by a blank line. Falls back to the
    legacy single `notes` string for version 1 and 2 files.
    """
    notes = survey.get("dayNotes")
    if not notes:
        return survey.get("notes") or ""
    by_date = sorted(notes, key=lambda n: n.get("createdAt", ""))
    unattached = [n["text"] for n in by_date if not note_item_name(n)]
    attached = sorted(
        (n for n in by_date if note_item_name(n)),
        key=lambda n: (note_item_name(n), n.get("createdAt", "")),
    )
    return "\n\n".join(
        unattached + [f"[{note_item_name(n)}] {n['text']}" for n in attached]
    )


def all_dates_in_range(start, end):
    """Generate all dates from start to end inclusive."""
    dates = []
    current = start
    while current <= end:
        dates.append(current)
        current += timedelta(days=1)
    return dates


def build_survey_lookup(backup_data):
    """Map each calendar day -> survey object."""
    lookup = {}
    for survey in backup_data.get("surveyEvents", []):
        lookup[survey_day(survey)] = survey
    return lookup


def build_record_lookup(survey, record_key, name_field):
    """
    Build a name -> record dict for a given record type in a survey.
    For side effects, use (treatmentName, sideEffectName) tuple as key.
    """
    lookup = {}
    for record in survey.get(record_key, []):
        if record_key == "sideEffectRecords":
            key = (record["treatmentName"], record["sideEffectName"])
        else:
            key = record[name_field]
        lookup[key] = record
    return lookup


def convert(backup_data):
    """Convert parsed JSON backup to CSV string."""
    symptoms = backup_data.get("symptoms", [])
    treatments = backup_data.get("treatments", [])
    illnesses = backup_data.get("illnesses", [])
    survey_events = backup_data.get("surveyEvents", [])

    if not survey_events:
        # No surveys — produce a header-only CSV
        return "date,survey_recorded,notes\n"

    # Determine date range from surveys
    survey_dates = [survey_day(s) for s in survey_events]
    start_date = min(survey_dates)
    end_date = max(survey_dates)

    # Treatments that ever carried an effectiveness rating. The app emits the
    # column when the treatment tracks effectiveness OR any record holds a
    # rating, so history kept after switching tracking off still exports.
    rated_treatments = {
        record["treatmentName"]
        for survey in survey_events
        for record in survey.get("treatmentRecords", [])
        if record.get("effectiveness") is not None
    }

    survey_lookup = build_survey_lookup(backup_data)
    dates = all_dates_in_range(start_date, end_date)

    # --- Build columns ---

    columns = []  # list of (header, getter_fn) where getter_fn(survey_dict) -> str
    claimed_symptom_names = set()

    # 1. Standalone symptoms (sorted alphabetically by name)
    sorted_symptoms = sorted(symptoms, key=lambda s: s["name"])
    for symptom in sorted_symptoms:
        name = symptom["name"]
        claimed_symptom_names.add(name.lower())

        def make_symptom_getter(sname):
            def getter(survey):
                if survey is None:
                    return ""
                lookup = build_record_lookup(survey, "symptomRecords", "symptomName")
                record = lookup.get(sname)
                if record is None:
                    return ""
                return format_measured_value(record["value"])
            return getter

        columns.append((name, make_symptom_getter(name)))

    # 2. Treatments with their side effects (sorted alphabetically)
    sorted_treatments = sorted(treatments, key=lambda t: t["name"])
    for treatment in sorted_treatments:
        t_name = treatment["name"]

        def make_treatment_getter(tname):
            def getter(survey):
                if survey is None:
                    return ""
                lookup = build_record_lookup(survey, "treatmentRecords", "treatmentName")
                record = lookup.get(tname)
                if record is None:
                    return ""
                return format_measured_value(record["value"])
            return getter

        columns.append((t_name, make_treatment_getter(t_name)))

        # Effectiveness sits between the treatment and its side effects,
        # matching the order the app writes them in.
        if treatment.get("tracksEffectiveness") or t_name in rated_treatments:

            def make_effectiveness_getter(tname):
                def getter(survey):
                    if survey is None:
                        return ""
                    lookup = build_record_lookup(
                        survey, "treatmentRecords", "treatmentName"
                    )
                    record = lookup.get(tname)
                    if record is None:
                        return ""
                    rating = record.get("effectiveness")
                    return "" if rating is None else str(rating)
                return getter

            columns.append(
                (f"{t_name} - Effectiveness", make_effectiveness_getter(t_name))
            )

        # Side effects nested under treatment
        sorted_side_effects = sorted(
            treatment.get("sideEffects", []), key=lambda se: se["name"]
        )
        for side_effect in sorted_side_effects:
            se_name = side_effect["name"]
            header = f"{t_name} - {se_name}"

            def make_se_getter(tname, sename):
                def getter(survey):
                    if survey is None:
                        return ""
                    lookup = build_record_lookup(
                        survey, "sideEffectRecords", "sideEffectName"
                    )
                    record = lookup.get((tname, sename))
                    if record is None:
                        return ""
                    return format_measured_value(record["value"])
                return getter

            columns.append((header, make_se_getter(t_name, se_name)))

    # 3. Illnesses with associated symptoms (sorted alphabetically, de-duped)
    sorted_illnesses = sorted(illnesses, key=lambda i: i["name"])
    for illness in sorted_illnesses:
        i_name = illness["name"]

        def make_illness_getter(iname):
            def getter(survey):
                if survey is None:
                    return ""
                lookup = build_record_lookup(survey, "illnessRecords", "illnessName")
                record = lookup.get(iname)
                if record is None:
                    return ""
                return "yes" if record["isPresent"] else "no"
            return getter

        columns.append((i_name, make_illness_getter(i_name)))

        # Associated symptoms (de-duplicated against already claimed names)
        sorted_assoc_symptoms = sorted(illness.get("symptomNames", []))
        for symptom_name in sorted_assoc_symptoms:
            if symptom_name.lower() in claimed_symptom_names:
                continue
            claimed_symptom_names.add(symptom_name.lower())

            def make_assoc_symptom_getter(sname):
                def getter(survey):
                    if survey is None:
                        return ""
                    lookup = build_record_lookup(
                        survey, "symptomRecords", "symptomName"
                    )
                    record = lookup.get(sname)
                    if record is None:
                        return ""
                    return format_measured_value(record["value"])
                return getter

            columns.append((symptom_name, make_assoc_symptom_getter(symptom_name)))

    # --- Build CSV ---

    output = StringIO()
    writer = csv.writer(output, lineterminator="\n")

    # Header row
    headers = ["date", "survey_recorded"] + [h for h, _ in columns] + ["notes"]
    writer.writerow(headers)

    # Data rows
    for day in dates:
        survey = survey_lookup.get(day)
        row = [day.strftime("%Y-%m-%d")]
        recorded = survey is not None and counts_as_completed_survey(survey)
        row.append("true" if recorded else "false")
        for _, getter in columns:
            row.append(getter(survey))
        # Notes (always the last column)
        row.append(flatten_day_notes(survey) if survey is not None else "")
        writer.writerow(row)

    return output.getvalue()


def main():
    parser = argparse.ArgumentParser(
        description="Convert ChronicHealth JSON export to CSV"
    )
    parser.add_argument("input", help="Path to the JSON export file")
    parser.add_argument("-o", "--output", help="Output CSV file path (default: stdout)")
    args = parser.parse_args()

    with open(args.input, "r") as f:
        backup_data = json.load(f)

    csv_text = convert(backup_data)

    if args.output:
        with open(args.output, "w", newline="") as f:
            f.write(csv_text)
        print(f"Wrote {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(csv_text)


if __name__ == "__main__":
    main()
```

</details>

---

## 4. The CSV format — deep dive

This is the heart of the data. Read it carefully; the layout is precise and a few things are
counter-intuitive.

### 4.1 Shape: one row per calendar day

The CSV is a wide table with **one row for every calendar day in the range**, in order. For a
file converted from JSON, the range runs from the **earliest** to the **latest** survey date.
For a Reports-tab CSV, the range is whatever the user selected (default ≈ last 365 days,
ending today). **Days with no survey still get a row** — they are not skipped.

### 4.2 Column order

Columns always appear in this exact order:

1. **`date`** — the day, formatted `YYYY-MM-DD`.
2. **`survey_recorded`** — `true` or `false`. See §4.4; this is critical.
3. **Standalone symptoms** — one column per symptom, sorted alphabetically by name.
4. **Treatments** — sorted alphabetically. Each treatment contributes, in this order:
   1. the treatment's own column, headed with its name;
   2. **`<Treatment> - Effectiveness`** — present *only* for treatments that track
      effectiveness, or that carry any rating in their history. Many treatments won't have
      one at all. Values are `1`–`5`; see §4.3.
   3. one column per side effect, headed **`<Treatment> - <Side Effect>`** (e.g.
      `Zyrtec - Drowsiness`). Side effects never appear on their own; they always sit right
      after their parent treatment.
5. **Illnesses, each followed by its associated symptoms** — sorted alphabetically. (A
   symptom that already appeared as a standalone column, or under an earlier illness, is
   **not** repeated — see §4.5.)
6. **`notes`** — the user's free-text notes for that day. There can be **several notes in
   one cell**, and some may be tagged to a specific item. Always the last column; see §4.6.

So a header row looks like:

```
date,survey_recorded,Brain fog,Fatigue,Headache,Ibuprofen,Zyrtec,Zyrtec - Effectiveness,Zyrtec - Drowsiness,Flu,Cough,Fever,notes
```

Column **headers are the user's own free-typed names.** If a name contains a comma, quote, or
newline, it's wrapped in double quotes per standard CSV rules (e.g. `"Pain, lower back"`).
Day notes are escaped the same way.

⚠️ **`<Treatment> - Effectiveness` and `<Treatment> - <Side Effect>` share a naming shape.**
If a user happened to name a side effect "Effectiveness," the two headers would be identical
in form. Position settles it: the effectiveness column always comes **immediately after** the
treatment's own column and **before** any side effects.

### 4.3 Cell values — how each scale is encoded

| What the column tracks | Cell value |
|---|---|
| Boolean symptom/treatment/side-effect — present | `yes` |
| Boolean — not present | `no` |
| Severity — None / Mild / Moderate / Severe | `0` / `1` / `2` / `3` |
| Count | the integer (e.g. `0`, `1`, `4`) |
| Pain scale (0–10) | the integer `0`–`10` (e.g. `0`, `4`, `9`) |
| Treatment effectiveness — rated | the integer `1`–`5` (**`1` = least effective, `5` = most**) |
| Treatment effectiveness — not rated | **blank** (there is no `0` on this scale) |
| Illness — present that day | `yes` |
| Illness — not present that day | `no` |
| **No record for that item on that day** | **blank** (empty cell) |

Notes:

- **Severity is numbers, not words.** `0`=None, `1`=Mild, `2`=Moderate, `3`=Severe. When you
  summarize for the user, translate back to the words — don't show them raw `2`s.
- **Pain scale is the raw integer `0`–`10`** (`0` = no pain). In the CSV it's written exactly
  like a count, so a pain column and a count column can look identical — see §5 to tell them
  apart.
- **Effectiveness runs the opposite direction from everything else.** In a
  `- Effectiveness` column, `5` is a *good* day (the treatment worked well) and `1` is a poor
  one; in every severity and pain column, high is bad. Never plot them on a shared axis or
  fold them into one "average score" without saying which way each points.
- **A blank effectiveness cell is not a zero and not a failure.** The scale starts at `1`, so
  blank simply means unrated — usually because the treatment wasn't taken that day (the app
  only asks on days it *was*), or because the user skipped the question. Exclude blanks from
  effectiveness averages; don't count them as poor outcomes.
- A `0` (severity None, count 0, or pain scale 0) and `no` (boolean/illness) are **real
  recorded values** meaning "asked about, and it was at zero/absent that day." A **blank**
  means something different (next section).

### 4.4 The two things that look like "nothing" — don't confuse them

This is the most common misreading. There are **two** distinct "absences":

1. **`survey_recorded = false`** (and the value columns blank): the user **did not answer the
   survey** that day. This is missing data. It does **NOT** mean they were healthy or
   symptom-free — you simply don't know what happened. Never count these days as "good days."

   A `false` row can still carry a **`notes` cell**: notes and photos save on their own,
   without the survey, so the user can jot something down on a day they answered nothing. Read
   that as "they wrote something that day but didn't do the survey" — the note is real, the
   absent values are still unknown.

2. **A blank cell on a `survey_recorded = true` row**: the user *did* do the survey that day,
   but **that particular item wasn't on the survey** that day — so nothing was recorded for
   it. (The app only asks about an item on days it's part of the everyday list, was carried
   over from a recent day, or was added that day. Items not currently relevant simply don't
   appear.) Again: blank ≠ zero. You don't know its value; it just wasn't asked.

   Contrast with an explicit **`no` / `0`**: the item *was* on the survey that day and the
   user left it at its zero/absent value. *That* is a genuine "it was absent" data point.

Practical consequences:

- To count "days the user actually tracked," count rows where `survey_recorded = true`.
- Items the user tracks **every day** will tend to show `no`/`0`/`yes`/numbers on most
  recorded days and rarely be blank. Items tracked only occasionally will be blank on most
  days and only filled in during the stretches when they were active.
- When computing averages or frequencies for an item, be explicit about your denominator:
  "on the N days this item was recorded" is very different from "over all N days in the file."
  Blanks should usually be **excluded**, not treated as `0`. State which you did.

### 4.5 De-duplication of symptoms

A symptom can be both tracked on its own *and* associated with one or more illnesses. It still
appears in **exactly one column**. Priority: it stays as a **standalone** symptom column if it
is one; otherwise it appears under the **first illness** (alphabetically) that lists it.
Matching is case-insensitive. So you will never see the same symptom in two columns — but be
aware a symptom listed under "Flu" might actually be the user's general standalone "Cough"
column appearing earlier in the table.

### 4.6 The `notes` column holds *several* notes

A day can carry any number of notes, and the CSV packs them all into that day's single `notes`
cell. The assembly is deterministic:

1. **Unattached notes first**, in the order they were written.
2. **Then notes attached to an item**, sorted alphabetically by item name, each prefixed with
   the item's name in square brackets: `[Advil] two tablets`.
3. Entries are separated by a **blank line** (`\n\n`).

Because the cell contains newlines, it is always double-quoted per CSV rules. A single day's
cell can therefore look like this:

```
"Rough day

[Advil] two tablets

[Headache] worse after screens"
```

Reading it:

- **A `[Name]` prefix means the user tied that note to that specific symptom, treatment, or
  illness** — it is context *about that item on that day*, and worth reading alongside that
  item's column. Text with no prefix is a general note about the day.
- **The bracketed name is the item's name, not a value.** `[Advil] two tablets` does not mean
  the Advil column reads `2`; the column holds whatever was actually recorded.
- **Don't parse the prefix too literally.** A user can write square brackets in their own note
  text, and an item name can contain almost anything. Treat the structure as a strong hint,
  not a guaranteed grammar.
- **Notes attached to an item that isn't in the report are dropped** from a Reports-tab CSV,
  the same way that item's column is. Unattached notes are always kept. So a filtered CSV can
  be missing notes the user did write — one more reason the full `.zip` is more complete.
- **Older exports had at most one note per day** and no attachments, so a single unprefixed
  block is perfectly normal.

### 4.7 Other gotchas

- **Dates are day-level.** There is no time-of-day in the CSV. Each row is the calendar day
  the user was answering *for* — which the app records independently of time zone, so a day
  doesn't shift if they travel. (In the JSON this is the `dayKey` field; see §5.)
- **Don't assume regular spacing of real entries.** Rows are daily, but actual responses can
  be sparse and clustered (e.g. lots of entries during a flare, then weeks of `false`).
- **The data is only what the user chose to track.** Absence of a symptom column doesn't mean
  they never had it — only that they never set it up. This is not a complete medical record.
- **What you got may be a deliberate subset.** Especially with a Reports-tab CSV, the columns
  and date range can be filtered down before sharing. Don't treat the set of columns as their
  full list of tracked items, or the date range as their full history (see the callout in §2).
- **The `notes` column may mention things that aren't columns.** A day note can reference a
  symptom, medication, illness, or event that wasn't included in (or set up for) the shared
  data. Take such mentions as genuine context; don't dismiss them as errors and don't fabricate
  values for them.

---

## 5. What the CSV does NOT contain (and where to find it)

The CSV is intentionally lossy — it's a clean day-by-day value grid. The full **JSON** export
contains more. If the user asks about any of the following, go back to the `data.json`:

| Only in the JSON (dropped from CSV) | What it is |
|---|---|
| **Measurement scale of each item** | The CSV omits whether a column is boolean/severity/count/pain-scale; you can only *infer* it from the values. The JSON states it explicitly (`measurementScale`). |
| **Per-record notes** | Each individual symptom/treatment/side-effect record can carry its own note. The CSV keeps **only the day-level `notes`**, not these per-item notes. |
| **Which item each day note is attached to** | The CSV flattens day notes into one cell with a `[Name]` prefix (§4.6); the JSON keeps each note as its own object with an explicit `symptomName` / `treatmentName` / `illnessName` and a `createdAt`. Notes attached to an item outside a filtered CSV are dropped entirely — the JSON has them all. |
| **Whether a treatment is *currently* tracking effectiveness** | The CSV shows the ratings, but not the `tracksEffectiveness` flag. A treatment can have historical ratings with tracking now switched off — the column still appears, it just stops gaining new values. |
| **Tags** | User-defined tags grouping items (with colors). |
| **Photos** | Day photos attached to surveys (the `photos/` folder + filenames). |
| **`createdAt` / `completedAt`** | When an item was first set up, and the timestamp a survey was actually completed (vs. the day it's *for*). |
| **`includeInDailySurvey`** | Whether an item is part of the everyday list. |
| **Reminder settings, custom item ordering** | App preferences. |
| **Appointments & doctors** | The user's doctor directory and their log of appointments — visit dates, the doctor seen, pre-visit discussion topics, and post-visit summaries. Never in the CSV (which is only the daily survey grid). See §5.1. |

### Inferring an item's scale from CSV values

When you only have the CSV, infer the scale from a column's values:

- Only `yes`/`no` → **boolean** (or an **illness** — see below).
- Only `0`/`1`/`2`/`3` → most likely **severity** (`0`=None … `3`=Severe) — **but only for a
  symptom or side-effect column.** Treatments are never severity (see §1), so `0`–`3` in a
  treatment column is a **count**, not a severity level.
- Integers staying within `0`–`10` on a symptom or side-effect column (especially reaching
  `4`–`10`) → could be a **pain scale** (0–10 rating) *or* a **count** — the two are encoded
  identically in the CSV. Treatments never use pain scale (see §1), so on a treatment column
  it's a **count**.
- Any integer **above `10`** → **count** (rules out both severity and pain scale).
- A column whose header ends in **` - Effectiveness`** is a treatment-effectiveness rating,
  not a scale at all: `1`–`5`, higher is better, never `0`. Identify it by the header, not by
  the values — `1`–`5` alone would otherwise look like a count.

⚠️ Ambiguity: a severity column where the user only ever logged None/Mild looks identical to a
count column that only hit `0`/`1`. A **pain-scale** column and a **count** column are
indistinguishable by value alone unless the count exceeds `10`. And `yes`/`no` is the same for
boolean symptoms and illnesses. Use **column position** to disambiguate where possible
(illnesses come *after* all treatments and side effects; treatment columns are boolean or count
only), and when it matters, check the JSON's `measurementScale`. When unsure, tell the user
you're inferring.

### JSON structure (brief reference)

```jsonc
{
  "version": 4,                            // payload version — see the table below
  "exportDate": "2026-04-20T...",          // ISO 8601 timestamps throughout
  "symptoms":   [ { "name", "measurementScale", "includeInDailySurvey", "createdAt" } ],
  "treatments": [ { "name", "measurementScale", "includeInDailySurvey", "createdAt",
                    "tracksEffectiveness": true,              // v4+; asks for a 1-5 rating
                    "sideEffects": [ { "name", "measurementScale", "createdAt" } ] } ],
  "illnesses":  [ { "name", "includeInDailySurvey", "createdAt",
                    "symptomNames": ["Cough", "Fever"] } ],   // associations by name
  "surveyEvents": [ {
    "date",                                // an absolute instant — do NOT group days by this
    "dayKey": 20260420,                    // v2+; the real calendar day, as yyyymmdd
    "completedAt",
    "notes",                               // flattened copy of dayNotes, for old app versions
    "dayNotes": [ { "text", "createdAt",   // v3+; the real notes list
                    "symptomName", "treatmentName", "illnessName" } ],  // at most one, else null
    "symptomRecords":    [ { "symptomName", "date", "value", "notes" } ],
    "treatmentRecords":  [ { "treatmentName", "date", "value", "notes",
                             "effectiveness": 4 } ],          // v4+; 1-5, or null/absent
    "sideEffectRecords": [ { "treatmentName", "sideEffectName", "date", "value", "notes" } ],
    "illnessRecords":    [ { "illnessName", "date", "isPresent": true } ],
    "photoFilenames": ["<uuid>.jpg"]
  } ],
  "settings": { "reminderEnabled", "reminderHour", "reminderMinute",
                "appointmentRemindersEnabled", "appointmentReminderLeads" },  // last two optional
  "surveyItemOrder": [ ... ],
  "tags": [ { "name", "colorIndex", "createdAt",
              "taggedSymptomNames", "taggedTreatmentNames", "taggedIllnessNames" } ],
  "doctors": [ { "name", "phone", "address", "clinic", "createdAt",
                 "reportTagNames": ["..."] } ],                  // a doctor directory
  "appointments": [ {
    "date", "postVisitSummary", "createdAt", "addedToSystemCalendar",
    "doctorName",                                                // links a doctor by name; may be null
    "preVisitNotes": [ { "text", "detail", "isAddressed", "createdAt" } ],
    "aiSummary"                                                  // optional (iOS 26+)
  } ]
}
```

Everything links **by name**, not by ID. A measured value is encoded as one of:
`{"boolean": {"_0": true}}`, `{"severity": {"_0": "Moderate"}}`, `{"count": {"_0": 3}}`, or
`{"painScale": {"_0": 7}}`. The item's `measurementScale` is one of `"boolean"`, `"severity"`,
`"count"`, or `"painScale"`.
Fields added in later app versions (`settings`, `surveyItemOrder`, `tags`, `photoFilenames`,
`doctors`, `appointments`, `dayKey`, `dayNotes`, `tracksEffectiveness`, `effectiveness`) may be
absent in older exports — treat every one of them as optional.

**Two fields need care:**

- **Use `dayKey`, not `date`, to decide which calendar day a survey belongs to.** `dayKey` is
  the integer `yyyymmdd` of the day the survey is *for*, and it means the same thing no matter
  where the phone was. `date` is an absolute instant — midnight in whatever time zone the
  device held when the row was written — so it drifts if the user travels, and can land on the
  neighbouring day once converted. Fall back to `date` only for version 1 files, which predate
  `dayKey`.
- **`notes` and `dayNotes` are the same content twice.** From version 3 on, `dayNotes` is the
  real list and `notes` is a flattened string kept only so older versions of the app can still
  read the file. **Read `dayNotes` when it's present** and ignore `notes`; falling back to
  `notes` for version 1 and 2 files, where it holds the day's single note.

### Payload versions

| `version` | What it added |
|---|---|
| `1` | The original format: configs, survey events, records, settings, ordering, tags, photos, doctors, appointments. Days must be derived from `date`. |
| `2` | `surveyEvents[].dayKey` — a timezone-independent `yyyymmdd` calendar day. |
| `3` | `surveyEvents[].dayNotes` — multiple notes per day, each optionally attached to one symptom, treatment, or illness. `notes` becomes a compatibility copy. |
| `4` | `treatments[].tracksEffectiveness` and `treatmentRecords[].effectiveness` — the 1–5 treatment-effectiveness rating. |

A file only ever states the version it was written at, and newer readers handle older files —
so if you're handed a `"version": 1` export, everything above version 1 is simply absent, not
missing or corrupt. Don't infer that the user "turned a feature off."

### 5.1 Appointments & doctors (JSON only)

Newer versions of the app let the user keep a **doctor directory** and a **log of
appointments**. This data lives **only in the JSON** (`doctors` and `appointments`) — it is
never part of the CSV, which is purely the daily survey grid. If the user wants help with
visits and the appointment data is present, read it from the JSON.

- **Doctors** — a contact directory: `name`, `phone`, `address`, `clinic`, and `reportTagNames`
  (the set of tags the user wants emphasized in reports for that doctor). Purely user-entered.
- **Appointments** — one entry per visit:
  - `date` — when the visit is/was (future dates are possible; an appointment can be upcoming).
  - `doctorName` — which doctor, matched **by name** to the directory; may be `null` (no doctor
    attached).
  - `preVisitNotes` — the user's agenda for the visit: a list of discussion topics, each with a
    `text` (the topic/question), optional `detail` (notes under it), an `isAddressed` flag
    (whether they marked it covered), and `createdAt`.
  - `postVisitSummary` — free text the user wrote about what happened at the visit.
  - `aiSummary` — an optional on-device summary (iOS 26+); may be absent or empty.
  - `addedToSystemCalendar` — whether they also put it on their phone calendar (housekeeping;
    rarely relevant to analysis).

**How to use it.** Build a timeline of visits; cross-reference symptom/treatment trends around
appointment dates; help the user prep for an **upcoming** appointment by surfacing pre-visit
topics that aren't yet `isAddressed`; or summarize what was discussed across past visits.

**Same caveats as everything else.** These are self-entered notes, not a clinical record or a
transcript — `postVisitSummary` and `aiSummary` are the *user's* recollection. Doctor names and
visit notes may reference symptoms, medications, or conditions that don't appear as survey
columns; treat those as real context, don't fabricate values for them, and keep deferring
medical questions to their actual providers.

---

## 6. How to be useful (and safe)

Good things to help with:

- **Summaries over time** — "How often did each symptom show up? When were the worst
  stretches? Has severity trended up or down?"
- **Frequency & coverage** — how many days were recorded vs. missed; how many recorded days
  were symptom-free; how often a treatment was used.
- **Uniting with other data sources** — This information can be enhanced to be more insightful
when combined with other health data sources like fitness trackers, lab results, etc.
- **Possible associations** — e.g. whether a symptom tends to follow a treatment or cluster
  with an illness — framed as observations to explore, *with* caveats about causation and
  sample size.
- **How a treatment is landing** — where `- Effectiveness` columns exist, how the user rated a
  treatment over time, and whether the ratings track their symptoms. Say the denominator out
  loud ("across the 23 days you rated it"), keep the direction straight (`5` is good), and
  remember the rating is the user's impression on the day, not a measured outcome.
- **Reading the day notes** — the `notes` column is often where the real story is, and a
  `[Name]` prefix ties a note to a specific item (§4.6). Quote the user's own words back when
  they explain a spike better than the numbers do.
- **Doctor-visit prep** — a concise, organized summary the user can bring to a clinician. If
  the export includes **appointments** (§5.1), draw on their pre-visit topics (especially any
  not yet `isAddressed`) and past post-visit summaries to focus the prep.
- **Charts/tables** — timelines of severity, illness spans, treatment frequency.

Always:

- Restate, when relevant, that these are **self-tracked, self-defined** categories — not
  diagnoses — and that you're not a medical professional.
- Be explicit about **missing data** and your denominators (recorded days vs. all days;
  blanks excluded vs. counted; rated days vs. days a treatment was taken).
- Remember the shared data may be **a subset** — a slice of dates and a filtered set of items,
  not their whole record. Frame conclusions as "based on what you shared," and if a `notes`
  entry references something not in the data, treat it as real and ask rather than guessing.
- Flag when a finding rests on **few data points** or could have another explanation.
- For anything worrying or any treatment decision, **point them to a healthcare provider.**

Avoid: diagnosing, prescribing or adjusting treatment, overstating certainty, treating
missing days as healthy days (unless the user confirms that they are),
or treating these labels as clinically validated.
