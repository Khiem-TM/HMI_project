## 🔧 Cài đặt

### 1. Clone repository
h
git clone <repository-url>
cd SignLearn

### 2. Cài đặt dependencies cho Server

cd server
npm install

### 3. Cài đặt dependencies cho Client

cd ../client
npm install

### 4. Cài đặt Python dependencies

cd ../server
pip install -r requirements.txt**Lưu ý**: Nếu bạn gặp lỗi khi cài đặt `sign-language-translator`, có thể cần cài đặt thêm các dependencies:

pip install torch torchvision torchaudio
pip install opencv-contrib-python## 

### 1. Cấu hình Server

Tạo file `.env` trong thư mục `server/`:

cd server
cp env.example .envChỉnh sửa file `.env` với các giá trị phù hợp:
nv
# Database
MONGO_URI=mongodb://localhost:27017/signlearn

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Client
CLIENT_URL=http://localhost:3000

# Admin bootstrap (tài khoản admin mặc định)
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@signlearn.local
ADMIN_PASSWORD=change-me-please

### 2. Cấu hình Client (nếu cần)

Nếu client cần các biến môi trường riêng, tạo file `.env.local` trong thư mục `client/`:

NEXT_PUBLIC_API_URL=http://localhost:5000## 🗄️ Database Setup

### 1. Khởi động MongoDB

Đảm bảo MongoDB đang chạy:

# Trên macOS với Homebrew
brew services start mongodb-community

### Development Mode

Mở 2 terminal riêng biệt:

**Terminal 1 - Server:**
cd server
npm run devServer sẽ chạy tại `http://localhost:5000`

**Terminal 2 - Client:**
cd client
npm run devClient sẽ chạy tại `http://localhost:3000`

### Lỗi CORS

Nếu gặp lỗi CORS khi client gọi API:
- Đảm bảo `CLIENT_URL` trong `.env` của server khớp với URL client đang chạy
- Trong development, server tự động cho phép `localhost:3000`

### Lỗi kết nối MongoDB

- Kiểm tra MongoDB đang chạy: `mongosh` hoặc `mongo`
- Kiểm tra `MONGO_URI` trong `.env` đúng format

### Lỗi Python dependencies

Nếu gặp lỗi khi import Python modules:
# Cài đặt lại dependencies
pip install --upgrade -r requirements.txt

--> Chú ý: Đây chưa chắc là đã đầy đủ dependencies --> Ae đọc kĩ lỗi (đa số là thiếu thư viện) --> Nếu thiều dùng npm để install vào (Chủ yếu thiếu ở client)