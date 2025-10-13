using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Concurrent;

namespace Banking.Application.Services
{

    public class OTPService
    {
        private readonly IMemoryCache _cache;

        public OTPService(IMemoryCache memoryCache)
        {
            _cache = memoryCache;
        }

        // lưu opt vào bộ nhớ ngắn hạn 
        public bool SaveOtp(string email, string otp, int expireMinutes = 10)
        {
            var expiration = TimeSpan.FromMinutes(expireMinutes);
            _cache.Set($"otp:{email}", otp, expiration);
            _cache.Set($"otp:reverse:{otp}", email, expiration);

            Console.WriteLine($"[DEBUG] OTP '{otp}' saved for '{email}', expires in {expireMinutes} minutes");
            return true;
        }

        // kiểm tra otp có hợp lệ không
        public string VerifyAndGetEmailByOtp(string otp)
        {
            if (_cache.TryGetValue($"otp:reverse:{otp}", out string email))
            {
                if (_cache.TryGetValue($"otp:{email}", out string storedOtp))
                {
                    if (storedOtp == otp)
                    {
                        Console.WriteLine("[DEBUG] OTP verified successfully.");
                        return email;
                    }
                }
            }

            Console.WriteLine("[DEBUG] OTP không hợp lệ hoặc đã hết hạn.");
            return null;
        }
    }

}
