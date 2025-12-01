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
    SkillLevel NVARCHAR(20),                                    -- Trình độ (beginner, intermediate,    advanced)
    bio  NVARCHAR(20)  
);

-- 2. Sân bóng & Quản lý (6 bảng)
 
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
);

-- Sân nhỏ trong khu sân (ví dụ: "Sân 5 người số 1")
CREATE TABLE Fields (
    FieldID INT IDENTITY(1,1) PRIMARY KEY,                          -- ID sân nhỏ
    ComplexID INT FOREIGN KEY REFERENCES FieldComplexes(ComplexID), -- thuộc khu sân nào
    TypeID INT FOREIGN KEY REFERENCES FieldTypes(TypeID),           -- loại sân
    Name NVARCHAR(255) NOT NULL,                                    -- Tên sân nhỏ
    Size NVARCHAR(100),                                             -- Kích thước sân (VD: 20x40m)
    GrassType NVARCHAR(100),                                        -- Loại cỏ (tự nhiên, nhân tạo,…)
    Description NVARCHAR(MAX),                                      -- Mô tả chi tiết
    Image VARBINARY(MAX) NULL,	
    PricePerHour DECIMAL(10,2),                                     -- Giá thuê theo giờ
    Status NVARCHAR(20) DEFAULT 'Available',                        -- Trạng thái (Available, Maintenance,…) – phụ thuộc vào BookingStatus ở bảng Booking
    CreatedAt DATETIME2 DEFAULT GETDATE()
);



--   ////////////////////////////////////////////// Lịch Sân ////////////////////////////////////////////////////////////////////

-- Gồm có 1 bảng lưu riêng các slot  edit được giờ sân Slot 1: 22:15 – 23:45 | Slot 2: 20:45 – 22:15 | Slot 3: 19:15 – 20:45 | Slot 4: 17:45 – 19:15 | Slot 5: 16:15 – 17:45 | Slot 6: 14:45 – 16:15 | Slot 7: 13:15 – 14:45 | Slot 8: 11:45 – 13:15 | Slot 9: 10:15 – 11:45 | Slot 10: 08:45 – 10:15 | Slot 11: 07:15 – 08:45 )
CREATE TABLE TimeSlots (
    SlotID INT IDENTITY(1,1) PRIMARY KEY,       -- ID slot
    SlotName NVARCHAR(50),                      -- Tên slot (Slot 1, Slot 2,...)
    StartTime TIME NOT NULL,                    -- Giờ bắt đầu
    EndTime TIME NOT NULL,                      -- Giờ kết thúc
    UNIQUE(StartTime, EndTime)
);


-- (lịch sân ) 
CREATE TABLE FieldSchedules (
    ScheduleID INT IDENTITY(1,1) PRIMARY KEY,
    FieldID INT FOREIGN KEY REFERENCES Fields(FieldID),  -- sân nhỏ
    SlotID INT FOREIGN KEY REFERENCES TimeSlots(SlotID), -- slot chuẩn
    Date DATE NOT NULL,                                                             -- ngày áp dụng
    Status NVARCHAR(20) DEFAULT 'Available',                -- Available, Booked, Maintenance
    UNIQUE(FieldID, Date, SlotID)
);

-- ( giá sân theo từng slot )
CREATE TABLE FieldPrices (
    PriceID INT IDENTITY(1,1) PRIMARY KEY,
    FieldID INT FOREIGN KEY REFERENCES Fields(FieldID),  -- sân nhỏ
    SlotID INT FOREIGN KEY REFERENCES TimeSlots(SlotID), -- áp dụng cho slot nào
    Price DECIMAL(10,2) NOT NULL,                        -- giá thuê theo slot
    UNIQUE(FieldID, SlotID)
);



CREATE TABLE DepositPolicies (
    DepositPolicyID INT IDENTITY(1,1) PRIMARY KEY,
    FieldID INT NOT NULL FOREIGN KEY REFERENCES Fields(FieldID),           -- áp dụng cho sân nhỏ
    DepositPercent DECIMAL(5,2) NOT NULL,                                  -- % cọc (0 = không cần cọc)
    MinDeposit DECIMAL(10,2) NULL,                                         -- Cọc tối thiểu
    MaxDeposit DECIMAL(10,2) NULL,                                         -- Cọc tối đa
    CreatedAt DATETIME2 DEFAULT GETDATE()
);




