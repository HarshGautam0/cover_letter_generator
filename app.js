const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "coverLetters";

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ---------- Helpers ---------- */

const today = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function esc(text = "") {
  return String(text).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}

function listJoin(items) {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function toSentence(text) {
  return text.replace(/[.;:,]+$/, "") + ".";
}

function currentTemplate() {
  return document.querySelector('input[name="template"]:checked').value;
}

/* ---------- Resume reading ---------- */

async function readPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let out = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    let lastY = null,
      line = "";
    for (const item of content.items) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        out += line.trim() + "\n";
        line = "";
      }
      line += item.str + " ";
      lastY = y;
    }
    out += line.trim() + "\n";
  }
  return out;
}

async function readDocx(file) {
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return result.value;
}

/* ---------- Resume parsing (rule-based) ---------- */

const SECTION_PATTERNS = {
  skills: /^(technical\s+)?(skills|core competencies|key skills)\b/i,
  experience:
    /^(work\s+|professional\s+)?(experience|employment|work history)\b/i,
  education: /^(education|academic background|qualifications)\b/i,
};

function parseResume(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [""])[0];
  const phone = (text.match(/\+?\d[\d\s().-]{7,}\d/) || [""])[0].trim();
  const name = lines.find((l) => l.length < 50 && !/[@\d]/.test(l)) || "";

  const sections = { skills: [], experience: [], education: [] };
  let current = null;

  for (const line of lines) {
    const heading = Object.keys(SECTION_PATTERNS).find(
      (k) => SECTION_PATTERNS[k].test(line) && line.length < 40,
    );
    if (heading) {
      current = heading;
      continue;
    }
    if (current) sections[current].push(line);
  }

  const location =
    lines.find(
      (l) =>
        /\b(city|state|country)\b|,\s*[A-Z][a-z]+/.test(l) &&
        l.length < 60 &&
        !/[@\d]/.test(l),
    ) || "";

  return {
    name,
    email,
    phone,
    location,
    skills: sections.skills.join(", ").replace(/[•|]/g, ","),
    experience: sections.experience.join("\n"),
    education: sections.education.join("\n"),
  };
}

function fillResumeForm(r) {
  $("rName").value = r.name || "";
  $("rEmail").value = r.email || "";
  $("rPhone").value = r.phone || "";
  $("rLocation").value = r.location || "";
  $("rSkills").value = r.skills || "";
  $("rExperience").value = r.experience || "";
  $("rEducation").value = r.education || "";
}

function readResume() {
  return {
    name: $("rName").value.trim(),
    email: $("rEmail").value.trim(),
    phone: $("rPhone").value.trim(),
    location: $("rLocation").value.trim(),
    skills: $("rSkills").value.trim(),
    experience: $("rExperience").value.trim(),
    education: $("rEducation").value.trim(),
  };
}

function readCompany() {
  return {
    company: $("cCompany").value.trim(),
    role: $("cRole").value.trim(),
    hiring: $("cHiring").value.trim(),
    jd: $("cJD").value.trim(),
    requirements: $("cRequirements").value.trim(),
  };
}

function fillCompanyForm(c) {
  $("cCompany").value = c.company || "";
  $("cRole").value = c.role || "";
  $("cHiring").value = c.hiring || "";
  $("cJD").value = c.jd || "";
  $("cRequirements").value = c.requirements || "";
}

/* ---------- Letter generation (formal, template-based) ---------- */

function buildLetter(r, c) {
  const skills = r.skills
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const reqs = c.requirements
    .split("\n")
    .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean);
  const jd = c.jd.toLowerCase();
  const matched = skills.filter((s) => jd.includes(s.toLowerCase()));
  const topSkills = (matched.length ? matched : skills).slice(0, 3);
  const achievements = r.experience
    .split("\n")
    .map((s) => s.replace(/^[-•*\s]+/, "").trim())
    .filter((s) => s.length > 40)
    .slice(0, 3);
  const education = r.education.split("\n")[0] || "";

  const paras = [];
  paras.push(c.hiring ? `Dear ${c.hiring},` : "Dear Hiring Manager,");

  paras.push(
    `I am writing to express my strong interest in the ${c.role} position at ${c.company}. ` +
      (topSkills.length
        ? `With my background in ${listJoin(topSkills)}, I am confident that I can make a meaningful contribution to your team from the outset.`
        : `I am confident that my professional experience makes me a suitable candidate for this role.`),
  );

  if (achievements.length) {
    paras.push(
      "Throughout my professional career, I have developed a record of delivering results. " +
        achievements.map(toSentence).join(" "),
    );
  }

  if (reqs.length) {
    paras.push(
      `I have carefully reviewed the requirements of this position, and I believe my experience aligns well with ${listJoin(reqs.slice(0, 3))}.`,
    );
  }

  if (education) {
    paras.push(
      `My academic background, ${toSentence(education.trim())} has provided me with a solid foundation for this position.`,
    );
  }

  paras.push(
    `I am particularly drawn to ${c.company} and to the opportunity to contribute to its goals. ` +
      "I would welcome the chance to discuss how my qualifications can support your organization. " +
      "Thank you for your time and consideration. I look forward to hearing from you.",
  );

  return paras.join("\n\n");
}

