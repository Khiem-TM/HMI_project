"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  BookOpen,
  Award,
  Heart,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Hàm đếm time animation
function CounterAnimation({
  end,
  duration = 2000,
}: {
  end: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span ref={elementRef}>{count}</span>;
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
          <div className="w-full h-full bg-white rounded-full"></div>
        </div>
        <div className="absolute top-8 right-8 w-4 h-4 bg-white opacity-20"></div>
        <div className="absolute top-16 right-16 w-2 h-2 bg-white opacity-30"></div>
        <div className="absolute top-24 right-24 w-3 h-3 bg-white opacity-25"></div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-sm uppercase tracking-wide mb-4 opacity-90">
              Về chúng tôi
            </p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance leading-tight">
              5 năm hỗ trợ cộng đồng khiếm thính khám phá tiềm năng và hiểu sâu
              về giao tiếp
            </h1>
            <p className="text-lg opacity-90 max-w-3xl mx-auto text-pretty">
              5 năm trước, chúng tôi mở cửa để giúp cộng đồng người khiếm thính
              đạt được mục tiêu giao tiếp trong mơ. Trong thời gian đó, chúng
              tôi đã định hình cách mọi người tiếp cận giao tiếp và học tập để
              họ có thể học hỏi và phát triển từ trải nghiệm.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                SignLearn là nền tảng hỗ trợ cộng đồng người khiếm thính
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                5 năm trước, chúng tôi mở cửa để giúp cộng đồng người khiếm
                thính đạt được mục tiêu giao tiếp và học tập trong mơ. Trong
                thời gian đó, chúng tôi đã định hình cách mọi người tiếp cận
                giáo dục và giao tiếp để họ có thể học hỏi và phát triển bình
                đẳng.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center border-2 border-gray-100 hover:border-primary transition-colors hover:shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <p className="text-5xl font-bold text-primary mb-3">
                    <CounterAnimation end={2025} duration={1500} />
                  </p>
                  <p className="text-gray-600 font-medium">Thành lập</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2 border-gray-100 hover:border-primary transition-colors hover:shadow-lg">
                <CardContent className="pt-8 pb-6">
                  <p className="text-5xl font-bold text-primary mb-3">
                    <CounterAnimation end={50000} duration={2000} />+
                  </p>
                  <p className="text-gray-600 font-medium">
                    Thành viên cộng đồng
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold mb-2 text-sm uppercase tracking-wide">
              Mục tiêu của chúng tôi
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Đạt được mục tiêu giao tiếp cùng chúng tôi
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Chương trình đào tạo và hỗ trợ giao tiếp đẳng cấp thế giới được
              phát triển bởi các chuyên gia hàng đầu. Xây dựng kỹ năng giao tiếp
              với các khóa học ngôn ngữ ký hiệu, chứng chỉ và công cụ hỗ trợ từ
              các chuyên gia hàng đầu thế giới.
            </p>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                  Học ngôn ngữ ký hiệu
                </p>
              </div>
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-green-700 transition-colors duration-300">
                  Giao tiếp nhóm
                </p>
              </div>
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors duration-300">
                  Hỗ trợ chuyên nghiệp
                </p>
              </div>
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-orange-700 transition-colors duration-300">
                  Phát triển kỹ năng
                </p>
              </div>
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-pink-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-pink-700 transition-colors duration-300">
                  Cộng đồng hỗ trợ
                </p>
              </div>
            </div>
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors duration-300">
                  Tài nguyên đa dạng
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold mb-2 text-sm uppercase tracking-wide">
              Đội ngũ thực hiện
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Khám phá các thành viên đội ngũ chúng tôi
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Chọn từ hàng trăm khóa học từ các tổ chức chuyên môn
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Teacher 1 */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-200 to-green-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-800">JK</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Trương Mạnh Khiêm
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  email: 23021601@vnu.edu.vn
                </p>
              </CardContent>
            </Card>

            {/* Teacher 2 */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-800">KI</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nguyễn Hữu Hiếu
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  email: 23021549@vnu.edu.vn
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-800">HS</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Hà Xuân Sơn
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  email: 23021681@vnu.edu.vn
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-red-200 to-red-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-red-800">NY</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nguyễn Thị Ngọc Yến
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  email: 23021757@vnu.edu.vn
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-yellow-800">NB</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nguyễn Văn Biển
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  email: 23021477@vnu.edu.vu
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-200 to-green-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-800">NH</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nguyễn Hữu Lưu
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  email: 23021617@vnu.edu.vn
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold mb-2 text-sm uppercase tracking-wide">
              Đối tác của chúng tôi
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Được tin tưởng bởi các đối tác lớn
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Chúng tôi hợp tác với các trường đại học và công ty hàng đầu
            </p>
          </div>

          {/* Partner Logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 hover:opacity-100 transition-opacity">
            <div className="text-2xl font-bold text-gray-400">Slack</div>
            <div className="text-2xl font-bold text-gray-400">Amazon</div>
            <div className="text-2xl font-bold text-gray-400">HubSpot</div>
            <div className="text-2xl font-bold text-gray-400">Gusto</div>
            <div className="text-2xl font-bold text-gray-400">Google</div>
            <div className="text-2xl font-bold text-gray-400">Slack</div>
            <div className="text-2xl font-bold text-gray-400">Amazon</div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-green-500 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600 rounded-full opacity-20"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Đăng ký nhận bản tin
            </h2>
            <p className="text-white/90 mb-8 text-lg">
              Nhập địa chỉ email của bạn để đăng ký nhận bản tin của chúng tôi
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Email của bạn"
                className="bg-white border-0 text-gray-900 placeholder-gray-500"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white px-8">
                Đăng ký
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
