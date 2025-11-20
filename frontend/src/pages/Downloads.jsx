// src/pages/Downloads.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/hooks/useAuth";
import PdfModal from "@/components/PdfModal";
import { Download, Search, Calendar, FileText, Eye } from "lucide-react";
import { BASE_URL } from "@/lib/api";

export default function Downloads() {
  const { user, refreshMe } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedPdfId, setSelectedPdfId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Refresh user data to get latest downloads
    if (user) {
      refreshMe();
    }
  }, []);

  const downloads = user?.downloadedPDFs || [];

  // Filter downloads based on search
  const filteredDownloads = downloads.filter((item) =>
    item.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewPdf = (pdfId) => {
    setSelectedPdfId(pdfId);
    setModalOpen(true);
  };

  const handleDirectDownload = (pdfUrl) => {
    const fullUrl = pdfUrl.startsWith("http") 
      ? pdfUrl 
      : `${BASE_URL}${pdfUrl}`;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-2">
              <Download className="w-8 h-8" />
              My Downloads
            </h1>
            <p className="text-sm text-emerald-700 mt-1">
              Access all your downloaded PDFs anytime
            </p>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white px-4 py-2 text-lg w-fit">
            {downloads.length} {downloads.length === 1 ? "PDF" : "PDFs"}
          </Badge>
        </div>

        {/* Search */}
        <Card className="border-emerald-200 bg-white/80 backdrop-blur shadow-sm">
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
              <Input
                placeholder="Search downloaded PDFs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Downloads List */}
        {filteredDownloads.length === 0 ? (
          <Card className="border-emerald-200">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                {search ? "No PDFs found" : "No downloads yet"}
              </h3>
              <p className="text-emerald-700 mb-4">
                {search
                  ? "Try a different search term"
                  : "Start exploring our library and download PDFs"}
              </p>
              {!search && (
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Browse Library
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDownloads
              .sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt))
              .map((item, index) => {
                // Helper to get cover image URL
                const getCoverUrl = (coverImage) => {
                  if (!coverImage) return "";
                  if (coverImage.startsWith("http")) return coverImage;
                  const cleanPath = coverImage.replace(/^\//, "");
                  return `${BASE_URL}/${cleanPath}`;
                };

                const coverSrc = getCoverUrl(item.coverImage);

                return (
                  <Card
                    key={index}
                    className="group overflow-hidden border-emerald-200 hover:shadow-xl hover:shadow-emerald-200/50 transition-all duration-300 bg-white cursor-pointer"
                    onClick={() => handleViewPdf(item.postId)}
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden">
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={item.fileName || "PDF"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML =
                              '<div class="w-full h-full flex items-center justify-center text-emerald-600"><div class="text-center"><div class="text-5xl mb-2">📄</div><div class="text-xs font-medium px-4">' + (item.fileName || "PDF") + '</div></div></div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-600">
                          <div className="text-center">
                            <div className="text-5xl mb-2">📄</div>
                            <div className="text-xs font-medium px-4">
                              {item.fileName || "PDF"}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Downloaded Badge */}
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1 shadow text-xs font-semibold">
                        <Download className="w-3 h-3" />
                        Downloaded
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-2">
                      <h3 className="text-sm font-semibold line-clamp-2 text-emerald-900 leading-tight">
                        {item.fileName || "Untitled PDF"}
                      </h3>

                      {/* Download Date */}
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.downloadedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPdf(item.postId);
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectDownload(item.pdfUrl);
                          }}
                          variant="outline"
                          className="border-emerald-400 text-emerald-700 hover:bg-emerald-50 h-9 px-3"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}

        {/* PDF Modal */}
        <PdfModal
          pdfId={selectedPdfId}
          open={modalOpen}
          onOpenChange={(nextOpen) => setModalOpen(nextOpen)}
          onDownloaded={refreshMe}
        />
      </div>
    </div>
  );
}