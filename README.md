# GPT Recap

`gpt-recap` turns an exported OpenAI `conversations.json` file into TikTok/Instagram-ready stories and in-browser charts. Choose the Python CLI for power users or the zero-install web client for everyone else.

## Option 1 — Desktop CLI

1. **Install the package** (inside a virtual environment is recommended):

   ```bash
   pip install .
   ```

   The project depends on `pandas`, `numpy`, `matplotlib`, `seaborn`, and `jinja2`.

2. **Generate a recap** using the bundled CLI:

   ```bash
   gpt-recap conversations.json --output recap_output
   ```

   Replace `conversations.json` with the path to your export. All CSV tables, high-resolution plots, and the HTML recap will be written under `recap_output/` (defaults to `outputs/`).

3. **Open the story** by double-clicking `recap_output/gpt_recap.html` in a browser. The slides are designed for desktop viewing but adapt to smaller screens.

### Outputs

Running the CLI produces:

- Normalised CSV tables (`messages_flat.csv`, `conversation_summary.csv`, etc.) for further analysis in Python, R, or spreadsheets.
- Themed PNG plots sized for presentations: monthly role activity, conversation depth mix, reply-length trends, weekday/hour heatmap, cumulative usage, and more.
- A Spotify-style recap HTML (`gpt_recap.html`) that stitches the stats and plots into a scroll-driven narrative.

## License

MIT
