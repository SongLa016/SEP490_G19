using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.StatisticPlayer
{
    public class MonthlyPlayerStatsDto
    {
        public int Month { get; set; }
        public int TotalBookings { get; set; }
        public double TotalPlayingHours { get; set; }
        public decimal TotalSpending { get; set; }
    }

}
