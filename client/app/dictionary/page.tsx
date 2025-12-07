"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ImageOff, Loader2, PlayCircle } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const getImageUrl = (path: string | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const baseUrl = API_URL.replace('/api', '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState("hello");
  const [debouncedQuery, setDebouncedQuery] = useState("hello");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedWord, setSelectedWord] = useState<any>(null);

  const { user } = useAuth();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 800);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!debouncedQuery.trim()) return;
      setLoading(true);
      setError("");
      try {
        const res = await apiService.dictionary.searchWords({ word: debouncedQuery });
        const words = res.data?.words || [];
        setVideos(Array.isArray(words) ? words : []);
      } catch (err: any) {
        if (err.response?.status !== 404) setError("Lỗi kết nối server.");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [debouncedQuery]);

  const handleWordClick = async (wordData: any) => {
    setSelectedWord(wordData);

    if (!user) {
      console.log("Chưa đăng nhập -> Không lưu lịch sử");
      return;
    }

    // Ưu tiên Video -> Thumbnail -> Default Text
    const signContent = wordData.videoUrl || wordData.thumbnail || "Dictionary Result";

    try {
      console.log("Đang lưu lịch sử cho:", wordData.word);
      await apiService.translations.create({
        inputText: wordData.word,
        outputSign: signContent,
        direction: "dictionary-lookup"
      });
      console.log("Lưu thành công!");
    } catch (e) {
      console.error("Lỗi lưu lịch sử:", e);
    }
  };

  return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-foreground mb-2">Từ Điển Ký Hiệu</h1>
          <p className="text-muted-foreground">Tra cứu nhanh chóng - Dễ dàng học tập</p>
        </div>

        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
                type="text"
                placeholder="Nhập từ vựng (ví dụ: hello, family)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg rounded-full shadow-md border-primary/20 focus-visible:ring-primary"
            />
          </div>
        </div>

        {loading && <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>}

        {!loading && videos.length === 0 && debouncedQuery && (
            <div className="text-center py-12 text-muted-foreground">Không tìm thấy kết quả nào.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
              <Card
                  key={video._id}
                  className="group cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-border overflow-hidden"
                  onClick={() => handleWordClick(video)}
              >
                <div className="aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
                  {getImageUrl(video.thumbnail) ? (
                      <img
                          src={getImageUrl(video.thumbnail)!}
                          alt={video.word}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                  ) : (
                      <ImageOff className="h-10 w-10 text-muted-foreground/50" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </div>
                <CardContent className="p-4 text-center">
                  <h3 className="font-bold text-lg capitalize text-foreground">{video.word}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{video.meaning}</p>
                </CardContent>
              </Card>
          ))}
        </div>

        <Dialog open={!!selectedWord} onOpenChange={(open: boolean) => !open && setSelectedWord(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold capitalize text-primary text-center">
                {selectedWord?.word}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border bg-black aspect-video shadow-inner flex items-center justify-center">
                {selectedWord?.videoUrl ? (
                    (selectedWord.videoUrl.includes("youtube.com") || selectedWord.videoUrl.includes("youtu.be")) ? (
                        <iframe
                            src={selectedWord.videoUrl.replace("/shorts/", "/embed/").replace("watch?v=", "embed/")}
                            className="w-full h-full"
                            allowFullScreen
                        />
                    ) : (
                        <video src={getImageUrl(selectedWord.videoUrl)!} controls className="w-full h-full" autoPlay />
                    )
                ) : (
                    <div className="text-muted-foreground flex flex-col items-center">
                      <ImageOff className="w-10 h-10 mb-2"/>
                      <span>Không có video</span>
                    </div>
                )}
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-2">
                <div>
                  <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Định nghĩa:</span>
                  <p className="text-lg font-medium text-foreground">{selectedWord?.meaning}</p>
                </div>

                <div className="flex gap-4 pt-2">
                  <div>
                    <span className="font-semibold text-xs text-muted-foreground uppercase">Phân loại:</span>
                    <p className="text-sm capitalize">{selectedWord?.category}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-muted-foreground uppercase">Độ khó:</span>
                    <p className="text-sm capitalize">{selectedWord?.difficulty}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}