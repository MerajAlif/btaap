import { useEffect, useMemo, useState } from "react";
import { api, BASE_URL } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import PDFUploader from "./PDFUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Heart, Search } from "lucide-react";
import PdfModal from "@/components/PdfModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PDFStorage() {
  const { user, isAdmin, refreshMe } = useAuth();
  const credits = user?.credits ?? 0;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [filterTag, setFilterTag] = useState("");

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api(
        `/api/pdfs?search=${encodeURIComponent(
          search
        )}&sortBy=${sortBy}&sortDir=${sortDir}`,
        { auth: !!user }
      );
      const data = Array.isArray(res) ? res : res.pdfs || res.data || [];
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, sortBy, sortDir]);

  

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    list.forEach((pdf) => {
      (pdf.tags || []).forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [list]);

  const displayList = useMemo(() => {
    let arr = [...list];

    // Filter by tag
    if (filterTag) {
      arr = arr.filter((pdf) => (pdf.tags || []).includes(filterTag));
    }

    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      if (sortBy === "filename") {
        return (a.filename || "").localeCompare(b.filename || "") * dir;
      }
      if (sortBy === "rating") {
        return ((a.rating || 0) - (b.rating || 0)) * dir;
      }
      if (sortBy === "downloads") {
        return ((a.downloads || 0) - (b.downloads || 0)) * dir;
      }
      if (sortBy === "favoritesCount") {
        return ((a.favoritesCount || 0) - (b.favoritesCount || 0)) * dir;
      }
      // default: createdAt
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return (ad - bd) * dir;
    });
    return arr;
  }, [list, sortBy, sortDir, filterTag]);

  const openPreview = (id) => {
    setActiveId(id);
    setOpen(true);
  };

  const onDownloaded = async () => {
    await refreshMe();
  };

  const onFavoritedChange = (id, isFav, count) => {
    setList((prev) =>
      prev.map((p) => (p._id === id ? { ...p, favoritesCount: count } : p))
    );
  };

  // Helper to get cover image URL
  const getCoverUrl = (coverImage) => {
    if (!coverImage) return "";
    if (coverImage.startsWith("http")) return coverImage;
    const cleanPath = coverImage.replace(/^\//, "");
    return `${BASE_URL}/${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-emerald-900">E-Library</h1>
            <p className="text-sm text-emerald-700 mt-1">
              Browse, preview, favorite, and download PDFs. Downloads cost 5
              credits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white px-4 py-1.5">
              Credits: {credits}
            </Badge>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => (window.location.href = "/pricing")}
            >
              Buy Credits
            </Button>
          </div>
        </div>

        {/* ──────────────────────────────────────── Controls ──────────────────────────────────────── */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur shadow-sm">
          <CardContent className="py-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* ── Search ── */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                <Input
                  placeholder="Search title or tags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {/* ── Tag Filter (dropdown) ── */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-700 font-medium whitespace-nowrap">
                  Filter:
                </span>
                <Select
                  value={filterTag || "all"}
                  onValueChange={(val) =>
                    setFilterTag(val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger className="w-[140px] border-emerald-200 focus:border-emerald-500">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Sort By ── */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-700 font-medium whitespace-nowrap">
                  Sort:
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px] border-emerald-200 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date</SelectItem>
                    <SelectItem value="filename">Name</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="downloads">Downloads</SelectItem>
                    <SelectItem value="favoritesCount">Favorites</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Sort Direction ── */}
              <Select value={sortDir} onValueChange={setSortDir}>
                <SelectTrigger className="w-[120px] border-emerald-200 focus:border-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">High to Low</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Admin Uploader */}
        {isAdmin && <PDFUploader onUpload={load} />}

        {/* Results count */}
        {!loading && (
          <div className="text-sm text-emerald-700">
            {displayList.length} {displayList.length === 1 ? "PDF" : "PDFs"}
            {filterTag && ` with tag "${filterTag}"`}
          </div>
        )}

        {/* Grid - Compact cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <Card
                key={`sk-${i}`}
                className="animate-pulse border-emerald-200"
              >
                <div className="aspect-[3/4] bg-emerald-100 rounded-t-lg" />
                <CardContent className="space-y-2 py-3">
                  <div className="h-4 bg-emerald-100 rounded w-2/3" />
                  <div className="h-3 bg-emerald-100 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}

          {!loading && displayList.length === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-4 border-emerald-200">
              <CardContent className="py-10 text-center text-emerald-700">
                No PDFs found. Try different search or filter.
              </CardContent>
            </Card>
          )}

          {!loading &&
            displayList.map((pdf) => {
              const sizeLabel =
                typeof pdf.size === "number"
                  ? `${(pdf.size / (1024 * 1024)).toFixed(1)} MB`
                  : "";
              const coverSrc = getCoverUrl(pdf.coverImage);

              return (
                <Card
                  key={pdf._id}
                  className="group overflow-hidden border-emerald-200 hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300 bg-white cursor-pointer"
                  onClick={() => openPreview(pdf._id)}
                >
                  {/* Cover */}
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden">
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={pdf.title || pdf.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            '<div class="w-full h-full flex items-center justify-center text-emerald-600"><div class="text-center"><div class="text-5xl mb-2">📄</div><div class="text-xs font-medium">No Cover</div></div></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-600">
                        <div className="text-center">
                          <div className="text-5xl mb-2">📄</div>
                          <div className="text-xs font-medium">No Cover</div>
                        </div>
                      </div>
                    )}

                    {/* Rating */}
                    {pdf.rating > 0 && (
                      <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-emerald-900">
                          {pdf.rating}/5
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    <h3 className="text-sm font-semibold line-clamp-2 text-emerald-900 leading-tight">
                      {pdf.title || pdf.filename || "Untitled"}
                    </h3>

                    {/* Tags */}
                    {pdf.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {pdf.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {pdf.tags.length > 2 && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0">
                            +{pdf.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-emerald-600">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {pdf.favoritesCount ?? 0}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {pdf.downloads ?? 0}
                        </span>
                      </div>
                      <span className="text-xs">{sizeLabel}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>

        {/* Modal */}
        <PdfModal
          pdfId={activeId}
          open={open}
          onOpenChange={(nextOpen, nextId) => {
            if (typeof nextId === "string") setActiveId(nextId);
            setOpen(nextOpen);
          }}
          onDownloaded={onDownloaded}
          onFavoritedChange={onFavoritedChange}
        />
      </div>
    </div>
  );
}
