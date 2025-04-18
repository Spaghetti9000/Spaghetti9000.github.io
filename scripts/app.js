const params = new URLSearchParams(window.location.search);
const seedParam = params.get("seed");
if (!seedParam || isNaN(parseInt(seedParam))) {
  document.body.innerHTML =
    "<h2 style='padding:20px; color:red;'>❌ Missing or invalid <code>seed</code> in URL. Please use something like <code>?seed=1234</code></h2>";
  throw new Error("Missing or invalid seed.");
}
const seed = parseInt(seedParam);

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadManifest() {
  const response = await fetch(`emails/manifest.json?v=${Date.now()}`);
  const manifest = await response.json();
  return manifest.file_pairs;
}

// Select either real or fake version of each email based on randomness
function selectRealOrFake(filePair, rng) {
  return rng() < 0.5 ? `${filePair}.html` : `fake/${filePair}.html`;
}

function createEmailPreview(filename) {
  const li = document.createElement("li");
  li.style.borderBottom = "1px solid #eee";
  li.style.padding = "15px";
  li.style.cursor = "pointer";

  li.addEventListener("click", () => {
    document.getElementById("email-list-view").style.display = "none";
    document.getElementById("email-viewer-container").style.display = "block";
    document.getElementById("email-viewer").src = `emails/${filename}`;
  });

  fetch(`emails/${filename}`)
    .then((res) => res.text())
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const body = doc.body;

      body
        .querySelectorAll("script, style, head, title, meta, link")
        .forEach((el) => el.remove());

      let previewText = "";
      const elements = body.querySelectorAll("p, div, span, td");

      for (const el of elements) {
        const text = el.textContent.trim();
        if (text.length > 20) {
          previewText = text.replace(/\s+/g, " ").slice(0, 100) + "...";
          break;
        }
      }

      li.innerHTML = `
        <div style="font-weight: 500;">${filename.replace(".html", "")}</div>
        <div style="color: #666; font-size: 0.9em;">${
          previewText || "No preview available."
        }</div>
      `;
    });

  return li;
}

document.getElementById("back-to-inbox").addEventListener("click", () => {
  document.getElementById("email-list-view").style.display = "block";
  document.getElementById("email-viewer-container").style.display = "none";
  document.getElementById("email-viewer").src = "";
});

document.getElementById("email-viewer").addEventListener("load", function () {
  const iframe = document.getElementById("email-viewer");

  function adjustIframeHeight() {
    const iframeDocument =
      iframe.contentDocument || iframe.contentWindow.document;
    if (iframeDocument.body.scrollHeight > window.innerHeight) {
      iframe.style.height = iframeDocument.body.scrollHeight + "px";
    } else {
      iframe.style.height = "100vh";
    }
  }

  adjustIframeHeight();
  iframe.contentWindow.addEventListener("resize", adjustIframeHeight);
});

function shuffleArray(array, seed) {
  const rng = mulberry32(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadEmails() {
  const filePairs = await loadManifest();
  const list = document.getElementById("email-list");

  const rngFunction = mulberry32(seed);
  const randomValues = filePairs.map(() => rngFunction());

  const selectedFiles = filePairs.map((filePair, index) => {
    const useReal = randomValues[index] < 0.5;
    return useReal ? `true/${filePair}.html` : `fake/${filePair}.html`;
  });

  selectedFiles.forEach((file) => {
    list.appendChild(createEmailPreview(file));
  });
}

loadEmails();
