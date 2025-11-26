"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Contact form submitted:", formData)
    // Handle form submission logic here
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Liên hệ chúng tôi</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Có bất kỳ thắc mắc hay phản hồi về chúng tôi? Hãy gửi tun nhắn cho chúng tôi tại đây để nhận phản hồi sớm nhất nhé.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Contact Info Cards */}
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-sm text-muted-foreground">support@signlearn.com</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Điện thoại</h3>
            <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Văn phòng</h3>
            <p className="text-sm text-muted-foreground">108 Mai Dịch, Cầu Giấy, Hà Nội</p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Viết tên của bạn tại đây"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nguyenVanA.email@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Chủ đề</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Viết chủ đề tại đây"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Tin nhắn</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Viết tin nhắn tại đây"
                className="min-h-[150px] resize-none"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Gửi tin nhắn
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
