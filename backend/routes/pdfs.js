// routes/pdfs.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import Pdf from "../models/Pdf.js";
import {
  protect,
  authorize,
  requireMentorApproval,
  optionalAuth,
} from "../middleware/auth.js";
import { deductCredits } from "../services/credits.js";

const router = express.Router();

/* ------------------------------ Paths & FS ------------------------------ */
const uploadRoot = path.join(process.cwd(), "uploads");
const pdfDir = path.join(uploadRoot, "pdfs");
const coverDir = path.join(uploadRoot, "covers");

// Ensure directories exist
[uploadRoot, pdfDir, coverDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* ------------------------------ Multer setup ---------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "pdf") return cb(null, pdfDir);
    if (file.fieldname === "cover") return cb(null, coverDir);
    cb(null, uploadRoot); // fallback
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "pdf") {
      if (file.mimetype !== "application/pdf") {
        return cb(new Error("Only PDF is allowed for the 'pdf' field"));
      }
    }
    if (file.fieldname === "cover") {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Cover must be an image"));
      }
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get("/tags", async (_req, res) => {
  try {
    const tags = await Pdf.distinct("tags");
    res.json({ success: true, tags: (tags || []).filter(Boolean).sort() });
  } catch (e) {
    console.error("tags endpoint error:", e);
    res.status(500).json({ success: false, error: "Failed to load tags" });
  }
});


router.get("/", async (req, res) => {
  try {
    const { search, sortBy = "createdAt", sortDir = "desc", userId } = req.query;
    const query = {};
    
    if (userId) query.owner = userId;
    
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { filename: searchRegex },
        { tags: searchRegex },
        { description: searchRegex }
      ];
    }

    const sort = { [sortBy]: sortDir === "desc" ? -1 : 1 };
    const docs = await Pdf.find(query).sort(sort);

    res.json(docs);
  } catch (err) {
    console.error("List PDFs error:", err);
    res.status(500).json({ error: "Failed to list PDFs" });
  }
});



router.post(
  "/upload",
  upload.fields([{ name: "pdf", maxCount: 1 }, { name: "cover", maxCount: 1 }]),
  async (req, res) => {
    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!pdfFile) return res.status(400).json({ error: "No PDF uploaded" });

    try {
      const existingPdfBytes = await fs.promises.readFile(pdfFile.path);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const timestamp = new Date().toISOString();
      pages.forEach((page, i) => {
        page.drawText(`Secure View: ${timestamp} | Page ${i + 1}`, {
          x: page.getWidth() - 200,
          y: 50,
          size: 10,
          color: rgb(1, 0, 0),
        });
      });
      const modifiedPdfBytes = await pdfDoc.save();
      await fs.promises.writeFile(pdfFile.path, modifiedPdfBytes);

      // parse body
      const { title, tags, description, rating } = req.body;
      const tagsArr = (tags || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let coverImage = "";
      if (coverFile) {
        coverImage = `/uploads/covers/${coverFile.filename}`;
      }

      const newPdf = await Pdf.create({
        filename: pdfFile.originalname,
        title: title || pdfFile.originalname,
        path: `/uploads/pdfs/${pdfFile.filename}`,
        coverImage,
        description: description || "",
        rating: isNaN(Number(rating)) ? 0 : Math.max(0, Math.min(5, Number(rating))),
        tags: tagsArr,
        size: pdfFile.size,
        owner: req.user?._id,
      });

      res.json({
        success: true,
        data: {
          _id: newPdf._id,
          filename: newPdf.filename,
          title: newPdf.title,
          coverImage: newPdf.coverImage,
        },
      });
    } catch (error) {
      console.error("Upload save error:", error);
      if (pdfFile && fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
      if (coverFile && fs.existsSync(coverFile.path)) fs.unlinkSync(coverFile.path);
      res.status(500).json({ error: "Failed to save PDF metadata" });
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: "PDF not found" });

    const publicPrefix = "/uploads/";
    if (!pdf.path?.startsWith(publicPrefix)) {
      return res.status(500).json({ error: "Invalid stored PDF path" });
    }
    const fsPath = path.join(process.cwd(), pdf.path.replace(/^\//, ""));

    if (!fs.existsSync(fsPath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    const stat = fs.statSync(fsPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader("Accept-Ranges", "bytes");

    if (range) {
      if (range.includes(",")) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }

      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }

      let start = m[1] === "" ? 0 : parseInt(m[1], 10);
      let end = m[2] === "" ? fileSize - 1 : parseInt(m[2], 10);

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start > end ||
        start >= fileSize
      ) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }
      end = Math.min(end, fileSize - 1);

      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunkSize,
        "Content-Type": "application/pdf",
      });

      const file = fs.createReadStream(fsPath, { start, end });

      file.on("error", (err) => {
        console.error("Read stream error:", err);
        if (!res.headersSent)
          res.status(500).json({ error: "Failed to stream PDF" });
        try {
          file.destroy();
        } catch {}
      });

      res.on("close", () => {
        try {
          file.destroy();
        } catch {}
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "application/pdf",
      });

      const file = fs.createReadStream(fsPath);

      file.on("error", (err) => {
        console.error("Read stream error:", err);
        if (!res.headersSent)
          res.status(500).json({ error: "Failed to stream PDF" });
        try {
          file.destroy();
        } catch {}
      });

      res.on("close", () => {
        try {
          file.destroy();
        } catch {}
      });

      file.pipe(res);
    }
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ error: "Failed to stream PDF" });
  }
});

