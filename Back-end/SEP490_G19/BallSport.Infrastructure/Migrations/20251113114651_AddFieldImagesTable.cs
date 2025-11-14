using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BallSport.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFieldImagesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FieldTypes",
                columns: table => new
                {
                    TypeID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TypeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__FieldTyp__516F03952DB61ED1", x => x.TypeID);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Roles__8AFACE3A38EC6744", x => x.RoleID);
                });

            migrationBuilder.CreateTable(
                name: "TimeSlots",
                columns: table => new
                {
                    SlotID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SlotName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__TimeSlot__0A124A4FB1680F1C", x => x.SlotID);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Avatar = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Users__1788CCACF80E6B0E", x => x.UserID);
                });

            migrationBuilder.CreateTable(
                name: "BlogPosts",
                columns: table => new
                {
                    PostID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AuthorID = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Draft"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__BlogPost__AA12603833AB0D25", x => x.PostID);
                    table.ForeignKey(
                        name: "FK__BlogPosts__Autho__236943A5",
                        column: x => x.AuthorID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "FieldComplexes",
                columns: table => new
                {
                    ComplexID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OwnerID = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Image = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Active"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__FieldCom__E14B3DF668A4569F", x => x.ComplexID);
                    table.ForeignKey(
                        name: "FK__FieldComp__Owner__5CD6CB2B",
                        column: x => x.OwnerID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotificationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TargetID = table.Column<int>(type: "int", nullable: true),
                    Message = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Notifica__20CF2E327469AD80", x => x.NotificationID);
                    table.ForeignKey(
                        name: "FK_Notifications_Users",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "OwnerBankAccounts",
                columns: table => new
                {
                    BankAccountID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OwnerID = table.Column<int>(type: "int", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BankShortCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AccountHolder = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: true, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OwnerBan__4FC8E7416736DED5", x => x.BankAccountID);
                    table.ForeignKey(
                        name: "FK__OwnerBank__Owner__756D6ECB",
                        column: x => x.OwnerID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "PlayerBankAccounts",
                columns: table => new
                {
                    BankAccountID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BankShortCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AccountHolder = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: true, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__PlayerBa__4FC8E741E8399AB7", x => x.BankAccountID);
                    table.ForeignKey(
                        name: "FK__PlayerBan__UserI__1B9317B3",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    ReportID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReporterID = table.Column<int>(type: "int", nullable: false),
                    TargetType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TargetID = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Pending"),
                    HandledBy = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Reports__D5BD48E53AE7A2FF", x => x.ReportID);
                    table.ForeignKey(
                        name: "FK_Reports_Admin",
                        column: x => x.HandledBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                    table.ForeignKey(
                        name: "FK_Reports_Reporter",
                        column: x => x.ReporterID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "SystemNotifications",
                columns: table => new
                {
                    NotificationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NotificationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValue: "General"),
                    SentToRole = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SentToSpecificUsers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InsUrgent = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    SentBy = table.Column<int>(type: "int", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__SystemNo__20CF2E3247B2B39F", x => x.NotificationID);
                    table.ForeignKey(
                        name: "FK__SystemNot__SentB__19DFD96B",
                        column: x => x.SentBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    TeamID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    ContactPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PreferredSkillLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PreferredPositions = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CurrentMembers = table.Column<int>(type: "int", nullable: true, defaultValue: 1),
                    MaxMembers = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Open"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Teams__123AE7B9F41C7002", x => x.TeamID);
                    table.ForeignKey(
                        name: "FK__Teams__CreatedBy__282DF8C2",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "UserProfiles",
                columns: table => new
                {
                    ProfileID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: true),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PreferredPositions = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SkillLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    bio = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__UserProf__290C888465AA0478", x => x.ProfileID);
                    table.ForeignKey(
                        name: "FK__UserProfi__UserI__571DF1D5",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserRoleID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: true),
                    RoleID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__UserRole__3D978A55A5AFEB15", x => x.UserRoleID);
                    table.ForeignKey(
                        name: "FK__UserRoles__RoleI__534D60F1",
                        column: x => x.RoleID,
                        principalTable: "Roles",
                        principalColumn: "RoleID");
                    table.ForeignKey(
                        name: "FK__UserRoles__UserI__52593CB8",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "ViolationReports",
                columns: table => new
                {
                    ReportID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReportedUserID = table.Column<int>(type: "int", nullable: false),
                    ReporterID = table.Column<int>(type: "int", nullable: false),
                    ReportType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Pending"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Violatio__D5BD48E5023AD08D", x => x.ReportID);
                    table.ForeignKey(
                        name: "FK__Violation__Repor__1DB06A4F",
                        column: x => x.ReportedUserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                    table.ForeignKey(
                        name: "FK__Violation__Repor__1EA48E88",
                        column: x => x.ReporterID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "Fields",
                columns: table => new
                {
                    FieldID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ComplexID = table.Column<int>(type: "int", nullable: true),
                    TypeID = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Size = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    GrassType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Image = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    PricePerHour = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Available"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    BankAccountID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Fields__C8B6FF273AB66C90", x => x.FieldID);
                    table.ForeignKey(
                        name: "FK_Fields_OwnerBankAccounts",
                        column: x => x.BankAccountID,
                        principalTable: "OwnerBankAccounts",
                        principalColumn: "BankAccountID");
                    table.ForeignKey(
                        name: "FK__Fields__ComplexI__619B8048",
                        column: x => x.ComplexID,
                        principalTable: "FieldComplexes",
                        principalColumn: "ComplexID");
                    table.ForeignKey(
                        name: "FK__Fields__TypeID__628FA481",
                        column: x => x.TypeID,
                        principalTable: "FieldTypes",
                        principalColumn: "TypeID");
                });

            migrationBuilder.CreateTable(
                name: "TeamJoinRequests",
                columns: table => new
                {
                    RequestID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Pending"),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RespondedBy = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__TeamJoin__33A8519AF308DD09", x => x.RequestID);
                    table.ForeignKey(
                        name: "FK__TeamJoinR__Respo__31B762FC",
                        column: x => x.RespondedBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                    table.ForeignKey(
                        name: "FK__TeamJoinR__TeamI__2DE6D218",
                        column: x => x.TeamID,
                        principalTable: "Teams",
                        principalColumn: "TeamID");
                    table.ForeignKey(
                        name: "FK__TeamJoinR__UserI__2EDAF651",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "CancellationPolicies",
                columns: table => new
                {
                    PolicyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FieldID = table.Column<int>(type: "int", nullable: false),
                    CancelBeforeHours = table.Column<int>(type: "int", nullable: false),
                    RefundRate = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    OwnerPenaltyRate = table.Column<decimal>(type: "decimal(5,2)", nullable: true, defaultValue: 0m),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(sysutcdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Cancella__2E1339446C8E5B6C", x => x.PolicyID);
                    table.ForeignKey(
                        name: "FK__Cancellat__Field__05D8E0BE",
                        column: x => x.FieldID,
                        principalTable: "Fields",
                        principalColumn: "FieldID");
                });

            migrationBuilder.CreateTable(
                name: "DepositPolicies",
                columns: table => new
                {
                    DepositPolicyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FieldID = table.Column<int>(type: "int", nullable: false),
                    DepositPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    MinDeposit = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    MaxDeposit = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DepositP__0B7CD7A3AFACB82D", x => x.DepositPolicyID);
                    table.ForeignKey(
                        name: "FK__DepositPo__Field__74AE54BC",
                        column: x => x.FieldID,
                        principalTable: "Fields",
                        principalColumn: "FieldID");
                });

            migrationBuilder.CreateTable(
                name: "FieldImage",
                columns: table => new
                {
                    FieldImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FieldId = table.Column<int>(type: "int", nullable: false),
                    ImageData = table.Column<byte[]>(type: "varbinary(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldImage", x => x.FieldImageId);
                    table.ForeignKey(
                        name: "FK_FieldImage_Fields_FieldId",
                        column: x => x.FieldId,
                        principalTable: "Fields",
                        principalColumn: "FieldID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FieldPrices",
                columns: table => new
                {
                    PriceID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FieldID = table.Column<int>(type: "int", nullable: true),
                    SlotID = table.Column<int>(type: "int", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__FieldPri__4957584F6417A502", x => x.PriceID);
                    table.ForeignKey(
                        name: "FK__FieldPric__Field__70DDC3D8",
                        column: x => x.FieldID,
                        principalTable: "Fields",
                        principalColumn: "FieldID");
                    table.ForeignKey(
                        name: "FK__FieldPric__SlotI__71D1E811",
                        column: x => x.SlotID,
                        principalTable: "TimeSlots",
                        principalColumn: "SlotID");
                });

            migrationBuilder.CreateTable(
                name: "FieldSchedules",
                columns: table => new
                {
                    ScheduleID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FieldID = table.Column<int>(type: "int", nullable: true),
                    SlotID = table.Column<int>(type: "int", nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Available")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__FieldSch__9C8A5B69C9B647FD", x => x.ScheduleID);
                    table.ForeignKey(
                        name: "FK__FieldSche__Field__6B24EA82",
                        column: x => x.FieldID,
                        principalTable: "Fields",
                        principalColumn: "FieldID");
                    table.ForeignKey(
                        name: "FK__FieldSche__SlotI__6C190EBB",
                        column: x => x.SlotID,
                        principalTable: "TimeSlots",
                        principalColumn: "SlotID");
                });

            migrationBuilder.CreateTable(
                name: "Posts",
                columns: table => new
                {
                    PostID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MediaURL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FieldID = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Active")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Posts__AA1260385ACE9BE0", x => x.PostID);
                    table.ForeignKey(
                        name: "FK_Posts_Fields",
                        column: x => x.FieldID,
                        principalTable: "Fields",
                        principalColumn: "FieldID");
                    table.ForeignKey(
                        name: "FK_Posts_Users",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    CommentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PostID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    ParentCommentID = table.Column<int>(type: "int", nullable: true),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())"),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Active")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Comments__C3B4DFAAB7F9B484", x => x.CommentID);
                    table.ForeignKey(
                        name: "FK_Comments_Parent",
                        column: x => x.ParentCommentID,
                        principalTable: "Comments",
                        principalColumn: "CommentID");
                    table.ForeignKey(
                        name: "FK_Comments_Posts",
                        column: x => x.PostID,
                        principalTable: "Posts",
                        principalColumn: "PostID");
                    table.ForeignKey(
                        name: "FK_Comments_Users",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "PostLikes",
                columns: table => new
                {
                    LikeID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PostID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__PostLike__A2922CF4D8340BB2", x => x.LikeID);
                    table.ForeignKey(
                        name: "FK_PostLikes_Posts",
                        column: x => x.PostID,
                        principalTable: "Posts",
                        principalColumn: "PostID");
                    table.ForeignKey(
                        name: "FK_PostLikes_Users",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "BookingCancellationRequests",
                columns: table => new
                {
                    RequestID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingID = table.Column<int>(type: "int", nullable: false),
                    RequestedByUserID = table.Column<int>(type: "int", nullable: false),
                    RequestedByRole = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RequestReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(sysutcdatetime())"),
                    RequestStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Pending"),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RefundAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    PenaltyAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    UndoAllowedUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReversedByUserID = table.Column<int>(type: "int", nullable: true),
                    ReversedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReversalReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    FinalRefundAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__BookingC__33A8519A54076F12", x => x.RequestID);
                    table.ForeignKey(
                        name: "FK__BookingCa__Reque__0B91BA14",
                        column: x => x.RequestedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                    table.ForeignKey(
                        name: "FK__BookingCa__Rever__0E6E26BF",
                        column: x => x.ReversedByUserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "BookingCancellations",
                columns: table => new
                {
                    CancellationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingID = table.Column<int>(type: "int", nullable: false),
                    RequestID = table.Column<int>(type: "int", nullable: true),
                    CancelledBy = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CancelReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    RefundAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PenaltyAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: true, defaultValue: 0m),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(sysutcdatetime())"),
                    VerifiedBy = table.Column<int>(type: "int", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__BookingC__6A2D9A1AFAD0F417", x => x.CancellationID);
                    table.ForeignKey(
                        name: "FK__BookingCa__Reque__123EB7A3",
                        column: x => x.RequestID,
                        principalTable: "BookingCancellationRequests",
                        principalColumn: "RequestID");
                    table.ForeignKey(
                        name: "FK__BookingCa__Verif__151B244E",
                        column: x => x.VerifiedBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    BookingID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    ScheduleID = table.Column<int>(type: "int", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DepositAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    RemainingAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    BookingStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Pending"),
                    PaymentStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Pending"),
                    HasOpponent = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    MatchRequestID = table.Column<int>(type: "int", nullable: true),
                    QRCode = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    QRExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    ConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledBy = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CancelReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Bookings__73951ACD3F1D6103", x => x.BookingID);
                    table.ForeignKey(
                        name: "FK__Bookings__Schedu__797309D9",
                        column: x => x.ScheduleID,
                        principalTable: "FieldSchedules",
                        principalColumn: "ScheduleID");
                    table.ForeignKey(
                        name: "FK__Bookings__UserID__787EE5A0",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "MatchRequests",
                columns: table => new
                {
                    MatchRequestID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingID = table.Column<int>(type: "int", nullable: true),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Open"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__MatchReq__AE45CD76F9ECB289", x => x.MatchRequestID);
                    table.ForeignKey(
                        name: "FK__MatchRequ__Booki__3493CFA7",
                        column: x => x.BookingID,
                        principalTable: "Bookings",
                        principalColumn: "BookingID");
                    table.ForeignKey(
                        name: "FK__MatchRequ__Creat__3587F3E0",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    PaymentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BookingID = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true, defaultValue: "Pending"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    Method = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true, defaultValue: "PayOS"),
                    TransactionCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OrderCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PayOrderInfo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ResponseCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PayURL = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PaymentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Payments__9B556A580D32C6B5", x => x.PaymentID);
                    table.ForeignKey(
                        name: "FK__Payments__Bookin__00200768",
                        column: x => x.BookingID,
                        principalTable: "Bookings",
                        principalColumn: "BookingID");
                });

            migrationBuilder.CreateTable(
                name: "MatchParticipants",
                columns: table => new
                {
                    ParticipantID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MatchRequestID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    IsCreator = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__MatchPar__7227997E0CC0A8DB", x => x.ParticipantID);
                    table.ForeignKey(
                        name: "FK__MatchPart__Match__3B40CD36",
                        column: x => x.MatchRequestID,
                        principalTable: "MatchRequests",
                        principalColumn: "MatchRequestID");
                    table.ForeignKey(
                        name: "FK__MatchPart__UserI__3C34F16F",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateTable(
                name: "PlayerMatchHistory",
                columns: table => new
                {
                    HistoryID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    MatchRequestID = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FinalStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__PlayerMa__4D7B4ADD11DF0DB5", x => x.HistoryID);
                    table.ForeignKey(
                        name: "FK__PlayerMat__Match__41EDCAC5",
                        column: x => x.MatchRequestID,
                        principalTable: "MatchRequests",
                        principalColumn: "MatchRequestID");
                    table.ForeignKey(
                        name: "FK__PlayerMat__UserI__40F9A68C",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BlogPosts_AuthorID",
                table: "BlogPosts",
                column: "AuthorID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellationRequests_BookingID",
                table: "BookingCancellationRequests",
                column: "BookingID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellationRequests_RequestedByUserID",
                table: "BookingCancellationRequests",
                column: "RequestedByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellationRequests_ReversedByUserID",
                table: "BookingCancellationRequests",
                column: "ReversedByUserID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellations_BookingID",
                table: "BookingCancellations",
                column: "BookingID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellations_RequestID",
                table: "BookingCancellations",
                column: "RequestID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellations_VerifiedBy",
                table: "BookingCancellations",
                column: "VerifiedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_MatchRequestID",
                table: "Bookings",
                column: "MatchRequestID");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ScheduleID",
                table: "Bookings",
                column: "ScheduleID");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserID",
                table: "Bookings",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_CancellationPolicies_FieldID",
                table: "CancellationPolicies",
                column: "FieldID");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_ParentCommentID",
                table: "Comments",
                column: "ParentCommentID");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_PostID",
                table: "Comments",
                column: "PostID");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_UserID",
                table: "Comments",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_DepositPolicies_FieldID",
                table: "DepositPolicies",
                column: "FieldID");

            migrationBuilder.CreateIndex(
                name: "IX_FieldComplexes_OwnerID",
                table: "FieldComplexes",
                column: "OwnerID");

            migrationBuilder.CreateIndex(
                name: "IX_FieldImage_FieldId",
                table: "FieldImage",
                column: "FieldId");

            migrationBuilder.CreateIndex(
                name: "IX_FieldPrices_SlotID",
                table: "FieldPrices",
                column: "SlotID");

            migrationBuilder.CreateIndex(
                name: "UQ__FieldPri__2817DB823439E8DC",
                table: "FieldPrices",
                columns: new[] { "FieldID", "SlotID" },
                unique: true,
                filter: "[FieldID] IS NOT NULL AND [SlotID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Fields_BankAccountID",
                table: "Fields",
                column: "BankAccountID");

            migrationBuilder.CreateIndex(
                name: "IX_Fields_ComplexID",
                table: "Fields",
                column: "ComplexID");

            migrationBuilder.CreateIndex(
                name: "IX_Fields_TypeID",
                table: "Fields",
                column: "TypeID");

            migrationBuilder.CreateIndex(
                name: "IX_FieldSchedules_SlotID",
                table: "FieldSchedules",
                column: "SlotID");

            migrationBuilder.CreateIndex(
                name: "UQ__FieldSch__F1CF6ABC02AE2AE5",
                table: "FieldSchedules",
                columns: new[] { "FieldID", "Date", "SlotID" },
                unique: true,
                filter: "[FieldID] IS NOT NULL AND [SlotID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UQ__FieldTyp__D4E7DFA8A98A70C9",
                table: "FieldTypes",
                column: "TypeName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchParticipants_MatchRequestID",
                table: "MatchParticipants",
                column: "MatchRequestID");

            migrationBuilder.CreateIndex(
                name: "IX_MatchParticipants_UserID",
                table: "MatchParticipants",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRequests_BookingID",
                table: "MatchRequests",
                column: "BookingID");

            migrationBuilder.CreateIndex(
                name: "IX_MatchRequests_CreatedBy",
                table: "MatchRequests",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserID",
                table: "Notifications",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_OwnerBankAccounts_OwnerID",
                table: "OwnerBankAccounts",
                column: "OwnerID");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BookingID",
                table: "Payments",
                column: "BookingID");

            migrationBuilder.CreateIndex(
                name: "UQ_Payments_OrderCode",
                table: "Payments",
                column: "OrderCode",
                unique: true,
                filter: "[OrderCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerBankAccounts_UserID",
                table: "PlayerBankAccounts",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerMatchHistory_MatchRequestID",
                table: "PlayerMatchHistory",
                column: "MatchRequestID");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerMatchHistory_UserID",
                table: "PlayerMatchHistory",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_PostLikes_UserID",
                table: "PostLikes",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "UQ_PostLikes",
                table: "PostLikes",
                columns: new[] { "PostID", "UserID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Posts_FieldID",
                table: "Posts",
                column: "FieldID");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_UserID",
                table: "Posts",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_HandledBy",
                table: "Reports",
                column: "HandledBy");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_ReporterID",
                table: "Reports",
                column: "ReporterID");

            migrationBuilder.CreateIndex(
                name: "UQ__Roles__8A2B616012173E19",
                table: "Roles",
                column: "RoleName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemNotifications_SentBy",
                table: "SystemNotifications",
                column: "SentBy");

            migrationBuilder.CreateIndex(
                name: "IX_TeamJoinRequests_RespondedBy",
                table: "TeamJoinRequests",
                column: "RespondedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TeamJoinRequests_TeamID",
                table: "TeamJoinRequests",
                column: "TeamID");

            migrationBuilder.CreateIndex(
                name: "IX_TeamJoinRequests_UserID",
                table: "TeamJoinRequests",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_CreatedBy",
                table: "Teams",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "UQ__TimeSlot__F4AF5A9C54149FFE",
                table: "TimeSlots",
                columns: new[] { "StartTime", "EndTime" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__UserProf__1788CCAD01035ECC",
                table: "UserProfiles",
                column: "UserID",
                unique: true,
                filter: "[UserID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleID",
                table: "UserRoles",
                column: "RoleID");

            migrationBuilder.CreateIndex(
                name: "UQ__UserRole__AF27604EA2C5F7A0",
                table: "UserRoles",
                columns: new[] { "UserID", "RoleID" },
                unique: true,
                filter: "[UserID] IS NOT NULL AND [RoleID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UQ__Users__A9D1053449DCA7A5",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ViolationReports_ReportedUserID",
                table: "ViolationReports",
                column: "ReportedUserID");

            migrationBuilder.CreateIndex(
                name: "IX_ViolationReports_ReporterID",
                table: "ViolationReports",
                column: "ReporterID");

            migrationBuilder.AddForeignKey(
                name: "FK__BookingCa__Booki__0A9D95DB",
                table: "BookingCancellationRequests",
                column: "BookingID",
                principalTable: "Bookings",
                principalColumn: "BookingID");

            migrationBuilder.AddForeignKey(
                name: "FK__BookingCa__Booki__114A936A",
                table: "BookingCancellations",
                column: "BookingID",
                principalTable: "Bookings",
                principalColumn: "BookingID");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_MatchRequests",
                table: "Bookings",
                column: "MatchRequestID",
                principalTable: "MatchRequests",
                principalColumn: "MatchRequestID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__Bookings__UserID__787EE5A0",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK__FieldComp__Owner__5CD6CB2B",
                table: "FieldComplexes");

            migrationBuilder.DropForeignKey(
                name: "FK__MatchRequ__Creat__3587F3E0",
                table: "MatchRequests");

            migrationBuilder.DropForeignKey(
                name: "FK__OwnerBank__Owner__756D6ECB",
                table: "OwnerBankAccounts");

            migrationBuilder.DropForeignKey(
                name: "FK__MatchRequ__Booki__3493CFA7",
                table: "MatchRequests");

            migrationBuilder.DropTable(
                name: "BlogPosts");

            migrationBuilder.DropTable(
                name: "BookingCancellations");

            migrationBuilder.DropTable(
                name: "CancellationPolicies");

            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "DepositPolicies");

            migrationBuilder.DropTable(
                name: "FieldImage");

            migrationBuilder.DropTable(
                name: "FieldPrices");

            migrationBuilder.DropTable(
                name: "MatchParticipants");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PlayerBankAccounts");

            migrationBuilder.DropTable(
                name: "PlayerMatchHistory");

            migrationBuilder.DropTable(
                name: "PostLikes");

            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropTable(
                name: "SystemNotifications");

            migrationBuilder.DropTable(
                name: "TeamJoinRequests");

            migrationBuilder.DropTable(
                name: "UserProfiles");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "ViolationReports");

            migrationBuilder.DropTable(
                name: "BookingCancellationRequests");

            migrationBuilder.DropTable(
                name: "Posts");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "MatchRequests");

            migrationBuilder.DropTable(
                name: "FieldSchedules");

            migrationBuilder.DropTable(
                name: "Fields");

            migrationBuilder.DropTable(
                name: "TimeSlots");

            migrationBuilder.DropTable(
                name: "OwnerBankAccounts");

            migrationBuilder.DropTable(
                name: "FieldComplexes");

            migrationBuilder.DropTable(
                name: "FieldTypes");
        }
    }
}
