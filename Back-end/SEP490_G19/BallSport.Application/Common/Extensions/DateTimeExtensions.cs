using System;

namespace BallSport.Application.Common.Extensions
{
    public static class DateTimeExtensions
    {
        // Múi giờ Việt Nam - chuẩn cả Windows và Linux (không daylight saving)
        public static readonly TimeZoneInfo VietnamZone = OperatingSystem.IsWindows()
            ? TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")
            : TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

        // Giờ hiện tại theo múi giờ Việt Nam (thay thế hoàn hảo cho DateTime.Now khi cần giờ VN)
        public static DateTime VietnamNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamZone);

        /// <summary>
        /// Chuyển DateTime sang giờ Việt Nam (UTC+7).
        /// Xử lý an toàn mọi Kind: Utc, Unspecified, Local.
        /// </summary>
        /// <param name="dateTime">DateTime cần convert (thường là UTC từ DB)</param>
        /// <returns>DateTime ở múi giờ Việt Nam</returns>
        public static DateTime ToVietnamTime(this DateTime dateTime)
        {
            DateTime utcToConvert;

            switch (dateTime.Kind)
            {
                case DateTimeKind.Utc:
                    utcToConvert = dateTime;
                    break;

                case DateTimeKind.Unspecified:
                    // Từ DB (EF Core) thường là Unspecified → giả định là UTC
                    utcToConvert = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
                    break;

                case DateTimeKind.Local:
                    // Nếu là Local (do DateTime.Now hoặc từ client) → convert về UTC trước
                    utcToConvert = TimeZoneInfo.ConvertTimeToUtc(dateTime, TimeZoneInfo.Local);
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(dateTime.Kind), "Invalid DateTime Kind");
            }

            return TimeZoneInfo.ConvertTimeFromUtc(utcToConvert, VietnamZone);
        }

        /// <summary>
        /// Chuyển DateTime? sang giờ Việt Nam.
        /// Nếu null → trả về giờ hiện tại VN.
        /// </summary>
        public static DateTime ToVietnamTimeOrNow(this DateTime? dateTime)
            => dateTime.HasValue ? dateTime.Value.ToVietnamTime() : VietnamNow;

        /// <summary>
        /// Chuyển DateOnly + TimeOnly thành DateTime ở múi giờ Việt Nam.
        /// </summary>
        public static DateTime ToDateTime(this DateOnly date, TimeOnly time)
        {
            // Tạo DateTime UTC từ DateOnly + TimeOnly
            var utc = date.ToDateTime(time, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(utc, VietnamZone);
        }

        /// <summary>
        /// Format ngày tiếng Việt đẹp: "Thứ Bảy, 29/11/2025"
        /// </summary>
        public static string ToVietNamString(this DateTime dateTime, string format = "dddd, dd/MM/yyyy")
        {
            return dateTime.ToString(format, new System.Globalization.CultureInfo("vi-VN"));
        }

        /// <summary>
        /// Format giờ đẹp: "07:00" thay vì "7:00"
        /// </summary>
        public static string ToTimeString(this TimeOnly time)
        {
            return time.ToString(@"HH\:mm");
        }

        /// <summary>
        /// Gộp DateOnly + TimeOnly thành DateTime ở múi giờ Việt Nam.
        /// (Tên phương thức này giống ToDateTime, nhưng giữ để tương thích nếu đã dùng)
        /// </summary>
        public static DateTime CombineWithStartTime(this DateOnly date, TimeOnly startTime)
        {
            return date.ToDateTime(startTime);
        }
    }
}