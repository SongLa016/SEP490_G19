using System;
using System.Collections.Generic;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace BallSport.Infrastructure.Data;

public partial class Sep490G19v1Context : DbContext
{
    public Sep490G19v1Context()
    {
    }

    public Sep490G19v1Context(DbContextOptions<Sep490G19v1Context> options)
        : base(options)
    {
    }

    public virtual DbSet<BlogPost> BlogPosts { get; set; }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<BookingCancellation> BookingCancellations { get; set; }

    public virtual DbSet<BookingCancellationRequest> BookingCancellationRequests { get; set; }

    public virtual DbSet<CancellationPolicy> CancellationPolicies { get; set; }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<DepositPolicy> DepositPolicies { get; set; }

    public virtual DbSet<Field> Fields { get; set; }

    public virtual DbSet<FieldComplex> FieldComplexes { get; set; }

    public virtual DbSet<FieldPrice> FieldPrices { get; set; }

    public virtual DbSet<FieldSchedule> FieldSchedules { get; set; }

    public virtual DbSet<FieldType> FieldTypes { get; set; }

    public virtual DbSet<MatchParticipant> MatchParticipants { get; set; }

    public virtual DbSet<MatchRequest> MatchRequests { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<OwnerBankAccount> OwnerBankAccounts { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PlayerBankAccount> PlayerBankAccounts { get; set; }

    public virtual DbSet<PlayerMatchHistory> PlayerMatchHistories { get; set; }

    public virtual DbSet<Post> Posts { get; set; }

    public virtual DbSet<PostLike> PostLikes { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<SystemNotification> SystemNotifications { get; set; }

    public virtual DbSet<Team> Teams { get; set; }

    public virtual DbSet<TeamJoinRequest> TeamJoinRequests { get; set; }

    public virtual DbSet<TimeSlot> TimeSlots { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserProfile> UserProfiles { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    public virtual DbSet<ViolationReport> ViolationReports { get; set; }
    public DbSet<FieldImage> FieldImages { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
       /* if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer("Server = tcp:ballsport - server.database.windows.net, 1433; Initial Catalog = SEP490_G19V1; Persist Security Info = False; User ID = adminsql; Password = Admin@12345; MultipleActiveResultSets = True; Encrypt = True; TrustServerCertificate = True; Connection Timeout = 30;");
        }*/
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.HasKey(e => e.PostId).HasName("PK__BlogPost__AA12603833AB0D25");

            entity.Property(e => e.PostId).HasColumnName("PostID");
            entity.Property(e => e.AuthorId).HasColumnName("AuthorID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Draft");
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.Author).WithMany(p => p.BlogPosts)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__BlogPosts__Autho__236943A5");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.BookingId).HasName("PK__Bookings__73951ACD3F1D6103");

            entity.Property(e => e.BookingId).HasColumnName("BookingID");
            entity.Property(e => e.BookingStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.CancelReason).HasMaxLength(255);
            entity.Property(e => e.CancelledBy).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.DepositAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.HasOpponent).HasDefaultValue(false);
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.Qrcode)
                .HasMaxLength(255)
                .HasColumnName("QRCode");
            entity.Property(e => e.QrexpiresAt).HasColumnName("QRExpiresAt");
            entity.Property(e => e.RemainingAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.ScheduleId).HasColumnName("ScheduleID");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Schedule).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.ScheduleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Bookings__Schedu__797309D9");

            entity.HasOne(d => d.User).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Bookings__UserID__787EE5A0");
        });