/* ---------------------- Mentor demo endpoints (ok) ---------------------- */
router.post(
  "/mentor-upload",
  protect,
  authorize("mentor"),
  requireMentorApproval,
  async (req, res) => {
    res.json({
      message: "Approved mentor uploaded resource",
      uploadedBy: req.user.name,
    });
  }
);

router.post(
  "/courses",
  protect,
  authorize("mentor"),
  requireMentorApproval,
  async (req, res) => {
    res.json({ message: "Approved mentor created course" });
  }
);

/* ------------------------------- Delete PDF ----------------------------- */
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const doc = await Pdf.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "PDF not found" });

    // Delete files if present
    try {
      // path & coverImage are public URLs; map to filesystem paths
      const toFs = (p) =>
        p && p.startsWith("/uploads/")
          ? path.join(process.cwd(), p.replace(/^\//, ""))
          : null;

      const filePaths = [toFs(doc.path), toFs(doc.coverImage)].filter(Boolean);
      for (const pth of filePaths) {
        if (pth && fs.existsSync(pth)) fs.unlinkSync(pth);
      }
    } catch {}

    res.json({ success: true });
  } catch (err) {
    console.error("Delete PDF error:", err);
    res.status(500).json({ error: "Failed to delete PDF" });
  }
});

/* ------------------------- PDF details + similar ------------------------ */
router.get("/:id/details", optionalAuth, async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf)
      return res.status(404).json({ success: false, error: "PDF not found" });

    const similar = await Pdf.find({
      _id: { $ne: pdf._id },
      ...(pdf.tags?.length ? { tags: { $in: pdf.tags } } : {}),
    })
      .select("_id title filename coverImage rating tags")
      .limit(12)
      .sort({ createdAt: -1 });

    let isFavorite = false;
    if (req.user?.favorites?.length) {
      isFavorite = req.user.favorites.some(
        (fid) => fid.toString() === pdf._id.toString()
      );
    }

    res.json({ success: true, data: { pdf, isFavorite, similar } });
  } catch (err) {
    console.error("PDF details error:", err);
    res.status(500).json({ success: false, error: "Failed to load details" });
  }
});

/* ------------------------------ Favorite toggle ------------------------- */
router.post("/:id/favorite", protect, async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf)
      return res.status(404).json({ success: false, error: "PDF not found" });

    const user = req.user;
    const idx = (user.favorites || []).findIndex(
      (fid) => fid.toString() === pdf._id.toString()
    );

    let favorited;
    if (idx === -1) {
      user.favorites.push(pdf._id);
      pdf.favoritesCount = (pdf.favoritesCount || 0) + 1;
      favorited = true;
    } else {
      user.favorites.splice(idx, 1);
      pdf.favoritesCount = Math.max(0, (pdf.favoritesCount || 0) - 1);
      favorited = false;
    }

    await user.save();
    await pdf.save();

    res.json({ success: true, favorited, favoritesCount: pdf.favoritesCount });
  } catch (err) {
    console.error("Favorite error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to update favorite" });
  }
});

/* ------------------------ Download (deduct credits) --------------------- */
router.post("/:id/download", protect, async (req, res) => {
  try {
    const COST = 5;
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf)
      return res.status(404).json({ success: false, error: "PDF not found" });

    const remaining = await deductCredits(
      req.user,
      COST,
      `Download "${pdf.title || pdf.filename}"`
    );
    pdf.downloads = (pdf.downloads || 0) + 1;
    await pdf.save();

    res.json({
      success: true,
      message: "Credits deducted. You can proceed to download.",
      remainingCredits: remaining,
    });
  } catch (err) {
    console.error("Download deduct error:", err);
    const status = err.statusCode || 500;
    res.status(status).json({
      success: false,
      error: err.message || "Failed to process download",
      code: err.code,
    });
  }
});

export default router;
