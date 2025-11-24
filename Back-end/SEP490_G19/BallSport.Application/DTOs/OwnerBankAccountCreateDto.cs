using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class OwnerBankAccountCreateDto
    {
        public int OwnerId { get; set; }
        public string BankName { get; set; } = null!;
        public string? BankShortCode { get; set; }
        public string AccountNumber { get; set; } = null!;
        public string AccountHolder { get; set; } = null!;
        public bool IsDefault { get; set; } = false;

    }
}
