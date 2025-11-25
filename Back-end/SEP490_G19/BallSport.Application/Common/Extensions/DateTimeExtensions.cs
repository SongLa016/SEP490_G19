// File: BallSport.Application/Common/Extensions/DateTimeExtensions.cs
using System;

namespace BallSport.Application.Common.Extensions
{
    public static class DateTimeExtensions
    {
        private static readonly TimeZoneInfo VietnamZone = OperatingSystem.IsWindows()
            ? TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time")
            : TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

        /// <summary>
        /// Chuyển DateOnly + TimeOnly → DateTime đúng giờ Việt Nam (UTC+7)
        /// </summary>
        public static DateTime ToDateTime(this DateOnly date, TimeOnly time)
        {
            var utc = date.ToDateTime(time, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(utc, VietnamZone);
        }

        /// <summary>
        /// Format ngày đẹp: "Thứ 7, 29/11/2025" hoặc "29/11/2025 07:00"
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
        /// Gộp ngày + giờ bắt đầu → DateTime đầy đủ
        /// </summary>
        public static DateTime CombineWithStartTime(this DateOnly date, TimeOnly startTime)
        {
            return date.ToDateTime(startTime);
        }
    }
}