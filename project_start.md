

# ⚙️ PROJECT: **ReadForge v1.1 — AI Book Summarizer Server + Interactive CLI/TUI**

> “ReadForge turns your book library into daily Telegram digests.
> It reads, summarizes, and delivers knowledge — automatically, beautifully, and locally.”

---

## 🧭 1. OVERVIEW & GOALS

**ReadForge** is a self-hosted automation system that:

1. Runs daily (as a daemon or cron job).
2. Scans a local `/books` directory for PDFs.
3. Picks the next unprocessed file.
4. Extracts text and metadata.
5. Uses **Gemini 2.5 Flash** to create a detailed, human-level summary.
6. Sends that summary via a **Telegram Bot** to the user.
7. Logs each run in CSV + console with aesthetic progress output.
8. Can be configured and managed entirely from a **command-line TUI**.

All modules must be modular, documented, testable, and production-ready.

---

## 🧩 2. SYSTEM ARCHITECTURE

```plaintext
/books
 ├── The Lean Startup.pdf
 ├── Zero to One.pdf
 └── Deep Work.pdf

readforge/
 ├── core/
 │    ├── scanner.py          # locate new PDFs
 │    ├── extractor.py        # extract text + metadata
 │    ├── summarizer.py       # Gemini 2.5 Flash integration
 │    ├── notifier.py         # Telegram bot interface
 │    ├── logger.py           # CLI + CSV logging
 │    ├── config_manager.py   # YAML/env configuration loader/saver
 │    └── scheduler.py        # daily scheduling & daemon loop
 ├── cli/
 │    ├── main.py             # main rich CLI dashboard
 │    └── config_tui.py       # interactive TUI configurator
 ├── data/
 │    ├── summaries_log.csv
 │    ├── processed.txt
 │    └── config.yaml
 ├── .env.example
 ├── requirements.txt
 ├── Dockerfile
 └── README.md
```

---

## ⚙️ 3. DEPENDENCIES

```
rich
textual
pyyaml
python-dotenv
schedule
requests
pandas
PyMuPDF
google-generativeai
```

*(Textual provides the TUI, Rich powers CLI progress bars.)*

---

## 🧰 4. CONFIGURATION SYSTEM

All runtime values are stored in `data/config.yaml`.
Example:

```yaml
books_dir: "/home/twarga/books"
daily_time: "09:00"
books_per_day: 1
summary_style: "concise"       # options: concise | story | academic
gemini_api_key: "sk-xxxxx"
telegram_token: "123456789:ABCdef"
telegram_chat_id: "987654321"
timezone: "Africa/Casablanca"
daemon_mode: true
```

`config_manager.py` handles:

* Loading and validating this file.
* Writing changes made via the TUI.
* Fallback to `.env` for secrets if missing.

---

## 🧠 5. FUNCTIONAL MODULES

### **scanner.py**

* Scan `books_dir` for `.pdf` files.
* Compare names to `processed.txt`.
* Return a list of unprocessed PDFs.
* Allow optional random selection or chronological.

---

### **extractor.py**

* Use `PyMuPDF` (`fitz`) to open PDF.
* Extract text page by page.
* Detect metadata: title, author, page count.
* Return:

  ```python
  {
      "title": "Deep Work",
      "author": "Cal Newport",
      "pages": 302,
      "text": "full raw text..."
  }
  ```

---

### **summarizer.py**

* Use `google-generativeai` client.
* Handle chunking of long texts (≤ 8 k tokens each).
* Summarize each chunk:

  ```text
  You are a professional book summarizer.
  Summarize this text into 10–15 key insights,
  include 2–3 direct quotes, and finish with one-paragraph conclusion.
  ```
* Merge all chunk summaries with a second “synthesis” prompt:

  ```text
  Combine these summaries into a coherent digest
  (800–1200 words, natural tone, feels like reading the book).
  ```
* Support `summary_style` variants (`concise`, `story`, `academic`).
* Return final summary text and token count.

---

### **notifier.py**

* Send Markdown message via Telegram Bot API:

  * `POST https://api.telegram.org/bot{TOKEN}/sendMessage`
  * Fields: `chat_id`, `text`, `parse_mode="Markdown"`
* Split message if > 4000 chars.
* Return message ID + status.

---

### **logger.py**

* Use `rich` for live console feedback:

  * progress bars for each stage (extract → summarize → send → log)
  * success/fail badges
* Append to `summaries_log.csv`:

| date | title | pages | style | tokens | msg_id | duration_s |
| ---- | ----- | ----- | ----- | ------ | ------ | ---------- |

* Update `processed.txt` after success.

---

### **scheduler.py**

* Read `daily_time` and `books_per_day` from config.
* Use `schedule` library for timed jobs.
* Support manual mode (`readforge run --now`).
* When triggered:

  * call `scanner` → `extractor` → `summarizer` → `notifier` → `logger`.
* Run loop for daemon mode.

---

## 🎨 6. CLI / UX DESIGN

### Base Command

```
readforge [subcommand]
```

### Subcommands

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `readforge run`    | Run summarization (one-shot or daily daemon) |
| `readforge config` | Launch the TUI configuration interface       |
| `readforge test`   | Test Gemini + Telegram connectivity          |
| `readforge stats`  | Display CSV log in table format              |

---

### Example CLI Session (Rich)