/* ---------- Preview ---------- */

function renderPreview() {
  const r = readResume();
  const c = readCompany();
  const tpl = currentTemplate();
  const body = $("letterBody").value.trim();
  const paras = body
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => `<p>${esc(p.trim())}</p>`)
    .join("");
  const contact = [r.email, r.phone, r.location].filter(Boolean).join("  |  ");

  $("preview").className = "letter tpl-" + tpl;
  $("preview").innerHTML = `
    <div class="lt-header">
      <div class="lt-name">${esc(r.name || "Your Name")}</div>
      <div class="lt-contact">${esc(contact)}</div>
    </div>
    <div class="lt-date">${esc(today())}</div>
    <div class="lt-recipient">${esc(c.hiring || "Hiring Manager")}<br>${esc(c.company || "Company Name")}</div>
    <p class="lt-subject">Application for ${esc(c.role || "the position")}</p>
    <div class="lt-body">${paras}</div>
    <div class="lt-sign">Yours sincerely,<br><br><strong>${esc(r.name)}</strong></div>`;
}

/* ---------- PDF export ---------- */

function exportPdf() {
  const body = $("letterBody").value.trim();
  if (!body) return alert("Generate a letter before downloading.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const r = readResume();
  const c = readCompany();
  const tpl = currentTemplate();

  const M = 22; // margin in mm
  const W = 210 - M * 2; // text width in mm
  const font = tpl === "classic" ? "times" : "helvetica";
  let y = 30;

  const ensureSpace = (h) => {
    if (y + h > 280) {
      doc.addPage();
      y = 25;
    }
  };

  const writeLines = (text, size, style = "normal", gap = 3) => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, W);
    lines.forEach((line) => {
      ensureSpace(size * 0.5);
      doc.text(line, M, y);
      y += size * 0.5;
    });
    y += gap;
  };

  const contact = [r.email, r.phone, r.location].filter(Boolean).join("  |  ");

  // Header per template
  if (tpl === "modern") {
    doc.setFillColor(31, 78, 121);
    doc.rect(0, 0, 210, 42, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(font, "bold");
    doc.setFontSize(20);
    doc.text(r.name || "Your Name", M, 18);
    doc.setFont(font, "normal");
    doc.setFontSize(10);
    doc.text(contact, M, 28);
    doc.setTextColor(31, 41, 51);
    y = 56;
  } else if (tpl === "classic") {
    doc.setTextColor(20, 20, 20);
    doc.setFont(font, "bold");
    doc.setFontSize(20);
    doc.text(r.name || "Your Name", 105, y, { align: "center" });
    y += 7;
    doc.setFont(font, "normal");
    doc.setFontSize(10);
    doc.text(contact, 105, y, { align: "center" });
    y += 4;
    doc.line(M, y, 210 - M, y);
    y += 12;
  } else {
    doc.setTextColor(30, 30, 30);
    doc.setFont(font, "bold");
    doc.setFontSize(16);
    doc.text((r.name || "Your Name").toUpperCase(), M, y);
    y += 6;
    doc.setFont(font, "normal");
    doc.setFontSize(9);
    doc.setTextColor(97, 110, 124);
    doc.text(contact, M, y);
    doc.setTextColor(30, 30, 30);
    y += 16;
  }

  // Letter content
  doc.setTextColor(30, 30, 30);
  writeLines(today(), 11, "normal", 8);
  writeLines(
    `${c.hiring || "Hiring Manager"}\n${c.company || "Company Name"}`,
    11,
    "normal",
    8,
  );
  writeLines(`Application for ${c.role || "the position"}`, 11, "bold", 6);

  body
    .split(/\n\s*\n/)
    .filter(Boolean)
    .forEach((p) => writeLines(p.trim(), 11, "normal", 4));

  y += 4;
  writeLines("Yours sincerely,", 11, "normal", 12);
  writeLines(r.name, 11, "bold", 0);

  const safe = (s) => (s || "").replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
  doc.save(
    `${safe(r.name) || "Cover_Letter"}_${safe(c.company) || "Company"}.pdf`,
  );
}

