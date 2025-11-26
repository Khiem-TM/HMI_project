"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { apiService } from "@/lib/api";

export default function DictionaryPage() {
  const [searchQuery, setSearchQuery] = useState("hello");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gọi API mỗi khi searchQuery thay đổi
  useEffect(() => {
    const fetchVideos = async () => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setError("");

      try {
        console.log("🔍 Fetching dictionary for word:", searchQuery);
        const res = await apiService.dictionary.searchWords({
          word: searchQuery,
        });

        const words = res.data?.words || [];

        setVideos(Array.isArray(words) ? words : []);

        if (words.length === 0) {
          console.warn("⚠️ No words found in response");
        }
      } catch (err: any) {
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config,
          isNetworkError: err.isNetworkError,
        });

        // Better error messages
        let errorMessage = "Không thể tải dữ liệu từ server";

        if (err.isNetworkError || !err.response) {
          errorMessage =
            "Không thể kết nối tới server. Vui lòng kiểm tra server có đang chạy không (http://localhost:5000)";
        } else if (err.response?.status === 404) {
          errorMessage = "Không tìm thấy từ vựng";
        } else if (err.response?.status >= 500) {
          errorMessage = "Lỗi server. Vui lòng thử lại sau";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">Từ điển</h1>
        <p className="text-muted-foreground mb-2">
          Dễ dàng tra cứu các từ và cụm từ trong ngôn ngữ ký hiệu tại đây.
        </p>
      </div>

      <div className="border-t pt-8">
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Tìm kiếm từ và cụm từ tại đây."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
        </div>

        {/* Search Results */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{searchQuery}</h2>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Không tìm thấy kết quả nào
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <Card
                key={video._id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-video bg-muted relative">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.word}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{video.word}</h3>
                  <p className="text-sm text-muted-foreground">
                    {video.description}
                  </p>
                  <div className="text-xs mt-2">
                    <span className="mr-2">Phân loại: {video.category}</span>
                    <span>Độ khó: {video.difficulty}</span>
                  </div>
                  {video.meaning && (
                    <div className="mt-2 text-base text-green-700">
                      <strong>Định nghĩa (Tiếng Việt):</strong> {video.meaning}
                    </div>
                  )}
                  {video.videoUrl && (
                    <div className="mt-4">
                      {video.videoUrl.includes("youtube.com") ||
                      video.videoUrl.includes("youtu.be") ? (
                        <iframe
                          width="100%"
                          height="220"
                          src={video.videoUrl.replace("/shorts/", "/embed/")}
                          title={video.word}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video width="100%" height="220" controls>
                          <source src={video.videoUrl} type="video/mp4" />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