        modelBuilder.Entity<BookingCancellation>(entity =>
        {
            entity.HasKey(e => e.CancellationId).HasName("PK__BookingC__6A2D9A1AFAD0F417");

            entity.Property(e => e.CancellationId).HasColumnName("CancellationID");
            entity.Property(e => e.BookingId).HasColumnName("BookingID");
            entity.Property(e => e.CancelReason).HasMaxLength(255);
            entity.Property(e => e.CancelledBy).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.PenaltyAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(10, 2)");
            entity.Property(e => e.RefundAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.RequestId).HasColumnName("RequestID");

            entity.HasOne(d => d.Booking).WithMany(p => p.BookingCancellations)
                .HasForeignKey(d => d.BookingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__BookingCa__Booki__114A936A");

            entity.HasOne(d => d.Request).WithMany(p => p.BookingCancellations)
                .HasForeignKey(d => d.RequestId)
                .HasConstraintName("FK__BookingCa__Reque__123EB7A3");

            entity.HasOne(d => d.VerifiedByNavigation).WithMany(p => p.BookingCancellations)
                .HasForeignKey(d => d.VerifiedBy)
                .HasConstraintName("FK__BookingCa__Verif__151B244E");
        });

        modelBuilder.Entity<BookingCancellationRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__BookingC__33A8519A54076F12");

            entity.Property(e => e.RequestId).HasColumnName("RequestID");
            entity.Property(e => e.BookingId).HasColumnName("BookingID");
            entity.Property(e => e.FinalRefundAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PenaltyAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.RefundAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.RequestReason).HasMaxLength(255);
            entity.Property(e => e.RequestStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.RequestedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.RequestedByRole).HasMaxLength(20);
            entity.Property(e => e.RequestedByUserId).HasColumnName("RequestedByUserID");
            entity.Property(e => e.ReversalReason).HasMaxLength(255);
            entity.Property(e => e.ReversedByUserId).HasColumnName("ReversedByUserID");

            entity.HasOne(d => d.Booking).WithMany(p => p.BookingCancellationRequests)
                .HasForeignKey(d => d.BookingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__BookingCa__Booki__0A9D95DB");

            entity.HasOne(d => d.RequestedByUser).WithMany(p => p.BookingCancellationRequestRequestedByUsers)
                .HasForeignKey(d => d.RequestedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__BookingCa__Reque__0B91BA14");

            entity.HasOne(d => d.ReversedByUser).WithMany(p => p.BookingCancellationRequestReversedByUsers)
                .HasForeignKey(d => d.ReversedByUserId)
                .HasConstraintName("FK__BookingCa__Rever__0E6E26BF");
        });

        modelBuilder.Entity<CancellationPolicy>(entity =>
        {
            entity.HasKey(e => e.PolicyId).HasName("PK__Cancella__2E1339446C8E5B6C");

            entity.Property(e => e.PolicyId).HasColumnName("PolicyID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.FieldId).HasColumnName("FieldID");
            entity.Property(e => e.OwnerPenaltyRate)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(5, 2)");
            entity.Property(e => e.RefundRate).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Field).WithMany(p => p.CancellationPolicies)
                .HasForeignKey(d => d.FieldId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Cancellat__Field__05D8E0BE");
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.CommentId).HasName("PK__Comments__C3B4DFAAB7F9B484");

            entity.Property(e => e.CommentId).HasColumnName("CommentID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ParentCommentId).HasColumnName("ParentCommentID");
            entity.Property(e => e.PostId).HasColumnName("PostID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Active");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.ParentComment).WithMany(p => p.InverseParentComment)
                .HasForeignKey(d => d.ParentCommentId)
                .HasConstraintName("FK_Comments_Parent");

            entity.HasOne(d => d.Post).WithMany(p => p.Comments)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Comments_Posts");

            entity.HasOne(d => d.User).WithMany(p => p.Comments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Comments_Users");
        });

        modelBuilder.Entity<DepositPolicy>(entity =>
        {
            entity.HasKey(e => e.DepositPolicyId).HasName("PK__DepositP__0B7CD7A3AFACB82D");

            entity.Property(e => e.DepositPolicyId).HasColumnName("DepositPolicyID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.DepositPercent).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.FieldId).HasColumnName("FieldID");
            entity.Property(e => e.MaxDeposit).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.MinDeposit).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Field).WithMany(p => p.DepositPolicies)
                .HasForeignKey(d => d.FieldId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DepositPo__Field__74AE54BC");
        });

        modelBuilder.Entity<Field>(entity =>
        {
            entity.HasKey(e => e.FieldId).HasName("PK__Fields__C8B6FF273AB66C90");

            entity.Property(e => e.FieldId).HasColumnName("FieldID");
            entity.Property(e => e.BankAccountId).HasColumnName("BankAccountID");
            entity.Property(e => e.ComplexId).HasColumnName("ComplexID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.GrassType).HasMaxLength(100);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.PricePerHour).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Size).HasMaxLength(100);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Available");
            entity.Property(e => e.TypeId).HasColumnName("TypeID");

            entity.HasOne(d => d.BankAccount).WithMany(p => p.Fields)
                .HasForeignKey(d => d.BankAccountId)
                .HasConstraintName("FK_Fields_OwnerBankAccounts");

            entity.HasOne(d => d.Complex).WithMany(p => p.Fields)
                .HasForeignKey(d => d.ComplexId)
                .HasConstraintName("FK__Fields__ComplexI__619B8048");

            entity.HasOne(d => d.Type).WithMany(p => p.Fields)
                .HasForeignKey(d => d.TypeId)
                .HasConstraintName("FK__Fields__TypeID__628FA481");
        });

        modelBuilder.Entity<FieldComplex>(entity =>
        {
            entity.HasKey(e => e.ComplexId).HasName("PK__FieldCom__E14B3DF668A4569F");

            entity.Property(e => e.ComplexId).HasColumnName("ComplexID");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.OwnerId).HasColumnName("OwnerID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Active");

            entity.HasOne(d => d.Owner).WithMany(p => p.FieldComplexes)
                .HasForeignKey(d => d.OwnerId)
                .HasConstraintName("FK__FieldComp__Owner__5CD6CB2B");
        });

        modelBuilder.Entity<FieldPrice>(entity =>
        {
            entity.HasKey(e => e.PriceId).HasName("PK__FieldPri__4957584F6417A502");

            entity.HasIndex(e => new { e.FieldId, e.SlotId }, "UQ__FieldPri__2817DB823439E8DC").IsUnique();

            entity.Property(e => e.PriceId).HasColumnName("PriceID");
            entity.Property(e => e.FieldId).HasColumnName("FieldID");
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.SlotId).HasColumnName("SlotID");

            entity.HasOne(d => d.Field).WithMany(p => p.FieldPrices)
                .HasForeignKey(d => d.FieldId)
                .HasConstraintName("FK__FieldPric__Field__70DDC3D8");

            entity.HasOne(d => d.Slot).WithMany(p => p.FieldPrices)
                .HasForeignKey(d => d.SlotId)
                .HasConstraintName("FK__FieldPric__SlotI__71D1E811");
        });

