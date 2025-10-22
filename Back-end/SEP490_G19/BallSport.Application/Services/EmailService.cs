using System;
using System.Net.Mail;
using System.Net;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;
using Microsoft.Extensions.Options;
using SendGrid.Helpers.Mail;
using SendGrid;

namespace Banking.Application.Services
{
    public class EmailService
    {
        private readonly SmtpSettings _smtpSettings;

        public EmailService(SmtpSettings smtpSettings)
        {
            _smtpSettings = smtpSettings;
        }

        public async Task SendEmailAsync(string recipientEmail, string subject, string message)
        {
            await SendMail(recipientEmail, subject, message, isHtml: true);
        }

        /// <summary>
        /// Gửi email chứa mã OTP
        /// </summary>
        public async Task SendOtpEmailAsync(string recipientEmail, string otp)
        {
            string subject = "Xác nhận OTP đăng ký";
            string message = $"Mã OTP của bạn là: <b>{otp}</b>. Vui lòng nhập OTP để xác nhận tài khoản.";
            await SendMail(recipientEmail, subject, message, isHtml: true);
        }

        /// <summary>
        /// Hàm dùng chung để gửi email
        /// </summary>
        private async Task SendMail(string recipientEmail, string subject, string message, bool isHtml)
        {
            try
            {
                Console.WriteLine($"[EMAIL] Preparing to send email to {recipientEmail}...");

                // ✅ Nếu có SendGrid thì ưu tiên dùng
                if (!string.IsNullOrEmpty(_smtpSettings.SendGridApiKey))
                {
                    Console.WriteLine("[EMAIL] Using SendGrid...");
                    var client = new SendGridClient(_smtpSettings.SendGridApiKey);
                    var from = new EmailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName);
                    var to = new EmailAddress(recipientEmail);
                    var msg = MailHelper.CreateSingleEmail(from, to, subject, isHtml ? null : message, isHtml ? message : null);
                    var response = await client.SendEmailAsync(msg);
                    Console.WriteLine($"[EMAIL] SendGrid response: {response.StatusCode}");

                    if (!response.IsSuccessStatusCode)
                    {
                        var body = await response.Body.ReadAsStringAsync();
                        Console.WriteLine($"[EMAIL] SendGrid error body: {body}");
                    }
                }
                else
                {
                    Console.WriteLine("[EMAIL] Using Gmail SMTP...");
                    using var client = new SmtpClient(_smtpSettings.Server, _smtpSettings.Port)
                    {
                        Credentials = new NetworkCredential(_smtpSettings.SenderEmail, _smtpSettings.Password),
                        EnableSsl = true
                    };

                    using var mailMessage = new MailMessage
                    {
                        From = new MailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName),
                        Subject = subject,
                        Body = message,
                        IsBodyHtml = isHtml
                    };

                    mailMessage.To.Add(recipientEmail);
                    await client.SendMailAsync(mailMessage);
                    Console.WriteLine("[EMAIL] Gmail SMTP sent successfully.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Lỗi gửi email: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"❌ Inner: {ex.InnerException.Message}");
            }
        }




    }
}
