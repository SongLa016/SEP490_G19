using System;
using System.Net.Mail;
using System.Net;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Banking.Application.Services
{
    public class EmailService
    {
        private readonly SmtpSettings _smtpSettings;

        public EmailService(SmtpSettings smtpSettings)
        {
            _smtpSettings = smtpSettings ?? throw new ArgumentNullException(nameof(smtpSettings));
        }

        public async Task SendEmailAsync(string recipientEmail, string subject, string message)
        {
            if (string.IsNullOrWhiteSpace(recipientEmail))
            {
                Console.WriteLine("[EMAIL SKIPPED] Recipient email is null or empty.");
                return;
            }

            if (string.IsNullOrWhiteSpace(_smtpSettings.SenderEmail))
            {
                Console.WriteLine("[EMAIL SKIPPED] Sender email is not configured.");
                return;
            }

            await SendMail(recipientEmail, subject, message, isHtml: true);
        }

        public async Task SendOtpEmailAsync(string recipientEmail, string otp)
        {
            if (string.IsNullOrWhiteSpace(recipientEmail))
            {
                Console.WriteLine("[EMAIL SKIPPED] Recipient email is null or empty.");
                return;
            }

            string subject = "Xác nhận OTP đăng ký";
            string message = $"Mã OTP của bạn là: <b>{otp}</b>. Vui lòng nhập OTP để xác nhận tài khoản.";
            await SendMail(recipientEmail, subject, message, isHtml: true);
        }

        private async Task SendMail(string recipientEmail, string subject, string message, bool isHtml)
        {
            try
            {
                Console.WriteLine($"[EMAIL] Preparing to send email to {recipientEmail}...");

                if (!string.IsNullOrEmpty(_smtpSettings.SendGridApiKey))
                {
                    Console.WriteLine("[EMAIL] Using SendGrid...");
                    var client = new SendGridClient(_smtpSettings.SendGridApiKey);
                    var from = new EmailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName ?? "NoName");
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
                        From = new MailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName ?? "NoName"),
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
                Console.WriteLine($"[SMTP ERROR] {ex.GetType().Name}: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[INNER EXCEPTION] {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
                }
            }
        }
    }
}