        modelBuilder.Entity<FieldSchedule>(entity =>
        {
            entity.HasKey(e => e.ScheduleId).HasName("PK__FieldSch__9C8A5B69C9B647FD");

            entity.HasIndex(e => new { e.FieldId, e.Date, e.SlotId }, "UQ__FieldSch__F1CF6ABC02AE2AE5").IsUnique();

            entity.Property(e => e.ScheduleId).HasColumnName("ScheduleID");
            entity.Property(e => e.FieldId).HasColumnName("FieldID");
            entity.Property(e => e.SlotId).HasColumnName("SlotID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Available");

            entity.HasOne(d => d.Field).WithMany(p => p.FieldSchedules)
                .HasForeignKey(d => d.FieldId)
                .HasConstraintName("FK__FieldSche__Field__6B24EA82");

            entity.HasOne(d => d.Slot).WithMany(p => p.FieldSchedules)
                .HasForeignKey(d => d.SlotId)
                .HasConstraintName("FK__FieldSche__SlotI__6C190EBB");
        });

        modelBuilder.Entity<FieldType>(entity =>
        {
            entity.HasKey(e => e.TypeId).HasName("PK__FieldTyp__516F03952DB61ED1");

            entity.HasIndex(e => e.TypeName, "UQ__FieldTyp__D4E7DFA8A98A70C9").IsUnique();

            entity.Property(e => e.TypeId).HasColumnName("TypeID");
            entity.Property(e => e.TypeName).HasMaxLength(50);
        });

