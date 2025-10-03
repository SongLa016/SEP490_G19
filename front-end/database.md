-- 1. Người dùng & Xác thực (4 bảng)

CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,                      -- ID vai trò
    RoleName NVARCHAR(50) NOT NULL UNIQUE                      -- Tên vai trò (Admin, Owner, Player)
);

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,                      -- ID người dùng
    Email NVARCHAR(255) NOT NULL UNIQUE,                       -- Email đăng nhập
    PasswordHash NVARCHAR(255) NOT NULL,                       -- Mật khẩu đã mã hóa
    FullName NVARCHAR(100) NOT NULL,                           -- Họ tên đầy đủ
    Phone NVARCHAR(20),                                        -- Số điện thoại
    Avatar VARBINARY(MAX) NULL,                                   -- đại diện
    Status NVARCHAR(20) DEFAULT 'Active',                      -- Trạng thái tài khoản
    CreatedAt DATETIME2 DEFAULT GETDATE()                      -- Ngày tạo tài khoản
IsBanned BIT DEFAULT 0,                                          -- User bị khóa do báo cáo
    BannedAt DATETIME2 NULL,                                         -- Thời gian khóa
    BanReason NVARCHAR(255) NULL                                     -- Lý do khóa

);

CREATE TABLE UserRoles (
    UserRoleID INT IDENTITY(1,1) PRIMARY KEY,                  -- ID phân quyền
    UserID INT FOREIGN KEY REFERENCES Users(UserID),           -- ID người dùng
    RoleID INT FOREIGN KEY REFERENCES Roles(RoleID),           -- ID vai trò
    UNIQUE(UserID, RoleID)
);

CREATE TABLE UserProfiles (
    ProfileID INT IDENTITY(1,1) PRIMARY KEY,                   -- ID hồ sơ
    UserID INT UNIQUE FOREIGN KEY REFERENCES Users(UserID),    -- ID người dùng
    DateOfBirth DATE,                                          -- Ngày sinh
    Gender NVARCHAR(10),                                       -- Giới tính
    Address NVARCHAR(500),                                     -- Địa chỉ
    PreferredPositions NVARCHAR(100),                          -- Vị trí ưa thích (thủ môn, tiền đạo...)
    SkillLevel NVARCHAR(20)                                    -- Trình độ (beginner, intermediate,    advanced)
   bio TEXT,
);



-- 2. Sân bóng & Quản lý (6 bảng)
  Loại sân (5vs5, 7vs7, 11vs11)
CREATE TABLE FieldTypes (
    TypeID INT IDENTITY(1,1) PRIMARY KEY,
    TypeName NVARCHAR(50) NOT NULL UNIQUE
);

-- Khu sân lớn (ví dụ: "Sân bóng đá XYZ - Quận 1")
CREATE TABLE FieldComplexes (
    ComplexID INT IDENTITY(1,1) PRIMARY KEY,         -- ID khu sân
    OwnerID INT FOREIGN KEY REFERENCES Users(UserID),-- Chủ sở hữu
    Name NVARCHAR(255) NOT NULL,                     -- Tên khu sân
    Address NVARCHAR(500) NOT NULL,                  -- Địa chỉ khu sân
    Description NVARCHAR(MAX),                       -- Mô tả tổng quan
   Image VARBINARY(MAX) NULL,
    Status NVARCHAR(20) DEFAULT 'Active',            -- Trạng thái
    CreatedAt DATETIME2 DEFAULT GETDATE()            -- Ngày tạo
ApprovalStatus NVARCHAR(20) DEFAULT 'Pending',                   -- Pending, Approved, Rejected
    ApprovedBy INT NULL FOREIGN KEY REFERENCES Users(UserID),        -- Admin phê duyệt
    ApprovedAt DATETIME2 NULL

);

