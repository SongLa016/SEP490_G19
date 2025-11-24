using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class PlayerBankAccountDTO
    {
        public int UserID { get; set; }              
        public string BankName { get; set; }
        public string BankShortCode { get; set; }
        public string AccountNumber { get; set; }
        public string AccountHolder { get; set; }
        public bool IsDefault { get; set; } = false;
    }
}