CREATE TABLE Bookings (
    BookingID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),                        -- Người đặt
    ScheduleID INT NOT NULL FOREIGN KEY REFERENCES FieldSchedules(ScheduleID),       -- Slot sân

    TotalPrice DECIMAL(10,2) NOT NULL,             -- Tổng tiền
    DepositAmount DECIMAL(10,2) NOT NULL,          -- Số tiền cọc
    RemainingAmount DECIMAL(10,2) NULL,            -- Phần còn lại trả tại sân

    BookingStatus NVARCHAR(20) DEFAULT 'Pending',  -- Pending, Confirmed, Cancelled, Completed, Expired, Reactive
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending',  -- Pending, Paid, Refunded

    HasOpponent BIT DEFAULT 0,                     -- 0 = chưa có đối, 1 = đã có đối
    MatchRequestID INT  , 
                                                  -- Nếu chưa có đối thì hệ thống auto tạo request
                                                  -- Nếu có rồi thì null hoặc trỏ đến request đã matched

    QRCode NVARCHAR(255) NULL,                     -- Mã QR đặt sân
    QRExpiresAt DATETIME2 NULL,                    -- Hết hạn QR giữ chỗ (5–10 phút)

    CreatedAt DATETIME2 DEFAULT GETDATE(),
    ConfirmedAt DATETIME2 NULL,
    CancelledAt DATETIME2 NULL,
    CancelledBy NVARCHAR(20) NULL,                 -- Player / Owner / System
    CancelReason NVARCHAR(255) NULL
);





CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL FOREIGN KEY REFERENCES Bookings(BookingID),
    OwnerID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),       -- Ai nhận tiền (chủ sân)
    Amount DECIMAL(10,2) NOT NULL,
    Method NVARCHAR(50) DEFAULT 'PayOS',                            -- PayOS / VNPay / Momo
    TransactionCode NVARCHAR(100) NULL,                             -- Mã giao dịch
    OrderCode NVARCHAR(100) NULL,                                   -- Mã đơn hàng (unique)
    ResponseCode NVARCHAR(20) NULL,
    PayURL NVARCHAR(MAX) NULL,                                      -- Link thanh toán
    Status NVARCHAR(20) DEFAULT 'Pending',                          -- Pending / Success / Failed
    PaidAt DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
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
    RequestID INT NULL FOREIGN KEY REFERENCES BookingCancellationRequests(RequestID), -- optional link
    CancelledBy NVARCHAR(20) NOT NULL,    -- 'Player' / 'Owner' / 'System'
    CancelReason NVARCHAR(255) NULL,
    RefundAmount DECIMAL(10,2) NOT NULL,
    PenaltyAmount DECIMAL(10,2) DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    VerifiedBy INT NULL FOREIGN KEY REFERENCES Users(UserID), -- chủ sân xác minh
    VerifiedAt DATETIME2 NULL                                   -- thời gian xác minh
);


-- ====admin===
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
	);

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


-- ====== Tìm đội =======================================
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

-- ====== Tìm đối thủ =======================================
CREATE TABLE MatchRequests (
    MatchRequestID INT IDENTITY(1,1) PRIMARY KEY,       -- ID yêu cầu tìm đối thủ
    BookingID INT NOT NULL FOREIGN KEY REFERENCES Bookings(BookingID), 
                                                        -- Booking gắn với trận này (Player A đã đặt sân)
    CreatedBy INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), 
                                                        -- Người tạo request (Player A)
    Description NVARCHAR(500),                          -- Mô tả (ví dụ: “Đội mạnh, cần đối 7vs7”)
    Status NVARCHAR(20) DEFAULT 'Open',                 -- Open, Pending, Matched, Cancelled
    CreatedAt DATETIME2 DEFAULT GETDATE()               -- Ngày giờ tạo request
);

ALTER TABLE Bookings
ADD CONSTRAINT FK_Bookings_MatchRequests FOREIGN KEY (MatchRequestID) REFERENCES MatchRequests(MatchRequestID);

