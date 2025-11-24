using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class BookingCreateDto
    {
        public int UserId { get; set; }
        public int ScheduleId { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal DepositAmount { get; set; }
        public bool HasOpponent { get; set; }
      
    }
}