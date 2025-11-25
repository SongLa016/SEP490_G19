using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.StatisticOwner
{
    public class DailyRevenueDTO
    {
        public DateTime Date { get; set; }
        public string DayName { get; set; } = "";
        public decimal TotalRevenue { get; set; }
    }
}