CREATE TABLE MatchParticipants (
    ParticipantID INT IDENTITY(1,1) PRIMARY KEY,        -- ID tham gia
    MatchRequestID INT NOT NULL FOREIGN KEY REFERENCES MatchRequests(MatchRequestID),
                                                        -- Trận đấu nào
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
                                                        -- Người chơi/đội tham gia (Player B captain)
    IsCreator BIT DEFAULT 0,                            -- 1 nếu là chủ trận (Player A)
    JoinedAt DATETIME2 DEFAULT GETDATE()                -- Thời điểm tham gia
);

CREATE TABLE PlayerMatchHistory (
    HistoryID INT IDENTITY(1,1) PRIMARY KEY,          -- ID lịch sử
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),  -- Người chơi
    MatchRequestID INT NOT NULL FOREIGN KEY REFERENCES MatchRequests(MatchRequestID), -- Trận tìm đối
    Role NVARCHAR(20) NOT NULL,                       -- Vai trò (Creator = chủ booking, Joiner = tham gia)
    FinalStatus NVARCHAR(20) NOT NULL,                -- Kết quả cuối (Matched, Cancelled, Expired, Pending)
    CreatedAt DATETIME2 DEFAULT GETDATE(),            -- Thời điểm tham gia
    UpdatedAt DATETIME2 DEFAULT GETDATE()             -- Cập nhật khi trạng thái thay đổi
);


-- 3. Cộng Đồng (5 bảng)
 -- ======================
 -- BẢNG POSTS (Bài viết)
 -- ======================
CREATE TABLE Posts (
    PostID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,                         -- Người đăng
    Title NVARCHAR(255) NULL,                    -- Tiêu đề (tùy chọn)
    Content NVARCHAR(MAX) NOT NULL,              -- Nội dung
    MediaURL NVARCHAR(500) NULL,                 -- Ảnh/Video
    FieldID INT NULL,                            -- Tag sân (nếu có)
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    Status NVARCHAR(20) DEFAULT 'Active',        -- Active/Hidden/Deleted
    CONSTRAINT FK_Posts_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Posts_Fields FOREIGN KEY (FieldID) REFERENCES Fields(FieldID)
);

 -- ======================
 -- BẢNG COMMENTS (Bình luận)
-- ======================
CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    ParentCommentID INT NULL,                    -- Reply comment
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Active',
    CONSTRAINT FK_Comments_Posts FOREIGN KEY (PostID) REFERENCES Posts(PostID),
    CONSTRAINT FK_Comments_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Comments_Parent FOREIGN KEY (ParentCommentID) REFERENCES Comments(CommentID)
);

 -- ======================
 -- BẢNG POSTLIKES (Like bài viết)
-- ======================
 CREATE TABLE PostLikes (
    LikeID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PostLikes_Posts FOREIGN KEY (PostID) REFERENCES Posts(PostID),
    CONSTRAINT FK_PostLikes_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT UQ_PostLikes UNIQUE (PostID, UserID)   -- Mỗi user chỉ like 1 lần/post
);

 -- ======================
-- BẢNG REPORTS (Báo cáo vi phạm)
 -- ======================
CREATE TABLE Reports (
    ReportID INT IDENTITY(1,1) PRIMARY KEY,
    ReporterID INT NOT NULL,                      -- Ai báo cáo
    TargetType NVARCHAR(20) NOT NULL CHECK (TargetType IN ('Post','Comment')),
    TargetID INT NOT NULL,                        -- ID Post hoặc Comment
    Reason NVARCHAR(500) NOT NULL,                -- Lý do
    CreatedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Pending',        -- Pending/Reviewed/Resolved
    HandledBy INT NULL,                           -- Admin xử lý
    CONSTRAINT FK_Reports_Reporter FOREIGN KEY (ReporterID) REFERENCES Users(UserID),
    CONSTRAINT FK_Reports_Admin FOREIGN KEY (HandledBy) REFERENCES Users(UserID)
    -- TargetID sẽ tham chiếu Posts hoặc Comments tùy theo TargetType → xử lý ở tầng ứng dụng
);

 -- ======================