/* ---------- Saved letters ---------- */

function getSaved() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setSaved(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderSaved() {
  const list = getSaved();
  const ul = $("savedList");
  if (!list.length) {
    ul.innerHTML = `<li class="empty">No saved letters yet.</li>`;
    return;
  }
  ul.innerHTML = list
    .map(
      (item) => `
    <li>
      <span><strong>${esc(item.role)}</strong> at ${esc(item.company)}
        <small>(${esc(item.date)}, ${esc(item.template)})</small></span>
      <span>
        <button class="btn" data-load="${item.id}">Load</button>
        <button class="btn" data-delete="${item.id}">Delete</button>
      </span>
    </li>`,
    )
    .join("");
}

function saveLetter() {
  const body = $("letterBody").value.trim();
  if (!body) return alert("Generate a letter before saving.");
  const list = getSaved();
  list.unshift({
    id: Date.now(),
    company: readCompany().company || "Unknown company",
    role: readCompany().role || "Unknown role",
    template: currentTemplate(),
    date: today(),
    resume: readResume(),
    companyData: readCompany(),
    body,
  });
  setSaved(list);
  renderSaved();
}

function loadLetter(id) {
  const item = getSaved().find((i) => i.id === id);
  if (!item) return;
  fillResumeForm(item.resume);
  fillCompanyForm(item.companyData);
  const radio = document.querySelector(
    `input[name="template"][value="${item.template}"]`,
  );
  if (radio) radio.checked = true;
  $("letterBody").value = item.body;
  renderPreview();
  window.scrollTo({ top: $("preview").offsetTop - 20, behavior: "smooth" });
}

function deleteLetter(id) {
  setSaved(getSaved().filter((i) => i.id !== id));
  renderSaved();
}

function copyText() {
  const body = $("letterBody").value;
  navigator.clipboard
    .writeText(body)
    .then(() => alert("Letter text copied to clipboard."))
    .catch(() =>
      alert(
        "Could not copy automatically. Please select the text and copy it manually.",
      ),
    );
}

/* ---------- Event wiring ---------- */

$("resumeFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const name = file.name.toLowerCase();
  $("uploadStatus").textContent = `Reading ${file.name}...`;

  try {
    let text;
    if (name.endsWith(".pdf")) text = await readPdf(file);
    else if (name.endsWith(".docx")) text = await readDocx(file);
    else throw new Error("Please upload a PDF or DOCX file.");

    if (!text.trim())
      throw new Error(
        "No readable text found. Scanned images are not supported.",
      );
    fillResumeForm(parseResume(text));
    $("uploadStatus").textContent =
      "Resume read successfully. Please check the fields below.";
  } catch (err) {
    $("uploadStatus").textContent = err.message || "Could not read this file.";
  }
});

$("generateBtn").addEventListener("click", () => {
  const r = readResume();
  const c = readCompany();
  if (!r.name || !c.company || !c.role) {
    alert("Please enter your name, the company name, and the job title.");
    return;
  }
  $("letterBody").value = buildLetter(r, c);
  renderPreview();
});

$("letterBody").addEventListener("input", renderPreview);
$("downloadBtn").addEventListener("click", exportPdf);
$("saveBtn").addEventListener("click", saveLetter);
$("copyBtn").addEventListener("click", copyText);

$("savedList").addEventListener("click", (e) => {
  const loadId = e.target.dataset.load;
  const deleteId = e.target.dataset.delete;
  if (loadId) loadLetter(Number(loadId));
  if (deleteId) deleteLetter(Number(deleteId));
});

// Refresh preview when the template or header fields change
document
  .querySelectorAll('input[name="template"]')
  .forEach((radio) => radio.addEventListener("change", renderPreview));
[
  "rName",
  "rEmail",
  "rPhone",
  "rLocation",
  "cCompany",
  "cRole",
  "cHiring",
].forEach((id) => $(id).addEventListener("input", renderPreview));

renderSaved();
renderPreview();
