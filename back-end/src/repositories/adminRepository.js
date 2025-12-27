// Lớp AdminRepository chịu trách nhiệm cho tất cả các tương tác trực tiếp với cơ sở dữ liệu
// liên quan đến model User, đặc biệt là các truy vấn dành cho admin.
// Ví dụ: tìm admin theo email, cập nhật thông tin admin, v.v.
// Việc tách riêng logic truy vấn DB vào lớp Repository giúp mã nguồn sạch sẽ,
// dễ bảo trì và dễ dàng thay thế hoặc mock DB khi viết test.

// Hiện tại, các logic này đang được xử lý trực tiếp trong AdminService.
// Có thể tái cấu trúc trong tương lai để chuyển các truy vấn đó vào đây.