-- BẢNG NOTIFICATIONS (Thông báo)
 -- ======================
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,                          -- Người nhận thông báo
    Type NVARCHAR(20) NOT NULL CHECK (Type IN ('NewComment','Reply','Mention','Like','ReportResult','System')),
    TargetID INT NULL,                            -- Liên kết Post/Comment
    Message NVARCHAR(500) NOT NULL,
    IsRead BIT DEFAULT 0,                         -- 0 = chưa đọc, 1 = đã đọc
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);






CREATE TABLE OwnerBankAccounts (
    BankAccountID INT IDENTITY(1,1) PRIMARY KEY,
    OwnerID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    BankName NVARCHAR(100) NOT NULL,                -- Tên ngân hàng (VD: Vietcombank)
    BankShortCode NVARCHAR(20),                     -- Mã ngân hàng (VD: VCB, MB, TPB)
    AccountNumber NVARCHAR(30) NOT NULL,            -- Số tài khoản
    AccountHolder NVARCHAR(100) NOT NULL,           -- Chủ tài khoản
    IsDefault BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);





CREATE TABLE PayoutTransactions (
    PayoutID INT IDENTITY(1,1) PRIMARY KEY,
    OwnerID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    PaymentID INT NOT NULL FOREIGN KEY REFERENCES Payments(PaymentID),
    Amount DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending',           -- Pending / Completed / Failed
    TransactionCode NVARCHAR(100) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CompletedAt DATETIME2 NULL
);


ALTER TABLE MatchRequests
ALTER COLUMN BookingID INT NULL;


ALTER TABLE Fields
ADD BankAccountID INT NULL 
    CONSTRAINT FK_Fields_OwnerBankAccounts 
    REFERENCES OwnerBankAccounts(BankAccountID);



	ALTER TABLE Fields
    ALTER COLUMN Image VARBINARY(MAX);
 

 ALTER TABLE Payments
DROP CONSTRAINT FK_Payments_OwnerID;

 ALTER TABLE Payments
DROP COLUMN OwnerID;

CREATE TABLE PlayerBankAccounts (
    BankAccountID INT IDENTITY(1,1) PRIMARY KEY,        -- ID tài khoản ngân hàng
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),  -- Liên kết với người dùng
    BankName NVARCHAR(100) NOT NULL,                    -- Tên ngân hàng (VD: Vietcombank)
    BankShortCode NVARCHAR(20),                         -- Mã ngân hàng (VD: VCB, MB, TPB)
    AccountNumber NVARCHAR(30) NOT NULL,                -- Số tài khoản
    AccountHolder NVARCHAR(100) NOT NULL,               -- Chủ tài khoản
    IsDefault BIT DEFAULT 1,                             -- Có phải tài khoản mặc định không
    CreatedAt DATETIME2 DEFAULT GETDATE(),             
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);


DROP TABLE IF EXISTS PayoutTransactions;

ALTER TABLE Payments ADD PaymentType NVARCHAR(50);

ALTER TABLE BookingCancellationRequests
ADD FinalRefundAmount DECIMAL(18,2) NULL;


ALTER TABLE FieldComplexes
ALTER COLUMN Image VARBINARY(MAX) NULL;

ALTER TABLE Bookings
DROP CONSTRAINT FK_Bookings_MatchRequests;

ALTER TABLE Bookings
DROP COLUMN MatchRequestID;

 ALTER TABLE TimeSlots
ADD Price DECIMAL(18,2) NOT NULL DEFAULT 0;

ALTER TABLE FieldImages
DROP COLUMN Image;

ALTER TABLE FieldImages
ADD ImageUrl NVARCHAR(MAX) NULL;

ALTER TABLE Fields
DROP COLUMN Image;

ALTER TABLE Fields
ADD ImageUrl NVARCHAR(MAX) NULL;

 ALTER TABLE FieldComplexes
DROP COLUMN Image;

ALTER TABLE FieldComplexes
ADD ImageUrl NVARCHAR(MAX) NULL;

-- 1. Cập nhật MatchRequests
ALTER TABLE MatchRequests ADD 
    OpponentUserID INT NULL FOREIGN KEY REFERENCES Users(UserID),
    MatchedAt DATETIME2 NULL,
    ExpiresAt DATETIME2 NULL,
    PlayerCount INT NULL;

