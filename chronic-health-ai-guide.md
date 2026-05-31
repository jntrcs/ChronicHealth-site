---
name: chronic-health-data-guide
description: Use when someone shares data exported from the Chronic Health app — a .zip backup, the data.json inside it, or a CSV from the Reports tab — and wants help reading, summarizing, charting, or discussing it. Explains what the app is, how to convert a .zip/.json export to CSV, and how to interpret every column and value — while making clear these are user-defined categories, NOT medical diagnoses.
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
- They also chose **how** to measure each thing (yes/no, a 0–3 severity scale, or a count)
  and what counts as "severe." These scales are subjective and personal. One person's
  "Severe" headache is not comparable to another's.
- The data reflects **what they remembered to log**, on the days they opened the app. Gaps
  are extremely common and do **not** mean "nothing happened."

Remeber this when suggesting diagnoses, evaluating treatments, and prepping information form their doctor.
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

Each Symptom and Side Effect is measured on one of three **scales**:

- **Boolean** — present / not present (yes/no)
- **Severity** — None / Mild / Moderate / Severe
- **Count** — a whole number (e.g. "how many times did you vomit today?")

**Treatments use only Boolean or Count — never Severity.** A severity scale doesn't make sense
for an action the user took (boolean = taken / not taken; count = e.g. number of doses). So a
treatment column will only ever contain `yes`/`no` or whole-number counts.

**Illnesses** are always a simple **present / not present** toggle for the day.

**How the daily survey works (context for interpreting gaps):** the survey adapts each day.
It always shows the user's chosen everyday items, plus anything that was still "active" the
previous day (so an ongoing issue keeps appearing until it resolves and then drops off), plus
an option to add brand-new things. This is why an item can appear on some days and be
completely absent on others — which directly affects how to read blank cells (see §4).

The app stores data **locally on the device only** (no cloud account). The export the user
gives you is their complete record, or a filtered slice of it.

---

## 2. What the user may hand you (three input forms)

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
- **Got a `.zip`?** Unzip it and find `data.json` at the top level. Then convert it to CSV
  (next step). Ignore the `photos/` folder unless they specifically ask about photos.
- **Got a `.json`?** Convert it to CSV (next step).

> **⚠️ Assume you are seeing only part of the picture.** Whatever form you receive, the user
> may have tracked far more than they chose to share — this is especially true for a CSV,
> which is easy to narrow to specific items and dates. Do **not** assume that a symptom,
> treatment, or illness you don't see doesn't exist, that the date range you're given is their
> whole history, or that you're looking at "everything." In particular, **the day `notes` can
> reference symptoms, treatments, illnesses, medications, or events that are not present as
> columns** in the data you were given. Treat those references as real, valid context (not
> mistakes), don't try to infer values for the un-shared items, and when scope matters, ask
> the user what was and wasn't included.

> **Always convert `.zip`/`.json` to CSV first.** The CSV is the clean, day-by-day table
> that's easy to reason about and chart. Do all your analysis on the CSV. Only go back to the
> raw JSON for the few extra details the CSV intentionally drops (see §5).

---

## 3. Converting a `.zip` / `.json` export to CSV

Save the script below as `json_to_csv.py`, then run it on the export's `data.json`:

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

    Encoding format: {"boolean": {"_0": true}} or {"severity": {"_0": "Moderate"}} etc.
    CSV output:
      - boolean true  -> "yes"
      - boolean false -> "no"
      - severity      -> numeric 0/1/2/3
      - count         -> integer string
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
    else:
        return ""


def escape_csv_value(value):
    """Escape a value for CSV."""
    if "," in value or '"' in value or "\n" in value:
        escaped = value.replace('"', '""')
        return f'"{escaped}"'
    return value


def all_dates_in_range(start, end):
    """Generate all dates from start to end inclusive."""
    dates = []
    current = start
    while current <= end:
        dates.append(current)
        current += timedelta(days=1)
    return dates


def build_survey_lookup(backup_data):
    """Map each survey date -> survey object."""
    lookup = {}
    for survey in backup_data.get("surveyEvents", []):
        date = parse_iso8601(survey["date"])
        lookup[date] = survey
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
    survey_dates = [parse_iso8601(s["date"]) for s in survey_events]
    start_date = min(survey_dates)
    end_date = max(survey_dates)

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
    for date in dates:
        survey = survey_lookup.get(date)
        row = [date.strftime("%Y-%m-%d")]
        row.append("true" if survey is not None else "false")
        for _, getter in columns:
            row.append(getter(survey))
        # Notes
        if survey is not None and survey.get("notes"):
            row.append(survey["notes"])
        else:
            row.append("")
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
4. **Treatments, each followed immediately by its side effects** — sorted alphabetically.
   A side-effect column is named **`<Treatment> - <Side Effect>`** (e.g.
   `Zyrtec - Drowsiness`). Side effects never appear on their own; they always sit right
   after their parent treatment.
5. **Illnesses, each followed by its associated symptoms** — sorted alphabetically. (A
   symptom that already appeared as a standalone column, or under an earlier illness, is
   **not** repeated — see §4.5.)
6. **`notes`** — free-text note the user wrote for that whole day. Always the last column.

So a header row looks like:

```
date,survey_recorded,Brain fog,Fatigue,Headache,Ibuprofen,Zyrtec,Zyrtec - Drowsiness,Flu,Cough,Fever,notes
```

Column **headers are the user's own free-typed names.** If a name contains a comma, quote, or
newline, it's wrapped in double quotes per standard CSV rules (e.g. `"Pain, lower back"`).
Day notes are escaped the same way.

### 4.3 Cell values — how each scale is encoded

