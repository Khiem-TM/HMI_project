# Hướng Dẫn Cài Đặt

### Frontend (Client)

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** components
- **Axios** cho API calls
- **Framer Motion** cho animations

### Backend (Server)

- **Express.js 5**
- **MongoDB** với Mongoose
- **JWT** cho authentication
- **bcryptjs** cho password hashing
- **CORS** đã bật
- **Helmet** cho security

### 1. Cài Đặt Dependencies

```bash
npm run install:all
```

### 2. Thiết Lập Môi Trường Server

Sao chép và chỉnh sửa file môi trường server:

```bash
cd server
cp env.example .env
```

Chỉnh sửa `server/.env` --> Dựa trên cấu hình máy cá nhân nhé

```env
MONGO_URI=mongodb://localhost:27017/signlearn
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Thiết Lập Môi Trường Client

Tạo `client/.env.local`:

```bash
cd ../client
```

Tạo file `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Khởi Động MongoDB

**MongoDB Local:**

```bash
# Mac (Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB
```

### 5. Seed Database --> Cấp sampledata cho 2 chức năng dictionary và exercises

--> Cần cải tiến thêm nhiều

Để có dữ liệu ban đầu:

```bash
cd server
node seed-dictionary.js
node seed-exercises.js
```

### 6. Chạy Development Servers

Từ thư mục gốc:

```bash
npm run dev
```