-- 2. Tái tạo MatchParticipants (Mutual Matching)
DROP TABLE IF EXISTS MatchParticipants;
CREATE TABLE MatchParticipants (
    ParticipantID INT IDENTITY(1,1) PRIMARY KEY,
    MatchRequestID INT NOT NULL FOREIGN KEY REFERENCES MatchRequests(MatchRequestID),
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    TeamName NVARCHAR(100) NULL,
    PlayerCount INT NULL,
    ContactPhone NVARCHAR(20) NULL,
    Note NVARCHAR(255) NULL,
    StatusFromB NVARCHAR(20) DEFAULT 'Pending'  
        CHECK (StatusFromB IN ('Pending','Accepted','Rejected','Withdrawn')),
    StatusFromA NVARCHAR(20) DEFAULT 'Accepted' 
        CHECK (StatusFromA IN ('Accepted','Rejected','Cancelled')),
    JoinedAt DATETIME2 DEFAULT GETDATE(),
    RespondedAt DATETIME2 NULL,
    CONSTRAINT UQ_OneJoinPerUser UNIQUE (MatchRequestID, UserID)
);
CREATE INDEX IX_MatchParticipants_Request ON MatchParticipants(MatchRequestID);

-- 3. Hoàn thiện PlayerMatchHistory
ALTER TABLE PlayerMatchHistory ADD 
    OpponentUserID INT NULL FOREIGN KEY REFERENCES Users(UserID);
CREATE INDEX IX_PlayerMatchHistory_Opponent ON PlayerMatchHistory(OpponentUserID);

-- TRIGGER 1: Khi matched → HasOpponent = 1
CREATE OR ALTER TRIGGER TR_MatchRequests_AfterMatched
ON MatchRequests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(Status)
    BEGIN
        UPDATE b
        SET b.HasOpponent = 1
        FROM Bookings b
        INNER JOIN inserted i ON b.BookingID = i.BookingID
        WHERE i.Status = 'Matched' AND i.BookingID IS NOT NULL;
    END
END
GO

-- TRIGGER 2: Khi hủy/expired → HasOpponent = 0 (nếu chưa từng matched)
CREATE OR ALTER TRIGGER TR_MatchRequests_AfterCancel
ON MatchRequests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(Status)
    BEGIN
        UPDATE b
        SET b.HasOpponent = 0
        FROM Bookings b
        INNER JOIN inserted i ON b.BookingID = i.BookingID
        WHERE i.Status IN ('Cancelled', 'Expired') 
          AND i.OpponentUserID IS NULL;
    END
END
GO

-- TRIGGER 3: Khi mutual accept → tự động tạo lịch sử cho cả 2 bên
CREATE OR ALTER TRIGGER TR_MatchParticipants_AfterMutualAccept
ON MatchParticipants
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(StatusFromB)
    BEGIN
        INSERT INTO PlayerMatchHistory (UserID, MatchRequestID, Role, FinalStatus, OpponentUserID, CreatedAt, UpdatedAt)
        SELECT 
            mr.CreatedBy, i.MatchRequestID, 'Creator', 'Matched', i.UserID, GETDATE(), GETDATE()
        FROM inserted i
        INNER JOIN MatchRequests mr ON i.MatchRequestID = mr.MatchRequestID
        WHERE i.StatusFromB = 'Accepted' AND i.StatusFromA = 'Accepted'
          AND NOT EXISTS (SELECT 1 FROM PlayerMatchHistory h 
                          WHERE h.MatchRequestID = i.MatchRequestID AND h.UserID = mr.CreatedBy)

        UNION ALL

        SELECT 
            i.UserID, i.MatchRequestID, 'Joiner', 'Matched', mr.CreatedBy, GETDATE(), GETDATE()
        FROM inserted i
        INNER JOIN MatchRequests mr ON i.MatchRequestID = mr.MatchRequestID
        WHERE i.StatusFromB = 'Accepted' AND i.StatusFromA = 'Accepted'
          AND NOT EXISTS (SELECT 1 FROM PlayerMatchHistory h 
                          WHERE h.MatchRequestID = i.MatchRequestID AND h.UserID = i.UserID);
    END