-- Sân nhỏ trong khu sân (ví dụ: "Sân 5 người số 1")
CREATE TABLE Fields (
    FieldID INT IDENTITY(1,1) PRIMARY KEY,           -- ID sân nhỏ
    ComplexID INT FOREIGN KEY REFERENCES FieldComplexes(ComplexID), -- thuộc khu sân nào
    TypeID INT FOREIGN KEY REFERENCES FieldTypes(TypeID),           -- loại sân
    Name NVARCHAR(255) NOT NULL,                     -- Tên sân nhỏ
    Size NVARCHAR(100),                              -- Kích thước sân (VD: 20x40m)
    GrassType NVARCHAR(100),                         -- Loại cỏ (tự nhiên, nhân tạo,…)
    Description NVARCHAR(MAX),                       -- Mô tả chi tiết
    Image VARBINARY(MAX) NULL,	
    PricePerHour DECIMAL(10,2),                      -- Giá thuê theo giờ
    Status NVARCHAR(20) DEFAULT 'Available',         -- Trạng thái (Available, Maintenance,…) – phụ thuộc vào BookingStatus ở bảng Booking
    CreatedAt DATETIME2 DEFAULT GETDATE()
ApprovalStatus NVARCHAR(20) DEFAULT 'Pending',       -- Pending, Approved, Rejected
    ApprovedBy INT NULL FOREIGN KEY REFERENCES Users(UserID),
    ApprovedAt DATETIME2 NULL,
    IsHidden BIT DEFAULT 0  

);



////////////////////////////////////////////// Lịch Sân ////////////////////////////////////////////////////////////////////

Gồm có 1 bảng lưu riêng các slot  edit được giờ sân Slot 1: 22:15 – 23:45 | Slot 2: 20:45 – 22:15 | Slot 3: 19:15 – 20:45 | Slot 4: 17:45 – 19:15 | Slot 5: 16:15 – 17:45 | Slot 6: 14:45 – 16:15 | Slot 7: 13:15 – 14:45 | Slot 8: 11:45 – 13:15 | Slot 9: 10:15 – 11:45 | Slot 10: 08:45 – 10:15 | Slot 11: 07:15 – 08:45 )
CREATE TABLE TimeSlots (
    SlotID INT IDENTITY(1,1) PRIMARY KEY,       -- ID slot
    SlotName NVARCHAR(50),                      -- Tên slot (Slot 1, Slot 2,...)
    StartTime TIME NOT NULL,                    -- Giờ bắt đầu
    EndTime TIME NOT NULL,                      -- Giờ kết thúc
    UNIQUE(StartTime, EndTime)
);


(lịch sân ) 
CREATE TABLE FieldSchedules (
    ScheduleID INT IDENTITY(1,1) PRIMARY KEY,
    FieldID INT FOREIGN KEY REFERENCES Fields(FieldID),  -- sân nhỏ
    SlotID INT FOREIGN KEY REFERENCES TimeSlots(SlotID), -- slot chuẩn
    Date DATE NOT NULL,                                                             -- ngày áp dụng
    Status NVARCHAR(20) DEFAULT 'Available',                -- Available, Booked, Maintenance
    UNIQUE(FieldID, Date, SlotID)
);

( giá sân theo từng slot )
CREATE TABLE FieldPrices (
    PriceID INT IDENTITY(1,1) PRIMARY KEY,
    FieldID INT FOREIGN KEY REFERENCES Fields(FieldID),  -- sân nhỏ
    SlotID INT FOREIGN KEY REFERENCES TimeSlots(SlotID), -- áp dụng cho slot nào
    Price DECIMAL(10,2) NOT NULL,                        -- giá thuê theo slot
    UNIQUE(FieldID, SlotID)
);


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////










CREATE TABLE DepositPolicies (
    DepositPolicyID INT IDENTITY(1,1) PRIMARY KEY,
    FieldID INT NOT NULL FOREIGN KEY REFERENCES Fields(FieldID), -- áp dụng cho sân nhỏ
    DepositPercent DECIMAL(5,2) NOT NULL,   -- % cọc (0 = không cần cọc)
    MinDeposit DECIMAL(10,2) NULL,          -- Cọc tối thiểu
    MaxDeposit DECIMAL(10,2) NULL,          -- Cọc tối đa
    CreatedAt DATETIME2 DEFAULT GETDATE()
);




CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),           -- Người đặt
    ScheduleID INT NOT NULL FOREIGN KEY REFERENCES FieldSchedules(ScheduleID), -- Slot
    TotalPrice DECIMAL(10,2) NOT NULL,             -- Tổng tiền
    DepositAmount DECIMAL(10,2) NOT NULL,          -- Số tiền cọc
    RemainingAmount DECIMAL(10,2) NULL,            -- Phần còn lại trả tại sân
    BookingStatus NVARCHAR(20) DEFAULT 'Pending',  -- Pending, Confirmed, Cancelled, Completed, Expired – sẽ cập nhật trạng thái slot của sân nhỏ 
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending',  -- Pending, Paid, Refunded
    QRCode NVARCHAR(255) NULL,                     -- Mã QR đặt sân
    QRExpiresAt DATETIME2 NULL,                    -- Hết hạn QR giữ chỗ (5–10 phút)
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    ConfirmedAt DATETIME2 NULL,
    CancelledAt DATETIME2 NULL,
    CancelledBy NVARCHAR(20) NULL,                 -- Player / Owner / System
    CancelReason NVARCHAR(255) NULL
);



CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,                     -- ID thanh toán
    BookingID INT FOREIGN KEY REFERENCES Bookings(BookingID),    -- Liên kết đặt sân
    Amount DECIMAL(10,2) NOT NULL,                               -- Số tiền thanh toán
    VNPayTransactionCode NVARCHAR(100) NOT NULL,                 -- Mã giao dịch từ VNPay
    VNPayOrderInfo NVARCHAR(255),                                -- Nội dung đơn hàng
    VNPayResponseCode NVARCHAR(10),                              -- Mã phản hồi từ VNPay
    Status NVARCHAR(20) DEFAULT 'Pending',                       -- Trạng thái (Pending, Success, Failed)
    CreatedAt DATETIME2 DEFAULT GETDATE(),                       -- Ngày tạo
    UpdatedAt DATETIME2 DEFAULT GETDATE()                        -- Ngày cập nhật
);



-- 1) CancellationPolicies: áp dụng cho mỗi sân nhỏ (Field)
CREATE TABLE CancellationPolicies (
    PolicyID INT IDENTITY(1,1) PRIMARY KEY,
    FieldID INT NOT NULL FOREIGN KEY REFERENCES Fields(FieldID),  -- << SỬA: gắn sân nhỏ
    CancelBeforeHours INT NOT NULL,    -- e.g. 24, 2, 0
    RefundRate DECIMAL(5,2) NOT NULL,  -- 1.00 = 100%, 0.50 = 50%, 0 = 0%
    OwnerPenaltyRate DECIMAL(5,2) DEFAULT 0, -- khi Owner hủy trễ, bồi thường cho player (% của deposit)
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- 2) BookingCancellationRequests: quản lý yêu cầu hủy (chưa finalized)
CREATE TABLE BookingCancellationRequests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL FOREIGN KEY REFERENCES Bookings(BookingID),
    RequestedByUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- ai yêu cầu
    RequestedByRole NVARCHAR(20) NOT NULL, -- 'Player' or 'Owner'
    RequestReason NVARCHAR(255) NULL,
    RequestedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    RequestStatus NVARCHAR(20) DEFAULT 'Pending', -- Pending, Processing, Completed, Reversed, Rejected, Failed
    ProcessedAt DATETIME2 NULL,
    RefundAmount DECIMAL(10,2) NULL,
    PenaltyAmount DECIMAL(10,2) NULL,
    -- thời gian cho phép rút lại hủy (undo window) trước khi final processing:
    UndoAllowedUntil DATETIME2 NULL,
    ReversedByUserID INT NULL FOREIGN KEY REFERENCES Users(UserID),
    ReversedAt DATETIME2 NULL,
    ReversalReason NVARCHAR(255) NULL
);

