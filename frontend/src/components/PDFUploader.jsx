// src/components/PDFUploader.jsx
import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Image } from "lucide-react";
import TagPicker from "@/components/TagPicker";

export default function PDFUploader({ onUpload }) {
  const { isAdmin } = useAuth();
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!isAdmin) return null;

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || file.type !== "application/pdf") {
      return alert("Please pick a valid PDF");
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("pdf", file);
      if (cover) form.append("cover", cover);
      if (title) form.append("title", title);
      if (tags?.length) form.append("tags", tags.join(","));
      if (description) form.append("description", description);
      if (rating) form.append("rating", rating);

      const res = await fetch("/api/pdfs/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      onUpload?.(data);
      setFile(null);
      setCover(null);
      setTitle("");
      setTags([])
      setDescription("");
      setRating("");

      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input) => (input.value = ""));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-emerald-200 bg-white/80 backdrop-blur shadow-md">
      <CardHeader className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardTitle className="text-emerald-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-600" />
          Upload New PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleUpload} className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-emerald-900 font-medium">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Enter PDF title"
              />
            </div>

            <TagPicker value={tags} onChange={setTags} />

            <div>
              <Label htmlFor="rating" className="text-emerald-900 font-medium">
                Rating (0-5)
              </Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="mt-1.5 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="4.5"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <Label className="text-emerald-900 font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                PDF File
              </Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="mt-1.5 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
              />
              {file && (
                <p className="text-xs text-emerald-600 mt-1.5">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <div>
              <Label className="text-emerald-900 font-medium flex items-center gap-2">
                <Image className="w-4 h-4 text-emerald-600" />
                Cover Image (optional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setCover(e.target.files[0] || null)}
                className="mt-1.5 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
              />
              {cover && (
                <p className="text-xs text-emerald-600 mt-1.5">
                  Selected: {cover.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="desc" className="text-emerald-900 font-medium">
                Description
              </Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 min-h-[80px]"
                placeholder="Short summary of the book…"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={uploading || !file}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