END
GO
-- 1) Gói booking theo tháng/quý
CREATE TABLE BookingPackages (
    BookingPackageID INT IDENTITY(1,1) PRIMARY KEY,        -- ID gói
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),  -- Ai đặt gói
    FieldID INT NOT NULL FOREIGN KEY REFERENCES Fields(FieldID), -- Sân áp dụng
    PackageName NVARCHAR(255) NOT NULL,                     -- Tên gói (VD: Tháng 05/2025)
    StartDate DATE NOT NULL,                                 -- Ngày bắt đầu gói
    EndDate DATE NOT NULL,                                   -- Ngày kết thúc gói
    TotalPrice DECIMAL(18,2) NOT NULL,                      -- Tổng tiền của cả gói
    BookingStatus NVARCHAR(20) DEFAULT 'Pending',           -- Pending / Confirmed / Cancelled / Completed
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending',           -- Pending / Paid / Refunded
    QRCode NVARCHAR(255) NULL,                               -- QR code giữ chỗ
    QRExpiresAt DATETIME2 NULL,                              -- Hết hạn QR
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- 2) Buổi con trong gói
CREATE TABLE PackageSessions (
    PackageSessionID INT IDENTITY(1,1) PRIMARY KEY,         -- ID buổi con
    BookingPackageID INT NOT NULL FOREIGN KEY REFERENCES BookingPackages(BookingPackageID), -- Gói cha
    ScheduleID INT NOT NULL FOREIGN KEY REFERENCES FieldSchedules(ScheduleID), -- Slot / ngày cụ thể
    SessionDate DATE NOT NULL,                               -- Ngày buổi chơi (copy từ FieldSchedules.Date)
    PricePerSession DECIMAL(18,2) NOT NULL,                 -- Giá 1 buổi (lấy từ FieldPrices hoặc Field.PricePerHour)
    SessionStatus NVARCHAR(20) DEFAULT 'Pending',           -- Pending / Confirmed / Cancelled / Completed
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Ai đặt (copy từ BookingPackage)
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE MonthlyPackagePayments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,                      
    BookingPackageID INT NOT NULL 
        CONSTRAINT FK_PackagePayments_BookingPackage
        REFERENCES BookingPackages(BookingPackageID),
    UserID INT NOT NULL 
        CONSTRAINT FK_PackagePayments_User
        REFERENCES Users(UserID),
    Amount DECIMAL(10,2) NOT NULL,          -- Tổng tiền gói
    TotalSlots INT NOT NULL,                 -- Tổng số buổi/sân trong gói
    Method NVARCHAR(50) DEFAULT 'PayOS',     -- VNPay / Momo / PayOS...
    TransactionCode NVARCHAR(100) NULL,     -- Mã giao dịch ngân hàng
    Status NVARCHAR(20) DEFAULT 'Pending',  -- Pending / Success / Failed
    PaidAt DATETIME2 NULL,                   -- Thời gian thanh toán
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE BookingPackageSessionDraft (
    DraftId INT IDENTITY(1,1) PRIMARY KEY,
    BookingPackageId INT NOT NULL, -- ID gói tháng
    UserId INT NOT NULL,           -- người dùng tạo gói
    FieldId INT NOT NULL,          -- sân/field liên quan
    SlotId INT NOT NULL,           -- slot trong tuần mà user chọn
    DayOfWeek TINYINT NOT NULL,    -- 0=Sunday, 1=Monday,..., 6=Saturday
    Status NVARCHAR(20) NOT NULL DEFAULT 'Draft', -- Draft / Confirmed
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);

  ALTER TABLE Users
    ALTER COLUMN Avatar NVARCHAR(MAX) NULL;
	---Bảng đánh giá sân sau khi booking = completed
CREATE TABLE Ratings (
    RatingId INT IDENTITY(1,1) PRIMARY KEY,
    BookingId INT NOT NULL,
    UserId INT NOT NULL,
    FieldId INT NOT NULL,
    Stars INT NOT NULL,          -- 1 đến 5 sao
    Comment NVARCHAR(500) NULL,  -- nội dung đánh giá
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (BookingId) REFERENCES Bookings(BookingId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (FieldId) REFERENCES Fields(FieldId)
);