| What the column tracks | Cell value |
|---|---|
| Boolean symptom/treatment/side-effect — present | `yes` |
| Boolean — not present | `no` |
| Severity — None / Mild / Moderate / Severe | `0` / `1` / `2` / `3` |
| Count | the integer (e.g. `0`, `1`, `4`) |
| Illness — present that day | `yes` |
| Illness — not present that day | `no` |
| **No record for that item on that day** | **blank** (empty cell) |

Notes:

- **Severity is numbers, not words.** `0`=None, `1`=Mild, `2`=Moderate, `3`=Severe. When you
  summarize for the user, translate back to the words — don't show them raw `2`s.
- A `0` (severity None or count 0) and `no` (boolean/illness) are **real recorded values**
  meaning "asked about, and it was at zero/absent that day." A **blank** means something
  different (next section).

### 4.4 The two things that look like "nothing" — don't confuse them

This is the most common misreading. There are **two** distinct "absences":

1. **`survey_recorded = false`** (and the whole row blank): the user **did not fill out the
   app at all** that day. This is missing data. It does **NOT** mean they were healthy or
   symptom-free — you simply don't know what happened. Never count these days as "good days."

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

### 4.6 Other gotchas

- **Dates are day-level** in the device's local time zone. There is no time-of-day in the CSV.
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
| **Measurement scale of each item** | The CSV omits whether a column is boolean/severity/count; you can only *infer* it from the values. The JSON states it explicitly (`measurementScale`). |
| **Per-record notes** | Each individual symptom/treatment/side-effect record can carry its own note. The CSV keeps **only the day-level `notes`**, not these per-item notes. |
| **Tags** | User-defined tags grouping items (with colors). |
| **Photos** | Day photos attached to surveys (the `photos/` folder + filenames). |
| **`createdAt` / `completedAt`** | When an item was first set up, and the timestamp a survey was actually completed (vs. the day it's *for*). |
| **`includeInDailySurvey`** | Whether an item is part of the everyday list. |
| **Reminder settings, custom item ordering** | App preferences. |

### Inferring an item's scale from CSV values

When you only have the CSV, infer the scale from a column's values:

- Only `yes`/`no` → **boolean** (or an **illness** — see below).
- Only `0`/`1`/`2`/`3` → most likely **severity** (`0`=None … `3`=Severe) — **but only for a
  symptom or side-effect column.** Treatments are never severity (see §1), so `0`–`3` in a
  treatment column is a **count**, not a severity level.
- Any integer, especially values above `3` → **count**.

⚠️ Ambiguity: a severity column where the user only ever logged None/Mild looks identical to a
count column that only hit `0`/`1`. And `yes`/`no` is the same for boolean symptoms and
illnesses. Use **column position** to disambiguate where possible (illnesses come *after* all
treatments and side effects; treatment columns are boolean or count only), and when it matters,
check the JSON's `measurementScale`. When unsure, tell the user you're inferring.

### JSON structure (brief reference)

```jsonc
{
  "version": 1,
  "exportDate": "2026-04-20T...",          // ISO 8601 timestamps throughout
  "symptoms":   [ { "name", "measurementScale", "includeInDailySurvey", "createdAt" } ],
  "treatments": [ { "name", "measurementScale", "includeInDailySurvey", "createdAt",
                    "sideEffects": [ { "name", "measurementScale", "createdAt" } ] } ],
  "illnesses":  [ { "name", "includeInDailySurvey", "createdAt",
                    "symptomNames": ["Cough", "Fever"] } ],   // associations by name
  "surveyEvents": [ {
    "date", "completedAt", "notes",
    "symptomRecords":    [ { "symptomName", "date", "value", "notes" } ],
    "treatmentRecords":  [ { "treatmentName", "date", "value", "notes" } ],
    "sideEffectRecords": [ { "treatmentName", "sideEffectName", "date", "value", "notes" } ],
    "illnessRecords":    [ { "illnessName", "date", "isPresent": true } ],
    "photoFilenames": ["<uuid>.jpg"]
  } ],
  "settings": { "reminderEnabled", "reminderHour", "reminderMinute" },
  "surveyItemOrder": [ ... ],
  "tags": [ { "name", "colorIndex", "createdAt",
              "taggedSymptomNames", "taggedTreatmentNames", "taggedIllnessNames" } ]
}
```

Everything links **by name**, not by ID. A measured value is encoded as one of:
`{"boolean": {"_0": true}}`, `{"severity": {"_0": "Moderate"}}`, or `{"count": {"_0": 3}}`.
Fields added in later app versions (`settings`, `surveyItemOrder`, `tags`, `photoFilenames`)
may be absent in older exports — treat them as optional.

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
- **Doctor-visit prep** — a concise, organized summary the user can bring to a clinician.
- **Charts/tables** — timelines of severity, illness spans, treatment frequency.

Always:

- Restate, when relevant, that these are **self-tracked, self-defined** categories — not
  diagnoses — and that you're not a medical professional.
- Be explicit about **missing data** and your denominators (recorded days vs. all days;
  blanks excluded vs. counted).
- Remember the shared data may be **a subset** — a slice of dates and a filtered set of items,
  not their whole record. Frame conclusions as "based on what you shared," and if a `notes`
  entry references something not in the data, treat it as real and ask rather than guessing.
- Flag when a finding rests on **few data points** or could have another explanation.
- For anything worrying or any treatment decision, **point them to a healthcare provider.**

Avoid: diagnosing, prescribing or adjusting treatment, overstating certainty, treating
missing days as healthy days (unless the user confirms that they are),
or treating these labels as clinically validated.
