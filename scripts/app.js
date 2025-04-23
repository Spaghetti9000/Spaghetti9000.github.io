// Helper functions defined outside main
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showMobileWarning() {
  document.body.innerHTML = `
    <div style="padding: 2rem; font-family: sans-serif; text-align: center;">
      <h2>This app is best viewed on a desktop or laptop.</h2>
      <p style="color: #555;">Please switch to a larger screen to view the emails properly.</p>
    </div>
  `;
}

function parseParameters() {
  const params = new URLSearchParams(window.location.search);
  const seedParam = params.get("id");

  // Check that it's all digits and not empty
  if (!seedParam || !/^\d+$/.test(seedParam)) {
    document.body.innerHTML =
      "<h2 style='padding:20px; color:red;'> Missing or invalid. Please click the link in the survey again.</h2>";
    throw new Error("Missing or invalid seed.");
  }

  // Pad with extra zeros
  const seed = seedParam.padStart(10, "0");
  return seed;
}

function cleanUrl() {
  // Clean the URL to remove the encoded seed. fshd
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

async function loadManifest() {
  const manifestUrl = `emails/manifest.json?v=${Date.now()}`; // Avoids caching
  const response = await fetch(manifestUrl);
  const manifest = await response.json();
  return manifest.file_pairs;
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
      <div style="font-weight: 500;">${
        filename.split("/").pop().replace(".html", "").charAt(0).toUpperCase() +
        filename.split("/").pop().replace(".html", "").slice(1)
      }</div>
      <div style="color: #666; font-size: 0.9em;">${
        previewText || "No preview available."
      }</div>
    `;
    });

  return li;
}

function shuffleArray(array, seed) {
  const rng = mulberry32(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadEmails(seed) {
  const filePairs = await loadManifest();
  const list = document.getElementById("email-list");

  const selectedFiles = filePairs.map((filePair, index) => {
    const digit = parseInt(seed[index], 10);
    const useReal = digit % 2 === 0;
    return useReal ? `real/${filePair}.html` : `fake/${filePair}.html`;
  });

  // Sort the files alphabetically by the filename (ignoring the directories)
  selectedFiles.sort((a, b) => {
    const fileA = a.split("/").pop(); // Get the filename part of the path
    const fileB = b.split("/").pop(); // Get the filename part of the path
    return fileA.localeCompare(fileB); // Compare filenames alphabetically
  });
  selectedFiles.forEach((file) => {
    list.appendChild(createEmailPreview(file));
  });
}

// Main function calling all helpers
async function main() {
  if (isMobileDevice()) {
    showMobileWarning();
    return;
  }

  const seed = parseParameters();
  cleanUrl();

  // Finally load emails
  await loadEmails(seed);
}

// Event listener for back to inbox
document.getElementById("back-to-inbox").addEventListener("click", () => {
  document.getElementById("email-list-view").style.display = "block";
  document.getElementById("email-viewer-container").style.display = "none";
  document.getElementById("email-viewer").src = "";
});

// Adjust iframe height when loaded
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

// Run it!
main().catch((err) => {
  console.error("App failed to start:", err);
});