        modelBuilder.Entity<MatchParticipant>(entity =>
        {
            entity.HasKey(e => e.ParticipantId).HasName("PK__MatchPar__7227997E0CC0A8DB");

            entity.Property(e => e.ParticipantId).HasColumnName("ParticipantID");
            entity.Property(e => e.IsCreator).HasDefaultValue(false);
            entity.Property(e => e.JoinedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.MatchRequestId).HasColumnName("MatchRequestID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.MatchRequest).WithMany(p => p.MatchParticipants)
                .HasForeignKey(d => d.MatchRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__MatchPart__Match__3B40CD36");

            entity.HasOne(d => d.User).WithMany(p => p.MatchParticipants)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__MatchPart__UserI__3C34F16F");
        });

        modelBuilder.Entity<MatchRequest>(entity =>
        {
            entity.HasKey(e => e.MatchRequestId).HasName("PK__MatchReq__AE45CD76F9ECB289");

            entity.Property(e => e.MatchRequestId).HasColumnName("MatchRequestID");
            entity.Property(e => e.BookingId).HasColumnName("BookingID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Open");

            entity.HasOne(d => d.Booking).WithMany(p => p.MatchRequests)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK__MatchRequ__Booki__3493CFA7");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.MatchRequests)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__MatchRequ__Creat__3587F3E0");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PK__Notifica__20CF2E327469AD80");

            entity.Property(e => e.NotificationId).HasColumnName("NotificationID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.TargetId).HasColumnName("TargetID");
            entity.Property(e => e.Type).HasMaxLength(20);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_Users");
        });

        modelBuilder.Entity<OwnerBankAccount>(entity =>
        {
            entity.HasKey(e => e.BankAccountId).HasName("PK__OwnerBan__4FC8E7416736DED5");

            entity.Property(e => e.BankAccountId).HasColumnName("BankAccountID");
            entity.Property(e => e.AccountHolder).HasMaxLength(100);
            entity.Property(e => e.AccountNumber).HasMaxLength(30);
            entity.Property(e => e.BankName).HasMaxLength(100);
            entity.Property(e => e.BankShortCode).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsDefault).HasDefaultValue(true);
            entity.Property(e => e.OwnerId).HasColumnName("OwnerID");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Owner).WithMany(p => p.OwnerBankAccounts)
                .HasForeignKey(d => d.OwnerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__OwnerBank__Owner__756D6ECB");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__Payments__9B556A580D32C6B5");

            entity.HasIndex(e => e.OrderCode, "UQ_Payments_OrderCode").IsUnique();

            entity.Property(e => e.PaymentId).HasColumnName("PaymentID");
            entity.Property(e => e.Amount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.BookingId).HasColumnName("BookingID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Method)
                .HasMaxLength(50)
                .HasDefaultValue("PayOS");
            entity.Property(e => e.OrderCode).HasMaxLength(100);
            entity.Property(e => e.PayOrderInfo).HasMaxLength(255);
            entity.Property(e => e.PayUrl).HasColumnName("PayURL");
            entity.Property(e => e.PaymentType).HasMaxLength(50);
            entity.Property(e => e.ResponseCode).HasMaxLength(20);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TransactionCode).HasMaxLength(100);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Booking).WithMany(p => p.Payments)
                .HasForeignKey(d => d.BookingId)
                .HasConstraintName("FK__Payments__Bookin__00200768");
        });

        modelBuilder.Entity<PlayerBankAccount>(entity =>
        {
            entity.HasKey(e => e.BankAccountId).HasName("PK__PlayerBa__4FC8E741E8399AB7");

            entity.Property(e => e.BankAccountId).HasColumnName("BankAccountID");
            entity.Property(e => e.AccountHolder).HasMaxLength(100);
            entity.Property(e => e.AccountNumber).HasMaxLength(30);
            entity.Property(e => e.BankName).HasMaxLength(100);
            entity.Property(e => e.BankShortCode).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsDefault).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.PlayerBankAccounts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PlayerBan__UserI__1B9317B3");
        });

        modelBuilder.Entity<PlayerMatchHistory>(entity =>
        {
            entity.HasKey(e => e.HistoryId).HasName("PK__PlayerMa__4D7B4ADD11DF0DB5");

            entity.ToTable("PlayerMatchHistory");

            entity.Property(e => e.HistoryId).HasColumnName("HistoryID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.FinalStatus).HasMaxLength(20);
            entity.Property(e => e.MatchRequestId).HasColumnName("MatchRequestID");
            entity.Property(e => e.Role).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.MatchRequest).WithMany(p => p.PlayerMatchHistories)
                .HasForeignKey(d => d.MatchRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PlayerMat__Match__41EDCAC5");

            entity.HasOne(d => d.User).WithMany(p => p.PlayerMatchHistories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PlayerMat__UserI__40F9A68C");
        });

        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasKey(e => e.PostId).HasName("PK__Posts__AA1260385ACE9BE0");

            entity.Property(e => e.PostId).HasColumnName("PostID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.FieldId).HasColumnName("FieldID");
            entity.Property(e => e.MediaUrl)
                .HasMaxLength(500)
                .HasColumnName("MediaURL");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Active");
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Field).WithMany(p => p.Posts)
                .HasForeignKey(d => d.FieldId)
                .HasConstraintName("FK_Posts_Fields");

            entity.HasOne(d => d.User).WithMany(p => p.Posts)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Posts_Users");
        });

        modelBuilder.Entity<PostLike>(entity =>
        {
            entity.HasKey(e => e.LikeId).HasName("PK__PostLike__A2922CF4D8340BB2");

            entity.HasIndex(e => new { e.PostId, e.UserId }, "UQ_PostLikes").IsUnique();

            entity.Property(e => e.LikeId).HasColumnName("LikeID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.PostId).HasColumnName("PostID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Post).WithMany(p => p.PostLikes)
                .HasForeignKey(d => d.PostId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PostLikes_Posts");

            entity.HasOne(d => d.User).WithMany(p => p.PostLikes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PostLikes_Users");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.ReportId).HasName("PK__Reports__D5BD48E53AE7A2FF");

            entity.Property(e => e.ReportId).HasColumnName("ReportID");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.ReporterId).HasColumnName("ReporterID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TargetId).HasColumnName("TargetID");
            entity.Property(e => e.TargetType).HasMaxLength(20);

            entity.HasOne(d => d.HandledByNavigation).WithMany(p => p.ReportHandledByNavigations)
                .HasForeignKey(d => d.HandledBy)
                .HasConstraintName("FK_Reports_Admin");

            entity.HasOne(d => d.Reporter).WithMany(p => p.ReportReporters)
                .HasForeignKey(d => d.ReporterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reports_Reporter");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Roles__8AFACE3A38EC6744");

            entity.HasIndex(e => e.RoleName, "UQ__Roles__8A2B616012173E19").IsUnique();

            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<SystemNotification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PK__SystemNo__20CF2E3247B2B39F");

            entity.Property(e => e.NotificationId).HasColumnName("NotificationID");
            entity.Property(e => e.InsUrgent).HasDefaultValue(false);
            entity.Property(e => e.NotificationType)
                .HasMaxLength(50)
                .HasDefaultValue("General");
            entity.Property(e => e.SentAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.SentToRole).HasMaxLength(50);
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.SentByNavigation).WithMany(p => p.SystemNotifications)
                .HasForeignKey(d => d.SentBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__SystemNot__SentB__19DFD96B");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.TeamId).HasName("PK__Teams__123AE7B9F41C7002");

            entity.Property(e => e.TeamId).HasColumnName("TeamID");
            entity.Property(e => e.ContactPhone).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.CurrentMembers).HasDefaultValue(1);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.PreferredPositions).HasMaxLength(100);
            entity.Property(e => e.PreferredSkillLevel).HasMaxLength(20);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Open");
            entity.Property(e => e.TeamName).HasMaxLength(100);

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Teams)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Teams__CreatedBy__282DF8C2");
        });

        modelBuilder.Entity<TeamJoinRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__TeamJoin__33A8519AF308DD09");

            entity.Property(e => e.RequestId).HasColumnName("RequestID");
            entity.Property(e => e.Message).HasMaxLength(255);
            entity.Property(e => e.RequestedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TeamId).HasColumnName("TeamID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.RespondedByNavigation).WithMany(p => p.TeamJoinRequestRespondedByNavigations)
                .HasForeignKey(d => d.RespondedBy)
                .HasConstraintName("FK__TeamJoinR__Respo__31B762FC");

            entity.HasOne(d => d.Team).WithMany(p => p.TeamJoinRequests)
                .HasForeignKey(d => d.TeamId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TeamJoinR__TeamI__2DE6D218");

            entity.HasOne(d => d.User).WithMany(p => p.TeamJoinRequestUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TeamJoinR__UserI__2EDAF651");
        });

        modelBuilder.Entity<TimeSlot>(entity =>
        {
            entity.HasKey(e => e.SlotId).HasName("PK__TimeSlot__0A124A4FB1680F1C");

            entity.HasIndex(e => new { e.StartTime, e.EndTime }, "UQ__TimeSlot__F4AF5A9C54149FFE").IsUnique();

            entity.Property(e => e.SlotId).HasColumnName("SlotID");
            entity.Property(e => e.SlotName).HasMaxLength(50);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CCACF80E6B0E");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D1053449DCA7A5").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Active");
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.ProfileId).HasName("PK__UserProf__290C888465AA0478");

            entity.HasIndex(e => e.UserId, "UQ__UserProf__1788CCAD01035ECC").IsUnique();

            entity.Property(e => e.ProfileId).HasColumnName("ProfileID");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Bio)
                .HasMaxLength(20)
                .HasColumnName("bio");
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.PreferredPositions).HasMaxLength(100);
            entity.Property(e => e.SkillLevel).HasMaxLength(20);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithOne(p => p.UserProfile)
                .HasForeignKey<UserProfile>(d => d.UserId)
                .HasConstraintName("FK__UserProfi__UserI__571DF1D5");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.UserRoleId).HasName("PK__UserRole__3D978A55A5AFEB15");

            entity.HasIndex(e => new { e.UserId, e.RoleId }, "UQ__UserRole__AF27604EA2C5F7A0").IsUnique();

            entity.Property(e => e.UserRoleId).HasColumnName("UserRoleID");
            entity.Property(e => e.RoleId).HasColumnName("RoleID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("FK__UserRoles__RoleI__534D60F1");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserRoles__UserI__52593CB8");
        });

        modelBuilder.Entity<ViolationReport>(entity =>
        {
            entity.HasKey(e => e.ReportId).HasName("PK__Violatio__D5BD48E5023AD08D");

            entity.Property(e => e.ReportId).HasColumnName("ReportID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.ReportType).HasMaxLength(50);
            entity.Property(e => e.ReportedUserId).HasColumnName("ReportedUserID");
            entity.Property(e => e.ReporterId).HasColumnName("ReporterID");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.ReportedUser).WithMany(p => p.ViolationReportReportedUsers)
                .HasForeignKey(d => d.ReportedUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Violation__Repor__1DB06A4F");

            entity.HasOne(d => d.Reporter).WithMany(p => p.ViolationReportReporters)
                .HasForeignKey(d => d.ReporterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Violation__Repor__1EA48E88");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