```bash
$ readforge run

───────────────────────────────
📚 ReadForge v1.1
───────────────────────────────
🔍 Scanning: ~/books
📄 Found 86 PDFs | Processed 42 | Remaining 44
───────────────────────────────
📘 Now processing: "The Lean Startup"
    Pages: 320 | Size: 2.1 MB

[01/05] Extracting text............. ██████████ 100%
[02/05] Summarizing chapters........ ██████████ 100%
[03/05] Merging final digest........ ██████████ 100%
[04/05] Sending to Telegram......... ✅ done
[05/05] Logging results............. ✅ saved
───────────────────────────────
🧠 Tokens: 12 532 | Time: 3 m 22 s | Cost ≈ $0.22
💬 Sent → @TwargaReadingBot (message #942)
💾 Logged to summaries_log.csv
───────────────────────────────
“Another mind forged from ink.”
```

---

## 🖥️ 7. TUI CONFIGURATOR (Textual)

### Launch

```
readforge config
```

### Interface Sketch

```plaintext
──────────────────────────────────────────────
          ⚙️  READFORGE CONFIGURATION
──────────────────────────────────────────────
📅  Daily Schedule      →  09:00
📚  Books per Day       →  1
🧠  Summary Style       →  concise
🤖  Gemini API Key      →  sk-•••••••
💬  Telegram Token      →  1234:•••••••
📨  Chat ID             →  987654321
🌐  Time Zone           →  Africa/Casablanca
──────────────────────────────────────────────
[ Save & Exit ]   [ Test Connections ]   [ Cancel ]
──────────────────────────────────────────────
```

### Behavior

* Arrow keys = navigate; Enter = edit; Space = toggle.
* “Test Connections”:

  * pings Gemini API & Telegram API.
* On save → writes to `data/config.yaml`, prints confirmation in green.

---

## 🧮 8. DAILY WORKFLOW LOGIC

```plaintext
[Cron/Scheduler] → [Scanner] → [Extractor]
     ↓                   ↓
 [Summarizer (Gemini)] → [Notifier (Telegram)]
                                ↓
                         [Logger → CSV + CLI]
```

---

## 📦 9. DOCKER / DEPLOYMENT

**Dockerfile**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "-m", "cli.main"]
```

**Volumes**

```bash
docker run -d \
  -v ~/books:/books \
  -v ~/readforge/data:/app/data \
  readforge
```

**systemd Example**

```
[Unit]
Description=ReadForge Daemon
After=network.target

[Service]
ExecStart=/usr/bin/readforge run --daemon
Restart=always
User=twarga
WorkingDirectory=/home/twarga/readforge

[Install]
WantedBy=multi-user.target
```

---

## 📊 10. CSV LOG EXAMPLE

| date       | title                      | pages | style   | tokens | msg_id | duration_s | cost_usd |
| ---------- | -------------------------- | ----- | ------- | ------ | ------ | ---------- | -------- |
| 2025-10-20 | The Lean Startup           | 320   | concise | 12 532 | 942    | 202        | 0.22     |
| 2025-10-21 | Good Strategy/Bad Strategy | 288   | story   | 14 006 | 945    | 226        | 0.25     |

---

## 🔁 11. EXTENSION IDEAS

| Category       | Future Feature                              |
| -------------- | ------------------------------------------- |
| 🗣 TTS         | convert summary to voice (gTTS/OpenAI TTS)  |
| 🌍 Translation | output summary in multiple languages        |
| 🔎 Search      | SQLite + embeddings to query your summaries |
| 🕸 Web UI      | FastAPI + Tailwind dashboard                |
| 📥 Cloud Sync  | Google Drive / Dropbox ingestion            |

---

## 💡 12. DESIGN & STYLE

* **Color scheme:** cyan + magenta + dark gray.
* **Typography:** monospace borders, subtle gradients.
* **Tone:** calm & professional, minimal emoji accent.
* **Signature line:**

  > “Every day a book dies, and a mind is reborn.”

---

## 🧾 13. PHASED BUILD PLAN (for AI-Coder)

### **Phase 1 — Setup**

* Create repo structure.
* Initialize env, YAML, CSV files.
* Implement `config_manager.py`.

### **Phase 2 — Core Engine**

* Implement `scanner`, `extractor`, `summarizer`, `notifier`, `logger`.
* Test end-to-end manually on one small PDF.

### **Phase 3 — CLI + TUI**

* `cli/main.py` → progress bars, summary table.
* `cli/config_tui.py` → Textual-based configuration UI.

### **Phase 4 — Automation**

* `scheduler.py` for cron/daemon behavior.
* Add CLI subcommands using `argparse` or `typer`.

### **Phase 5 — Polishing**

* Dockerfile + README.
* Systemd service example.
* Unit tests for each core module.
* Pretty ASCII banners + random quotes.

---

## ✅ 14. EXPECTED FINAL OUTPUT

After build completion, the AI should produce:

1. Full working Python project `readforge/`.
2. Interactive TUI configuration (`readforge config`).
3. Rich CLI summarizer with daily schedule.
4. Logs & CSV summaries stored locally.
5. Docker + systemd ready deployment.
6. README with usage examples and screenshots.

---

## 🧑‍💻 15. FINAL INSTRUCTION (for any AI-coder)

> You are the project engineer for **ReadForge v1.1**.
> Begin by creating all folders and files exactly as specified.
> Implement each module in clean, well-documented Python 3.12 code.
> Use PEP-8 formatting, Rich for visuals, and Textual for TUI.
> Test Gemini 2.5 Flash and Telegram API connectivity.
> After each milestone, update a local `progress.md` with completed steps.
> End each run with a demo command showing the system summarizing one PDF and sending it to Telegram successfully.

---

