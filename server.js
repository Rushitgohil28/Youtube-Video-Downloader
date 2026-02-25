const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

/* ===============================
   1️⃣ GET VIDEO INFO
=================================*/
app.get("/info", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL missing");

  const cmd = `yt-dlp --no-check-certificate --extractor-args "youtube:player_client=android" -j "${url}"`;

  exec(cmd, (err, stdout) => {
    if (err) return res.status(500).send("Failed to fetch info");

    const data = JSON.parse(stdout);

    res.json({
      title: data.title,
      thumbnail: data.thumbnail
    });
  });
});

/* ===============================
   2️⃣ DOWNLOAD VIDEO / AUDIO
=================================*/
app.get("/download", (req, res) => {
  const { url, quality } = req.query;
  if (!url || !quality) return res.status(400).send("Missing data");

  const infoCmd = `yt-dlp --no-check-certificate --extractor-args "youtube:player_client=android" -j "${url}"`;

  exec(infoCmd, (err, stdout) => {
    if (err) return res.status(500).send("Error fetching title");

    const data = JSON.parse(stdout);

    // Clean file name
    const safeTitle = data.title.replace(/[<>:"/\\|?*]+/g, "");

    let fileName;
    let filePath;
    let cmd;

    if (quality === "mp3") {
      fileName = `${safeTitle}.mp3`;
      filePath = path.join(__dirname, fileName);

      cmd = `yt-dlp --no-check-certificate --extractor-args "youtube:player_client=android" -f "bestaudio" -x --audio-format mp3 -o "${filePath}" "${url}"`;
    } else {
      fileName = `${safeTitle}_${quality}p.mp4`;
      filePath = path.join(__dirname, fileName);

      cmd = `yt-dlp --no-check-certificate --extractor-args "youtube:player_client=android" -f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]" --merge-output-format mp4 -o "${filePath}" "${url}"`;
    }

    exec(cmd, (error) => {
      if (error) {
        console.log(error);
        return res.status(500).send("Download failed");
      }

      res.download(filePath, fileName, () => {
        fs.unlink(filePath, () => {});
      });
    });
  });
});

/* ===============================
   3️⃣ DOWNLOAD THUMBNAIL
=================================*/
app.get("/thumbnail", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL missing");

  const cmd = `yt-dlp --no-check-certificate --extractor-args "youtube:player_client=android" -j "${url}"`;

  exec(cmd, (err, stdout) => {
    if (err) return res.status(500).send("Thumbnail failed");

    const data = JSON.parse(stdout);
    res.redirect(data.thumbnail);
  });
});

/* =============================== */

app.listen(5000, () => {
  console.log("🚀 Backend running at http://localhost:5000");
});