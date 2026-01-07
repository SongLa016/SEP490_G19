using System;

namespace BallSport.Application.Common.Extensions
{
    public static class DateTimeExtensions
    {
        // Múi giờ Việt Nam - chuẩn cả Windows và Linux
        public static readonly TimeZoneInfo VietnamZone = OperatingSystem.IsWindows()
            ? TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")
            : TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

        // Giờ hiện tại Việt Nam (UTC+7) - thay thế hoàn hảo cho DateTime.Now
        public static DateTime VietnamNow => TimeZoneInfo.ConvertTimeFromUtc(DateTime.Now, VietnamZone);

        /// <summary>
        /// Chuyển DateTime (UTC) → giờ Việt Nam (UTC+7)
        /// </summary>
        public static DateTime ToVietnamTime(this DateTime utcDateTime)
        {
            if (utcDateTime.Kind == DateTimeKind.Unspecified)
                utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);

            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, VietnamZone);
        }

        /// <summary>
        /// Chuyển DateTime? (UTC) → giờ Việt Nam, nếu null thì trả về giờ hiện tại VN
        /// </summary>
        public static DateTime ToVietnamTimeOrNow(this DateTime? utcDateTime)
            => utcDateTime?.ToVietnamTime() ?? VietnamNow;

        /// <summary>
        /// Chuyển DateOnly + TimeOnly → DateTime giờ Việt Nam
        /// </summary>
        public static DateTime ToDateTime(this DateOnly date, TimeOnly time)
        {
            var utc = date.ToDateTime(time, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(utc, VietnamZone);
        }

        /// <summary>
        /// Format ngày tiếng Việt đẹp: "Thứ 7, 29/11/2025"
        /// </summary>
        public static string ToVietNamString(this DateTime dateTime, string format = "dddd, dd/MM/yyyy")
        {
            return dateTime.ToString(format, new System.Globalization.CultureInfo("vi-VN"));
        }

        /// <summary>
        /// Format giờ đẹp: 07:00 thay vì 7:00
        /// </summary>
        public static string ToTimeString(this TimeOnly time)
        {
            return time.ToString(@"HH\:mm");
        }

        /// <summary>
        /// Gộp ngày + giờ → DateTime Việt Nam
        /// </summary>
        public static DateTime CombineWithStartTime(this DateOnly date, TimeOnly startTime)
        {
            return date.ToDateTime(startTime);
        }
    }
}