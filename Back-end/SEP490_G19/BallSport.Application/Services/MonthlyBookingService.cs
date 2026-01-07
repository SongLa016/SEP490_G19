    using BallSport.Application.DTOs;
using BallSport.Infrastructure.Models;
    using BallSport.Infrastructure.Repositories;
    using Banking.Application.Services;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace BallSport.Application.Services
    {
        public class MonthlyBookingService
        {
            private readonly BookingPackageRepository _bookingRepo;
            private readonly PaymentRepository _paymentRepo;
            private readonly MonthlyPackagePaymentRepo _monthlyPayment;
            private readonly PackageSessionRepository _packageSessionRepo;
            private readonly BookingPackageSessionDraftRepository _draftRepo;
            private readonly EmailService _emailService;

        public MonthlyBookingService(BookingPackageRepository bookingRepo, PaymentRepository paymentRepo, MonthlyPackagePaymentRepo monthlyPayment, PackageSessionRepository packageSessionRepo, BookingPackageSessionDraftRepository draftRepo, EmailService emailService)
        {
            _bookingRepo = bookingRepo;
            _paymentRepo = paymentRepo;
            _monthlyPayment = monthlyPayment;
            _packageSessionRepo = packageSessionRepo;
            _draftRepo = draftRepo;
            _emailService = emailService;
        }

        public async Task<reposeDraftDTO> CreateBookingPackageAsync(BookingPackageCreateDto dto)
        {
            // 1. Tạo package
            var package = new BookingPackage
            {
                UserId = dto.UserId,
                FieldId = dto.FieldId,
                PackageName = dto.PackageName,
                StartDate = DateOnly.FromDateTime(dto.StartDate),
                EndDate = DateOnly.FromDateTime(dto.EndDate),
                TotalPrice = 0,
                BookingStatus = "Pending",
                PaymentStatus = "Pending",
                CreatedAt = DateTime.Now
            };

            package = await _bookingRepo.CreateBookingPackageAsync(package);
            Console.WriteLine($"[LOG] Created BookingPackage {package.BookingPackageId} for user {dto.UserId}");

            decimal totalPrice = 0;

            // 2. Tạo draft cho từng slot được chọn
            if (dto.SelectedSlots != null && dto.SelectedSlots.Any())
            {
                foreach (var slot in dto.SelectedSlots)
                {
                    int fieldId = slot.FieldId ?? dto.FieldId;
                    decimal slotPrice = await _packageSessionRepo.GetSlotPriceAsync(slot.SlotId, fieldId);

                    Console.WriteLine($"[LOG] Processing SlotId {slot.SlotId} for FieldId {fieldId}, SlotPrice = {slotPrice}, DayOfWeek = {slot.DayOfWeek}");

                    for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
                    {
                        if ((byte)date.DayOfWeek != slot.DayOfWeek)
                            continue;

                        var schedule = await _packageSessionRepo.GetScheduleAsync(fieldId, slot.SlotId, DateOnly.FromDateTime(date));
                        int? scheduleId = slot.ScheduleId ?? schedule?.ScheduleId;

                        Console.WriteLine($"[LOG] Date {date:yyyy-MM-dd}, ScheduleId from DTO or DB = {scheduleId}");

                        var draft = new BookingPackageSessionDraft
                        {
                            BookingPackageId = package.BookingPackageId,
                            UserId = dto.UserId,
                            FieldId = fieldId,
                            SlotId = slot.SlotId,
                            DayOfWeek = slot.DayOfWeek,
                            Status = "Draft",
                            CreatedAt = DateTime.Now,
                            ScheduleId = scheduleId,
                            ActualDate = DateOnly.FromDateTime(date)
                        };

                        // Lưu draft vào DB
                        await _draftRepo.CreateDraftAsync(draft);

                        // Cộng giá nếu schedule thực sự có
                        if (scheduleId.HasValue)
                        {
                            totalPrice += slotPrice;
                            Console.WriteLine($"[LOG] Added SlotPrice {slotPrice}, TotalPrice now = {totalPrice}");
                        }
                        else
                        {
                            Console.WriteLine("[LOG] Schedule not found, slot skipped for pricing");
                        }
                    }
                }
            }

            // 3. Cập nhật totalPrice cho package
            package.TotalPrice = totalPrice;
            await _bookingRepo.UpdateTotalPriceAsync(package.BookingPackageId, totalPrice);
            Console.WriteLine($"[LOG] Final TotalPrice for Package {package.BookingPackageId} = {totalPrice}");

            // 4. Tạo QR code
            string qrUrl = await _paymentRepo.GenerateVietQRForPackageAsync(package.BookingPackageId, totalPrice);
            var expiresAt = DateTime.Now.AddMinutes(10);
            await _bookingRepo.UpdateQRCodeAsync(package.BookingPackageId, qrUrl, expiresAt);

            package.Qrcode = qrUrl;
            package.QrexpiresAt = expiresAt;

            var packageFromDb = await _bookingRepo.GetByIdAsync(package.BookingPackageId);

            if (packageFromDb.User != null && !string.IsNullOrWhiteSpace(packageFromDb.User.Email))
            {
                string subject = $"Đặt sân gói {packageFromDb.PackageName} thành công";
                string message = $"Chào {packageFromDb.User.FullName},<br/>" +
                                 $"Bạn vừa đặt sân gói <b>{packageFromDb.PackageName}</b> ...";

                await _emailService.SendEmailAsync(packageFromDb.User.Email, subject, message);
            }



            // 5. Trả về DTO
            return new reposeDraftDTO
            {
                BookingPackageId = package.BookingPackageId,
                UserId = package.UserId,
                FieldId = package.FieldId,
                PackageName = package.PackageName,
                StartDate = package.StartDate,
                EndDate = package.EndDate,
                TotalPrice = package.TotalPrice,
                BookingStatus = package.BookingStatus,
                PaymentStatus = package.PaymentStatus,
                Qrcode = package.Qrcode,
                QrexpiresAt = package.QrexpiresAt
            };
        }



        public async Task<bool> ConfirmBookingByOwnerAsync(int packageId)
        {
            var package = await _bookingRepo.GetByIdAsync(packageId);
            if (package == null)
            {
                Console.WriteLine($"[Confirm] PackageId {packageId} không tồn tại");
                return false;
            }

            // 1. Update status
            package.BookingStatus = "Confirmed";
            package.PaymentStatus = "Paid";
            package.UpdatedAt = DateTime.Now;

            await _bookingRepo.UpdateStatusToConfirmedAsync(packageId);
            Console.WriteLine($"[Confirm] Updated package status");

            // 2. Lấy DRAFT
            var drafts = await _draftRepo.GetDraftsByPackageIdAsync(packageId);
            Console.WriteLine($"[Confirm] Found {drafts.Count} draft records");

            // Lọc draft hợp lệ (có ScheduleId)
            var validDrafts = drafts.Where(d => d.ScheduleId.HasValue).ToList();
            int totalSlots = validDrafts.Count;

            if (totalSlots == 0)
            {
                Console.WriteLine("[Confirm] Không có draft hợp lệ (ScheduleId null)");
                return false;
            }

            Console.WriteLine($"[Confirm] Total valid slots = {totalSlots}");

            // 3. Tạo payment
            var payment = new MonthlyPackagePayment
            {
                BookingPackageId = package.BookingPackageId,
                UserId = package.UserId,
                Amount = package.TotalPrice,
                TotalSlots = totalSlots,
                Status = "Paid",
                Method = "Manual",
                PaidAt = DateTime.Now,
                CreatedAt = DateTime.Now
            };

            await _monthlyPayment.CreatePaymentAsync(payment);
            Console.WriteLine("[Confirm] Payment created");

        
            // 5. Tạo PackageSession theo từng draft
            foreach (var draft in validDrafts)
            {
                try
                {
                    var schedule = await _packageSessionRepo.GetScheduleByIdAsync(draft.ScheduleId.Value);
                    if (schedule == null)
                    {
                        Console.WriteLine($"[Confirm][WARN] ScheduleId {draft.ScheduleId} not found");
                        continue;
                    }

                     decimal pricePerSession =
                      await _packageSessionRepo.GetSlotPriceAsync(draft.SlotId, package.FieldId);

                    var session = new PackageSession
                    {
                        BookingPackageId = package.BookingPackageId,
                        UserId = package.UserId,
                        SessionDate = draft.ActualDate!.Value,
                        PricePerSession = pricePerSession,
                        SessionStatus = "Booking",
                        CreatedAt = DateTime.Now,
                        ScheduleId = schedule.ScheduleId
                    };

                    await _packageSessionRepo.CreatePackageSessionAsync(session);
                    Console.WriteLine($"[Confirm] Created session for date {schedule.Date}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Confirm][Error] Creating session: {ex.Message}");
                    throw;
                }
            }

            if (!string.IsNullOrWhiteSpace(package.User?.Email))
            {
                string subject = $"Booking gói {package.PackageName} đã được chủ sân duyệt";
                string message = $"Chào {package.User.FullName},<br/><br/>" +
                                 $"Chúc mừng! Chủ sân đã duyệt booking gói <b>{package.PackageName}</b> của bạn.<br/>" +
                                 $"Cảm ơn bạn đã sử dụng dịch vụ.<br/><br/>" +
                                 $"Trân trọng,<br/>Ban quản lý sân";

                await _emailService.SendEmailAsync(package.User.Email, subject, message);
            }

            return true;
        }

        public async Task<bool> CompleteBookingPackageAsync(int BookingPackageId)
            {
                return await _bookingRepo.CompleteBookingPackageAsync(BookingPackageId);
            }


        public async Task<object> CancelPackageSessionAsync(int sessionId)
        {
            var session = await _packageSessionRepo.GetByIdAsync(sessionId);
            if (session == null)
            {
                // Log sessionId để debug
                Console.WriteLine($"CancelPackageSessionAsync: sessionId {sessionId} not found");
                throw new Exception($"Không tìm thấy buổi chơi với ID {sessionId}.");
            }


            // 2) Cập nhật trạng thái session
            session.SessionStatus = "Cancelled";
            session.UpdatedAt = DateTime.Now;
            await _packageSessionRepo.UpdateSessionAsync(session);

            // 3) Lấy giá tiền từ session
            decimal price = session.PricePerSession;

            // 4) Gen QR refund cho người chơi
            string qrUrl = await _paymentRepo.GenerateRefundQRForSessionAsync(session.UserId, price);


            if (!string.IsNullOrWhiteSpace(session.User?.Email))
            {
                string subject = $"Buổi chơi {session.SessionDate:dd/MM/yyyy} đã bị hủy";
                string message = $"Chào {session.User.FullName},<br/><br/>" +
                                 $"Buổi chơi ngày <b>{session.SessionDate:dd/MM/yyyy}</b> trong gói <b>{session.BookingPackage?.PackageName}</b> đã bị hủy.<br/>" +                                 
                                 $"Trân trọng,<br/>Ban quản lý sân";

                await _emailService.SendEmailAsync(session.User.Email, subject, message);
            }

            return new
            {
                sessionId = session.PackageSessionId,
                bookingPackageId = session.BookingPackageId,
                scheduleId = session.ScheduleId,
                sessionDate = session.SessionDate,
                price = price,
                sessionStatus = session.SessionStatus,
                refundQr = qrUrl
            };
        }


        // ================= Owner packages =================
        public async Task<List<BKDTO>> GetBookingPackagesForOwnerAsync(int ownerId)
        {
            var packages = await _bookingRepo.GetByOwnerIdAsync(ownerId);

            var result = packages.Select(p => new BKDTO
            {
                BookingPackageId = p.BookingPackageId,
                UserId = p.UserId,
                FieldId = p.FieldId,
                PackageName = p.PackageName,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                TotalPrice = p.TotalPrice,
                BookingStatus = p.BookingStatus,
                PaymentStatus = p.PaymentStatus,
                Qrcode = p.Qrcode,
                QrexpiresAt = p.QrexpiresAt,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                FieldName = p.Field?.Name,
                FieldStatus = p.Field?.Status,
                
            }).ToList();

            return result;
        }

        // ================= Player packages =================
        public async Task<List<BKDTO>> GetBookingPackagesForPlayerAsync(int userId)
        {
            var packages = await _bookingRepo.GetByPlayerIdAsync(userId);

            var result = packages.Select(p => new BKDTO
            {
                BookingPackageId = p.BookingPackageId,
                UserId = p.UserId,
                FieldId = p.FieldId,
                PackageName = p.PackageName,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                TotalPrice = p.TotalPrice,
                BookingStatus = p.BookingStatus,
                PaymentStatus = p.PaymentStatus,
                Qrcode = p.Qrcode,
                QrexpiresAt = p.QrexpiresAt,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                FieldName = p.Field?.Name,
                FieldStatus = p.Field?.Status,
                
            }).ToList();

            return result;
        }

        // ================= Player sessions =================
        public async Task<List<PSDTO>> GetPackageSessionsForPlayerAsync(int userId)
        {
            var sessions = await _packageSessionRepo.GetSessionsByPlayerIdAsync(userId);

            return sessions.Select(s => new PSDTO
            {
                PackageSessionId = s.PackageSessionId,
                BookingPackageId = s.BookingPackageId,
                SessionDate = s.SessionDate,
                PricePerSession = s.PricePerSession,
                SessionStatus = s.SessionStatus,
                UserId = s.UserId,
                ScheduleId = s.ScheduleId
               
            }).ToList();
        }

        // ================= Owner sessions =================
        public async Task<List<PSDTO>> GetPackageSessionsForOwnerAsync(int ownerId)
        {
            var sessions = await _packageSessionRepo.GetSessionsByOwnerIdAsync(ownerId);

            return sessions.Select(s => new PSDTO
            {
                PackageSessionId = s.PackageSessionId,
                BookingPackageId = s.BookingPackageId,
                SessionDate = s.SessionDate,
                PricePerSession = s.PricePerSession,
                SessionStatus = s.SessionStatus,
                UserId = s.UserId,
                ScheduleId = s.ScheduleId
               
            }).ToList();
        }


        public async Task<int> AutoCompleteExpiredSessionsAsync()
        {
            var now = DateTime.Now;
            return await _packageSessionRepo.CompleteExpiredSessionsAsync(now);
        }


    }




}
