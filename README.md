# Cover Letter Designer

A simple, privacy-friendly web app that creates formal, tailored cover letters from your resume and the details of the job you are applying for. It runs entirely in your browser: no API key, no account, and no server.

## Features

- **Resume upload:** Accepts PDF and DOCX files and fills in your name, contact details, skills, experience, and education automatically.
- **Tailored letters:** Matches your skills against the job description and key requirements to highlight the most relevant points.
- **Three templates:** Classic (serif, centred header), Modern (coloured header band), and Minimal (clean and left-aligned).
- **PDF download:** Exports an A4 PDF formatted for the chosen template.
- **Editable preview:** Edit the letter text directly, with the preview updating as you type.
- **Saved letters:** Store letters for different companies in your browser and reload or delete them later.
- **Copy text:** Copy the letter body to the clipboard in one click.
- **Private by design:** Resume data is read and processed locally. Nothing is uploaded to a server.

## Project Structure

```
cover-letter-designer/
├── index.html      # Home page
├── designer.html   # The cover letter designer app
├── styles.css      # All styling (home page and app)
├── script.js       # Resume parsing, letter generation, PDF export, saved letters
└── README.md       # This file
```

## Getting Started

### Requirements

- A modern web browser (Chrome, Edge, Firefox, or Safari)
- An internet connection the first time you open the app, because the PDF and DOCX libraries are loaded from a CDN

### Running the App

1. Download or clone the project folder.
2. Open `index.html` in your browser.
3. Click **Start designing** to open the app.

No build step, installation, or server is required. You can also run it with a simple local server:

```bash
cd cover-letter-designer
python -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## How to Use

1. **Upload your resume.** Choose a PDF or DOCX file. The app extracts the text and fills in the fields. Check and correct them where needed.
2. **Enter company details.** Provide the company name, job title, hiring manager (optional), job description, and key requirements (one per line).
3. **Choose a template.** Select Classic, Modern, or Minimal.
4. **Generate the letter.** Click **Generate cover letter**. The letter is written in a formal style and shown in the preview.
5. **Edit and export.** Adjust the letter body if needed, then click **Download PDF**, **Save letter**, or **Copy text**.

## Tips for Best Results

- Paste the full job description. The app uses it to find skills that match your resume.
- Write key requirements one per line. The first three are used in the letter.
- Use one achievement or responsibility per line in the Experience field. Lines longer than about 40 characters are used as achievement sentences.
- Review the generated text before sending. The letter is built from rules, not AI, so it may need small wording changes to sound natural for your situation.

## Limitations

- **Scanned resumes are not supported.** Only resumes with selectable text can be read. If the extraction misses something, fill the field by hand.
- **Parsing is rule-based.** Section headings such as "Skills", "Experience", and "Education" are detected by keyword. Unusual headings may need manual correction.
- **Browser storage is local.** Saved letters are kept in your browser's local storage. Clearing browser data or using a different browser or device will remove them.
- **Internet is needed for libraries.** The PDF.js, Mammoth, and jsPDF libraries load from a CDN. For fully offline use, download these files and update the script tags in `designer.html`.
- **Simple PDF layout.** Long letters are split across pages automatically, but the layout does not include a photo or icons.

## Customising

- **Colours and fonts:** Edit the CSS variables at the top of `styles.css` (for example, `--primary` and `--accent`).
- **Letter wording:** Edit the `buildLetter` function in `script.js` to change the paragraphs, tone, or closing.
- **Section detection:** Edit the `SECTION_PATTERNS` object in `script.js` to recognise other headings in your language.
- **Templates:** Add a new `tpl-*` class in `styles.css`, a radio option in `designer.html`, and a matching branch in `exportPdf` in `script.js`.

## Browser Compatibility

The app is designed for current versions of Chrome, Edge, Firefox, and Safari. The `:has()` selector used to highlight the selected template card needs a recent browser. Older browsers will still work but will not highlight the selected card.

## Privacy

All processing happens in your browser. Your resume and letters are not sent to any server. Saved letters are stored only in your browser's local storage, and you can delete them at any time with the **Delete** button.

## Licence

This project is provided for personal use. Add your preferred licence (for example, MIT) before sharing it publicly.

## Acknowledgements

- [PDF.js](https://mozilla.github.io/pdf.js/) for reading PDF files
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for reading DOCX files
- [jsPDF](https://github.com/parallax/jsPDF) for generating PDF documents
