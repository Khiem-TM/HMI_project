import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Languages, Gamepad2, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
          Học Ngôn Ngữ Ký Hiệu,{" "}
          <span className="text-primary">Kết Nối Giao Tiếp</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          Sứ mệnh của chúng tôi là hỗ trợ cộng đồng người khiếm thính bằng cách mang đến các công cụ học ngôn ngữ ký hiệu dễ tiếp cận và công nghệ dịch thuật tự động, giúp phá bỏ rào cản giao tiếp và thúc đẩy sự hòa nhập xã hội.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Bắt đầu miễn phí
            </Button>
          </Link>
          <Link href="/about">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              Tìm hiểu thêm
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Mọi thứ bạn cần để học ngôn ngữ ký hiệu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Từ điển</h3>
              <p className="text-muted-foreground mb-4">
                Tìm kiếm và học hàng ngàn từ ngôn ngữ ký hiệu với các video minh họa.
              </p>
              <Link href="/dictionary">
                <Button variant="link" className="p-0">
                  Khám phá Từ điển →
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trình dịch</h3>
              <p className="text-muted-foreground mb-4">
                Trình dịch ngôn ngữ ký hiệu thời gian thực giữa ngôn ngữ ký hiệu và văn bản sử dụng camera của bạn.
              </p>
              <Link href="/translator">
                <Button variant="link" className="p-0">
                  Thử trình dịch →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Gamepad2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trò chơi luyện tập</h3>
              <p className="text-muted-foreground mb-4">
                Kiểm tra kiến thức của bạn với các trò chơi tương tác và cải thiện kỹ năng ngôn ngữ ký hiệu.
              </p>
              <Link href="/game">
                <Button variant="link" className="p-0">
                  Chơi trò chơi →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cộng đồng</h3>
              <p className="text-muted-foreground mb-4">
                Tham gia một cộng đồng hỗ trợ gồm những người học và người ký hiệu bản ngữ.
              </p>
              <Link href="/about">
                <Button variant="link" className="p-0">
                  Tham gia cộng đồng →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground rounded-lg px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Bạn đã sẵn sàng bắt đầu quá trình học chưa?
        </h2>
        <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
          Tham gia cùng hàng ngàn người học đang phá vỡ rào cản giao tiếp
          thông qua ngôn ngữ ký hiệu.
        </p>
        <Link href="/signup">
          <Button
            size="lg"
            variant="secondary"
            className="bg-background text-foreground hover:bg-background/90"
          >
            Đăng ký ngay miễn phí
          </Button>
        </Link>
      </section>
    </div>
  );
}
