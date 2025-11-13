import { useEffect, useState } from "react";
import { api, BASE_URL } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Download,
  Heart,
  HeartOff,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function PdfModal({
  pdfId,
  open,
  onOpenChange,
  onDownloaded,
  onFavoritedChange,
}) {
  const { user, refreshMe } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const load = async (id = pdfId) => {
    setLoading(true);
    setError("");
    try {
      const res = await api(`/api/pdfs/${id}/details`, { auth: !!user });
      setData(res.data);
    } catch (e) {
      setError(e.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && pdfId) {
      load();
      setShowFullDescription(false);
    }
  }, [open, pdfId]);

  const toggleFavorite = async () => {
    if (!user) return setError("Please login to use favorites.");
    setBusy(true);
    setError("");
    try {
      const res = await api(`/api/pdfs/${pdfId}/favorite`, { method: "POST" });
      setData((d) => ({
        ...d,
        isFavorite: res.favorited,
        pdf: { ...d.pdf, favoritesCount: res.favoritesCount },
      }));
      onFavoritedChange?.(pdfId, res.favorited, res.favoritesCount);
    } catch (e) {
      setError(e.message || "Failed to update favorite");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!user) return setError("Please login to download.");
    setBusy(true);
    setError("");
    try {
      const res = await api(`/api/pdfs/${pdfId}/download`, { method: "POST" });
      await refreshMe();
      onDownloaded?.(pdfId, res.remainingCredits);
      window.open(`${BASE_URL}/api/pdfs/${pdfId}`, "_blank");
    } catch (e) {
      setError(e.message || "Failed to download");
    } finally {
      setBusy(false);
    }
  };

  const pdf = data?.pdf;
  const similar = data?.similar || [];

  const getCoverUrl = (coverImage) => {
    if (!coverImage) return "";
    if (coverImage.startsWith("http")) return coverImage;
    const cleanPath = coverImage.replace(/^\//, "");
    return `${BASE_URL}/${cleanPath}`;
  };

  const coverSrc = getCoverUrl(pdf?.coverImage);

  const description =
    pdf?.description || "No description provided for this PDF.";
  const isLongDescription = description.length > 200;
  const displayDescription =
    showFullDescription || !isLongDescription
      ? description
      : description.slice(0, 200) + "...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-emerald-100">
          <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700">
            PDF Details
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="h-64 rounded-2xl animate-pulse" />
          ) : error ? (
            <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Top Section: Cover + Info */}
              <div className="flex gap-6">
                {/* Compact Cover Image */}
                <div className="flex-shrink-0 w-24 h-36 sm:w-32 sm:h-44 bg-gradient-to-br from-emerald-200 via-teal-200 to-cyan-200 rounded-xl overflow-hidden shadow-lg ring-2 ring-emerald-300/50">
                  {coverSrc ? (
                    <img
                      src={coverSrc}
                      alt={pdf?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML =
                          '<div class="w-full h-full flex items-center justify-center text-emerald-700"><div class="text-4xl">📄</div></div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-700">
                      <div className="text-4xl">📄</div>
                    </div>
                  )}
                </div>

                {/* Info Column */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 leading-tight">
                    {pdf?.title || pdf?.filename || "Untitled PDF"}
                  </h2>

                  {/* Stats in Compact Grid */}
                  <div className="Flex">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">
                        {pdf?.rating ?? 0}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">
                        {pdf?.downloads ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Heart className="w-4 h-4 text-rose-600" />
                      <span className="text-xs text-rose-600 font-medium">
                        {pdf?.favoritesCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {pdf?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {pdf.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 px-2.5 py-1 text-xs font-medium shadow-sm"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl p-5 border border-emerald-200/60 shadow-sm">
                <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  {displayDescription}
                </p>
                {isLongDescription && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {showFullDescription ? (
                      <>
                        Show Less <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Show More <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  disabled={busy || !user}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all h-12 font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>

                <Button
                  onClick={toggleFavorite}
                  variant="outline"
                  disabled={busy || !user}
                  className="border-2 border-emerald-400 text-emerald-700 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 shadow-sm hover:shadow-md transition-all h-12 px-6"
                >
                  {data?.isFavorite ? (
                    <HeartOff className="w-4 h-4" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {!user && (
                <div className="p-4 rounded-xl border border-amber-300 shadow-sm">
                  <p className="text-sm text-amber-800 font-medium">
                    🔒 Please{" "}
                    <a
                      href="/login"
                      className="underline font-bold text-amber-900 hover:text-amber-700"
                    >
                      login
                    </a>{" "}
                    to download or favorite this PDF.
                  </p>
                </div>
              )}

              {/* Similar PDFs - Top 4 */}
              {similar.length > 0 && (
                <div className="rounded-xl p-4 border border-teal-200/60 shadow-sm">
                  <h4 className="text-lg font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700">
                    Similar PDFs You Might Like
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {similar.slice(0, 4).map((sp) => {
                      const sCover = getCoverUrl(sp.coverImage);
                      return (
                        <button
                          key={sp._id}
                          className="group rounded-lg border border-emerald-200 hover:border-emerald-400 bg-white hover:shadow-xl transition-all duration-300 text-left overflow-hidden transform hover:scale-105"
                          onClick={() => {
                            onOpenChange(false);
                            setTimeout(() => {
                              onOpenChange(true, sp._id);
                            }, 100);
                          }}
                        >
                          <div className="w-full h-28 bg-gradient-to-br from-emerald-200 to-teal-200 overflow-hidden relative">
                            {sCover ? (
                              <img
                                src={sCover}
                                alt={sp.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML =
                                    '<div class="w-full h-full flex items-center justify-center text-emerald-600"><div class="text-3xl">📄</div></div>';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-emerald-600">
                                <div className="text-3xl">📄</div>
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <div className="text-xs font-semibold line-clamp-2 text-emerald-900 mb-1.5 leading-tight group-hover:text-emerald-700 transition-colors">
                              {sp.title || sp.filename}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs bg-amber-50 px-1.5 py-0.5 rounded">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-amber-700">
                                  {sp.rating ?? 0}
                                </span>
                              </div>
                              <div className="text-xs text-emerald-600 font-medium">
                                {sp.downloads ?? 0} DL
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
