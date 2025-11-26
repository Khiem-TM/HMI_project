"use client";
import Link from "next/link"
import { usePathname } from "next/navigation";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="border-t bg-muted/50 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <span className="text-xl font-bold">SignLearn</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sứ mệnh của chúng tôi là hỗ trợ cộng đồng người khiếm thính bằng cách mang đến các công cụ học ngôn ngữ ký hiệu dễ tiếp cận và công nghệ dịch thuật tự động, giúp phá bỏ rào cản giao tiếp và thúc đẩy sự hòa nhập xã hội
            </p>
          </div>

          {/* Pages */}
          <div>
            <h3 className="font-semibold mb-4">Trang</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  Thôngtin
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dictionary" className="text-muted-foreground hover:text-primary transition-colors">
                  Từ điển
                </Link>
              </li>
              <li>
                <Link href="/translator" className="text-muted-foreground hover:text-primary transition-colors">
                  Trình dịch
                </Link>
              </li>
              <li>
                <Link href="/game" className="text-muted-foreground hover:text-primary transition-colors">
                  Game
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 SignLearn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