-- 3) BookingCancellations (log cuối cùng khi hủy đã hoàn tất) — giữ làm audit of finalized cancellations
CREATE TABLE BookingCancellations (
    CancellationID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL FOREIGN KEY REFERENCES Bookings(BookingID),
    BookingCancellationRequests(RequestID), -- optional link
    CancelledBy NVARCHAR(20) NOT NULL,    -- 'Player' / 'Owner' / 'System'
    CancelReason NVARCHAR(255) NULL,
    RefundAmount DECIMAL(10,2) NOT NULL,
    PenaltyAmount DECIMAL(10,2) DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);



====== Tìm đội =======================================
-- 1. Request tạo đội (Teams)
CREATE TABLE Teams (
    TeamID INT IDENTITY(1,1) PRIMARY KEY,
    TeamName NVARCHAR(100) NOT NULL,                            -- Tên đội / phòng chờ
    CreatedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),-- Người tạo đội
    ContactPhone NVARCHAR(20) NOT NULL,                         -- Số điện thoại để liên hệ
    Description NVARCHAR(500),                                  -- Mô tả thêm
    PreferredSkillLevel NVARCHAR(20),                           -- Beginner / Intermediate / Advanced
    PreferredPositions NVARCHAR(100),                           -- Vị trí cần (GK, DF, MF, FW…)
    CurrentMembers INT DEFAULT 1,                               -- Số thành viên hiện có (bao gồm người tạo)
    MaxMembers INT NOT NULL,                                    -- Số lượng mong muốn
    Status NVARCHAR(20) DEFAULT 'Open',                         -- Open / Full / Closed
    CreatedAt DATETIME2 DEFAULT GETDATE()                       -- Ngày tạo request
);

-- 2. Yêu cầu tham gia đội (Join request)
CREATE TABLE TeamJoinRequests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    TeamID INT NOT NULL FOREIGN KEY REFERENCES Teams(TeamID),   -- Xin vào đội nào
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),   -- Ai xin vào
    Message NVARCHAR(255) NULL,                                 -- Lời nhắn
    Status NVARCHAR(20) DEFAULT 'Pending',                      -- Pending / Approved / Rejected
    RequestedAt DATETIME2 DEFAULT GETDATE(),                    -- Thời gian xin tham gia
    RespondedAt DATETIME2 NULL,                                 -- Thời gian được xử lý
    RespondedBy INT NULL FOREIGN KEY REFERENCES Users(UserID)   -- Người tạo đội duyệt
);








====admin===
CREATE TABLE SystemNotifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    NotificationType NVARCHAR(50) DEFAULT 'General',           -- General, Promotion, Warning, Update
    SentToRole NVARCHAR(50) NULL,                              -- NULL = all, 'Player', 'Owner'
    SentToSpecificUsers NVARCHAR(MAX) NULL,                    -- JSON array of user IDs
    InsUrgent BIT DEFAULT 0,                                    -- Thông báo khẩn
    SentBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    SentAt DATETIME2 DEFAULT GETDATE(),
    ExpiresAt DATETIME2 NULL,


CREATE TABLE ViolationReports (
    ReportID INT IDENTITY(1,1) PRIMARY KEY,
    ReportedUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- User bị báo cáo
    ReporterID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),     -- Người báo cáo
    ReportType NVARCHAR(50) NOT NULL,                                -- Loại vi phạm
    Description NVARCHAR(500) NOT NULL,                              -- Mô tả
    Status NVARCHAR(20) DEFAULT 'Pending',                           -- Pending, Resolved
    CreatedAt DATETIME2 DEFAULT GETDATE()
);


CREATE TABLE BlogPosts (
    PostID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    AuthorID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),      -- Admin viết bài
    Status NVARCHAR(20) DEFAULT 'Draft',                             -- Draft, Published
    CreatedAt DATETIME2 DEFAULT GETDATE()
);



============================NHÁP====================================

